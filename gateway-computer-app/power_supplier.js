class PowerSupply {

    constructor(name, port) {
        PowerSupply.N_supplies++;
        this.name = name;
        this.port = port;
        this.polarity = POLARITY_UNDEFINED;
        this.voltage = 0;
        this.current = 0;
        this.error = ERR_NONE;
        this.control_type = MANUAL;
    }

    // number of power supplies in the system
    static N_supplies = 0;

    // error codes
    static ERR_NONE() { return 0; }
    
    // polarity of supplier
    static POLARITY_POSITIVE() { return 1; }
    static POLARITY_NEGATIVE() { return -1; }
    static POLARITY_UNDEFINED() { return 0; }
    
    // port of supplier
    static PORT_UNDEFINED() { return 0; }

    // MANUAL: Control from master computer
    // REMOTE: Control from remote computer
    static MANUAL() { return 0; }
    static REMOTE() { return 1; }
  }