const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("readline");
// const { spawn } = require("child_process"); // Może się przydać, ale jednak nie używam. (https://dev.to/alexdhaenens/how-to-execute-shell-commands-in-js-2j5j)
// const { SerialPort } = require("serialport");

const DEBUG = true;
const CONFIG_FILE_PATH = "./config.json";
// const CONFIG_FILE_PATH = "./test_config.json";

// https://github.com/yaacov/node-modbus-serial
const ModbusRTU = require("modbus-serial");
const { clear, assert } = require("node:console");

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
  constructor(name, port, maxCurrent, polarity_mutable = true) {
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
    this.read_timeout = 1000;
    this.baudRate = 9600;
    this.timeout = 1000;
    this.errors = PowerSupply.ERR_NONE;
    this.connected = false;
    this.setting_current_n_bits = null;
    this.reading_current_n_bits = 12;
    this.reading_voltage_n_bits = 12;
    this.maxVoltage = 100;

    // modbus-serial library:
    this.modbus_client = new ModbusRTU();
  }

  async turn_on() {
    if (DEBUG) {
      console.log("Turning on supplier...");
    }
    // if (
    //   this.on == PowerSupply.TURNED_ON ||
    //   this.on == PowerSupply.TURNING_ON
    // ) {
    //   return;
    // }
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
      return get_return_msg(get_err_msg(err), "turn_on");
    }
    try {
      await client.writeCoils(0, [true, false, false]);
      if (DEBUG) {
        console.log("Supplier turned on.");
      }
      this.on = PowerSupply.TURNING_ON;
    } catch (err) {
      console.log(err);
      errors += get_err_msg(err);
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += get_err_msg(err);
      }
      return get_return_msg(errors, "turn_on");
    }
  }

  async turn_off() {
    if (DEBUG) {
      console.log("Turning off supplier...");
    }
    // if (
    //   this.on == PowerSupply.TURNED_OFF ||
    //   this.on == PowerSupply.TURNING_OFF
    // ) {
    //   return;
    // }
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      console.log(err);
      return get_return_msg(get_err_msg(err), "turn_off");
    }
    try {
      await client.writeCoils(0, [false, false, false]);
      if (DEBUG) {
        console.log("Supplier turned off.");
      }
      this.on = PowerSupply.TURNING_OFF;
    } catch (err) {
      console.log(err);
      errors += get_err_msg(err);
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += get_err_msg(err);
      }
      return get_return_msg(errors, "turn_off");
    }
  }

  async set_current(new_val) {
    if (DEBUG) {
      console.log("setting current to " + new_val + "A");
    }

    // new val is a float with 1 decimal point
    new_val = parseInt(new_val * 10);
    // convert to float:
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
      return get_return_msg(get_err_msg(err), "set_current");
    }
    try {
      await client.writeCoils(0, message_to_supplier);
      if (DEBUG) {
        console.log("current set.");
      }
    } catch (err) {
      errors += get_err_msg(err);
      if (DEBUG) {
        console.log(err);
      }
    } finally {
      try {
        client.close();
      } catch (err) {
        errors += get_err_msg(err);
        if (DEBUG) {
          console.log(err);
        }
      }
      return get_return_msg(errors, "set_current");
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
      return get_return_msg(get_err_msg(err), "set_polarity");
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
      errors += get_err_msg(err);
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += get_err_msg(err);
      }
      return get_return_msg(errors, "set_polarity");
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
      return get_return_msg(get_err_msg(err), "reset");
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
      errors += get_err_msg(err);
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += get_err_msg(err);
      }
    }
    return get_return_msg(errors, "reset");
  }

  async read_status() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    let errors = "";
    let msg = null;
    let ret = null;
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      return get_return_msg(get_err_msg(err), "read_status");
    }
    try {
      let msg = await client.readInputRegisters(0, 2);
      if (DEBUG) {
        console.log(msg);
      }
      let first_reg = msg.data[0];
      let second_reg = msg.data[1];
      let current_mask = (1 << this.reading_current_n_bits) - 1;
      let current_scaled = first_reg & current_mask;
      let current = (current_scaled * this.maxCurrent) / current_mask;
      let is_on = (first_reg >> this.reading_current_n_bits) & 1;
      let polarity = (first_reg >> (this.reading_current_n_bits + 1)) & 1;
      let reset = (first_reg >> (this.reading_current_n_bits + 2)) & 1;
      let control_type = (first_reg >> (this.reading_current_n_bits + 3)) & 1;
      let voltage_mask = (1 << this.reading_voltage_n_bits) - 1;
      let voltage_scaled = second_reg & voltage_mask;
      let voltage = (voltage_scaled * this.maxVoltage) / voltage_mask;
      let errors = second_reg >> this.reading_voltage_n_bits;
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
      errors += get_err_msg(err);
    } finally {
      try {
        client.close();
      } catch (err) {
        if (DEBUG) {
          console.log(err);
        }
        errors += get_err_msg(err);
      }
      if (errors.length > 0) {
        return get_return_msg(errors, "read_status");
      }
      this.current = ret.current;
      this.is_on = ret.is_on;
      this.polarity = ret.polarity;
      this.reset = ret.reset;
      this.control_type = ret.control_type;
      this.voltage = ret.voltage;
      this.errors = ret.errors;
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

// inherited class: PowerSupply100A:
class PowerSupply100A extends PowerSupply {
  constructor(name, port, maxCurrent, polarity_mutable = true) {
    super(name, port, 100, polarity_mutable);
    this.setting_current_n_bits = 12;
  }
}

class PowerSupply200A extends PowerSupply {
  constructor(name, port, maxCurrent, polarity_mutable = true) {
    super(name, port, 200, polarity_mutable);
    this.setting_current_n_bits = 16;
  }
}

module.exports = PowerSupply;

function setup_suppliers_and_clients(config) {
  if (typeof config === "string") {
    console.log("Error: bad config file.");
    return;
  }
  // config is a JSON object.
  // create power supplies:
  const suppliers = [];
  for (const supplier of config.suppliers) {
    var splr;
    if (supplier.maxCurrent == 100) {
      splr = new PowerSupply100A(
        supplier.no,
        supplier.port,
        supplier.maxCurrent,
        supplier.polarity
      );
    } else if (supplier.maxCurrent == 200) {
      splr = new PowerSupply200A(
        supplier.name,
        supplier.port,
        supplier.maxCurrent,
        supplier.polarity
      );
    } else {
      console.log("Error: unknown maxCurrent value.");
    }
    suppliers.push(splr);
  }
  return suppliers;
}

function server(config) {
  const suppliers = setup_suppliers_and_clients(config);
  while (true) {
    /** Handle requests from renderer. */
  }
}

function test_server(config) {
  for (const supplier of config) {
    let r = supplier.turn_on().catch((err) => {
      console.log(err);
    });
  }
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
  // console.log("Otwieram plik konfiguracyjny...");
  try {
    const konfiguracja = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
    return konfiguracja;
  } catch (err) {
    // check error type
    if (err.code === "ENOENT") {
      console.log("Config file not found!");
      return "Config file not found!";
    }
    if (err instanceof SyntaxError) {
      console.log("Config file is not a valid JSON file!");
      return "Config file is not a valid JSON file!";
    }
  }
}

const createWindow = () => {
  // Create the browser window.
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
  ipcMain.handle(
    "dialog:otworzPlikKonfiguracyjny",
    obsluzOtworzeniePlikuKonfiguracyjnego
  );
  ipcMain.handle("dialog:set_polarity", (event, supp_id, new_val) => {
    console.log("setting polarity to " + new_val);
    console.log("supp_id: " + supp_id);
    return suppliers[supp_id].set_polarity(new_val);
  });
  ipcMain.handle("dialog:set_current", (event, supp_id, new_val) =>
    suppliers[supp_id].set_current(new_val)
  );
  ipcMain.handle("dialog:turn_on", (event, supp_id) =>
    suppliers[supp_id].turn_on()
  );
  ipcMain.handle("dialog:turn_off", (event, supp_id) =>
    suppliers[supp_id].turn_off()
  );

  let mainWindow = createWindow();
  const electronApp = require("electron").app;

  config = suppliers = setup_suppliers_and_clients(
    obsluzOtworzeniePlikuKonfiguracyjnego()
  );

  if (config === undefined) {
    console.log("Error: config is undefined.");
    return;
  }
  var sprintf = require("sprintf-js").sprintf,
    vsprintf = require("sprintf-js").vsprintf;

  async function ask_suppliers() {
    for (let i = 0; i < suppliers.length; i++) {
      let supplier = suppliers[i];
      let res = await supplier.read_status();
      if (DEBUG) {
        console.log(res);
      }

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
        mainWindow.webContents.send("new-error", i, res.errors);
      }

      // let str_current = sprintf("%05.1f", i);
      // mainWindow.webContents.send("new-current", i, str_current);
      // mainWindow.webContents.send("new-on-off", i, i % 2);
      // mainWindow.webContents.send("new-polarity", i, !(i % 2));
    }
  }
  // text_server(suppliers);
  timer = setInterval(() => {
    console.log("Sending new status...");
    ask_suppliers();
  }, 5000);
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
