import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase';
import { useAuth } from './AuthContext';
import {
  Track,
  ScenarioType,
  SpeedType,
  ThreatLevel,
  IncidentReport,
  WatchlistItem,
  AirspaceEvent,
  AcknowledgedAlertData,
} from '../types/airspace';
import { scoreTrack, TrackSeed, clamp } from '../utils/airspaceRules';
import firebaseConfig from '../../firebase-applet-config.json';

const STORAGE_KEY = 'aegis-airspace-state';
const SPEEDS: Record<SpeedType, number> = { slow: 2600, normal: 1400, fast: 700 };

export const scenarioMeta: Record<
  ScenarioType,
  { label: string; intro: string; boost: number; restrictedBias: number }
> = {
  normal: {
    label: 'Routine airspace picture',
    intro: 'Baseline traffic with stable vectors',
    boost: 0,
    restrictedBias: 0.1,
  },
  anomalous: {
    label: 'Probing behavior detected',
    intro: 'Unscheduled vector changes in east corridor',
    boost: 18,
    restrictedBias: 0.35,
  },
  'high-threat': {
    label: 'Active incursion exercise',
    intro: 'Multiple objects converging on protected core',
    boost: 31,
    restrictedBias: 0.65,
  },
};

const seedTracks: TrackSeed[] = [
  { id: 'AX-204', callsign: 'RAVEN', type: 'UNKNOWN UAV', symbol: '◇', x: 61, y: 30, altitude: 1280, speed: 68, heading: 124, confidence: 82, behavior: 'probing', home: 'EAST CORRIDOR', restricted: true, accent: 'red' },
  { id: 'DR-118', callsign: 'KITE', type: 'QUADCOPTER', symbol: '✦', x: 31, y: 57, altitude: 480, speed: 42, heading: 248, confidence: 94, behavior: 'steady', home: 'NORTHWEST', restricted: false, accent: 'amber' },
  { id: 'BX-077', callsign: 'FALCON', type: 'FIXED-WING', symbol: '△', x: 78, y: 68, altitude: 2100, speed: 114, heading: 301, confidence: 96, behavior: 'steady', home: 'SOUTHERN ARC', restricted: false, accent: 'cyan' },
  { id: 'HX-052', callsign: 'MICA', type: 'HELICOPTER', symbol: '◒', x: 43, y: 22, altitude: 760, speed: 54, heading: 178, confidence: 91, behavior: 'loitering', home: 'NORTH GATE', restricted: false, accent: 'cyan' },
  { id: 'SX-441', callsign: 'SABLE', type: 'UNKNOWN UAV', symbol: '◇', x: 19, y: 35, altitude: 990, speed: 73, heading: 76, confidence: 78, behavior: 'erratic', home: 'WEST EDGE', restricted: false, accent: 'amber' },
  { id: 'DR-390', callsign: 'ORBIT', type: 'QUADCOPTER', symbol: '✦', x: 69, y: 50, altitude: 330, speed: 29, heading: 222, confidence: 88, behavior: 'steady', home: 'SOUTHEAST', restricted: false, accent: 'cyan' },
  { id: 'BX-312', callsign: 'NOMAD', type: 'FIXED-WING', symbol: '△', x: 53, y: 78, altitude: 1780, speed: 98, heading: 14, confidence: 97, behavior: 'transit', home: 'SOUTHERN ARC', restricted: false, accent: 'cyan' },
  { id: 'HX-903', callsign: 'EMBER', type: 'HELICOPTER', symbol: '◒', x: 87, y: 39, altitude: 620, speed: 48, heading: 196, confidence: 93, behavior: 'loitering', home: 'EAST EDGE', restricted: false, accent: 'amber' },
];

function generateTracksForScenario(scenario: ScenarioType): Track[] {
  const profile = scenarioMeta[scenario];
  return seedTracks.map((seed, index) => {
    const track = { ...seed, heading: seed.heading, confidence: seed.confidence };
    if (scenario === 'anomalous' && [0, 4, 7].includes(index)) {
      track.behavior = index === 4 ? 'erratic' : 'probing';
      track.restricted = index === 0 || index === 7;
      track.speed += index === 4 ? 18 : 9;
      track.confidence -= 5;
    }
    if (scenario === 'high-threat' && [0, 1, 4, 7].includes(index)) {
      track.restricted = true;
      track.behavior = index === 1 ? 'erratic' : 'probing';
      track.speed += index === 1 ? 21 : 14;
      track.heading = index === 0 ? 142 : index === 7 ? 226 : track.heading;
      track.confidence -= index === 4 ? 11 : 4;
    }
    track.scenarioBoost = profile.boost;
    return scoreTrack(track);
  });
}

const pad = (value: number) => String(value).padStart(2, '0');
const timeLabel = (date = new Date()) =>
  `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;

interface AirspaceContextValue {
  tracks: Track[];
  selectedTrack: Track | null;
  selectedTrackId: string;
  scenario: ScenarioType;
  speed: SpeedType;
  paused: boolean;
  tick: number;
  sweepCount: number;
  alertFilter: 'all' | 'critical' | 'high' | 'watch';
  sortThreat: boolean;
  acknowledged: Record<string, AcknowledgedAlertData>;
  incidents: IncidentReport[];
  watchlist: Record<string, WatchlistItem>;
  events: AirspaceEvent[];
  online: boolean;
  firebaseConnected: boolean;
  pingLatencyMs: number | null;
  firebaseProjectId: string;
  firestoreDatabaseId: string;
  setSelectedTrackId: (id: string) => void;
  setScenario: (scenario: ScenarioType) => void;
  setSpeed: (speed: SpeedType) => void;
  togglePause: () => void;
  resetSimulation: () => void;
  setAlertFilter: (filter: 'all' | 'critical' | 'high' | 'watch') => void;
  toggleSortThreat: () => void;
  acknowledgeAlert: (trackId: string, notes?: string) => Promise<void>;
  clearAcknowledged: () => Promise<void>;
  createIncidentReport: (incident: Omit<IncidentReport, 'id' | 'authorId' | 'authorCallsign' | 'createdAt'>) => Promise<void>;
  toggleWatchlistTarget: (track: Track, priority?: 'urgent' | 'elevated' | 'routine', reason?: string) => Promise<void>;
  addEvent: (label: string, detail: string, tone?: AirspaceEvent['tone']) => void;
}

const AirspaceContext = createContext<AirspaceContextValue | undefined>(undefined);

export const AirspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, demoOperator } = useAuth();

  const [scenario, setScenarioState] = useState<ScenarioType>('normal');
  const [speed, setSpeedState] = useState<SpeedType>('normal');
  const [paused, setPaused] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(42);
  const [sweepCount, setSweepCount] = useState<number>(42);
  const [selectedTrackId, setSelectedTrackIdState] = useState<string>('AX-204');
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'high' | 'watch'>('all');
  const [sortThreat, setSortThreat] = useState<boolean>(true);
  const [tracks, setTracks] = useState<Track[]>(() => generateTracksForScenario('normal'));

  const [acknowledged, setAcknowledged] = useState<Record<string, AcknowledgedAlertData>>({});
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [watchlist, setWatchlist] = useState<Record<string, WatchlistItem>>({});
  const [events, setEvents] = useState<AirspaceEvent[]>([
    { id: '1', time: timeLabel(), label: 'Command deck initialized', detail: 'SKYLOCK SENITAL operational', tone: 'cyan' },
    { id: '2', time: timeLabel(), label: 'Sensor fusion online', detail: '8 tracked aerial objects acquired', tone: 'green' },
    { id: '3', time: timeLabel(), label: 'Firebase Cloud DB', detail: 'Real-time Firestore sync & Auth connected', tone: 'violet' },
  ]);

  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [pingLatencyMs, setPingLatencyMs] = useState<number | null>(null);

  const addEvent = useCallback((label: string, detail: string, tone: AirspaceEvent['tone'] = 'cyan') => {
    const newEvent: AirspaceEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: timeLabel(),
      label,
      detail,
      tone,
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
  }, []);

  // Initial Firebase connection validation
  useEffect(() => {
    const checkConnection = async () => {
      const startTime = performance.now();
      const connected = await testConnection();
      const latency = Math.round(performance.now() - startTime);
      setFirebaseConnected(connected);
      setPingLatencyMs(latency);
      if (connected) {
        addEvent('Firestore Verified', `Live connection to ${firebaseConfig.projectId} (${latency}ms)`, 'green');
      }
    };
    checkConnection();
  }, [addEvent]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      addEvent('Network Restored', 'Re-established link with telemetry and Firestore', 'green');
    };
    const handleOffline = () => {
      setOnline(false);
      addEvent('Offline Mode Active', 'Operating with cached data and local sensor simulation', 'amber');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addEvent]);

  // Firestore Real-Time Listener: Shared Incident Reports
  useEffect(() => {
    if (!firebaseConnected) return;
    const incidentsRef = collection(db, 'incidents');
    const unsubscribe = onSnapshot(
      incidentsRef,
      (snapshot) => {
        const loaded: IncidentReport[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as IncidentReport);
        });
        // Sort descending by creation date
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setIncidents(loaded);
      },
      (error) => {
        console.warn('Incidents snapshot warning:', error.message);
      }
    );
    return () => unsubscribe();
  }, [firebaseConnected]);

  // Firestore Real-Time Listener: Shared Target Watchlist
  useEffect(() => {
    if (!firebaseConnected) return;
    const watchlistRef = collection(db, 'watchlist');
    const unsubscribe = onSnapshot(
      watchlistRef,
      (snapshot) => {
        const loaded: Record<string, WatchlistItem> = {};
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as WatchlistItem;
          loaded[item.trackId] = item;
        });
        setWatchlist(loaded);
      },
      (error) => {
        console.warn('Watchlist snapshot warning:', error.message);
      }
    );
    return () => unsubscribe();
  }, [firebaseConnected]);

  // Firestore Real-Time Listener: Operator's Acknowledged Alerts
  useEffect(() => {
    if (!user || !firebaseConnected) {
      // Load from local storage for demo operator
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (saved.acknowledged) setAcknowledged(saved.acknowledged);
      } catch (_) {}
      return;
    }
    const acksRef = collection(db, 'users', user.uid, 'acknowledgements');
    const unsubscribe = onSnapshot(
      acksRef,
      (snapshot) => {
        const loaded: Record<string, AcknowledgedAlertData> = {};
        snapshot.forEach((docSnap) => {
          loaded[docSnap.id] = docSnap.data() as AcknowledgedAlertData;
        });
        setAcknowledged(loaded);
      },
      (error) => {
        console.warn('Acknowledgements snapshot warning:', error.message);
      }
    );
    return () => unsubscribe();
  }, [user, firebaseConnected]);

  // Firestore Real-Time Listener: Operator's Session controls
  useEffect(() => {
    if (!user || !firebaseConnected) return;
    const sessionDocRef = doc(db, 'users', user.uid, 'session', 'current');
    const unsubscribe = onSnapshot(
      sessionDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.scenario && scenarioMeta[data.scenario as ScenarioType]) {
            setScenarioState(data.scenario as ScenarioType);
          }
          if (data.speed && SPEEDS[data.speed as SpeedType]) {
            setSpeedState(data.speed as SpeedType);
          }
          if (typeof data.paused === 'boolean') {
            setPaused(data.paused);
          }
          if (data.selectedTrackId) {
            setSelectedTrackIdState(data.selectedTrackId);
          }
        }
      },
      (error) => {
        console.warn('Session snapshot warning:', error.message);
      }
    );
    return () => unsubscribe();
  }, [user, firebaseConnected]);

  // Sync state changes to Firestore if user logged in
  const syncSessionToCloud = useCallback(
    async (newScenario: ScenarioType, newSpeed: SpeedType, newPaused: boolean, newTrackId: string) => {
      if (!user || !firebaseConnected) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ scenario: newScenario, speed: newSpeed, acknowledged })
        );
        return;
      }
      try {
        const path = `users/${user.uid}/session/current`;
        await setDoc(doc(db, 'users', user.uid, 'session', 'current'), {
          userId: user.uid,
          scenario: newScenario,
          speed: newSpeed,
          paused: newPaused,
          selectedTrackId: newTrackId,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync session to Firestore:', err);
      }
    },
    [user, firebaseConnected, acknowledged]
  );

  const setScenario = (newScenario: ScenarioType) => {
    setScenarioState(newScenario);
    const newTracks = generateTracksForScenario(newScenario);
    setTracks(newTracks);
    addEvent('Scenario Changed', scenarioMeta[newScenario].intro, 'amber');
    syncSessionToCloud(newScenario, speed, paused, selectedTrackId);
  };

  const setSpeed = (newSpeed: SpeedType) => {
    setSpeedState(newSpeed);
    addEvent('Speed Changed', `Telemetry updated to ${newSpeed} cadence`, 'cyan');
    syncSessionToCloud(scenario, newSpeed, paused, selectedTrackId);
  };

  const togglePause = () => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    addEvent(
      nextPaused ? 'Simulation Paused' : 'Simulation Resumed',
      nextPaused ? 'Telemetry frozen for analysis' : 'Active tracking resumed',
      'violet'
    );
    syncSessionToCloud(scenario, speed, nextPaused, selectedTrackId);
  };

  const setSelectedTrackId = (id: string) => {
    setSelectedTrackIdState(id);
    syncSessionToCloud(scenario, speed, paused, id);
  };

  const resetSimulation = () => {
    setTick(42);
    setSweepCount(42);
    const fresh = generateTracksForScenario(scenario);
    setTracks(fresh);
    addEvent('Simulation Reset', `Reloaded ${scenarioMeta[scenario].label}`, 'cyan');
  };

  const toggleSortThreat = () => setSortThreat((prev) => !prev);

  // Simulation tick loop
  useEffect(() => {
    if (paused) return;

    const intervalMs = SPEEDS[speed];
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      setSweepCount((s) => (s + 1) % 999);

      setTracks((prevTracks) => {
        return prevTracks.map((track) => {
          // Micro position adjustments simulating live radar returns
          const rad = ((track.heading - 90) * Math.PI) / 180;
          const deltaDist = (track.speed / 180) * 0.45;
          let nextX = clamp(track.x + Math.cos(rad) * deltaDist, 4, 96);
          let nextY = clamp(track.y + Math.sin(rad) * deltaDist, 4, 96);

          // Bound bounce
          let nextHeading = track.heading;
          if (nextX <= 4 || nextX >= 96) nextHeading = (180 - nextHeading + 360) % 360;
          if (nextY <= 4 || nextY >= 96) nextHeading = (360 - nextHeading) % 360;

          // Altitude micro jitter
          const altJitter = Math.round((Math.random() - 0.5) * 12);
          const nextAlt = clamp(track.altitude + altJitter, 150, 4500);

          const updatedSeed: TrackSeed = {
            ...track,
            x: Number(nextX.toFixed(2)),
            y: Number(nextY.toFixed(2)),
            heading: Math.round(nextHeading),
            altitude: nextAlt,
          };

          const scored = scoreTrack(updatedSeed);
          // Keep altitude history
          scored.history = [...track.history.slice(-14), nextAlt];
          scored.age = track.age + 1;
          return scored;
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [paused, speed, scenario]);

  // Acknowledge alert in Firestore
  const acknowledgeAlert = async (trackId: string, notes = 'Reviewed and cleared by operator') => {
    const target = tracks.find((t) => t.id === trackId);
    if (!target) return;

    const operatorId = user ? user.uid : 'operator-local';
    const operatorCallsign = user ? profile?.callsign || 'COMMANDER' : demoOperator.callsign;

    const ackData: AcknowledgedAlertData = {
      trackId,
      callsign: target.callsign,
      operatorId,
      operatorCallsign,
      threatLevel: target.level,
      threatScore: target.score,
      acknowledgedAt: new Date().toISOString(),
      notes,
    };

    if (user && firebaseConnected) {
      const path = `users/${user.uid}/acknowledgements/${trackId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'acknowledgements', trackId), ackData);
        addEvent('Alert Acknowledged', `Saved ${target.callsign} [${trackId}] acknowledgement to Cloud Firestore`, 'green');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setAcknowledged((prev) => {
        const next = { ...prev, [trackId]: ackData };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ scenario, speed, acknowledged: next }));
        return next;
      });
      addEvent('Alert Acknowledged', `Track ${target.callsign} acknowledged locally`, 'amber');
    }
  };

  const clearAcknowledged = async () => {
    if (user && firebaseConnected) {
      try {
        const keys = Object.keys(acknowledged);
        for (const k of keys) {
          await deleteDoc(doc(db, 'users', user.uid, 'acknowledgements', k));
        }
        addEvent('Queue Cleared', 'Reset cloud-acknowledged alerts', 'cyan');
      } catch (err) {
        console.warn('Could not clear Firestore acknowledgements:', err);
      }
    } else {
      setAcknowledged({});
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ scenario, speed, acknowledged: {} }));
      addEvent('Queue Cleared', 'Reset all local alert acknowledgements', 'cyan');
    }
  };

  // Publish Incident Report to Firestore
  const createIncidentReport = async (
    data: Omit<IncidentReport, 'id' | 'authorId' | 'authorCallsign' | 'createdAt'>
  ) => {
    const id = `inc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const authorId = user ? user.uid : 'demo-operator-id';
    const authorCallsign = user ? profile?.callsign || 'OPERATOR' : demoOperator.callsign;

    const report: IncidentReport = {
      ...data,
      id,
      authorId,
      authorCallsign,
      createdAt: new Date().toISOString(),
    };

    if (user && firebaseConnected) {
      const path = `incidents/${id}`;
      try {
        await setDoc(doc(db, 'incidents', id), report);
        addEvent('Incident Broadcasted', `Cloud Firestore incident log #${id} synced to defense network`, 'red');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      setIncidents((prev) => [report, ...prev]);
      addEvent('Incident Logged (Local)', `Logged #${id} for ${data.targetCallsign || data.trackId}`, 'amber');
    }
  };

  // Toggle Watchlist in Firestore
  const toggleWatchlistTarget = async (
    track: Track,
    priority: 'urgent' | 'elevated' | 'routine' = 'elevated',
    reason = 'Surveillance requested'
  ) => {
    const isWatched = !!watchlist[track.id];
    const authorId = user ? user.uid : 'demo-operator-id';

    if (isWatched) {
      if (user && firebaseConnected) {
        const path = `watchlist/${track.id}`;
        try {
          await deleteDoc(doc(db, 'watchlist', track.id));
          addEvent('Watchlist Removed', `Removed ${track.callsign} from Cloud Watchlist`, 'cyan');
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
      } else {
        setWatchlist((prev) => {
          const next = { ...prev };
          delete next[track.id];
          return next;
        });
        addEvent('Watchlist Removed', `Removed ${track.callsign} locally`, 'cyan');
      }
    } else {
      const item: WatchlistItem = {
        trackId: track.id,
        callsign: track.callsign,
        priority,
        authorId,
        reason,
        addedAt: new Date().toISOString(),
      };
      if (user && firebaseConnected) {
        const path = `watchlist/${track.id}`;
        try {
          await setDoc(doc(db, 'watchlist', track.id), item);
          addEvent('Watchlist Added', `Broadcasted ${track.callsign} [${track.id}] to Cloud Watchlist`, 'amber');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      } else {
        setWatchlist((prev) => ({ ...prev, [track.id]: item }));
        addEvent('Watchlist Added', `Added ${track.callsign} to local priority watchlist`, 'amber');
      }
    }
  };

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null;

  return (
    <AirspaceContext.Provider
      value={{
        tracks,
        selectedTrack,
        selectedTrackId,
        scenario,
        speed,
        paused,
        tick,
        sweepCount,
        alertFilter,
        sortThreat,
        acknowledged,
        incidents,
        watchlist,
        events,
        online,
        firebaseConnected,
        pingLatencyMs,
        firebaseProjectId: firebaseConfig.projectId,
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
        setSelectedTrackId,
        setScenario,
        setSpeed,
        togglePause,
        resetSimulation,
        setAlertFilter,
        toggleSortThreat,
        acknowledgeAlert,
        clearAcknowledged,
        createIncidentReport,
        toggleWatchlistTarget,
        addEvent,
      }}
    >
      {children}
    </AirspaceContext.Provider>
  );
};

export const useAirspace = () => {
  const context = useContext(AirspaceContext);
  if (!context) {
    throw new Error('useAirspace must be used within an AirspaceProvider');
  }
  return context;
};
