import { ApiErrorCode } from '@/types';
import { ApiError } from '@/lib';

const KNOWN_CODES = new Set<string>(Object.values(ApiErrorCode));

function toApiErrorCode(raw: string | undefined, status: number, method: string): ApiErrorCode {
  if (raw && KNOWN_CODES.has(raw)) return raw as ApiErrorCode;
  if (status === 503) return ApiErrorCode.UpstreamUnavailable;
  if (status === 429) return ApiErrorCode.RateLimited;
  // 500 on a write matches the documented `write_failed` contract; on a
  // read it's unexpected (only 503 is documented there) and reads better as
  // a generic, retryable "server had a problem" than a "save" that never
  // happened — e.g. a dev-server proxy error hitting a GET.
  if (status === 500) return method === 'GET' ? ApiErrorCode.UpstreamUnavailable : ApiErrorCode.WriteFailed;
  if (status === 404) return ApiErrorCode.NotFound;
  if (status === 400) return ApiErrorCode.BadRequest;
  return ApiErrorCode.Unknown;
}

function parseRetryAfterMs(headers: Headers): number | null {
  const raw = headers.get('retry-after');
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

interface RequestOptions extends RequestInit {
  signal?: AbortSignal;
}

/** The one place fetch is actually called. Never retries itself — it just
 *  normalizes a response or thrown error into one `ApiError` shape so every
 *  caller branches on `.code`/`.retryable` instead of parsing strings. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { 'content-type': 'application/json', ...options.headers },
    });
  } catch (cause) {
    if (options.signal?.aborted) throw ApiError.aborted();
    throw ApiError.network(cause instanceof Error ? cause.message : 'Network request failed.');
  }

  const requestId = response.headers.get('x-request-id');
  const method = (options.method ?? 'GET').toUpperCase();

  if (!response.ok) {
    let code = toApiErrorCode(undefined, response.status, method);
    let message = response.statusText || 'Request failed.';
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string } };
      if (body?.error?.code) code = toApiErrorCode(body.error.code, response.status, method);
      if (body?.error?.message) message = body.error.message;
    } catch {
      // Body was not JSON — fall back to the status-derived code above.
    }
    throw new ApiError({
      status: response.status,
      code,
      message,
      retryAfterMs: parseRetryAfterMs(response.headers),
      requestId,
    });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
