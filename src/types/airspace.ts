export type ScenarioType = 'normal' | 'anomalous' | 'high-threat';
export type SpeedType = 'slow' | 'normal' | 'fast';
export type ThreatLevel = 'critical' | 'high' | 'watch' | 'low';

export interface Track {
  id: string;
  callsign: string;
  type: string;
  symbol: string;
  x: number;
  y: number;
  altitude: number;
  speed: number;
  heading: number;
  confidence: number;
  behavior: 'steady' | 'transit' | 'loitering' | 'probing' | 'erratic';
  home: string;
  restricted: boolean;
  accent: 'red' | 'amber' | 'cyan';
  scenarioBoost?: number;
  score: number;
  level: ThreatLevel;
  proximity: number;
  speedAnomaly: number;
  behaviorScore: number;
  lowConfidence: number;
  reasons: string[];
  eta: number;
  history: number[];
  age: number;
  projectedPath: Array<{ x: number; y: number }>;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  callsign?: string;
  role: 'operator' | 'commander' | 'observer' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface AcknowledgedAlertData {
  trackId: string;
  callsign?: string;
  operatorId: string;
  operatorCallsign?: string;
  threatLevel: ThreatLevel;
  threatScore?: number;
  acknowledgedAt?: string;
  notes?: string;
}

export interface IncidentReport {
  id: string;
  trackId: string;
  targetCallsign?: string;
  severity: 'critical' | 'high' | 'watch' | 'routine';
  title: string;
  summary?: string;
  authorId: string;
  authorCallsign?: string;
  createdAt: string;
}

export interface WatchlistItem {
  trackId: string;
  callsign?: string;
  priority: 'urgent' | 'elevated' | 'routine';
  authorId: string;
  reason?: string;
  addedAt: string;
}

export interface AirspaceEvent {
  id: string;
  time: string;
  label: string;
  detail: string;
  tone: 'cyan' | 'green' | 'amber' | 'violet' | 'red';
}
