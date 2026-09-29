export function extractApiError(err: unknown, fallback: string): string {
  const e = err as {
    error?: { message?: string; errors?: Record<string, string[]> };
    message?: string;
  };
  if (e?.error?.errors) {
    const msgs = Object.values(e.error.errors).flat();
    if (msgs.length) return msgs.join(' ');
  }
  if (typeof e?.error?.message === 'string' && e.error.message) return e.error.message;
  if (typeof e?.message === 'string' && e.message) return e.message;
  return fallback;
}
