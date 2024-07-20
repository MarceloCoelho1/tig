import fs from 'node:fs';

export function ensureTigRepoInitialized(tigDir) {
  if (!fs.existsSync(tigDir)) {
    throw new Error('Tig repository not initialized. Please run "init" first.');
  }
}
