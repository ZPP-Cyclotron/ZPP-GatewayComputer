// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("child_process"); // Może się przydać, ale jednak nie używam. (https://dev.to/alexdhaenens/how-to-execute-shell-commands-in-js-2j5j)
const { SerialPort } = require("serialport");

// For creating and sending modbus dataframes:
// https://github.com/tbarnhill/modbus
const modbus = require("modbus");

const ModbusRTU = require("modbus-serial");

const client = new ModbusRTU();

console.log(client);

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
    baudRate = 9600;
    this.modbus_device = modbus(this.port, baudRate);
  }

  turn_on() {
    var PACKAGE = 1 << 2;
    this.modbus_device.write("c0-2", PACKAGE);
  }

  turn_off() {
    var PACKAGE = 0;
    this.modbus_device.write("c0-2", PACKAGE);
  }

  set_current(new_val) {
    return 0;
  }

  set_polarity(new_val) {
    // convert new_val to integer:
    new_val = parseInt(new_val);
    if (new_val != 1 && new_val != 0) {
      return PowerSupply.ERR_BAD_ARG;
    }
    // Little endian format:
    var PACKAGE = 0x1 | (new_val << 2);
    this.modbus_device.write("c0-2", PACKAGE);
  }

  reset() {
    // Little endian format:
    var PACKAGE = 0x2 | (1 << 2);
    this.modbus_device.write("c0-2", PACKAGE);
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
  set_current(new_val) {
    new_val = parseInt(new_val);
    if (new_val < 0 || new_val > this.maxCurrent) {
      return PowerSupply.ERR_BAD_ARG;
    }
    var PACKAGE = 0x3 | (new_val << 2);
    this.modbus_device.write("c0-15", PACKAGE);
  }
}

class PowerSupply200A extends PowerSupply {
  constructor(name, port, maxCurrent, polarity_mutable = true) {
    super(name, port, 200, polarity_mutable);
  }

  set_current(new_val) {
    new_val = parseInt(new_val);
    if (new_val < 0 || new_val > this.maxCurrent) {
      return PowerSupply.ERR_BAD_ARG;
    }
    var PACKAGE = 0x3 | (new_val << 2);
    this.modbus_device.write("c0-17", PACKAGE);
  }
}

function setup_suppliers_and_clients(config) {
  // create power supplies:
  const suppliers = [];
  for (const supplier of config.suppliers) {
    var splr;
    if (supplier.maxCurrent == 100) {
      splr = new PowerSupply100A(
        supplier.name,
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

function obsluzOtworzeniePlikuKonfiguracyjnego() {
  // console.log("Otwieram plik konfiguracyjny...");
  const konfiguracja = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
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

  createWindow();

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

// In this file you can include the rest of your app's specific main
// process
// code. You can also put them in separate files and require them here.
