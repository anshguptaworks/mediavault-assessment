import { ApiErrorCode, type Asset } from '@/types';

const RETRYABLE_CODES: ReadonlySet<ApiErrorCode> = new Set([
  ApiErrorCode.UpstreamUnavailable,
  ApiErrorCode.RateLimited,
  ApiErrorCode.WriteFailed,
  ApiErrorCode.Network,
]);

/** Every failure the app can hit is normalized into this shape. Callers
 *  branch on `code`, never `message`; `retryable` is a property of the
 *  error, not inferred later by matching status codes or strings. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: ApiErrorCode;
  readonly retryable: boolean;
  readonly retryAfterMs: number | null;
  readonly requestId: string | null;

  constructor(options: {
    status: number | null;
    code: ApiErrorCode;
    message: string;
    retryAfterMs?: number | null;
    requestId?: string | null;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.retryable = RETRYABLE_CODES.has(options.code);
    this.retryAfterMs = options.retryAfterMs ?? null;
    this.requestId = options.requestId ?? null;
  }

  static network(message = 'Network request failed.'): ApiError {
    return new ApiError({ status: null, code: ApiErrorCode.Network, message });
  }

  static aborted(): ApiError {
    return new ApiError({
      status: null,
      code: ApiErrorCode.Network,
      message: 'Request was cancelled.',
    });
  }
}

/** A 409 already resolved by fetching the row's current state — carrying
 *  `latestAsset` lets the UI show a real diff instead of a dead end. */
export class VersionConflictError extends ApiError {
  readonly latestAsset: Asset;

  constructor(latestAsset: Asset, message: string) {
    super({ status: 409, code: ApiErrorCode.VersionConflict, message });
    this.name = 'VersionConflictError';
    this.latestAsset = latestAsset;
  }
}

/** User-facing copy. The server's own `message` is logged, never rendered —
 *  it can leak implementation detail like exact rate-limit windows. */
const FRIENDLY_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.BadRequest]: 'That request was not valid. Try adjusting your filters.',
  [ApiErrorCode.StaleCursor]: 'This view changed while loading. Refreshing the list.',
  [ApiErrorCode.TooManyIds]: 'That selection is larger than a single batch allows.',
  [ApiErrorCode.VersionConflict]: 'Someone else changed this asset. Review the latest version.',
  [ApiErrorCode.InvalidName]: 'Name must be at least 3 characters.',
  [ApiErrorCode.InvalidStatus]: 'That status is not valid for this asset.',
  [ApiErrorCode.InvalidTags]: 'Those tags are not valid.',
  [ApiErrorCode.LegalHold]: 'This asset is on legal hold and cannot be archived.',
  [ApiErrorCode.WriteFailed]: 'The save failed. Retrying usually works.',
  [ApiErrorCode.NotFound]: 'This asset no longer exists.',
  [ApiErrorCode.ThumbnailMissing]: 'No preview is available for this asset.',
  [ApiErrorCode.UpstreamUnavailable]: 'The server is temporarily unavailable. Retrying…',
  [ApiErrorCode.RateLimited]: "You're doing that a bit fast. Slowing down and retrying…",
  [ApiErrorCode.Network]: 'Connection lost. Check your network and try again.',
  [ApiErrorCode.Unknown]: 'Something went wrong. Please try again.',
};

export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) return FRIENDLY_MESSAGES[error.code];
  return FRIENDLY_MESSAGES[ApiErrorCode.Unknown];
}
