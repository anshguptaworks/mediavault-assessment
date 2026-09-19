import type { Asset, AssetKind, AssetStatus, Owner } from './asset';

export enum SortField {
  UpdatedAt = 'updatedAt',
  CreatedAt = 'createdAt',
  Name = 'name',
  SizeBytes = 'sizeBytes',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export type SortValue = `${SortField}:${SortDirection}`;

export interface AssetQuery {
  q?: string;
  status?: AssetStatus[];
  kind?: AssetKind[];
  tag?: string[];
  collectionId?: string;
  owner?: string;
  sort?: SortValue;
  limit?: number;
  cursor?: string;
}

export interface AssetPage {
  items: Asset[];
  total: number;
  nextCursor: string | null;
}

export interface BatchAssetsResult {
  items: Asset[];
  missing: string[];
}

/** One row of a bulk-status response — a single id can succeed or fail independently. */
export type BulkStatusItemResult =
  | { id: string; ok: true; asset: Asset }
  | { id: string; ok: false; code: BulkFailureCode; message?: string };

export enum BulkFailureCode {
  NotFound = 'not_found',
  LegalHold = 'legal_hold',
  Conflict = 'conflict',
}

export interface BulkStatusResult {
  applied: number;
  failed: number;
  results: BulkStatusItemResult[];
}

/** Structured error codes the API can return — branch on these, never on `message`. */
export enum ApiErrorCode {
  BadRequest = 'bad_request',
  StaleCursor = 'stale_cursor',
  TooManyIds = 'too_many_ids',
  VersionConflict = 'version_conflict',
  InvalidName = 'invalid_name',
  InvalidStatus = 'invalid_status',
  InvalidTags = 'invalid_tags',
  LegalHold = 'legal_hold',
  WriteFailed = 'write_failed',
  NotFound = 'not_found',
  ThumbnailMissing = 'thumbnail_missing',
  UpstreamUnavailable = 'upstream_unavailable',
  RateLimited = 'rate_limited',
  Network = 'network_error',
  Unknown = 'unknown',
}

export interface Facets {
  tags: string[];
  owners: Owner[];
  statuses: AssetStatus[];
  kinds: AssetKind[];
}

export interface Collection {
  id: string;
  name: string;
}

export interface HealthStatus {
  ok: boolean;
  assets: number;
  chaos: boolean;
  latency: boolean;
}
