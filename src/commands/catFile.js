import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export default function catFile(hash) {
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
