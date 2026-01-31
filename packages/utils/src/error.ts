export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return JSON.stringify(
      {
        name: error.name,
        message: error.message,
        ...(error.cause ? { cause: error.cause } : {}),
      },
      null,
      2,
    );
  }
  return String(error);
}
