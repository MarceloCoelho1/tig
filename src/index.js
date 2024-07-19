import * as fs from 'node:fs'
import path from 'node:path';


const command = process.argv[2];

switch(command) {
  case "init":
    init()
    break
  default:
    throw new Error(`Unknown command ${command}`);
}

function init() {
  console.log("initializing .git repository")

  fs.mkdirSync()
}

