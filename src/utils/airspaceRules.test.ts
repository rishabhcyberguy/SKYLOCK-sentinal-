import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  calculateDistance,
  scoreTrack,
  predictTrajectory,
  validateIncidentPayload,
  isValidIp,
  TrackSeed,
} from './airspaceRules';

test('clamp restricts numbers within bounds', () => {
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(-10, 0, 100), 0);
  assert.equal(clamp(50, 0, 100), 50);
});

test('calculateDistance computes Euclidean distance correctly', () => {
  assert.equal(calculateDistance(0, 0, 3, 4), 5);
});

test('scoreTrack correctly scores high threat restricted tracks', () => {
  const seed: TrackSeed = {
    id: 'AX-204',
    callsign: 'RAVEN',
    type: 'UNKNOWN UAV',
    symbol: '◇',
    x: 53,
    y: 50,
    altitude: 1280,
    speed: 95,
    heading: 124,
    confidence: 60,
    behavior: 'erratic',
    home: 'EAST CORRIDOR',
    restricted: true,
    accent: 'red',
    scenarioBoost: 25,
  };

  const scored = scoreTrack(seed);
  assert.equal(scored.level, 'critical');
  assert.ok(scored.score >= 78, `Score ${scored.score} should be >= 78 for critical`);
  assert.ok(scored.reasons.includes('Restricted-zone entry'));
  assert.equal(scored.projectedPath.length, 4);
});

test('predictTrajectory projects sequential steps based on heading and speed', () => {
  const path = predictTrajectory(50, 50, 90, 70, 4);
  assert.equal(path.length, 4);
  // Heading 90 deg (due East) means y should stay around 50, x should increase
  assert.ok(path[0].x > 50, 'Path should advance towards positive X');
  assert.equal(path[0].y, 50);
});

test('validateIncidentPayload checks required fields and boundaries', () => {
  const valid = {
    id: 'inc-01',
    trackId: 'AX-204',
    severity: 'critical',
    title: 'Perimeter breach detected',
    authorId: 'user_123',
  };
  assert.equal(validateIncidentPayload(valid), true);

  const invalid = {
    ...valid,
    title: '', // empty title
  };
  assert.equal(validateIncidentPayload(invalid), false);
});

test('isValidIp validates IPv4 and IPv6 format', () => {
  assert.equal(isValidIp('192.168.1.1'), true);
  assert.equal(isValidIp('8.8.8.8'), true);
  assert.equal(isValidIp('999.999.999.999'), false);
  assert.equal(isValidIp('not-an-ip'), false);
});
