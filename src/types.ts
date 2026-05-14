import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  points: number;
  updatedAt: Timestamp;
}

export interface Campaign {
  id: string;
  title: string;
  targetLink: string;
  description: string;
  pointsPerReply: number;
  maxEntries?: number;
  currentEntries: number;
  active: boolean;
  createdAt: Timestamp;
  createdBy: string;
}

export type SubmissionType = 'tweet' | 'reply';

export interface Submission {
  id: string;
  userId: string;
  link: string;
  type: SubmissionType;
  pointsEarned: number;
  campaignId?: string;
  createdAt: Timestamp;
  status: 'verified';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
