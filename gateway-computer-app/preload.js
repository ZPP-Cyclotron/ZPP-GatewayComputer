const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  otworzPlikKonfiguracyjny: () =>
    ipcRenderer.invoke("dialog:otworzPlikKonfiguracyjny"),
  set_polarity: (new_val, supp_name) =>
    ipcRenderer.invoke("dialog:set_polarity", new_val, supp_name),
  set_current: (new_val, supp_name) =>
    ipcRenderer.invoke("dialog:set_current", new_val, supp_name),
  turn_on: (supp_name) => ipcRenderer.invoke("dialog:turn_on", supp_name),
  turn_off: (supp_name) => ipcRenderer.invoke("dialog:turn_off", supp_name),
  reset: (supp_name) => ipcRenderer.invoke("dialog:reset", supp_name),
  // set control mode to manual or remote:
  set_control_mode: (new_val) =>
    ipcRenderer.invoke("dialog:set_control_mode", new_val),
});
