/**
 * Pure functions for airspace threat scoring, trajectory calculation, and validation.
 */

export interface TrackSeed {
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
}

export interface ScoredTrack extends TrackSeed {
  score: number;
  level: 'critical' | 'high' | 'watch' | 'low';
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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

export function scoreTrack(track: TrackSeed, coreX = 52, coreY = 49): ScoredTrack {
  const distanceFromCore = calculateDistance(track.x, track.y, coreX, coreY);
  const proximity = clamp(100 - distanceFromCore * 1.8, 8, 100);
  const speedAnomaly = clamp(Math.abs(track.speed - 52) * 1.55, 5, 100);
  const restricted = track.restricted ? 100 : 7;
  const behaviorMap: Record<string, number> = {
    steady: 9,
    transit: 17,
    loitering: 46,
    probing: 78,
    erratic: 92,
  };
  const behavior = behaviorMap[track.behavior] ?? 20;
  const lowConfidence = clamp(100 - track.confidence, 4, 100);
  const scenarioWeight = track.scenarioBoost || 0;

  const score = Math.round(
    clamp(
      proximity * 0.28 +
        speedAnomaly * 0.16 +
        restricted * 0.26 +
        behavior * 0.2 +
        lowConfidence * 0.1 +
        scenarioWeight,
      0,
      99
    )
  );

  const level: 'critical' | 'high' | 'watch' | 'low' =
    score >= 78 ? 'critical' : score >= 57 ? 'high' : score >= 31 ? 'watch' : 'low';

  const reasons: string[] = [];
  if (track.restricted) reasons.push('Restricted-zone entry');
  if (proximity > 65) reasons.push('Proximity to protected core');
  if (behavior === 92 || behavior === 78) {
    reasons.push(`${track.behavior[0].toUpperCase()}${track.behavior.slice(1)} vector behavior`);
  }
  if (speedAnomaly > 45) reasons.push('Speed deviation from profile');
  if (track.confidence < 85) reasons.push('Classification confidence below threshold');
  if (!reasons.length) reasons.push('No priority indicators detected');

  const eta = Math.max(18, Math.round((100 - proximity) * 1.25 + 15));

  const projectedPath = predictTrajectory(track.x, track.y, track.heading, track.speed, 4);

  return {
    ...track,
    score,
    level,
    proximity: Math.round(proximity),
    speedAnomaly: Math.round(speedAnomaly),
    behaviorScore: behavior,
    lowConfidence: Math.round(lowConfidence),
    reasons,
    eta,
    history: [track.altitude],
    age: 0,
    projectedPath,
  };
}

export function predictTrajectory(
  startX: number,
  startY: number,
  headingDeg: number,
  speedKnots: number,
  steps = 4
): Array<{ x: number; y: number }> {
  const rad = ((headingDeg - 90) * Math.PI) / 180;
  const stepDist = (speedKnots / 70) * 4.2;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 1; i <= steps; i++) {
    const x = clamp(startX + Math.cos(rad) * stepDist * i, 2, 98);
    const y = clamp(startY + Math.sin(rad) * stepDist * i, 2, 98);
    points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  }

  return points;
}

export function validateIncidentPayload(payload: {
  id: string;
  trackId: string;
  severity: string;
  title: string;
  authorId: string;
}): boolean {
  if (!payload.id || payload.id.length > 64) return false;
  if (!payload.trackId || payload.trackId.length > 32) return false;
  if (!payload.title || payload.title.trim().length === 0 || payload.title.length > 128) return false;
  if (!['critical', 'high', 'watch', 'routine'].includes(payload.severity)) return false;
  if (!payload.authorId) return false;
  return true;
}

export function isValidIp(ip: string): boolean {
  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  const ipv6 = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;
  return ipv4.test(ip.trim()) || ipv6.test(ip.trim());
}
