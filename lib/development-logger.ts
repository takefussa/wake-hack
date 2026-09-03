export function logDevelopmentError(scope: string, error: unknown): void {
  if (__DEV__) {
    if (typeof error === 'object' && error !== null) {
      const record = error as Record<string, unknown>;
      console.error(`[Okita!:${scope}]`, {
        code: record.code,
        message: record.message,
        details: record.details,
        hint: record.hint,
      });
      return;
    }

    console.error(`[Okita!:${scope}]`, error);
  }
}

export function logDevelopmentWarning(scope: string, value: unknown): void {
  if (__DEV__) {
    if (typeof value === 'object' && value !== null) {
      const record = value as Record<string, unknown>;
      console.warn(`[Okita!:${scope}]`, {
        code: record.code,
        message: record.message,
        details: record.details,
        hint: record.hint,
      });
      return;
    }

    console.warn(`[Okita!:${scope}]`, value);
  }
}
