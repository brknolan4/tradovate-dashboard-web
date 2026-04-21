import fs from 'node:fs';
import path from 'node:path';
import { resolveRuntimePath } from './config.js';

export function ensureRuntimeDirectories(config) {
  const paths = {
    downloadDir: resolveRuntimePath(config.downloadDir),
    sessionDir: resolveRuntimePath(config.sessionDir),
    importStagingDir: resolveRuntimePath(config.importStagingDir),
    manifestsDir: resolveRuntimePath('./runtime/manifests'),
    logsDir: resolveRuntimePath('./runtime/logs'),
  };

  Object.values(paths).forEach((dirPath) => {
    fs.mkdirSync(dirPath, { recursive: true });
  });

  return paths;
}

export function stageDownloadedReport(downloadedPath, stagedFileName, stagingDir) {
  const destinationPath = path.join(stagingDir, stagedFileName);
  fs.copyFileSync(downloadedPath, destinationPath);
  return destinationPath;
}
