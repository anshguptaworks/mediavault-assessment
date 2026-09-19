export enum AssetStatus {
  Draft = 'draft',
  InReview = 'in_review',
  Approved = 'approved',
  Archived = 'archived',
}

export enum AssetKind {
  Image = 'image',
  Video = 'video',
  Document = 'document',
}

export interface Owner {
  id: string;
  name: string;
}

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  status: AssetStatus;
  tags: string[];
  collectionId: string;
  owner: Owner;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  hasThumbnail: boolean;
}
