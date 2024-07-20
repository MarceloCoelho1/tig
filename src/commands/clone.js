import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import unzipper from 'unzipper';

const pipe = promisify(pipeline);

export async function cloneRepository(repoUrl) {
  const repoName = path.basename(repoUrl, '.git'); // Extract repo name from URL
  const tigDir = path.join(process.cwd(), repoName);
  const zipFilePath = path.join(tigDir, 'repo.zip');
  
  fs.mkdirSync(tigDir, { recursive: true });

  try {
    console.log(`Fetching repository from ${repoUrl}`);

    const zipUrl = `${repoUrl.replace('.git', '/archive/refs/heads/main.zip')}`;

    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(zipFilePath, response.data);

    console.log('Unzipping the repository...');
    await unzipFile(zipFilePath, tigDir);

    console.log(`Repository cloned from ${repoUrl} to ${tigDir}`);
  } catch (error) {
    console.error('Error cloning repository:', error.message);
  } finally {
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
    }
  }
}

async function unzipFile(zipFilePath, outputDir) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: outputDir }))
      .on('finish', resolve)
      .on('error', reject);
  });
}

