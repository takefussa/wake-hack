export function logDevelopmentError(scope: string, error: unknown): void {
  if (__DEV__) {
    if (typeof error === 'object' && error !== null) {
      const record = error as Record<string, unknown>;
      console.error(`[Wake Hack:${scope}]`, {
        code: record.code,
        message: record.message,
        details: record.details,
        hint: record.hint,
      });
      return;
    }

    console.error(`[Wake Hack:${scope}]`, error);
  }
}
