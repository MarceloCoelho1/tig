import * as fs from 'node:fs'
import path from 'node:path';
import * as zlib from 'node:zlib';


const command = process.argv;
console.log(command)
switch (command[2]) {
  case "init":
    init()
    break

  case "cat-file":
    if (command.length < 4) {
      throw new Error('Usage: cat-file <sha1>');
    }
    catFile(command[3]);
    break;
  default:
    throw new Error(`Unknown command ${command}`);
} 


function catFile(hash) {
  const dir = path.join(process.cwd(), '.git', 'objects', hash.substring(0, 2))
  const file = path.join(dir, hash.substring(2))

  if(!fs.existsSync(file)) {
    throw new Error(`Object ${hash} not found`)
  }

  const content = fs.readFileSync(path.join(dir, file))
  const dataUnzipped = zlib.inflateSync(content)
  const res = dataUnzipped.toString().split('\0')[1];
  process.stdout.write(res);
}

function init() {
  const gitDir = path.join(process.cwd(), '.git');
  const headFile = path.join(gitDir, 'HEAD');

  if (fs.existsSync(gitDir) && fs.existsSync(headFile)) {
    console.log('Git repository already initialized');
    return;
  }

  fs.mkdirSync(path.join(process.cwd(), '.git'), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");

  console.log("Initialized empty Git repository in ", path.join(process.cwd(), '.git'))
}

