import init from './commands/init.js';
import catFile from './commands/catFile.js';
import hashObject from './commands/hashObject.js';
import add from './commands/add.js';
import writeTree from './commands/writeTree.js';
import commit from './commands/commit.js';
import { cloneRepository } from './commands/clone.js';

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
  case "clone":
    if (command.length < 4) {
      throw new Error('Usage: clone <repo-url>');
    }
    cloneRepository(command[3]);
    break;
  default:
    throw new Error(`Unknown command ${command[2]}`);
}
