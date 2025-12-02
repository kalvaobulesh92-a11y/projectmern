import { SerialPort } from 'serialport';

function toBuffer(arr) {
  return Buffer.from(arr);
}

export default class Fingerprint {
  constructor(path = process.env.FP_SERIAL_PORT || '/dev/ttyUSB0', baudRate = parseInt(process.env.FP_BAUDRATE || '115200')) {
    this.path = path;
    this.baudRate = baudRate;
    this.port = null;
    this.readBuffer = Buffer.alloc(0);
  }

  open() {
    return new Promise((resolve, reject) => {
      if (this.port && this.port.isOpen) return resolve();
      this.port = new SerialPort({ path: this.path, baudRate: this.baudRate, autoOpen: false });
      this.port.open((err) => {
        if (err) return reject(err);
        // accumulate data
        this.port.on('data', (chunk) => {
          this.readBuffer = Buffer.concat([this.readBuffer, chunk]);
        });
        resolve();
      });
    });
  }

  close() {
    if (this.port && this.port.isOpen) this.port.close();
  }

  async _writeAndWait(cmdBuffer, timeout = 3000) {
    this.readBuffer = Buffer.alloc(0);
    return new Promise((resolve, reject) => {
      this.port.write(cmdBuffer, (err) => {
        if (err) return reject(err);
      });
      const start = Date.now();
      const interval = setInterval(() => {
        // basic heuristic: when buffer length > 0 parse it
        if (this.readBuffer.length > 0) {
          clearInterval(interval);
          const resp = this.readBuffer;
          this.readBuffer = Buffer.alloc(0);
          resolve(resp);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error('Timeout waiting for fingerprint sensor'));
        }
      }, 100);
    });
  }

  // helper to build a simple packet. GT521 family uses header 0x55AA and structure; adapt as needed.
  _packet(cmd, data = []) {
    // packet: 0x55 0xAA LEN_L LEN_H CMD DATA... (this is simplified)
    const len = 2 + data.length; // cmd + data length assumption
    const packet = [0x55, 0xAA, len & 0xFF, (len >> 8) & 0xFF, cmd, ...data];
    return toBuffer(packet);
  }

  async openSensor() {
    await this.open();
    const packet = this._packet(0x01, []); // example 'open' cmd
    const resp = await this._writeAndWait(packet, 1000);
    return resp;
  }

  async captureFinger() {
    const packet = this._packet(0x60);
    const resp = await this._writeAndWait(packet, 5000);
    return resp;
  }

  async enrollStart(id) {
    const packet = this._packet(0x22, [id & 0xFF]);
    const resp = await this._writeAndWait(packet, 2000);
    return resp;
  }

  async enrollStep(step) {
    // step 1: cmd 0x23, step 2: 0x24, step 3: 0x25
    const cmdMap = {1: 0x23, 2:0x24, 3:0x25};
    const cmd = cmdMap[step];
    const packet = this._packet(cmd);
    const resp = await this._writeAndWait(packet, 4000);
    return resp;
  }

  async identify() {
    const packet = this._packet(0x51);
    const resp = await this._writeAndWait(packet, 3000);
    return resp;
  }
}