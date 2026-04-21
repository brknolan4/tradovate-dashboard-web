import fs from 'node:fs';
import path from 'node:path';

const SESSION_STATE_FILE = 'session-state.json';

function getSessionStatePath(sessionDir) {
  return path.join(sessionDir, SESSION_STATE_FILE);
}

function hasSessionArtifacts(sessionDir) {
  if (!fs.existsSync(sessionDir)) return false;

  const likelyArtifacts = [
    'Local State',
    path.join('Default', 'Cookies'),
    path.join('Default', 'Preferences'),
  ];

  return likelyArtifacts.some((relativePath) => fs.existsSync(path.join(sessionDir, relativePath)));
}

function summarizeState(state) {
  if (!state) return null;

  return {
    authenticated: state.authenticated === true,
    verifiedAt: state.verifiedAt || null,
    verificationMode: state.verificationMode || null,
    verificationReason: state.verificationReason || null,
    url: state.url || null,
    title: state.title || null,
    authEvidence: state.authEvidence || null,
    profile: state.profile || null,
    browser: state.browser || null,
  };
}

export function readSavedSessionState(sessionDir) {
  const statePath = getSessionStatePath(sessionDir);
  if (!fs.existsSync(statePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeSavedSessionState(sessionDir, state) {
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(getSessionStatePath(sessionDir), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function recordUnauthenticatedSessionState(sessionDir, state = {}) {
  const previous = readSavedSessionState(sessionDir) || {};
  writeSavedSessionState(sessionDir, {
    ...previous,
    authenticated: false,
    lastCheckedAt: new Date().toISOString(),
    lastFailureMode: state.lastFailureMode || null,
    verificationReason: state.verificationReason || previous.verificationReason || null,
    url: state.url || null,
    title: state.title || null,
    authEvidence: state.authEvidence || null,
    profile: state.profile || previous.profile || null,
    browser: state.browser || previous.browser || null,
  });
}

export function detectSessionStrategy(config) {
  const hasPersistentSession = hasSessionArtifacts(config.sessionDir, config.browserProfileDirectory || 'Default');
  const savedState = readSavedSessionState(config.sessionDir);
  const hasVerifiedSavedLogin = Boolean(savedState?.authenticated === true);
  const hasEnvCreds = Boolean(config.username && config.password);

  if (hasVerifiedSavedLogin) {
    return {
      mode: 'persistent-session-verified',
      ready: true,
      reason: `Dedicated sidecar profile has a verified authenticated marker from ${savedState.verifiedAt || 'unknown time'}. Runtime verification still happens on launch.`,
      sessionState: summarizeState(savedState),
    };
  }

  if (hasPersistentSession) {
    return {
      mode: 'persistent-session-unverified',
      ready: true,
      reason: 'Dedicated sidecar profile artifacts exist, but no trusted authenticated marker was found. Treat as maybe reusable until launch-time verification succeeds.',
      sessionState: summarizeState(savedState),
    };
  }

  if (hasEnvCreds) {
    return {
      mode: 'env-fallback',
      ready: true,
      reason: 'No reusable dedicated sidecar profile was found yet; env credentials are available as fallback login assistance.',
      sessionState: summarizeState(savedState),
    };
  }

  return {
    mode: 'manual-bootstrap-needed',
    ready: false,
    reason: 'No dedicated sidecar profile is verified yet and no env fallback is configured.',
    sessionState: summarizeState(savedState),
  };
}

export function canAttemptLogin(config) {
  return Boolean(config.username && config.password);
}
