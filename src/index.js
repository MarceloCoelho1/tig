import * as fs from 'node:fs';
import path from 'node:path';
import * as zlib from 'node:zlib';
import * as crypto from 'node:crypto';

const command = process.argv;
switch (command[2]) {
  case "init":
    init();
    break;

  case "cat-file":
    if (command.length < 4) {
      throw new Error('Usage: cat-file <sha1>');
    }
    catFile(command[3]);
    break;
  case "hash-object":
    if (command.length < 4) {
      throw new Error('Usage: hash-object <file>');
    }
    hashObject(command[3]);
    break;
  default:
    throw new Error(`Unknown command ${command[2]}`);
} 

function hashObject(file) {
  const tigDir = path.join(process.cwd(), '.tig');

  if (!fs.existsSync(tigDir)) {
    throw new Error('Tig repository not initialized. Please run "init" first.');
  }

  const filepath = path.join(process.cwd(), file);

  if (!fs.existsSync(filepath)) {
    throw new Error(`File ${file} not found`);
  }

  const content = fs.readFileSync(filepath);
  const header = `blob ${content.length}\0`;

  const store = Buffer.concat([Buffer.from(header), content]);

  const sha1 = crypto.createHash('sha1').update(store).digest('hex');

  const dir = path.join(process.cwd(), '.tig', 'objects', sha1.substring(0, 2));
  const filePath = path.join(dir, sha1.substring(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, zlib.deflateSync(store));

  return sha1;
}

function catFile(hash) {
  const dir = path.join(process.cwd(), '.tig', 'objects', hash.substring(0, 2));
  const file = path.join(dir, hash.substring(2));

  if (!fs.existsSync(file)) {
    throw new Error(`Object ${hash} not found`);
  }

  const content = fs.readFileSync(file);
  const dataUnzipped = zlib.inflateSync(content);
  const res = dataUnzipped.toString().split('\0')[1];
  process.stdout.write(res);
}

function init() {
  const tigDir = path.join(process.cwd(), '.tig');
  const headFile = path.join(tigDir, 'HEAD');

  if (fs.existsSync(tigDir) && fs.existsSync(headFile)) {
    console.log('Tig repository already initialized');
    return;
  }

  fs.mkdirSync(tigDir, { recursive: true });
  fs.mkdirSync(path.join(tigDir, "objects"), { recursive: true });
  fs.mkdirSync(path.join(tigDir, "refs"), { recursive: true });

  fs.writeFileSync(path.join(tigDir, "HEAD"), "ref: refs/heads/main\n");

  console.log("Initialized empty Tig repository in ", tigDir);
}
