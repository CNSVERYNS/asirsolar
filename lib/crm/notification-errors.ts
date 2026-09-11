export class DeliveryError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly uncertain: boolean;
  constructor(code: string, retryable = false, uncertain = false) {
    super(code); this.code = code; this.retryable = retryable; this.uncertain = uncertain;
  }
}
export function retryAt(attempts: number) { return Date.now() + Math.min(3600000, 60000 * 2 ** Math.max(0, attempts - 1)); }
