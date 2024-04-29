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
    this.bad_port_msg = "bad    port";
    PowerSupply.N_supplies++;
    this.idx = idx;
    this.name = name;
    this.port = port;
    this.polarity = PowerSupply.POLARITY_UNDEFINED();
    this.voltage = 0;
    this.current_read = 0;
    this.current_set = -1;
    this.current_sent_to_pico_n_bits = 16;
    this.control_of_supplier = PowerSupply.MANUAL_CONTROL_OF_SUPPLIER();
    this.control_mode = PowerSupply.MANUAL();
    // to jest stan zasilacza, tylko do odczytu w aplikacji
    this.on_read_from_supplier = PowerSupply.TURNED_OFF();

    // to jest polecenie wyslane do pico
    this.on_sent_to_pico;
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
    this.n_error_bits = 3;
    this.N_READING_REGISTERS = 3;
    this.wait_for_current_to_drop_timeout = 3000;
    this.turning_off = false;
  }

  async get_connected_client() {
    let client = new ModbusRTU();
    client.setTimeout(this.timeout);
    await client.connectRTU(this.port, { baudRate: this.baudRate });
    return client;
  }

  handleModbusError(err) {
    if (err.errno === "ETIMEDOUT") return "MODBUS TIMEOUT";
    if (err.errno !== undefined) return err.errno;
    else if (err.modbusCode !== undefined) {
      return "Modbus Error " + err.modbusCode;
    } else if (String(err).includes("CRC")) {
      return "CRC error";
    } else {
      return "Unknown";
    }
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
      throw this.bad_port_msg;
    }
    try {
      await client.writeCoils(0, frame);
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      errors += this.handleModbusError(err);
    } finally {
      try {
        client.close();
      } catch (err) {
        errors += "bad port close";
      }
      if (errors.length > 0) {
        throw errors;
      }
    }
  }

  async turn_on() {
    if (this.on_read_from_supplier === PowerSupply.TURNED_ON()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " is already on.");
      }
      return "Supplier " + this.name + " is already on.";
    }
    if (this.on_sent_to_pico === PowerSupply.TURNED_ON()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " has already been turned on.");
      }
      return "Supplier " + this.name + " has already been turned on.";
    }
    try {
      await this.send_frame_to_supplier([false, false, true]);
      this.on_sent_to_pico = PowerSupply.TURNED_ON();
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
    if (this.on_read_from_supplier === PowerSupply.TURNED_OFF()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " is already off.");
      }
      return "Supplier " + this.name + " is already off.";
    }
    if (this.on_sent_to_pico === PowerSupply.TURNED_OFF()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " has already been turned off.");
      }
      return "Supplier " + this.name + " has already been turned off.";
    }
    if (this.turning_off === true) {
      let msg =
        "Supplier " +
        this.name +
        " is already turning off.\n Please wait until the next read from supplier happens.";
      if (DEBUG) {
        console.log(msg);
      }
      return msg;
    }

    try {
      await this.set_current(0);
      this.turning_off = true;
      // wait 1s for the current to drop to 0
      await new Promise((resolve) =>
        setTimeout(resolve, this.wait_for_current_to_drop_timeout)
      );
      let res = await this.read_status();
      // check if new_status is a json object
      let i = this.idx;
      let new_current = null;
      if (typeof res === "object") {
        if (DEBUG) {
          console.log("[TURNING OFF] GOT INFO FROM SUPPLIER: " + i);
        }
        new_current = res.current_read_from_supplier;
      }
      if (new_current === 0) {
        await this.turn_off();
        this.turning_off = false;
        return "";
      } else {
        // this.on_read_from_supplier = PowerSupply.TURNED_ON();
        return "turn_off_failed";
      }
    } catch (errors) {
      throw errors;
    }
  }

  async turn_off() {
    if (this.on_read_from_supplier === PowerSupply.TURNED_OFF()) {
      if (DEBUG) {
        console.log("Supplier " + this.name + " is already off.");
      }
      return "Supplier " + this.name + " is already off.";
    }
    // this.on_read_from_supplier = PowerSupply.TURNED_OFF();
    try {
      await this.send_frame_to_supplier([false, false, false]);
      if (DEBUG) {
        console.log("Supplier turned off.");
      }
      this.turning_off = false;
      return "";
    } catch (errors) {
      if (DEBUG) {
        console.log(errors);
      }
      throw errors;
    }
  }

  async set_current(new_val) {
    new_val = parseInt(new_val * 10);
    new_val = new_val / 10;
    if (new_val < 0 || new_val > this.maxCurrent) {
      if (DEBUG) {
        console.log("Error: bad argument.");
      }
      return (
        "Error: bad argument " +
        new_val +
        "A when setting current. Minimal value is 0A, maximal value is " +
        this.maxCurrent +
        "A."
      );
    }
    if (DEBUG) {
      console.log("set current to: " + new_val);
    }
    const scale_factor = (1 << this.setting_current_n_bits) - 1;
    let scaled_val = (new_val * scale_factor) / this.maxCurrent;
    scaled_val = Math.floor(scaled_val);
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
      // check if binary_val_array is correct:
      let tmp = "";
      for (let i = 0; i < binary_val_array.length; i++) {
        tmp += binary_val_array[i];
      }
      let dec_val = parseInt(tmp, 2);
      assert(dec_val == scaled_val);
    }
    const message_to_supplier = code_array.concat(binary_val_array);

    try {
      await this.send_frame_to_supplier(message_to_supplier);
      if (DEBUG) {
        console.log("Current set to " + new_val + "A.");
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
    if (!this.polarity_mutable) {
      return "Error: polarity is not mutable.";
    }
    if (
      new_val != PowerSupply.POLARITY_POSITIVE() &&
      new_val != PowerSupply.POLARITY_NEGATIVE()
    ) {
      return (
        "Error: bad argument when setting polarity. Got " +
        new_val +
        ". Expected 0 or 1"
      );
    }
    try {
      await this.set_current(0);
      await new Promise((resolve) =>
        setTimeout(resolve, this.wait_for_current_to_drop_timeout)
      );
      let res = await this.read_status();
      // check if new_status is a json object
      let i = this.idx;
      let new_current = null;
      if (typeof res === "object") {
        if (DEBUG) {
          console.log("[POLARITY] GOT INFO FROM SUPPLIER: " + i);
        }
        new_current = res.current_read_from_supplier;
      }
      console.log("[SET POLARITY] new_current: " + new_current);
      if (new_current === 0) {
        await this.send_frame_to_supplier([true, false, new_val]);
        return "";
      } else {
        return "Polarity change failed: current is not 0";
      }
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
        console.log("Supplier reset.");
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
      return this.bad_port_msg;
    }
    try {
      let msg = await client.readInputRegisters(0, this.N_READING_REGISTERS);
      let first_reg = msg.data[0];
      let current_mask = (1 << this.reading_current_n_bits) - 1;
      let current_scaled = first_reg & current_mask;
      let current_received_from_supplier =
        (current_scaled * this.maxCurrent) / current_mask;
      first_reg = first_reg >> this.reading_current_n_bits;
      // Value read from supplier:
      let is_on_read_from_supplier = first_reg & 1;
      first_reg = first_reg >> 1;
      let polarity = first_reg & 1;
      first_reg = first_reg >> 1;
      let reset = first_reg & 1;
      let control_of_supplier = first_reg >> 1;
      let second_reg = msg.data[1];
      let voltage_mask = (1 << this.reading_voltage_n_bits) - 1;
      let voltage_scaled = second_reg & voltage_mask;
      second_reg = second_reg >> this.reading_voltage_n_bits;
      let errors_mask = (1 << this.n_error_bits) - 1;
      let errors_read_from_supplier = second_reg & errors_mask;
      let polarity_sent_to_pico = errors_read_from_supplier & 4;
      errors_read_from_supplier = errors_read_from_supplier & 3;
      second_reg = second_reg >> this.n_error_bits;
      let is_on_sent_to_pico = second_reg & 1;

      let third_reg = msg.data[2];
      let current_sent_to_pico_mask =
        (1 << this.current_sent_to_pico_n_bits) - 1;
      let current_sent_to_pico_scaled = third_reg & current_sent_to_pico_mask;
      let current_sent_to_pico =
        (current_sent_to_pico_scaled * this.maxCurrent) /
        current_sent_to_pico_mask;
      let voltage = (voltage_scaled * this.maxVoltage) / voltage_mask;

      ret = {
        current_read_from_supplier: current_received_from_supplier,
        current_sent_to_pico: current_sent_to_pico,
        is_on_read_from_supplier: is_on_read_from_supplier,
        is_on_sent_to_pico: this.turning_off === true ? 0 : is_on_sent_to_pico,
        polarity: polarity,
        polarity_sent_to_pico: polarity_sent_to_pico,
        reset: reset,
        control_type: control_of_supplier,
        voltage: voltage,
        errors: errors_read_from_supplier,
      };
    } catch (err) {
      if (DEBUG) {
        console.log(err);
      }
      errors += this.handleModbusError(err);
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
        if (ret.control_type !== 1 || this.current_set < 0) {
          this.current_set = ret.current_sent_to_pico;
        }
        ret.current_sent_to_pico = this.current_set;
        this.current_read = ret.current_read_from_supplier;
        this.on_read_from_supplier = ret.is_on;
        this.polarity = ret.polarity;
        // this.reset = ret.reset;
        this.control_of_supplier = ret.control_type;
        this.voltage = ret.voltage;
        this.errors = ret.errors;
        this.on_sent_to_pico =
          this.turning_off === true ? 0 : ret.is_on_sent_to_pico;
      } else {
        console.log("ret is null, errors: " + errors);
        ret = errors;
      }

      return ret;
    }
  }

  set_control_mode(new_val) {
    if (new_val !== PowerSupply.MANUAL() && new_val !== PowerSupply.REMOTE()) {
      throw "Illegal control mode!";
    }
    this.control_mode = new_val;
  }

  check_supplier_and_application_control_modes() {
    if (this.control_mode !== PowerSupply.MANUAL()) {
      return "Error: bad control mode (change to local).";
    }
    if (this.control_of_supplier === PowerSupply.MANUAL_CONTROL_OF_SUPPLIER()) {
      return "Error: bad control mode (change to remote on power supply control panel).";
    }
    return "";
  }

  turn_off_fail_stop() {
    this.turning_off = false;
    this.on_sent_to_pico = PowerSupply.TURNED_ON();
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
    return false;
  }
  static REMOTE() {
    return true;
  }

  static MANUAL_CONTROL_OF_SUPPLIER() {
    return false;
  }
  static APPLICATION_CONTROL_OF_SUPPLIER() {
    return true;
  }

  static TURNED_OFF() {
    return 0;
  }
  static TURNED_ON() {
    return 1;
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
