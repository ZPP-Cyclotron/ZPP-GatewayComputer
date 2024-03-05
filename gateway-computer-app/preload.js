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

  get_status: (callback) => {
    ipcRenderer.on('new-status', (event, ...args) => {callback(...args);});
  }
});
