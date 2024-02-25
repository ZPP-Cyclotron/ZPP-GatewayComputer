const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("readline");
// const { spawn } = require("child_process"); // Może się przydać, ale jednak nie używam. (https://dev.to/alexdhaenens/how-to-execute-shell-commands-in-js-2j5j)
// const { SerialPort } = require("serialport");

const DEBUG = true;
// const CONFIG_FILE_PATH = "./config.json";
const CONFIG_FILE_PATH = "./test_config.json";

// https://github.com/yaacov/node-modbus-serial
const ModbusRTU = require("modbus-serial");

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
    this.polarity_mutable = polarity_mutable;
    this.maxCurrent = maxCurrent;
    this.read_timeout = 1000;
    this.baudRate = 9600;
    this.timeout = 1000;
    this.error = PowerSupply.ERR_NONE;
    this.connected = false;

    // modbus-serial library:
    this.modbus_client = new ModbusRTU();
  }

  async turn_on() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    try {
      if (DEBUG) {
        console.log("Turning on supplier...");
      }
      await client.connectRTU(this.port, { baudRate: this.baudRate });
      await client.writeCoils(0, [true, false, false]);
      if (DEBUG) {
        console.log("Supplier turned on.");
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.close();
    }
  }

  async turn_off() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
      await client.writeCoils(0, [false, false, false]);
      if (DEBUG) {
        console.log("Supplier turned off.");
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.close();
    }
  }

  set_current(new_val) {
    if (!this.connected) {
      return PowerSupply.ERR_CONNECTION;
    }
    return 0;
  }

  async set_polarity(new_val) {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
      await client.writeCoils(0, [true, false, new_val]);
      if (DEBUG) {
        console.log("polarity set.");
      }
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
    } finally {
      client.close();
    }
  }

  async reset() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
      await client.writeCoils(0, [false, true, true]);
      if (DEBUG) {
        console.log("reset done.");
      }
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
    } finally {
      client.close();
    }
  }

  async read_status() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
      let msg = await client.readInputRegisters(0, 2);
      console.log(msg);
      if (DEBUG) {
        console.log("status:");
        console.log(type(msg));
      }
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
    } finally {
      client.close();
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
    return -1;
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
}

// inherited class: PowerSupply100A:
class PowerSupply100A extends PowerSupply {
  constructor(name, port, maxCurrent, polarity_mutable = true) {
    super(name, port, 100, polarity_mutable);
  }
  async set_current(new_val) {
    new_val = parseInt(new_val);
    if (new_val < 0 || new_val > this.maxCurrent) {
      if (DEBUG) {
        console.log("Error: bad argument.");
      }
      return PowerSupply.ERR_BAD_ARG;
    }
    var binary_array = [true, true];
    var div = 2;
    for (var i = 0; i < 12; i++) {
      binary_array.push(new_val % div);
      new_val = Math.floor(new_val / div);
    }
    if (DEBUG) {
      console.log("binary_array:");
      console.log(binary_array);
    }
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
      await client.writeCoils(0, binary_array);
      if (DEBUG) {
        console.log("current set.");
      }
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
    } finally {
      client.close();
    }
  }
}

class PowerSupply200A extends PowerSupply {
  constructor(name, port, maxCurrent, polarity_mutable = true) {
    super(name, port, 200, polarity_mutable);
  }

  async set_current(new_val) {
    new_val = parseInt(new_val);
    if (new_val < 0 || new_val > this.maxCurrent) {
      if (DEBUG) {
        console.log("Error: bad argument.");
      }
      return PowerSupply.ERR_BAD_ARG;
    }
    var binary_array = [true, true];
    var div = 2;
    for (var i = 0; i < 16; i++) {
      binary_array.push(new_val % div);
      new_val = Math.floor(new_val / div);
    }
    if (DEBUG) {
      console.log("binary_array:");
      console.log(binary_array);
    }
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    try {
      await client.connectRTU(this.port, { baudRate: this.baudRate });
      await client.writeCoils(0, binary_array);
      if (DEBUG) {
        console.log("current set.");
      }
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
    } finally {
      client.close();
    }
  }
}

function setup_suppliers_and_clients(config) {
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
      // splr.connect();
    } else if (supplier.maxCurrent == 200) {
      splr = new PowerSupply200A(
        supplier.name,
        supplier.port,
        supplier.maxCurrent,
        supplier.polarity
      );
      // splr.connect();
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

  async function  ask_suppliers() {
    for (const supplier of suppliers) {
      await supplier.read_status();
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
  const konfiguracja = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
  return konfiguracja;
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("templates/index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle(
    "dialog:otworzPlikKonfiguracyjny",
    obsluzOtworzeniePlikuKonfiguracyjnego
  );

  // createWindow();

  // console.log("Starting server...");

  config = suppliers = setup_suppliers_and_clients(
    obsluzOtworzeniePlikuKonfiguracyjnego()
  );

  text_server(suppliers);
  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
