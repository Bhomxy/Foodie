/**
 * Error monitoring — set EXPO_PUBLIC_SENTRY_DSN in `.env` to enable.
 * Uses lazy init so the app still runs if the SDK fails to load in a given environment.
 */
let initialized = false;

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (initialized || !dsn) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
    Sentry.init({
      dsn,
      tracesSampleRate: 0.15,
      enableAutoSessionTracking: true,
    });
    initialized = true;
  } catch {
    // Package missing or native module unavailable — skip silently
  }
}

export function captureException(error: unknown): void {
  if (!initialized) return;
  try {
    const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
    Sentry.captureException(error);
  } catch {
    /* noop */
  }
}
