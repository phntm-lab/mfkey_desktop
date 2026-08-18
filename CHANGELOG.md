# Changelog

## 1.0.0 - 2026-08-18

First stable release of MFKey Desktop, a cross-platform desktop application
that recovers MIFARE Classic (Crypto-1) keys from Flipper Zero nonce logs.

### Features

- Offline attack on a local log file with a clear progress and results view.
- Auto (live) mode over USB or BLE: download logs from the Flipper, run the
  attack, and upload the recovered dictionary back to the device.
- Support for mfkey32, static nested, static encrypted and HardNested inputs,
  detected automatically from the log contents.
- Recovered keys and dictionaries can be exported to a chosen folder.
- English and Russian interface, dark and light themes, persistent settings.

### Notes

- The bundles are unsigned. As a key-recovery tool, the binary may be flagged
  as a false positive by some antivirus engines.
