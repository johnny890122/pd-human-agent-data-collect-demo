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

export interface EdgeConfig {
  label: string;
  low: string;
  high: string;
}

export interface ExperimentSetup {
  activeEdgeIds: string[];
  edgeConfigs: Record<string, EdgeConfig>;
  decisionMaker: AgentId;
  opponent: AgentId;
}

export interface Scenario {
  id: number;
  edgeStates: Record<string, 0 | 1>; // edgeId -> 0 (Low) or 1 (High)
}

export interface SurveyResult {
  scenarioId: number;
  cooperationProbability: number; // 0.0 to 1.0
}