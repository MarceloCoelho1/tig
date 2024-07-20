import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import createTree from '../utils/treeUtils.js';
import { ensureTigRepoInitialized } from '../utils/fileUtils.js';

export default function writeTree() {
  const tigDir = path.join(process.cwd(), '.tig');

  ensureTigRepoInitialized(tigDir);

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
