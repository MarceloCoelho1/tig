import fs from 'node:fs';
import path from 'node:path';

export default function createTree(directory) {
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
