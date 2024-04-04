const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  ustawZoom: (zoom) => ipcRenderer.invoke("dialog:ustawZoom", zoom),
  otworzPlikKonfiguracyjny: () =>
    ipcRenderer.invoke("dialog:otworzPlikKonfiguracyjny"),
  set_polarity: (supp_id, new_val) =>
    ipcRenderer.invoke("dialog:set_polarity", supp_id, new_val),
  set_current: (new_val, supp_id) =>
    ipcRenderer.invoke("dialog:set_current", supp_id, new_val),
  turn_on: (supp_id) => ipcRenderer.invoke("dialog:turn_on", supp_id),
  turn_off: (supp_id) => ipcRenderer.invoke("dialog:turn_off", supp_id),
  reset: (supp_id) => ipcRenderer.invoke("dialog:reset", supp_id),
  // set control mode to manual or remote:
  set_control_mode: (new_val) =>
    ipcRenderer.invoke("dialog:set_control_mode", new_val),

  turn_off_fail_continue: (supp_id) =>
    ipcRenderer.invoke("dialog:turn_off_fail_continue", supp_id),

  turn_off_fail_stop: (supp_id) =>
    ipcRenderer.invoke("dialog:turn_off_fail_stop", supp_id),

  polarity_fail_continue: (supp_id) =>
    ipcRenderer.invoke("dialog:polarity_fail_continue", supp_id),

  polarity_fail_stop: (supp_id) =>
    ipcRenderer.invoke("dialog:polarity_fail_stop", supp_id),

  // get_status: (callback) => {
  //   ipcRenderer.on('new-status', (event, ...args) => {callback(...args);});
  // }
  get_current: (callback) => {
    ipcRenderer.on("new-current", (event, supp_id, new_val) => {
      callback(supp_id, new_val);
    });
  },
  get_on_off: (callback) => {
    ipcRenderer.on("new-on-off", (event, supp_id, isOn) => {
      callback(supp_id, isOn);
    });
  },
  get_polarity: (callback) => {
    ipcRenderer.on("new-polarity", (event, supp_id, isPositive) => {
      callback(supp_id, isPositive);
    });
  },
  get_error: (callback) => {
    ipcRenderer.on("new-error", (event, supp_id, message) => {
      callback(supp_id, message);
    });
  },
  get_voltage: (callback) => {
    ipcRenderer.on("new-voltage", (event, supp_id, new_val) => {
      callback(supp_id, new_val);
    });
  },
  get_control_of_supplier: (callback) => {
    ipcRenderer.on(
      "new_control_of_supplier",
      (event, supp_id, isApplication) => {
        callback(supp_id, isApplication);
      }
    );
  },
  get_nowy_zadany_prad: (callback) => {
    ipcRenderer.on("nowy_zadany_prad", (event, supp_id, new_val) => {
      callback(supp_id, new_val);
    });
  },
  // case:
  // user naciska off w aplikacji
  // aplikacja wysyła komunikat set current(0) i czeka 3 sekundy
  // potem robi read_status i wychodzi current > 0
  // wtedy ma dać użytkownikowi wybór:
  // "Prąd nie spadł do zera, czy dalej chcesz wyłączyć czy przerwać wyłączanie?"
  // jeżeli po 3 sekundach prad jest 0, to aplikacja sie nie pyta, tylko wysyła komunikat turn_off do zasilacza
  get_turn_off_failed: (callback) => {
    ipcRenderer.on("turn_off_failed", (event, supp_id) => {
      callback(supp_id);
    });
  },

  get_polarity_failed: (callback) => {
    ipcRenderer.on("polarity_failed", (event, supp_id) => {
      callback(supp_id);
    });
  },

  get_on_off_odczytany: (callback) => {
    ipcRenderer.on("on_off_odczytany", (event, supp_id, isOn) => {
      callback(supp_id, isOn);
    });
  },
});
