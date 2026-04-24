export type AgentId = 'A1' | 'A2' | 'B3' | 'B4';
export type GroupId = 'A' | 'B';

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

export interface SessionSetup {
  id?: string;
  groupId?: string;
  activeEdgeIds: string[];
  scenarios: Scenario[];
  focalNode: string;
  opponentNode: string;
  sampleSize: number;
  submissionCount?: number;
  updatedAt?: string;
}

export interface Submission {
  sessionId: string;
  edgeId: string;
  results: SurveyResult[];
  demographics?: {
    age: number;
    gender: string;
    education: string;
  };
  isCompleted?: boolean;
}


export interface Scenario {
  id: number;
  edgeStates: Record<string, 'not give' | 'give'>;
}

export interface SurveyResult {
  scenarioId: number;
  cooperationProbability: number; // 0.0 to 1.0
}