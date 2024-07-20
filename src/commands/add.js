import fs from 'node:fs';
import path from 'node:path';
import hashObject from './hashObject.js';

export default function add(file) {
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
