export function logDevelopmentError(scope: string, error: unknown): void {
  if (__DEV__) {
    console.error(`[Wake Hack:${scope}]`, error);
  }
}
