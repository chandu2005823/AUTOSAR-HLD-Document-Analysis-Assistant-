export type SystemRole = 'admin' | 'architect' | 'viewer';

export interface User {
  id: number;
  username: string;
  role: SystemRole;
  created_at?: string;
  active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Project {
  id: number;
  name: string;
  role: SystemRole;
  member_count?: number;
  document_count?: number;
}

export interface ProjectMember {
  user_id: number;
  username: string;
  role: SystemRole;
}

export interface DocumentItem {
  document_id: string;
  project_id: number;
  filename: string;
  version: number;
  pages: number;
  chunks: number;
  traceability_count: number;
  relationship_count: number;
  upload_timestamp?: string;
  status?: string;
}

export interface DocumentVersion {
  version: number;
  page_count: number;
  chunk_count: number;
  upload_timestamp?: string;
}

export interface ConfidenceInfo {
  level: string;
  score: number;
  semantic_score?: number;
  evidence_score?: number;
}

export interface GroundingInfo {
  supported: boolean;
  score: number;
  reason?: string;
}

export interface QASource {
  source_number?: string;
  page: number | string;
  chunk_id: number;
  text?: string;
  document_id?: string;
}

export interface QAResponse {
  answer: string;
  retrieval_confidence: ConfidenceInfo;
  grounding: GroundingInfo;
  sources: QASource[];
  primary_source?: QASource;
  project_id: number;
  document_id?: string;
  question?: string;
}

export interface TraceabilityRecord {
  entity: string;
  type: string;
  page: number | string;
  document_id?: string;
  project_id?: number;
  context?: string;
}

export interface RelationshipRecord {
  source: string;
  relationship: string;
  target: string;
  page: number | string | null;
  document_id?: string;
  project_id?: number;
}

export interface GraphNode {
  id: string;
  label: string;
}

export interface GraphEdge {
  id: number;
  source: string;
  target: string;
  relationship: string;
  page?: number | string | null;
  project_id?: number;
  document_id?: string;
}

export interface RelationshipGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ComparisonItem {
  entity: string;
  type: string;
  page?: number;
  page_changed?: boolean;
  old_page?: number;
  new_page?: number;
}

export interface ComparisonResult {
  added: ComparisonItem[];
  removed: ComparisonItem[];
  unchanged: ComparisonItem[];
}

export interface ReviewItem {
  id: string;
  question: string;
  answer: string;
  confidence?: ConfidenceInfo;
  review_status: 'approved' | 'needs_review' | 'rejected' | 'pending';
  created_at?: string;
  user_id?: number;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  event_type: string;
  document_name?: string | null;
  username: string;
  user_id?: number;
  project_id?: number;
  document_id?: string | null;
  status?: string;
  details?: Record<string, unknown>;
}
