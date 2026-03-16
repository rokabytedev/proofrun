let jsonMode = false;

export function setJsonMode(enabled) {
  jsonMode = enabled;
}

export function isJsonMode() {
  return jsonMode;
}

export function success(command, data, formatPlainText) {
  if (jsonMode) {
    console.log(JSON.stringify({ ok: true, command, data, error: null }));
  } else {
    if (formatPlainText) {
      const text = formatPlainText(data);
      if (text != null) console.log(text);
    } else {
      // Fallback: print key-value pairs
      for (const [key, val] of Object.entries(data || {})) {
        if (val !== null && val !== undefined) {
          console.log(`${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`);
        }
      }
    }
  }
}

export function error(command, message, exitCode = 1) {
  if (jsonMode) {
    console.log(JSON.stringify({ ok: false, command, data: null, error: message }));
  } else {
    console.error(`Error: ${message}`);
  }
  process.exit(exitCode);
}

export function usageError(command, message) {
  error(command, message, 2);
}
