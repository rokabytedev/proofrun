import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import {
  ensureSimLockFiles, ensurePortLockFiles,
  acquireSimulatorSlot, acquirePort,
  releaseLock, getLockedSlots, getLockedPorts,
} from '../locking.js';
import {
  generateSessionId, createSessionDir, saveSessionState,
  findActiveSession, loadSessionState, initEvidence, loadEvidence,
} from '../session.js';

export function registerSession(program) {
  const session = program
    .command('session')
    .description('Manage verification sessions');

  session
    .command('start')
    .description('Start a new verification session')
    .requiredOption('--change <name>', 'Change name to verify')
    .option('--device <type>', 'Device type from config', 'default')
    .option('--timeout <seconds>', 'Max wait time for resources', '300')
    .action(async (opts) => {
      const rawConfig = requireConfig('session.start');
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;

      // Check no active session
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);
      const existing = findActiveSession(evidenceDir);
      if (existing) {
        error('session.start', `Active session already exists: ${existing.sessionId}. Run \`proofrun session stop\` first.`);
      }

      const lockDir = resolve(projectRoot, config.session.lock_dir);
      const poolSize = config.simulator.pool_size;
      const { start: portStart, end: portEnd } = config.port_range;

      // Ensure lock files exist
      ensureSimLockFiles(lockDir, poolSize);
      ensurePortLockFiles(lockDir, portStart, portEnd);

      // Acquire simulator slot (poll with timeout per spec)
      const timeoutMs = parseInt(opts.timeout, 10) * 1000;
      const pollInterval = 10000; // 10 seconds
      const startTime = Date.now();
      let simResult = null;

      while (!simResult) {
        simResult = acquireSimulatorSlot(lockDir, poolSize);
        if (simResult) break;
        if (Date.now() - startTime >= timeoutMs) {
          error('session.start', `All ${poolSize} simulator slots are locked. Waited ${opts.timeout}s. Consider increasing simulator.pool_size in .proofrun/config.yaml.`);
        }
        // Poll: wait and retry
        await new Promise(r => setTimeout(r, pollInterval));
      }

      // Acquire port
      const portResult = acquirePort(lockDir, portStart, portEnd);
      if (!portResult) {
        releaseLock(simResult.lock);
        error('session.start', `All ports in range ${portStart}-${portEnd} are locked or in use. Consider expanding port_range in .proofrun/config.yaml.`);
      }

      // Resolve device name
      const deviceType = opts.device;
      const deviceName = config.simulator.device_types?.[deviceType] || config.simulator.device_types?.default || 'iPhone 16 Pro';

      // Create session
      const sessionId = generateSessionId();
      const sessionDir = createSessionDir(evidenceDir, sessionId);

      // Start dev server
      const serverCommand = config.dev_server.start.replace(/\{\{port\}\}/g, String(portResult.port));
      const serverLogPath = resolve(sessionDir, 'server.log');
      const logStream = createWriteStream(serverLogPath);

      const [cmd, ...args] = serverCommand.split(' ');
      const serverProcess = spawn(cmd, args, {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      });

      serverProcess.stdout.pipe(logStream);
      serverProcess.stderr.pipe(logStream);
      serverProcess.unref();

      // Wait for ready signal
      const readySignal = config.dev_server.ready_signal;
      const startupTimeout = (config.dev_server.startup_timeout || 120) * 1000;
      let serverReady = false;

      if (readySignal) {
        const readyRegex = new RegExp(readySignal);
        serverReady = await new Promise((resolvePromise) => {
          const timeout = setTimeout(() => resolvePromise(false), startupTimeout);
          const checkReady = (data) => {
            if (readyRegex.test(data.toString())) {
              clearTimeout(timeout);
              resolvePromise(true);
            }
          };
          serverProcess.stdout.on('data', checkReady);
          serverProcess.stderr.on('data', checkReady);
          serverProcess.on('exit', () => {
            clearTimeout(timeout);
            resolvePromise(false);
          });
        });
      } else {
        // No ready signal — wait a moment and assume ready
        await new Promise(r => setTimeout(r, 2000));
        serverReady = true;
      }

      const sessionState = {
        session_id: sessionId,
        status: serverReady ? 'active' : 'starting',
        change_name: opts.change,
        started_at: new Date().toISOString(),
        stopped_at: null,
        simulator: {
          slot: simResult.slot,
          device_name: deviceName,
          device_type: deviceType,
          lock_file: `.proofrun/locks/sim-${simResult.slot}.lock`,
        },
        port: {
          number: portResult.port,
          lock_file: `.proofrun/locks/port-${portResult.port}.lock`,
        },
        dev_server: {
          pid: serverProcess.pid,
          command: serverCommand,
          log_file: 'server.log',
        },
      };

      saveSessionState(sessionDir, sessionState);
      initEvidence(sessionDir, sessionId, opts.change, sessionState.simulator, portResult.port);

      success('session.start', {
        session_id: sessionId,
        change_name: opts.change,
        simulator: sessionState.simulator,
        port: { number: portResult.port, lock_file: sessionState.port.lock_file },
        dev_server: {
          pid: serverProcess.pid,
          command: serverCommand,
          log_file: `.proofrun/sessions/${sessionId}/server.log`,
          status: serverReady ? 'ready' : 'starting',
        },
        session_dir: `.proofrun/sessions/${sessionId}`,
      });
    });

  session
    .command('stop')
    .description('Stop the active verification session')
    .action(async () => {
      const rawConfig = requireConfig('session.stop');
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);

      const active = findActiveSession(evidenceDir);
      if (!active) {
        error('session.stop', 'No active session found.');
      }

      const { sessionDir, state } = active;

      // Kill dev server
      if (state.dev_server?.pid) {
        try {
          process.kill(state.dev_server.pid);
        } catch {
          // Process already dead
        }
      }

      // Release locks
      const lockDir = resolve(projectRoot, config.session.lock_dir);
      if (state.simulator?.slot !== undefined) {
        const simLock = { heldPath: resolve(lockDir, `sim-${state.simulator.slot}.lock.held`) };
        releaseLock(simLock);
      }
      if (state.port?.number !== undefined) {
        const portLock = { heldPath: resolve(lockDir, `port-${state.port.number}.lock.held`) };
        releaseLock(portLock);
      }

      // Update session state
      const stoppedAt = new Date().toISOString();
      state.status = 'stopped';
      state.stopped_at = stoppedAt;
      saveSessionState(sessionDir, state);

      // Count evidence
      const evidence = loadEvidence(sessionDir);
      const entryCount = evidence?.entries?.length || 0;
      const startedAt = new Date(state.started_at);
      const duration = Math.round((new Date(stoppedAt) - startedAt) / 1000);

      success('session.stop', {
        session_id: active.sessionId,
        released: {
          simulator_slot: state.simulator?.slot,
          port: state.port?.number,
          dev_server_pid: state.dev_server?.pid,
        },
        evidence_entries: entryCount,
        duration_seconds: duration,
      });
    });

  session
    .command('status')
    .description('Show active session info or pool availability')
    .action(async () => {
      const rawConfig = requireConfig('session.status');
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);
      const lockDir = resolve(projectRoot, config.session.lock_dir);
      const poolSize = config.simulator.pool_size;
      const { start: portStart, end: portEnd } = config.port_range;

      const active = findActiveSession(evidenceDir);

      const lockedSlots = existsSync(lockDir) ? getLockedSlots(lockDir, poolSize) : [];
      const lockedPorts = existsSync(lockDir) ? getLockedPorts(lockDir, portStart, portEnd) : [];
      const totalPorts = portEnd - portStart + 1;

      const pool = {
        simulators: { available: poolSize - lockedSlots.length, total: poolSize, locked_slots: lockedSlots },
        ports: { available: totalPorts - lockedPorts.length, total: totalPorts, locked_ports: lockedPorts },
      };

      if (active) {
        const { state } = active;
        const evidence = loadEvidence(active.sessionDir);
        success('session.status', {
          active: true,
          session_id: active.sessionId,
          change_name: state.change_name,
          simulator: state.simulator,
          port: state.port?.number,
          dev_server: { pid: state.dev_server?.pid, status: 'running' },
          started_at: state.started_at,
          evidence_entries: evidence?.entries?.length || 0,
          pool,
        });
      } else {
        success('session.status', { active: false, pool });
      }
    });
}
