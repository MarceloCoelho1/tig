import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { ensureTigRepoInitialized } from '../utils/fileUtils.js';

export default function hashObject(file) {
  const tigDir = path.join(process.cwd(), '.tig');

  ensureTigRepoInitialized(tigDir);

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
