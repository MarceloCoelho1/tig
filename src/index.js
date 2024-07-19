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
  fs.mkdirSync(path.join(process.cwd(), '.git'), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");

  console.log("Initialized empty Git repository in ", path.join(process.cwd(), '.git'))
}

