import { z } from 'zod';
import { projectSchema } from './contracts';

export type Project = z.infer<typeof projectSchema>;
export type Content = Project['content'];
export type Source = Content['source'];
export type Snapshot = { data: Record<string, unknown>; source: Source };
export type Revision = { id: string; number: number; contentHash: string; templateVersion: string; createdAt: string };
export type View = {
  id: string;
  name: string;
  family: string;
  status: string;
  currentRevision: number;
  payload: Project;
  revision: Revision;
  jobs?: Job[];
  updatedAt: string;
};
export type JobResult = {
  files?: Output[];
  expiresAt?: string;
  revision?: number;
  caption?: string;
  summary?: string;
  altText?: string;
  assetId?: string;
};
export type Job = { id: string; revision: number; status: string; kind: string; error?: string; result?: JobResult };
export type Output = { key: string; name: string; mime: string; width?: number; height?: number };
export type Asset = {
  id: string;
  name: string;
  kind: string;
  status: string;
  origin: string;
  people: string;
  jerseyNumber: string;
  consent: string;
  provenance?: { prompt: string; model: string; generatedAt: string; chargedMicros: number };
};
export type Partner = {
  id: string;
  name: string;
  assetId: string | null;
  seedLogo: string | null;
  status: string;
  contractNote: string;
};
export type Template = {
  id: string;
  family?: string;
  label: string;
  description: string;
  variants: string[];
  layouts: string[];
  formats: string[];
  version: string;
  status: string;
};
export type Report = { valid: boolean; errors: { field: string; message: string }[] };
export type AiTaskId = 'copy' | 'report' | 'text' | 'image';
export type AiProviderId = 'google' | 'anthropic' | 'openai';
export type AiModel = {
  id: string;
  provider: AiProviderId;
  kind: 'text' | 'image';
  label: string;
  input: number;
  output: number;
  imageOutput?: number;
  perImage2K?: number;
  custom?: boolean;
  available: boolean;
  maxCallMicros?: Partial<Record<AiTaskId, number>>;
};
export type AiTask = {
  id: AiTaskId;
  label: string;
  kind: 'text' | 'image';
  model: string;
  /** The owner's model for this task under the API engine (differs from `model` while the SDK engine is active). */
  apiModel?: string;
  /** Text tasks follow the global engine switch; images always use the image API. */
  engine?: AiEngineId;
  available: boolean;
  maxCallMicros: number;
};
export type AiEngineId = 'api' | 'claude-agent-sdk';
export type AiSdkState =
  'ready' | 'untested' | 'not_configured' | 'auth_required' | 'unavailable' | 'connection_error' | 'limit_reached';
type AiCall = {
  at: string;
  ok: boolean;
  operation: string;
  model: string | null;
  durationMs: number;
  errorCode: string | null;
  error: string | null;
};
/** Global text engine shared with the panel (GET/PUT /ai/engine). */
export type AiEngine = {
  engine: AiEngineId;
  agentSdkModel: string;
  fallbackToApi: boolean;
  updatedAt: string | null;
  updatedFrom: 'panel' | 'studio' | null;
  updatedByName: string | null;
  activeModel: string | null;
  sdk: {
    status: AiSdkState;
    detail?: string | null;
    keyConfigured: boolean;
    lastCall?: AiCall | null;
    lastTest?: AiCall | null;
    billing: string;
  };
  api: { label: string; model: string; provider?: AiProviderId; billing: string } | null;
  sdkModels: { id: string; label: string; default: boolean }[];
  operations: { id: string; surface: 'panel' | 'studio'; label: string; routing: 'engine' | 'api-only' }[];
  imageNotice: string;
};
export type AiEngineTest = {
  ok: boolean;
  engine: AiEngineId;
  model?: string;
  apiKeySource?: string;
  billing?: string;
  durationMs?: number;
  costUsd?: number;
  error?: string | null;
  detail?: string | null;
  status?: AiEngine | string;
};
export type AiKey = {
  provider: AiProviderId;
  label: string;
  hint: string;
  source: 'studio' | 'env' | null;
  last4: string | null;
  updatedAt: string | null;
  lastTestOk: boolean | null;
  lastTestedAt: string | null;
  lastError: string | null;
};
export type CustomModel = { id: string; provider: AiProviderId; label: string; input: number; output: number };
export type AiOverview = {
  engine?: AiEngineId;
  keys: AiKey[];
  models: AiModel[];
  tasks: AiTask[];
  customModels: CustomModel[];
  secretsConfigured: boolean;
};
export type Budget = {
  configured: boolean;
  remainingMicros: number;
  usedMicros: number;
  limitMicros: number;
  month: string;
  tasks: AiTask[];
  models: AiModel[];
};
export type Design = { style: string; format: string; status: string; kit: string; backgroundAssetId: string | null };
export type PostType = {
  id: string;
  family: string;
  variant: string;
  label: string;
  category: string;
  version: string;
  styles: string[];
  formats: string[];
  designs?: Design[];
};
export type ExportEntry = {
  id: string;
  jobId: string;
  revision: number;
  files: Output[];
  project: { name: string };
  expiresAt: string;
  createdAt: string;
};
export type SourceItem = {
  id: string;
  seasonId?: string;
  name?: string;
  title?: string;
  date?: string;
  opponent?: string;
  firstName?: string;
  lastName?: string;
  number?: string;
  position?: string;
};
export type User = { id?: string; firstName: string; lastName?: string };
