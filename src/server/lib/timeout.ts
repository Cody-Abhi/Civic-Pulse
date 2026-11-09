import "server-only";

export class FirestoreTimeoutError extends Error {
  readonly code = "FIRESTORE_TIMEOUT";
  readonly timeoutMs: number;
  readonly operation: string;

  constructor(operation: string, timeoutMs = 6000) {
    super(`Firestore read '${operation}' timed out after ${timeoutMs}ms`);
    this.name = "FirestoreTimeoutError";
    this.timeoutMs = timeoutMs;
    this.operation = operation;
  }
}

/**
 * 6s timeout on server Firestore reads per PRD §36.1 and Block C.
 * Rejects with FirestoreTimeoutError when the operation exceeds timeoutMs.
 */
export function withFirestoreTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 6000,
  operation = "Firestore read",
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new FirestoreTimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
