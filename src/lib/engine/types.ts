// DigOnce Conflict Engine — Core Types
// Pure TypeScript, no database access

export type WorkType = 'excavation' | 'resurfacing' | 'pipeline' | 'drainage' | 'cable' | 'other';
export type WorkStatus = 'planned' | 'active' | 'completed' | 'delayed' | 'cancelled';

export interface Work {
  id: string;
  title: string;
  departmentId: string;
  type: WorkType;
  status: WorkStatus;
  segmentIds: string[];
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
}

export type RuleId = 'R1_OVERLAP' | 'R2_REPEAT_EXCAVATION' | 'R3_MERGE_OPPORTUNITY';
export type Severity = 'high' | 'medium' | 'info';

export interface Conflict {
  rule: RuleId;
  severity: Severity;
  segmentId: string;
  otherWorkId: string;
  explanation: string; // plain language, shown to the user
  suggestion?: {
    start: string;
    end: string;
    text: string;
  };
}

export interface EngineConfig {
  moratoriumMonths: number;   // default 12
  mergeWindowDays: number;    // default 90
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  moratoriumMonths: 12,
  mergeWindowDays: 90,
};
