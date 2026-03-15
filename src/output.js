export function success(command, data) {
  console.log(JSON.stringify({ ok: true, command, data, error: null }));
}

export function error(command, message, exitCode = 1) {
  console.log(JSON.stringify({ ok: false, command, data: null, error: message }));
  process.exit(exitCode);
}

export function usageError(command, message) {
  error(command, message, 2);
}
