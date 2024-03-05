# ZPP-gateway-computer

project uses 

https://www.npmjs.com/package/serialport

https://www.npmjs.com/package/modbus-serial

### INSTALLING ELECTRON-FORGE:
# in directory ZPP-GATEWAYCOMPUTER/gateway-computer-app:
npm install --save-dev @electron-forge/cli
npx electron-forge import

### Building application:
Once Electron-forge is installed, simply run:

(in directory ZPP-GATEWAYCOMPUTER/gateway-computer-app)

npm run make


installable files will be stored in directory ZPP-GATEWAYCOMPUTER/gateway-computer-app/out/make

Once installation is complete, you should create config.json (or test_config.json, according to CONFIG_FILE_PATH in main.js) and put it in the same directory as the executable file.