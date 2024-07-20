import fs from 'node:fs';
import path from 'node:path';

export default function init() {
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
  fs.writeFileSync(mainBranchFile, '');

  console.log("Initialized empty Tig repository in ", tigDir);
}
