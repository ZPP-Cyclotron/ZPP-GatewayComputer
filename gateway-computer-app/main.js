const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("readline");

const DEBUG = true;
// const CONFIG_FILE_PATH = "./config.json";
const CONFIG_FILE_PATH = "./test_config.json";

const ModbusRTU = require("modbus-serial");
const { assert } = require("node:console");

function get_err_msg(err) {
  return (
    "name: " + err.name + ": " + err.message + ", errno: " + err.errno + "\n"
  );
}

function get_return_msg(errors, fname) {
  return errors.length == 0 ? "" : "Error " + fname + ": " + errors;
}
/****************************
 *  Server Implementation.  *
 ****************************/
class PowerSupply {
  constructor(
    name,
    port,
    maxCurrent,
    polarity_mutable = true,
    baudRate,
    modbusTimeout
  ) {
    PowerSupply.N_supplies++;
    this.name = name;
    this.port = port;
    this.polarity = PowerSupply.POLARITY_UNDEFINED;
    this.voltage = 0;
    this.current = 0;
    this.control_type = PowerSupply.MANUAL;
    this.on = PowerSupply.TURNED_OFF;
    this.polarity_mutable = polarity_mutable;
    this.maxCurrent = maxCurrent;
    this.read_timeout = modbusTimeout;
    this.baudRate = parseInt(baudRate);
    if (DEBUG) {
      console.log("baudRate: " + this.baudRate);
    }
    this.timeout = modbusTimeout;
    this.errors = PowerSupply.ERR_NONE;
    this.connected = false;
    this.setting_current_n_bits = null;
    this.reading_current_n_bits = 12;
    this.reading_voltage_n_bits = 12;
    this.maxVoltage = 100;
    this.n_error_bits = 4;
  }

  async turn_on() {
    if (DEBUG) {
      console.log("Turning on supplier...");
    }
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    try {
      if (DEBUG) {
        console.log("Turning on supplier...");
      }
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      console.log(err);
      return "bad port open";
    }
    try {
      await client.writeCoils(0, [false, false, true]);
      if (DEBUG) {
        console.log("Supplier turned on.");
      }
      this.on = PowerSupply.TURNING_ON;
    } catch (err) {
      console.log(err);
      errors += "modbus_error";
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += "bad port close";
      }
      return errors;
    }
  }

  async turn_off() {
    if (DEBUG) {
      console.log("Turning off supplier...");
    }
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      console.log(err);
      return "bad port open";
    }
    try {
      await client.writeCoils(0, [false, false, false]);
      if (DEBUG) {
        console.log("Supplier turned off.");
      }
      this.on = PowerSupply.TURNING_OFF;
    } catch (err) {
      console.log(err);
      errors += err.errno;
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += "bad port close";
      }
      return errors;
    }
  }

  async set_current(new_val) {
    if (DEBUG) {
      console.log("setting current to " + new_val + "A");
    }
    new_val = parseInt(new_val * 10);
    new_val = new_val / 10;
    if (new_val < 0 || new_val > this.maxCurrent) {
      if (DEBUG) {
        console.log("Error: bad argument.");
      }
      return (
        "Error setting current: bad argument\n new_val = " +
        new_val +
        "A. Minimal value is 0A, maximal value is " +
        this.maxCurrent +
        "A."
      );
    }
    if (DEBUG) {
      console.log(new_val);
    }
    const scale_factor = (1 << this.setting_current_n_bits) - 1;
    let scaled_val = (new_val * scale_factor) / this.maxCurrent;
    scaled_val = Math.floor(scaled_val);
    if (DEBUG) {
      console.log("scaled_val:");
      console.log(scaled_val);
    }
    var code_array = [true, true];
    var binary_val_array = [];
    var div = 2;
    let tmp_scaled = scaled_val;
    for (var i = 0; i < this.setting_current_n_bits; i++) {
      binary_val_array.push(tmp_scaled % div);
      tmp_scaled = Math.floor(tmp_scaled / div);
    }
    binary_val_array = binary_val_array.reverse();
    if (DEBUG) {
      console.log("binary_val_array:");
      console.log(binary_val_array);
      // check if binary_val_array is correct:
      let tmp = "";
      for (let i = 0; i < binary_val_array.length; i++) {
        tmp += binary_val_array[i];
      }
      let dec_val = parseInt(tmp, 2);
      console.log("tmp: " + tmp);
      console.log("dec_val: " + dec_val);
      console.log("scaled_val: " + scaled_val);
      assert(dec_val == scaled_val);
    }
    const message_to_supplier = code_array.concat(binary_val_array);
    if (DEBUG) {
      console.log("message_to_supplier:");
      console.log(message_to_supplier);
    }
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      return "bad port open";
    }
    try {
      await client.writeCoils(0, message_to_supplier);
      if (DEBUG) {
        console.log("current set.");
      }
    } catch (err) {
      errors += err.errno;
      if (DEBUG) {
        console.log(err);
      }
    } finally {
      try {
        client.close();
      } catch (err) {
        errors += "bad port close";
        if (DEBUG) {
          console.log(err);
        }
      }
      return errors;
    }
  }

  async set_polarity(new_val) {
    if (DEBUG) {
      console.log("Setting polarity...");
    }
    if (!this.polarity_mutable) {
      return "Error setting polarity: polarity is not mutable.";
    }
    if (
      new_val != PowerSupply.POLARITY_POSITIVE() &&
      new_val != PowerSupply.POLARITY_NEGATIVE()
    ) {
      return "Error setting polarity: bad argument.";
    }
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      return "bad port open";
    }
    try {
      await client.writeCoils(0, [true, false, new_val]);
      if (DEBUG) {
        console.log("polarity set.");
      }
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      errors += err.errno;
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += "bad port close";
      }
      return errors;
    }
  }

  async reset() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      return "bad port open";
    }
    try {
      await client.writeCoils(0, [false, true, true]);
      if (DEBUG) {
        console.log("reset done.");
      }
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      errors += err.errno;
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += "bad port close";
      }
    }
    return errors;
  }

  async read_status() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    let ret = null;
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      return "bad port open";
    }
    try {
      let msg = await client.readInputRegisters(0, 2);
      if (DEBUG) {
        console.log(msg);
      }
      let first_reg = msg.data[0];
      let current_mask = (1 << this.reading_current_n_bits) - 1;
      let current_scaled = first_reg & current_mask;
      if (DEBUG) {
        console.log("read current_scaled:" + current_scaled);
      }
      let current = (current_scaled * this.maxCurrent) / current_mask;
      if (DEBUG) {
        console.log("read current:" + current);
      }
      first_reg = first_reg >> this.reading_current_n_bits;
      let is_on = first_reg & 1;
      first_reg = first_reg >> 1;
      let polarity = first_reg & 1;
      first_reg = first_reg >> 1;
      let reset = first_reg & 1;
      let control_type = first_reg >> 1;
      let second_reg = msg.data[1];
      let voltage_mask = (1 << this.reading_voltage_n_bits) - 1;
      let voltage_scaled = second_reg & voltage_mask;
      if (DEBUG) {
        console.log("read voltage_scaled:" + voltage_scaled);
      }
      let voltage = (voltage_scaled * this.maxVoltage) / voltage_mask;
      if (DEBUG) {
        console.log("read voltage:" + voltage);
      }
      ret = {
        current: current,
        is_on: is_on,
        polarity: polarity,
        reset: reset,
        control_type: control_type,
        voltage: voltage,
        errors: errors,
      };
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      errors += err.errno;
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += "bad port close";
      }

      if (ret != null) {
        this.current = ret.current;
        this.is_on = ret.is_on;
        this.polarity = ret.polarity;
        // this.reset = ret.reset;
        this.control_type = ret.control_type;
        this.voltage = ret.voltage;
        this.errors = ret.errors;
      } else {
        ret = errors;
      }

      return ret;
    }
  }

  // number of power supplies in the system
  static N_supplies = 0;

  // error codes
  static ERR_BAD_ARG() {
    return 3;
  }
  static ERR_NONE() {
    return 0;
  }
  static ERR_BAD_PORT() {
    return 1;
  }
  static ERR_OTHER() {
    return 2;
  }
  static ERR_CONNECTION() {
    return 4;
  }

  // polarity of supplier
  static POLARITY_POSITIVE() {
    return 1;
  }
  static POLARITY_NEGATIVE() {
    return 0;
  }
  static POLARITY_UNDEFINED() {
    return 0;
  }

  // port of supplier
  static PORT_UNDEFINED() {
    return 0;
  }

  // MANUAL: Control from master computer
  // REMOTE: Control from remote computer
  static MANUAL() {
    return 0;
  }
  static REMOTE() {
    return 1;
  }

  static TURNED_OFF() {
    return 0;
  }
  static TURNED_ON() {
    return 1;
  }

  static TURNING_ON() {
    return 2;
  }
  static TURNING_OFF() {
    return 3;
  }
}

class PowerSupply100A extends PowerSupply {
  constructor(
    name,
    port,
    maxCurrent,
    polarity_mutable = true,
    baudRate,
    modbusTimeout
  ) {
    super(name, port, 100, polarity_mutable, baudRate, modbusTimeout);
    this.setting_current_n_bits = 12;
  }
}

class PowerSupply200A extends PowerSupply {
  constructor(
    name,
    port,
    maxCurrent,
    polarity_mutable = true,
    baudRate,
    modbusTimeout
  ) {
    super(name, port, 200, polarity_mutable, baudRate, modbusTimeout);
    this.setting_current_n_bits = 16;
  }
}

module.exports = PowerSupply;

function setup_suppliers_and_clients(config) {
  if (typeof config === "string") {
    console.log("Error: bad config file.");
    return;
  }

  const suppliers = [];
  for (const supplier of config.suppliers) {
    var splr;
    if (DEBUG) {
      console.log(typeof supplier.baudRate);
    }
    if (supplier.maxCurrent == 100) {
      splr = new PowerSupply100A(
        supplier.no,
        supplier.port,
        supplier.maxCurrent,
        supplier.polarity,
        supplier.baudRate,
        config.modbusTimeout
      );
    } else if (supplier.maxCurrent == 200) {
      splr = new PowerSupply200A(
        supplier.name,
        supplier.port,
        supplier.maxCurrent,
        supplier.polarity,
        supplier.baudRate,
        config.modbusTimeout
      );
    } else {
      console.log("Error: unknown maxCurrent value.");
    }
    suppliers.push(splr);
  }
  return suppliers;
}

function text_server(suppliers) {
  console.log("Suppliers:");
  suppliers.forEach((element) => {
    console.log(element.name);
  });
  console.log("\nsupported commands:");
  console.log("idx turn_on - turn on supplier idx");
  console.log("idx turn_off - turn off supplier idx");
  console.log("idx set_current val - set current to val for supplier idx");
  console.log("idx set_polarity val - set polarity to val for supplier idx");
  console.log("idx reset - reset supplier idx");
  console.log("ctrl - C to exit\n");

  let timer = null;
  let interval = 5000;

  async function ask_suppliers() {
    for (const supplier of suppliers) {
      let res = await supplier.read_status();
    }
  }

  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  r1.on("line", async (input) => {
    let in_split = input.split(" ");
    let idx = parseInt(in_split[0]);
    let cmd = in_split[1];
    let arg = undefined;
    if (in_split.length > 2) {
      arg = parseInt(in_split[2]);
    }

    if (DEBUG) {
      console.log(idx);
      console.log(cmd);
      console.log(arg);
    }

    if (idx < 0 || idx >= suppliers.length) {
      console.log("Error: bad index.");
      return;
    }

    splr = suppliers[idx];

    switch (cmd) {
      case "turn_on":
        await splr.turn_on();
        break;
      case "turn_off":
        await splr.turn_off();
        break;
      case "reset":
        await splr.reset();
        break;
      case "set_current":
        await splr.set_current(arg);
        break;
      case "set_polarity":
        await splr.set_polarity(arg);
        break;
      default:
        console.log("Error: unknown command.");
    }
  });

  r1.on("SIGINT", () => {
    if (DEBUG) console.log("exiting");
    clearInterval(timer);
    r1.close();
    process.exit(0);
  });

  timer = setInterval(ask_suppliers, interval);
}

function obsluzOtworzeniePlikuKonfiguracyjnego() {
  try {
    const konfiguracja = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
    return konfiguracja;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("Config file" + CONFIG_FILE_PATH + "not found!");
      return "Config file " + CONFIG_FILE_PATH + " not found!";
    }
    if (err instanceof SyntaxError) {
      console.log("Config file is not a valid JSON file!");
      return "Config file is not a valid JSON file!";
    }
  }
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    // fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("templates/index.html");

  return mainWindow;
};

let timer = null;

app.whenReady().then(() => {
  let mainWindow = createWindow();
  ipcMain.handle(
    "dialog:otworzPlikKonfiguracyjny",
    obsluzOtworzeniePlikuKonfiguracyjnego
  );
  ipcMain.handle("dialog:set_polarity", async (event, supp_id, new_val) => {
    console.log("setting polarity to " + new_val);
    console.log("supp_id: " + supp_id);
    let res = await suppliers[supp_id].set_polarity(new_val);
    if (res !== "") {
      mainWindow.webContents.send("new-error", supp_id, res);
    }
    return res;
  });
  ipcMain.handle("dialog:set_current", async (event, supp_id, new_val) => {
    let res = await suppliers[supp_id].set_current(new_val);
    if (res !== "") {
      mainWindow.webContents.send("new-error", supp_id, res);
    }
    return res;
  });
  ipcMain.handle("dialog:turn_on", async (event, supp_id) => {
    let res = await suppliers[supp_id].turn_on();
    if (res !== "") {
      mainWindow.webContents.send("new-error", supp_id, res);
    }
    return res;
  });
  ipcMain.handle("dialog:turn_off", async (event, supp_id) => {
    let res = await suppliers[supp_id].turn_off();
    if (res !== "") {
      mainWindow.webContents.send("new-error", supp_id, res);
    }
    return res;
  }
  );

  config = obsluzOtworzeniePlikuKonfiguracyjnego();

  // if (DEBUG) {
  //   console.log(config);
  // }

  if (config === undefined) {
    console.log("Error: config is undefined.");
  }

  suppliers = setup_suppliers_and_clients(config);
  var sprintf = require("sprintf-js").sprintf,
    vsprintf = require("sprintf-js").vsprintf;

  async function ask_suppliers() {
    for (let i = 0; i < suppliers.length; i++) {
      let supplier = suppliers[i];
      let res = await supplier.read_status();
      if (DEBUG) {
        console.log(res);
      }

      // check if res is a json object
      if (typeof res === "object") {
        let str_current = sprintf("%05.1f", res.current);
        mainWindow.webContents.send("new-current", i, str_current);
        let isOn = res.is_on;
        mainWindow.webContents.send("new-on-off", i, isOn);
        if (supplier.polarity_mutable) {
          mainWindow.webContents.send("new-polarity", i, res.polarity);
        }
        let str_voltage = sprintf("%05.1f", res.voltage);
        mainWindow.webContents.send("new-voltage", i, str_voltage);
        if (res.errors != 0) {
          mainWindow.webContents.send("new-error", i, "splr_err");
        }
      } else {
        console.log("Error: ret is not json object.");
        mainWindow.webContents.send("new-error", i, res);
        // send default values to frontend:
        mainWindow.webContents.send("new-current", i, "   . ");
        mainWindow.webContents.send("new-on-off", i, 0);
        mainWindow.webContents.send("new-polarity", i, 0);
        mainWindow.webContents.send("new-voltage", i, "   . ");
      }
    }
  }
  timer = setInterval(() => {
    console.log("Sending new status...");
    ask_suppliers();
  }, config.refreshInterval);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  clearInterval(timer);
  if (process.platform !== "darwin") app.quit();
});
