#!/usr/bin/env node
/**
 * Local Google Drive bridge for the Dualis API v2 bootstrap.
 * Uses the configured gws CLI without exposing credentials or raw tokens.
 * Read-only by design. No Drive write/delete operation is implemented here.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const fields = 'user,storageQuota';
const safe = (value) => {
  if (!value || typeof value !== 'object') return {};
  const user = value.user || {};
  const quota = value.storageQuota || {};
  return {
    user: { displayName: user.displayName || null, permissionId: user.permissionId || null },
    storageQuota: { limit: quota.limit || null, usage: quota.usage || null, usageInDrive: quota.usageInDrive || null },
    connector: 'google-drive', mode: 'read-only', credentials: 'redacted'
  };
};
export async function driveStatus() {
  const { stdout } = await run('gws', ['drive','about','get','--params',JSON.stringify({fields}), '--format','json'], {timeout: 20000, maxBuffer: 1024 * 1024});
  return safe(JSON.parse(stdout));
}
export async function driveInventory(limit = 25) {
  const params = {q:'trashed = false', pageSize:Math.min(Number(limit) || 25, 100), fields:'files(id,name,mimeType,modifiedTime,parents,trashed)'};
  const { stdout } = await run('gws', ['drive','files','list','--params',JSON.stringify(params), '--format','json'], {timeout: 30000, maxBuffer: 4 * 1024 * 1024});
  const value = JSON.parse(stdout);
  return {connector:'google-drive', mode:'read-only', credentials:'redacted', files:(value.files || []).map(({id,name,mimeType,modifiedTime,parents,trashed}) => ({id,name,mimeType,modifiedTime,parents,trashed}))};
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'status';
  const result = mode === 'inventory' ? await driveInventory(process.argv[3]) : await driveStatus();
  console.log(JSON.stringify(result, null, 2));
}
