export type AgentId = 'A1' | 'A2' | 'B3' | 'B4';
export type GroupId = 'A' | 'B';
export type EdgeState = 'not give' | 'give';
export type ScenarioStatus = 'active' | 'completed' | 'paused';
export type SessionMode = 'manual' | 'mixed';

export interface Agent {
  id: AgentId;
  label: string;
  group: GroupId;
}

export interface EdgeDef {
  id: string;
  source: AgentId;
  target: AgentId;
}

// NEW: Scenario 作為獨立的原子單元
export interface Scenario {
  _id: string;  // UUID，不再是 number
  focalNode: string;
  opponentNode: string;
  activeEdgeIds: string[];
  edgeStates: Record<string, EdgeState>;
  scenarioIndex?: number;
  groupId?: string | null;
  targetSize: number;
  responseCount: number;
  status: ScenarioStatus;
  completionRate?: number;  // Virtual field
  createdAt: string;
  updatedAt: string;
}

// REFACTORED: Session 取代 SessionSetup（輕量容器）
export interface Session {
  _id: string;  // UUID
  scenarioIds: string[];  // 引用 Scenario._id 陣列
  scenarios?: Scenario[];  // Virtual populate
  activeEdgeIds?: string[];  // Frontend UI only / Legacy
  focalNode: string;
  opponentNode: string;
  sampleSize: number;
  groupId?: string | null;
  submissionCount: number;
  metadata?: {
    participantId?: string | null;
    createdFor?: SessionMode | null;
  };
  createdAt: string;
  updatedAt: string;
}

// Lightweight scenario preview for frontend (before server creation)
export interface ScenarioPreview {
  id: number;
  edgeStates: Record<string, EdgeState>;
}

// UPDATED: Submission
export interface Submission {
  _id: string;
  sessionId: string;  // 引用 Session._id
  participantId?: string | null;
  results: SurveyResult[];
  demographics?: {
    age?: number;
    gender?: string;
    education?: string;
  } | null;
  isCompleted: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// UPDATED: SurveyResult
export interface SurveyResult {
  scenarioId: string;  // UUID 引用，不再是 number
  cooperationProbability: number;  // 0.0 to 1.0
  responseTime?: number;  // milliseconds
  answeredAt?: string;
}

// NEW: SessionGroup with unified config
export interface SessionGroup {
  _id: string;
  name: string;
  description?: string | null;
  config: {
    maxK?: number | null;  // Mixed mode
    scenariosPerSession?: number | null;  // Mixed mode
    targetSizePerScenario?: number | null;  // Mixed mode
    focalNode: string;
    opponentNode: string;
    sampleSize: number;
  };
  totalSessions: number;
  totalScenarios: number;
  mode?: SessionMode;  // Virtual field
  completionPercentage?: number;  // Virtual field
  createdAt: string;
  updatedAt: string;
}