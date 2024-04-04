const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("readline");
var PowerSupply100A = require("./supply.js").PowerSupply100A;
var PowerSupply200A = require("./supply.js").PowerSupply200A;
var PowerSupply = require("./supply.js").PowerSupply;

const DEBUG = true;
const CONFIG_FILE_PATH = "./config.json";
// const CONFIG_FILE_PATH = "./test_config.json";

/****************************
 *  Server Implementation.  *
 ****************************/

function setup_suppliers_and_clients(config) {
  if (typeof config === "string") {
    console.log("Error: bad config file.");
    return;
  }

  const suppliers = [];
  let i = 0;
  for (const supplier of config.suppliers) {
    var splr;
    if (DEBUG) {
      console.log(typeof supplier.baudRate);
    }
    if (supplier.maxCurrent == 100) {
      splr = new PowerSupply100A(
        i,
        supplier.no,
        supplier.port,
        supplier.maxCurrent,
        supplier.polarity,
        supplier.baudRate,
        config.modbusTimeout
      );
    } else if (supplier.maxCurrent == 200) {
      splr = new PowerSupply200A(
        i,
        supplier.no,
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
    i++;
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
    fullscreen: DEBUG ? false : true,
    frame: true,
    width: 1500,
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
  ipcMain.handle("dialog:ustawZoom", (event, zoom) => {
    mainWindow.webContents.setZoomFactor(zoom);
  });
  ipcMain.handle(
    "dialog:otworzPlikKonfiguracyjny",
    obsluzOtworzeniePlikuKonfiguracyjnego
  );
  ipcMain.handle("dialog:set_polarity", async (event, supp_id, new_val) => {
    let res = "";
    console.log(suppliers[supp_id].control_mode);
    if (suppliers[supp_id].control_mode !== PowerSupply.MANUAL()) {
      return "BAD CONTROL MODE (sterowanie ze sterowni)!";
    }
    if (
      suppliers[supp_id].control_of_supplier ===
      PowerSupply.MANUAL_CONTROL_OF_SUPPLIER()
    ) {
      return "BAD CONTROL MODE (ręczne sterowanie zasilaczem)!";
    }
    try {
      res = await suppliers[supp_id].set_polarity(new_val);
      if (res === "") mainWindow.webContents.send("new-error", supp_id, "");
    } catch (err) {
      if (DEBUG) {
        console.log("sending new-error:");
        console.log(err);
      }
      mainWindow.webContents.send("new-error", supp_id, err);
      res = "failed. Check the box on the right for more info.";
    } finally {
      return res;
    }
  });
  ipcMain.handle("dialog:set_current", async (event, supp_id, new_val) => {
    let res = "";
    if (suppliers[supp_id].control_mode !== PowerSupply.MANUAL()) {
      return "BAD CONTROL MODE (sterowanie ze sterowni)!";
    }
    if (
      suppliers[supp_id].control_of_supplier ===
      PowerSupply.MANUAL_CONTROL_OF_SUPPLIER()
    ) {
      return "BAD CONTROL MODE (ręczne sterowanie zasilaczem)!";
    }
    try {
      res = await suppliers[supp_id].set_current(new_val);
      if (res === "") mainWindow.webContents.send("new-error", supp_id, "");
    } catch (err) {
      if (DEBUG) {
        console.log("sending new-error:");
        console.log(err);
      }
      mainWindow.webContents.send("new-error", supp_id, err);
    } finally {
      return res;
    }
  });
  ipcMain.handle("dialog:turn_on", async (event, supp_id) => {
    let res = "";
    if (suppliers[supp_id].control_mode !== PowerSupply.MANUAL()) {
      return "BAD CONTROL MODE (sterowanie ze sterowni)!";
    }
    if (
      suppliers[supp_id].control_of_supplier ===
      PowerSupply.MANUAL_CONTROL_OF_SUPPLIER()
    ) {
      return "BAD CONTROL MODE (ręczne sterowanie zasilaczem)!";
    }
    try {
      res = await suppliers[supp_id].turn_on();
      if (res === "") mainWindow.webContents.send("new-error", supp_id, "");
    } catch (err) {
      if (DEBUG) {
        console.log("sending new-error:");
        console.log(err);
      }
      mainWindow.webContents.send("new-error", supp_id, err);
      res = "failed. Check the box on the right for more info.";
    } finally {
      return res;
    }
  });
  ipcMain.handle("dialog:turn_off", async (event, supp_id) => {
    let res = "";
    console.log("user presses turn off");
    if (suppliers[supp_id].control_mode !== PowerSupply.MANUAL()) {
      return "BAD CONTROL MODE (sterowanie ze sterowni)!";
    }
    if (
      suppliers[supp_id].control_of_supplier ===
      PowerSupply.MANUAL_CONTROL_OF_SUPPLIER()
    ) {
      return "BAD CONTROL MODE (ręczne sterowanie zasilaczem)!";
    }
    suppliers[supp_id].on_read_from_supplier = PowerSupply.TURNING_OFF();
    console.log("turning off set");
    try {
      mainWindow.webContents.send("nowy_zadany_prad", supp_id, "000.0");
      res = await suppliers[supp_id].initiate_turn_off();

      if (res === "") mainWindow.webContents.send("new-error", supp_id, "");
      if (res === "turn_off_failed") {
        mainWindow.webContents.send("turn_off_failed", supp_id);
        return "";
      }
    } catch (err) {
      if (DEBUG) {
        console.log("sending new-error:");
        console.log(err);
      }
      mainWindow.webContents.send("new-error", supp_id, err);
      res = "failed. Check the box on the right for more info.";
      return res;
    }
    // finally {
    //   console.log("finally returning: " + res);
    // }
  });
  ipcMain.handle("dialog:set_control_mode", async (_, new_val) => {
    if (DEBUG) {
      console.log("Control mode set to: " + new_val);
    }
    for (const supplier of suppliers) {
      supplier.set_control_mode(new_val);
    }
    if (DEBUG) {
      console.log("Control mode set to: " + new_val);
    }
    return "";
  });
  ipcMain.handle("dialog:turn_off_fail_continue", async (event, supp_id) => {
    let res = "";
    if (suppliers[supp_id].control_mode !== PowerSupply.MANUAL()) {
      return "BAD CONTROL MODE (sterowanie ze sterowni)!";
    }
    if (
      suppliers[supp_id].control_of_supplier ===
      PowerSupply.MANUAL_CONTROL_OF_SUPPLIER()
    ) {
      return "BAD CONTROL MODE (ręczne sterowanie zasilaczem)!";
    }
    try {
      res = await suppliers[supp_id].turn_off();
      if (res === "") mainWindow.webContents.send("new-error", supp_id, "");
    } catch (err) {
      if (DEBUG) {
        console.log("sending new-error:");
        console.log(err);
      }
      mainWindow.webContents.send("new-error", supp_id, err);
      res = "failed. Check the box on the right for more info.";
    }
    return res;
  });
  ipcMain.handle("dialog:turn_off_fail_stop", async (event, supp_id) => {
    let res = "";
    if (suppliers[supp_id].control_mode !== PowerSupply.MANUAL()) {
      return "BAD CONTROL MODE (sterowanie ze sterowni)!";
    }
    if (
      suppliers[supp_id].control_of_supplier ===
      PowerSupply.MANUAL_CONTROL_OF_SUPPLIER()
    ) {
      return "BAD CONTROL MODE (ręczne sterowanie zasilaczem)!";
    }
    suppliers[supp_id].on_read_from_supplier = PowerSupply.TURNED_ON();
    return "";
  });

  config = obsluzOtworzeniePlikuKonfiguracyjnego();

  if (config === undefined) {
    console.log("Error: config is undefined.");
  }

  suppliers = setup_suppliers_and_clients(config);
  var sprintf = require("sprintf-js").sprintf,
    vsprintf = require("sprintf-js").vsprintf;

  async function ask_suppliers() {
    for (let i = 0; i < suppliers.length; i++) {
      // let supplier = suppliers[i];
      let res = await suppliers[i].read_status();
      if (DEBUG) {
        // console.log(res);
        console.log("zasilacz: " + i);
        // console.log(suppliers[i]);
        console.log(res);
      }

      // check if res is a json object
      if (typeof res === "object") {
        if (DEBUG) {
          console.log("GOT INFO FROM SUPPLIER: " + i);
        }
        let str_current = sprintf("%05.1f", res.current_read_from_supplier);
        mainWindow.webContents.send("new-current", i, str_current);
        let str_current_sent_to_pico = sprintf(
          "%05.1f",
          res.current_sent_to_pico
        );
        mainWindow.webContents.send(
          "nowy_zadany_prad",
          i,
          str_current_sent_to_pico
        );
        // let isOn = res.is_on;
        // // cast isOn to boolean
        // isOn = isOn === 1;
        // if (
        //   // TODO OGARNAC WSPOLBIEZNE (POLARITY TEZ)
        //   suppliers[i].on_read_from_supplier !== PowerSupply.TURNING_OFF() &&
        //   suppliers[i].on_read_from_supplier !== PowerSupply.TURNING_ON()
        // ) {
        //   console.log("Setting on-off for supplier: " + i + " to: " + isOn);
        //   mainWindow.webContents.send("new-on-off", i, isOn);
        // }

        mainWindow.webContents.send("new-on-off", i, res.is_on_sent_to_pico);
        mainWindow.webContents.send(
          "on_off_odczytany",
          i,
          res.is_on_read_from_supplier
        );
        if (suppliers[i].polarity_mutable) {
          mainWindow.webContents.send("new-polarity", i, res.polarity);
        }
        let str_voltage = sprintf("%05.1f", res.voltage);
        mainWindow.webContents.send("new-voltage", i, str_voltage);
        mainWindow.webContents.send(
          "new_control_of_supplier",
          i,
          res.control_type
        );
        if (res.errors != 0) {
          mainWindow.webContents.send("new-error", i, "splr_err");
        } else {
          mainWindow.webContents.send("new-error", i, "");
        }
      } else {
        console.log("Error: ret is not json object.");
        mainWindow.webContents.send("new-error", i, res);
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
