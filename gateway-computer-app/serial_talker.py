import serial
import sys

# get the port name from the command line
if len(sys.argv) != 2:
    print('Usage: serial_talker.py portname')
    sys.exit(1)
portname = sys.argv[1]

# portname = '/dev/ttyUSB1'

# read from port and write everything to the console
with serial.Serial(portname, 9600, timeout=1) as ser:
    while True:
        bytes = ser.read()
        # print the byte in format \x00
        print(bytes)