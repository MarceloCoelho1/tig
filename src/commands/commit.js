import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import writeTree from './writeTree.js';
import { ensureTigRepoInitialized } from '../utils/fileUtils.js';

export default function commit(message) {
  const tigDir = path.join(process.cwd(), '.tig');

  ensureTigRepoInitialized(tigDir);

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
