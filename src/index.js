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
  case "add":
    if (command.length < 4) {
      throw new Error('Usage: add <file>');
    }
    add(command[3]);
    break;
  case "write-tree":
    console.log(writeTree());
    break;
  case "commit":
    if (command.length < 4) {
      throw new Error('Usage: commit <message>');
    }
    console.log(commit(command.slice(3).join(' ')));
    break;
  default:
    throw new Error(`Unknown command ${command[2]}`);
}

function init() {
  const tigDir = path.join(process.cwd(), '.tig');
  const headFile = path.join(tigDir, 'HEAD');
  const refsDir = path.join(tigDir, 'refs');
  const mainBranchFile = path.join(refsDir, 'heads', 'main');

  if (fs.existsSync(tigDir) && fs.existsSync(headFile)) {
    console.log('Tig repository already initialized');
    return;
  }

  fs.mkdirSync(tigDir, { recursive: true });
  fs.mkdirSync(path.join(tigDir, 'objects'), { recursive: true });
  fs.mkdirSync(path.join(tigDir, 'refs', 'heads'), { recursive: true });
  fs.mkdirSync(path.join(tigDir, 'stage'), { recursive: true });

  fs.writeFileSync(headFile, "ref: refs/heads/main\n");

  // Create the main branch file
  fs.writeFileSync(mainBranchFile, '');

  console.log("Initialized empty Tig repository in ", tigDir);
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

  const dir = path.join(tigDir, 'objects', sha1.substring(0, 2));
  const filePath = path.join(dir, sha1.substring(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, zlib.deflateSync(store));
  }

  return sha1;
}

function add(file) {
  const tigDir = path.join(process.cwd(), '.tig');

  if (!fs.existsSync(tigDir)) {
    throw new Error('Tig repository not initialized. Please run "init" first.');
  }

  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${file} not found`);
  }

  const sha1 = hashObject(file);
  const stageFilePath = path.join(tigDir, 'stage', file);

  fs.mkdirSync(path.dirname(stageFilePath), { recursive: true });
  fs.writeFileSync(stageFilePath, sha1);

  console.log(`Added ${file}`);
}

function writeTree() {
  const tigDir = path.join(process.cwd(), '.tig');

  if (!fs.existsSync(tigDir)) {
    throw new Error('Tig repository not initialized. Please run "init" first.');
  }

  const stageDir = path.join(tigDir, 'stage');
  const tree = createTree(stageDir);

  const store = Buffer.from(tree);
  const sha1 = crypto.createHash('sha1').update(store).digest('hex');

  const dir = path.join(tigDir, 'objects', sha1.substring(0, 2));
  const file = path.join(dir, sha1.substring(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, zlib.deflateSync(store));
  }

  return sha1;
}

function createTree(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const tree = [];

  entries.forEach(entry => {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(path.join(process.cwd(), '.tig', 'stage'), fullPath);
    
    if (entry.isFile()) {
      const sha1 = fs.readFileSync(fullPath, 'utf8');
      const mode = '100644'; // normal file
      tree.push(`${mode} ${relativePath}\0${Buffer.from(sha1, 'hex').toString('binary')}`);
    } else if (entry.isDirectory()) {
      const sha1 = createTree(fullPath);
      const mode = '040000'; // directory
      tree.push(`${mode} ${relativePath}\0${Buffer.from(sha1, 'hex').toString('binary')}`);
    }
  });

  return tree.join('');
}


function commit(message) {
  const tigDir = path.join(process.cwd(), '.tig');

  if (!fs.existsSync(tigDir)) {
    throw new Error('Tig repository not initialized. Please run "init" first.');
  }

  const treeSha = writeTree();
  const author = 'Author Name <author@example.com>';
  const committer = 'Committer Name <committer@example.com>';
  const timestamp = Math.floor(Date.now() / 1000);

  const headFile = path.join(tigDir, 'HEAD');
  const currentBranch = fs.readFileSync(headFile, 'utf8').trim().split(' ')[1];
  const branchFile = path.join(tigDir, currentBranch);
  let parentSha = '';

  if (fs.existsSync(branchFile)) {
    parentSha = fs.readFileSync(branchFile, 'utf8').trim();
  }

  const commitContent = [
    `tree ${treeSha}`,
    parentSha ? `parent ${parentSha}` : '',
    `author ${author} ${timestamp} +0000`,
    `committer ${committer} ${timestamp} +0000`,
    '',
    message,
    ''
  ].join('\n');

  const header = `commit ${commitContent.length}\0`;
  const store = Buffer.concat([Buffer.from(header), Buffer.from(commitContent)]);

  const sha1 = crypto.createHash('sha1').update(store).digest('hex');

  const dir = path.join(tigDir, 'objects', sha1.substring(0, 2));
  const filePath = path.join(dir, sha1.substring(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, zlib.deflateSync(store));
  }

  fs.writeFileSync(branchFile, sha1);

  const indexFile = path.join(tigDir, 'index');
  if (fs.existsSync(indexFile)) {
    fs.unlinkSync(indexFile);
  }

  console.log(`Committed as ${sha1}`);
  return sha1;
}
