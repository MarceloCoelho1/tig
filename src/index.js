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
    console.log(hashObject(command[3]));
    break;
  case "ls-tree":
    if (command.length < 4) {
      throw new Error('Usage: ls-tree <sha1>');
    }
    lsTree(command[3]);
    break;
  case "create-tree":
    if (command.length < 4) {
      throw new Error('Usage: create-tree <directory>');
    }
    const treeSha1 = createTreeFromDirectory(command[3]);
    console.log(treeSha1);
    break;
  default:
    throw new Error(`Unknown command ${command[2]}`);
}

function init() {
  const tigDir = path.join(process.cwd(), '.tig');
  const headFile = path.join(tigDir, 'HEAD');

  if (fs.existsSync(tigDir) && fs.existsSync(headFile)) {
    console.log('Tig repository already initialized');
    return;
  }

  fs.mkdirSync(path.join(process.cwd(), '.tig'), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".tig", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".tig", "refs"), { recursive: true });

  fs.writeFileSync(path.join(process.cwd(), ".tig", "HEAD"), "ref: refs/heads/main\n");

  console.log("Initialized empty Tig repository in ", path.join(process.cwd(), '.tig'))
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
  const fileHash = path.join(dir, sha1.substring(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fileHash, zlib.deflateSync(store));

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

function lsTree(hash) {
  const dir = path.join(process.cwd(), '.tig', 'objects', hash.substring(0, 2));
  const file = path.join(dir, hash.substring(2));

  if (!fs.existsSync(file)) {
    throw new Error(`Object ${hash} not found`);
  }

  const content = fs.readFileSync(file);
  const dataUnzipped = zlib.inflateSync(content);
  const data = dataUnzipped.toString('binary');

  if (!data.startsWith('tree ')) {
    throw new Error(`Object ${hash} is not a tree`);
  }

  let idx = data.indexOf('\0') + 1;
  while (idx < data.length) {
    const spaceIdx = data.indexOf(' ', idx);
    const mode = data.substring(idx, spaceIdx);
    const type = mode === '100644' ? 'blob' : 'tree';

    const nullIdx = data.indexOf('\0', spaceIdx + 1);
    const hash = data.substring(nullIdx + 1, nullIdx + 21);
    const hexHash = Buffer.from(hash, 'binary').toString('hex');

    const name = data.substring(spaceIdx + 1, nullIdx);

    idx = nullIdx + 21;

    console.log(`${mode} ${type} ${hexHash}\t${name}`);
  }
}

function createTreeFromDirectory(directoryPath) {
  const entries = [];

  const traverseDirectory = (dirPath) => {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isFile()) {
        const fileHash = hashObject(fullPath);
        entries.push({
          mode: '100644',
          type: 'blob',
          hash: fileHash,
          name: path.relative(directoryPath, fullPath)
        });
      } else if (stats.isDirectory()) {
        const treeHash = createTreeFromDirectory(fullPath);
        entries.push({
          mode: '040000',
          type: 'tree',
          hash: treeHash,
          name: path.relative(directoryPath, fullPath)
        });
      }
    }
  };

  traverseDirectory(directoryPath);

  const tree = entries.map(entry => {
    const { mode, name, hash } = entry;
    const entryHeader = `${mode} ${name}\0`;
    const entryData = Buffer.concat([Buffer.from(entryHeader, 'binary'), Buffer.from(hash, 'hex')]);
    return entryData;
  });

  const store = Buffer.concat(tree);
  const header = `tree ${store.length}\0`;
  const storeWithHeader = Buffer.concat([Buffer.from(header), store]);

  const sha1 = crypto.createHash('sha1').update(storeWithHeader).digest('hex');

  const dir = path.join(process.cwd(), '.tig', 'objects', sha1.substring(0, 2));
  const file = path.join(dir, sha1.substring(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(file, zlib.deflateSync(storeWithHeader));

  return sha1;
}
