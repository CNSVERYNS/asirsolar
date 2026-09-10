export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options.headers }, cache: "no-store", credentials: "same-origin" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(result.error || "İşlem tamamlanamadı. Tekrar deneyin.", response.status);
  return result as T;
}
