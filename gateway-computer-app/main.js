// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const fs = require("node:fs");
const path = require("node:path");
// const { spawn } = require("child_process"); // Może się przydać, ale jednak nie używam. (https://dev.to/alexdhaenens/how-to-execute-shell-commands-in-js-2j5j)
// const { SerialPort } = require("serialport");

const DEBUG = true;
// const CONFIG_FILE_PATH = "./config.json";
const CONFIG_FILE_PATH = "./test_config.json";

/** TODO change to modbus-serial */
// For creating and sending modbus dataframes:
// https://github.com/tbarnhill/modbus
// const modbus = require("modbus");

// https://github.com/yaacov/node-modbus-serial
const ModbusRTU = require("modbus-serial");
const { resourceLimits } = require("node:worker_threads");

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

  // async connect_promise() {
  //   let res = await this.modbus_client.connectRTUBuffered(this.port, {
  //     baudRate: this.baudRate,
  //   });
  //   if (res) this.connected = true;
  //   return this.connected;
  // }

  // connect() {
  //   let res = this.connect_promise();
  //   if (res) {
  //     this.connected = true;
  //     if (DEBUG) {
  //       console.log("Connected to supplier.");
  //       // send test message:
  //       let r = this.modbus_client.writeCoil(0, true).then((res) => {
  //         console.log(res);
  //       });
  //     }
  //   }
  //   return res;
  // }

  turn_on() {
    console.log("Turning on supplier...");
    // if (this.connected == false) {
    //   if (DEBUG) console.log("Not connected.");
    //   return PowerSupply.ERR_CONNECTION;
    // }

    // var PACKAGE = 1 << 2;

    /** TODO change to modbus-serial */
    // modbus library:
    // this.modbus_device.write("c0-2", PACKAGE);

    // modbus-serial library:
    // return await this.modbus_client.writeCoils(0, [false, false, true]);
    let client = new ModbusRTU();
    client
      .connectRTUBuffered(this.port, { baudRate: this.baudRate })
      .then(() => {
        client
          .writeCoils(0, [true, false, false])
          .then(() => {
            console.log("Supplier turned on.");
            return 1;
          })
          .catch((err) => {
            console.log(err);
            return 0;
          });
      });
  }

  turn_off() {
    // if (!this.connected) {
    //   return PowerSupply.ERR_CONNECTION;
    // }
    var PACKAGE = 0;

    /** TODO change to modbus-serial */
    // modbus library:
    // this.modbus_device.write("c0-2", PACKAGE);

    // modbus-serial library:
    // return await this.modbus_client.writeCoils(0, [false, false, false]);
    let client = new ModbusRTU();
    client
      .connectRTUBuffered(this.port, { baudRate: this.baudRate })
      .then(() => {
        client
          .writeCoils(0, [false, false, false])
          .then(() => {
            console.log("Supplier turned off.");
            return 1;
          })
          .catch((err) => {
            console.log(err);
            return 0;
          });
      });
  }

  set_current(new_val) {
    if (!this.connected) {
      return PowerSupply.ERR_CONNECTION;
    }
    return 0;
  }

  set_polarity(new_val) {
    // if (!this.connected) {
    //   return PowerSupply.ERR_CONNECTION;
    // }
    // convert new_val to integer:
    new_val = parseInt(new_val);
    if (new_val != 1 && new_val != 0) {
      return PowerSupply.ERR_BAD_ARG;
    }
    // Little endian format:
    // var PACKAGE = 0x1 | (new_val << 2);

    /** TODO change to modbus-serial */
    // modbus library:
    // this.modbus_device.write("c0-2", PACKAGE);

    // modbus-serial library:
    // return await this.modbus_client.writeCoils(0, [true, false, new_val]);
    let client = new ModbusRTU();
    client
      .connectRTUBuffered(this.port, { baudRate: this.baudRate })
      .then(() => {
        client
          .writeCoils(0, [true, false, new_val])
          .then(() => {
            console.log("polarity set.");
            return 1;
          })
          .catch((err) => {
            console.log(err);
            return 0;
          });
      });
  }

  reset() {
    // if (!this.connected) {
    //   return PowerSupply.ERR_CONNECTION;
    // }
    // Little endian format:
    var PACKAGE = 0x2 | (1 << 2);

    /** TODO change to modbus-serial */
    // modbus library:
    // this.modbus_device.write("c0-2", PACKAGE);

    // modbus-serial library:
    // return await this.modbus_client.writeCoils(0, [false, true, true]);
    let client = new ModbusRTU();
    client
      .connectRTUBuffered(this.port, { baudRate: this.baudRate })
      .then(() => {
        client
          .writeCoils(0, [false, true, true])
          .then(() => {
            console.log("reset done.");
            return 1;
          })
          .catch((err) => {
            console.log(err);
            return 0;
          });
      });
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
  set_current(new_val) {
    // if (!this.connected) {
    //   return PowerSupply.ERR_CONNECTION;
    // }
    new_val = parseInt(new_val);
    if (new_val < 0 || new_val > this.maxCurrent) {
      return PowerSupply.ERR_BAD_ARG;
    }
    var PACKAGE = 0x3 | (new_val << 2);

    /** TODO change to modbus-serial */
    // modbus library:
    // this.modbus_device.write("c0-13", PACKAGE);

    // modbus-serial library:
    // transform new_val to binary array:
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
    // return await this.modbus_client.writeCoils(0, binary_array);
    let client = new ModbusRTU();
    client
      .connectRTUBuffered(this.port, { baudRate: this.baudRate })
      .then(() => {
        client
          .writeCoils(0, binary_array)
          .then(() => {
            console.log("current set.");
            return 1;
          })
          .catch((err) => {
            console.log(err);
            return 0;
          });
      });
  }
}

class PowerSupply200A extends PowerSupply {
  constructor(name, port, maxCurrent, polarity_mutable = true) {
    super(name, port, 200, polarity_mutable);
  }

  set_current(new_val) {
    if (!this.connected) {
      return PowerSupply.ERR_CONNECTION;
    }
    new_val = parseInt(new_val);
    if (new_val < 0 || new_val > this.maxCurrent) {
      return PowerSupply.ERR_BAD_ARG;
    }
    var PACKAGE = 0x3 | (new_val << 2);

    /** TODO change to modbus-serial */
    // modbus library:
    // this.modbus_device.write("c0-17", PACKAGE);

    // modbus-serial library:
    // transform new_val to binary array:
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
    // return await this.modbus_client.writeCoils(0, binary_array);
    let client = new ModbusRTU();
    client
      .connectRTUBuffered(this.port, { baudRate: this.baudRate })
      .then(() => {
        client
          .writeCoils(0, binary_array)
          .then(() => {
            console.log("current set.");
            return 1;
          })
          .catch((err) => {
            console.log(err);
            return 0;
          });
      });
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
        supplier.name,
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

  // config = suppliers = setup_suppliers_and_clients(
  //   obsluzOtworzeniePlikuKonfiguracyjnego()
  // );

  // console.log("Server started. Config read.");

  // testing basic sending to port:
  // ModbusRTU.getPorts().then((ports) => {console.log(ports)});
  let supply = new PowerSupply100A("test", "/dev/ttyUSB0", 100);
  // if (supply.connect_promise()) {
  //   console.log("Connected to supplier.");
  //   supply.turn_on();
  // } else {
  //   console.log("Error: not connected.");
  // }
  // let res = supply.turn_on();
  let res = supply.set_polarity(1);
  // client.open(() => {

  // });
  // console.log(client);

  // test_server(config);

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
