import { resolve } from 'node:path';
import { success } from '../output.js';
import { getGlobalLockDir, listLocks, readLockData, isLockStale } from '../locking.js';

export function registerDevice(program) {
  const device = program
    .command('device')
    .description('Manage device locks');

  device
    .command('status')
    .description('Show device lock status (works without project config)')
    .option('--device <id>', 'Check status of a specific device')
    .action(async (opts) => {
      const lockDir = getGlobalLockDir();

      if (opts.device) {
        // Single device status
        const resourceName = `dev-${opts.device}`;
        const heldPath = resolve(lockDir, `${resourceName}.lock.held`);
        const lockData = readLockData(heldPath);

        if (!lockData) {
          success('device.status', {
            device: opts.device,
            status: 'free',
          }, (data) =>
            `Device: ${data.device}\nStatus: free\n\nThis device is available. Use \`proofrun session start --device ${data.device} --change <name>\` to lock it.`
          );
          return;
        }

        const staleInfo = isLockStale(lockData);
        const status = staleInfo.stale ? 'stale' : 'locked';

        const result = {
          device: opts.device,
          status,
          session_id: lockData.session_id,
          project: lockData.project,
          pid: lockData.pid,
          locked_at: lockData.locked_at,
          stale_reason: staleInfo.stale ? staleInfo.reason : null,
        };

        success('device.status', result, (data) => {
          const lines = [
            `Device: ${data.device}`,
            `Status: ${data.status}${data.stale_reason ? ` (${data.stale_reason})` : ''}`,
          ];
          if (data.session_id) lines.push(`Session: ${data.session_id}`);
          if (data.project) lines.push(`Project: ${data.project}`);
          if (data.pid) lines.push(`PID: ${data.pid}`);
          if (data.locked_at) lines.push(`Locked at: ${data.locked_at}`);
          lines.push('');
          if (data.status === 'stale') {
            lines.push(`Suggestion: Lock appears stale. Use \`proofrun session start --device ${data.device} --change <name> --force-unlock\` to take over.`);
          } else {
            lines.push(`This device is in use. Ask human for approval before using --force-unlock.`);
          }
          return lines.join('\n');
        });
        return;
      }

      // List all device locks
      const locks = listLocks(lockDir);

      if (locks.length === 0) {
        success('device.status', {
          devices: [],
          total: 0,
        }, () => 'No device locks found. All devices are available.');
        return;
      }

      const devices = locks.map(l => ({
        device: l.lockData?.device || l.resource.replace(/^dev-/, ''),
        resource: l.resource,
        status: l.staleInfo.stale ? 'stale' : 'locked',
        session_id: l.sessionId,
        project: l.lockData?.project || null,
        pid: l.lockData?.pid || null,
        locked_at: l.lockData?.locked_at || null,
        stale_reason: l.staleInfo.stale ? l.staleInfo.reason : null,
      }));

      success('device.status', {
        devices,
        total: devices.length,
      }, (data) => {
        const lines = [`${data.total} device(s) locked:`, ''];
        for (const d of data.devices) {
          const statusStr = d.status === 'stale' ? `stale (${d.stale_reason})` : 'locked';
          lines.push(`  ${d.device}: ${statusStr}`);
          if (d.session_id) lines.push(`    Session: ${d.session_id}`);
          if (d.project) lines.push(`    Project: ${d.project}`);
        }
        return lines.join('\n');
      });
    });
}
