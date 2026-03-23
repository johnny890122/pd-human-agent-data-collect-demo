export type AgentId = 'HA' | 'RA' | 'HB' | 'RB';
export type GroupId = 'A' | 'B';

export interface Agent {
  id: AgentId;
  label: string;
  group: GroupId;
  isRobot: boolean;
}

export interface EdgeDef {
  id: string;
  source: AgentId;
  target: AgentId;
}

export interface ExperimentSetup {
  id?: string;
  activeEdgeIds: string[];
  scenarios: Scenario[];
  focalNode: string;
  opponentNode: string;
  sampleSize: number;
  submissionCount: number;
  updatedAt?: string;
}

export interface EdgeConfigEntry {
  sessionId: string;
  edgeId: string;
  results: SurveyResult[];
  demographics: {
    age: number;
    gender: string;
    education: string;
  };
}


export interface Scenario {
  id: number;
  edgeStates: Record<string, 0 | 1>; // edgeId -> 0 (Low) or 1 (High)
}

export interface SurveyResult {
  scenarioId: number;
  cooperationProbability: number; // 0.0 to 1.0
}