import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 43128);
const DOWNLOADS_DIR = process.env.TRADOVATE_DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads');
const RUNTIME_DIR = path.join(__dirname, 'runtime');
const MANIFEST_DIR = path.join(RUNTIME_DIR, 'manifests');
const STAGING_DIR = path.join(RUNTIME_DIR, 'staged');
const STATUS_FILE = path.join(MANIFEST_DIR, 'last-sync.json');

function nowIso() {
  return new Date().toISOString();
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function ensureRuntime() {
  await fs.mkdir(MANIFEST_DIR, { recursive: true });
  await fs.mkdir(STAGING_DIR, { recursive: true });
}

async function readStatusFile() {
  try {
    const raw = await fs.readFile(STATUS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeStatusFile(payload) {
  await ensureRuntime();
  await fs.writeFile(STATUS_FILE, JSON.stringify(payload, null, 2));
}

async function statSafe(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

// Find the most recently modified CSV in Downloads whose name matches a keyword
async function findLatestCsv(keyword) {
  let entries;
  try {
    entries = await fs.readdir(DOWNLOADS_DIR, { withFileTypes: true });
  } catch {
    return null;
  }

  const matches = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.csv') && e.name.toLowerCase().includes(keyword))
    .map(e => path.join(DOWNLOADS_DIR, e.name));

  if (matches.length === 0) return null;

  const withStats = await Promise.all(matches.map(async (p) => {
    const stat = await statSafe(p);
    return { fullPath: p, name: path.basename(p), mtime: stat?.mtime || 0, size: stat?.size || 0 };
  }));

  withStats.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
  return withStats[0];
}

async function inspectDownloads() {
  const [fillsMatch, performanceMatch, cashMatch] = await Promise.all([
    findLatestCsv('fills'),
    findLatestCsv('performance'),
    findLatestCsv('cash'),
  ]);

  const inspected = [
    { kind: 'fills', required: true, match: fillsMatch },
    { kind: 'performance', required: true, match: performanceMatch },
    { kind: 'cash', required: false, match: cashMatch },
  ].map(({ kind, required, match }) => ({
    kind,
    required,
    name: match?.name || (kind === 'fills' ? 'Fills.csv' : kind === 'performance' ? 'Performance.csv' : 'Cash.csv'),
    fullPath: match?.fullPath || path.join(DOWNLOADS_DIR, kind + '.csv'),
    exists: Boolean(match),
    size: match?.size || 0,
    modifiedAt: match ? new Date(match.mtime).toISOString() : null,
  }));

  return {
    downloadsDir: DOWNLOADS_DIR,
    files: inspected,
    ready: inspected.filter(f => f.required).every(f => f.exists),
    missingRequired: inspected.filter(f => f.required && !f.exists).map(f => f.kind),
  };
}

async function stageFile(sourcePath, targetName) {
  await ensureRuntime();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetPath = path.join(STAGING_DIR, `${timestamp}-${targetName}`);
  await fs.copyFile(sourcePath, targetPath);
  return targetPath;
}

async function handleStatus() {
  const inspection = await inspectDownloads();
  const previous = await readStatusFile();
  const helper = {
    baseUrl: `http://127.0.0.1:${PORT}`,
    connectionState: 'connected',
    lastCheckedAt: nowIso(),
    statusEndpoint: `http://127.0.0.1:${PORT}/api/tradovate-sync/status`,
    triggerEndpoint: `http://127.0.0.1:${PORT}/api/tradovate-sync/sync`,
    source: 'helper-api',
    helperVersion: '0.0.1',
  };

  return {
    phase: inspection.ready ? (previous?.phase || 'idle') : 'idle',
    updatedAt: nowIso(),
    lastRunAt: previous?.lastRunAt || null,
    lastSuccessAt: previous?.lastSuccessAt || null,
    sessionStrategy: 'persistent-browser-first',
    credentialMode: 'session-only',
    message: inspection.ready
      ? 'Helper is online. Required files are present in Downloads.'
      : `Waiting for required files in ${DOWNLOADS_DIR}.`,
    summary: {
      importedFiles: previous?.summary?.importedFiles || [],
      notes: [
        `Downloads dir: ${DOWNLOADS_DIR}`,
        inspection.ready
          ? 'Ready to stage Fills.csv + Performance.csv for dashboard import.'
          : `Missing required files: ${inspection.missingRequired.join(', ') || 'none'}`,
      ],
      inspection,
    },
    helper,
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function handleLatestBundle() {
  const status = await readStatusFile();
  const stagedFiles = Array.isArray(status?.summary?.stagedFiles) ? status.summary.stagedFiles : [];
  const files = [];

  for (const file of stagedFiles) {
    try {
      const content = await fs.readFile(file.stagedPath, 'utf8');
      files.push({
        kind: file.kind,
        name: path.basename(file.source || file.stagedPath),
        content,
        stagedPath: file.stagedPath,
      });
    } catch {
      // ignore missing staged file
    }
  }

  return {
    files,
    updatedAt: nowIso(),
    count: files.length,
  };
}

async function handleSync(req) {
  const payload = await readBody(req);
  const inspection = await inspectDownloads();

  if (!inspection.ready) {
    const status = {
      phase: 'error',
      updatedAt: nowIso(),
      lastRunAt: nowIso(),
      lastSuccessAt: null,
      sessionStrategy: 'persistent-browser-first',
      credentialMode: 'session-only',
      message: 'Required Tradovate files are not present yet.',
      lastError: `Missing required files: ${inspection.missingRequired.join(', ')}`,
      summary: {
        importedFiles: [],
        notes: [
          `Downloads dir: ${DOWNLOADS_DIR}`,
          `Missing required files: ${inspection.missingRequired.join(', ')}`,
          payload.accountHint ? `Account hint: ${payload.accountHint}` : 'No account hint provided.',
        ],
        inspection,
      },
      helper: {
        baseUrl: `http://127.0.0.1:${PORT}`,
        connectionState: 'connected',
        lastCheckedAt: nowIso(),
        statusEndpoint: `http://127.0.0.1:${PORT}/api/tradovate-sync/status`,
        triggerEndpoint: `http://127.0.0.1:${PORT}/api/tradovate-sync/sync`,
        source: 'helper-api',
        helperVersion: '0.0.1',
      },
    };
    await writeStatusFile(status);
    return status;
  }

  const stagedFiles = [];
  for (const file of inspection.files.filter(file => file.exists)) {
    const stagedPath = await stageFile(file.fullPath, file.name);
    stagedFiles.push({ kind: file.kind, source: file.fullPath, stagedPath });
  }

  const status = {
    phase: 'success',
    updatedAt: nowIso(),
    lastRunAt: nowIso(),
    lastSuccessAt: nowIso(),
    sessionStrategy: 'persistent-browser-first',
    credentialMode: 'session-only',
    message: 'Tradovate files staged successfully. Next step: app-side import wiring.',
    summary: {
      importedFiles: stagedFiles.map(file => file.stagedPath),
      notes: [
        `Downloads dir: ${DOWNLOADS_DIR}`,
        payload.accountHint ? `Account hint: ${payload.accountHint}` : 'No account hint provided.',
        'Files were copied into sync-helper/runtime/staged as the first bridge step.',
        'Next step is to have the dashboard consume the staged bundle automatically.',
      ],
      inspection,
      stagedFiles,
    },
    helper: {
      baseUrl: `http://127.0.0.1:${PORT}`,
      connectionState: 'connected',
      lastCheckedAt: nowIso(),
      statusEndpoint: `http://127.0.0.1:${PORT}/api/tradovate-sync/status`,
      triggerEndpoint: `http://127.0.0.1:${PORT}/api/tradovate-sync/sync`,
      source: 'helper-api',
      helperVersion: '0.0.1',
    },
  };

  await writeStatusFile(status);
  return status;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    json(res, 404, { error: 'Not found' });
    return;
  }

  if (req.method === 'OPTIONS') {
    json(res, 200, { ok: true });
    return;
  }

  try {
    if (req.method === 'GET' && req.url === '/api/tradovate-sync/health') {
      json(res, 200, { ok: true, service: 'tradovate-sync-helper', version: '0.0.1', timestamp: nowIso() });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/tradovate-sync/status') {
      json(res, 200, await handleStatus());
      return;
    }

    if (req.method === 'GET' && req.url === '/api/tradovate-sync/bundle/latest') {
      json(res, 200, await handleLatestBundle());
      return;
    }

    if (req.method === 'POST' && req.url === '/api/tradovate-sync/sync') {
      json(res, 200, await handleSync(req));
      return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: nowIso(),
    });
  }
});

await ensureRuntime();
server.listen(PORT, '127.0.0.1', () => {
  console.log(`tradovate-sync-helper listening on http://127.0.0.1:${PORT}`);
});
