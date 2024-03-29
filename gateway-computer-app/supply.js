const ModbusRTU = require("modbus-serial");
const { assert } = require("node:console");
const DEBUG = true;

class PowerSupply {
  constructor(
    idx,
    name,
    port,
    maxCurrent,
    polarity_mutable = true,
    baudRate,
    modbusTimeout
  ) {
    PowerSupply.N_supplies++;
    this.idx = idx;
    this.name = name;
    this.port = port;
    this.polarity = PowerSupply.POLARITY_UNDEFINED();
    this.voltage = 0;
    this.current_read = 0;
    this.current_set = 0;
    this.control_type = PowerSupply.MANUAL();
    this.on = PowerSupply.TURNED_OFF();
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

  async get_connected_client() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    await client.connectRTU(this.port, { baudRate: this.baudRate });
    return client;
  }

  async send_frame_to_supplier(frame) {
    let client = null;
    let errors = "";
    try {
      client = await this.get_connected_client();
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      throw "bad port open";
    }
    try {
      await client.writeCoils(0, frame);
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
      if (errors.length > 0) {
        throw errors;
      }
    }
  }

  async turn_on() {
    if (DEBUG) {
      console.log("Turning on supplier...");
    }
    if (this.on === PowerSupply.TURNED_ON()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " is already on.");
      }
      return "Supplier " + this.name + " is already on.";
    }
    try {
      await this.send_frame_to_supplier([false, false, true]);
      if (DEBUG) {
        console.log("Supplier turned on.");
      }
      return "";
    } catch (errors) {
      if (DEBUG) {
        console.log(errors);
      }
      throw errors;
    }
  }

  async initiate_turn_off() {
    if (DEBUG) {
      console.log("Turning off supplier...");
    }
    if (this.on === PowerSupply.TURNED_OFF()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " is already off.");
      }
      return "Supplier " + this.name + " is already off.";
    }
    if (this.on === PowerSupply.TURNING_OFF()) {
      if (DEBUG) {
        console.log(
          "Supplier " +
            this.name +
            " is already turning off.\n Please wait until the next read from supplier happens."
        );
      }
      return (
        "Supplier " +
        this.name +
        " is already turning off.\n Please wait until the next read from supplier happens."
      );
    }

    try {
      var sprintf = require("sprintf-js").sprintf,
        vsprintf = require("sprintf-js").vsprintf;
      await this.set_current(0);
      this.on = PowerSupply.TURNING_OFF();
      // wait 1s for the current to drop to 0
      await new Promise((resolve) => setTimeout(resolve, 1000));
      let res = await this.read_status();
      // check if new_status is a json object
      let i = this.idx;
      let new_current = null;
      if (typeof res === "object") {
        if (DEBUG) {
          console.log("[TURNING OFF] GOT INFO FROM SUPPLIER: " + i);
        }
        new_current = res.current;
      }
      if (new_current === 0) {
        await this.turn_off();
        this.on = PowerSupply.TURNED_OFF();
        return "";
      } else {
        this.on = PowerSupply.TURNED_ON();
        return "failed to set current to 0. failed turn off";
      }
    } catch (errors) {
      throw errors;
    }
  }

  async turn_off() {
    if (DEBUG) {
      console.log("Turning off supplier...");
    }
    if (this.on === PowerSupply.TURNED_OFF()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " is already off.");
      }
      return "Supplier " + this.name + " is already off.";
    }
    if (this.on === PowerSupply.TURNING_OFF()) {
      if (DEBUG) {
        console.log(
          "Supplier " + this.name + " is already turning off.\n Please wait."
        );
      }
      return (
        "Supplier " + this.name + " is already turning off.\n Please wait."
      );
    }
    try {
      await this.send_frame_to_supplier([false, false, false]);
      if (DEBUG) {
        console.log("Supplier turned off.");
      }
      return "";
    } catch (errors) {
      if (DEBUG) {
        console.log(errors);
      }
      throw errors;
    }
  }

  async set_current(new_val) {
    if (DEBUG) {
      console.log("setting current to " + new_val + "A");
    }
    new_val = parseInt(new_val * 10);
    new_val = new_val / 10;
    if (this.on === PowerSupply.TURNED_OFF()) {
      if (DEBUG) {
        console.log("Supplier is off.");
      }
      return "Error setting current: supplier " + this.name + " is off.";
    }
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

    try {
      await this.send_frame_to_supplier(message_to_supplier);
      if (DEBUG) {
        console.log("Current set.");
      }
      this.current_set = new_val;
      return "";
    } catch (errors) {
      if (DEBUG) {
        console.log(errors);
      }
      throw errors;
    }
  }

  async set_polarity(new_val) {
    if (DEBUG) {
      console.log("Setting polarity...");
      console.log(this.on);
    }
    if (this.on === PowerSupply.TURNED_OFF()) {
      if (DEBUG) {
        console.log("Supplier is off.");
      }
      return "Error setting polarity: supplier " + this.name + " is off.";
    }
    if (!this.polarity_mutable) {
      return "Error setting polarity: polarity is not mutable.";
    }
    if (
      new_val != PowerSupply.POLARITY_POSITIVE() &&
      new_val != PowerSupply.POLARITY_NEGATIVE()
    ) {
      return (
        "Error setting polarity: bad argument. Got " +
        new_val +
        ". Expected 0 or 1"
      );
    }
    try {
      await this.send_frame_to_supplier([true, false, new_val]);
      if (DEBUG) {
        console.log("Supplier turned off.");
      }
      return "";
    } catch (errors) {
      if (DEBUG) {
        console.log(errors);
      }
      throw errors;
    }
  }

  async reset() {
    try {
      await this.send_frame_to_supplier([false, true, true]);
      if (DEBUG) {
        console.log("Supplier turned off.");
      }
      return "";
    } catch (errors) {
      if (DEBUG) {
        console.log(errors);
      }
      throw errors;
    }
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
        this.current_read = ret.current;
        this.on = ret.is_on;
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
    return -1;
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
    idx,
    name,
    port,
    maxCurrent,
    polarity_mutable = true,
    baudRate,
    modbusTimeout
  ) {
    super(idx, name, port, 100, polarity_mutable, baudRate, modbusTimeout);
    this.setting_current_n_bits = 12;
  }
}

class PowerSupply200A extends PowerSupply {
  constructor(
    idx,
    name,
    port,
    maxCurrent,
    polarity_mutable = true,
    baudRate,
    modbusTimeout
  ) {
    super(idx, name, port, 200, polarity_mutable, baudRate, modbusTimeout);
    this.setting_current_n_bits = 16;
  }
}

exports.PowerSupply = PowerSupply;
exports.PowerSupply100A = PowerSupply100A;
exports.PowerSupply200A = PowerSupply200A;
