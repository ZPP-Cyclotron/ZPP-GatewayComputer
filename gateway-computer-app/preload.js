const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  otworzPlikKonfiguracyjny: () =>
    ipcRenderer.invoke("dialog:otworzPlikKonfiguracyjny"),
  set_polarity: (new_val, supp_id) =>
    ipcRenderer.invoke("dialog:set_polarity", new_val, supp_id),
  set_current: (new_val, supp_id) =>
    ipcRenderer.invoke("dialog:set_current", new_val, supp_id),
  turn_on: (supp_id) => ipcRenderer.invoke("dialog:turn_on", supp_id),
  turn_off: (supp_id) => ipcRenderer.invoke("dialog:turn_off", supp_id),
  reset: (supp_id) => ipcRenderer.invoke("dialog:reset", supp_id),
  // set control mode to manual or remote:
  set_control_mode: (new_val) =>
    ipcRenderer.invoke("dialog:set_control_mode", new_val),

  // get_status: (callback) => {
  //   ipcRenderer.on('new-status', (event, ...args) => {callback(...args);});
  // }
  get_current: (callback) => {
    ipcRenderer.on('new-current', (event, supp_id, new_val) => {callback(supp_id, new_val);});
  },
  get_on_off: (callback) => {
    ipcRenderer.on('new-on-off', (event, supp_id, isOn) => {callback(supp_id, isOn);});
  },
  get_polarity: (callback) => {
    ipcRenderer.on('new-polarity', (event, supp_id, isPositive) => {callback(supp_id, isPositive);});
  },
});
