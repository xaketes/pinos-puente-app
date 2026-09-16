import { storage } from "@/src/utils/storage";
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createContext, useContext } from "react";

export type Attendance = "pending" | "yes" | "no";
export type Position = "Portero" | "Cierre" | "Ala" | "Pívot";
export type Team = "green" | "yellow";
export type Player = {
  id: string;
  name: string;
  number: string;
  position: Position;
  attendance: Attendance;
  points: number;
  matches: number;
  goals: number;
  assists: number;
  mvps: number;
};
export type MatchConfig = { date: string; time: string; venue: string };
export type PlayerStats = { goals: number; assists: number };
export type AppState = {
  players: Player[];
  match: MatchConfig;
  assignments: Record<string, Team>;
  scoreGreen: number;
  scoreYellow: number;
  stats: Record<string, PlayerStats>;
  mvpId: string;
  finalized: boolean;
};

const STORAGE_KEY = "pena-futsal-state-v1";
const initialState: AppState = {
  players: [],
  match: { date: "", time: "", venue: "" },
  assignments: {},
  scoreGreen: 0,
  scoreYellow: 0,
  stats: {},
  mvpId: "",
  finalized: false,
};

type Store = {
  state: AppState;
  hydrated: boolean;
  addPlayer: (name: string, number: string, position: Position) => void;
  removePlayer: (id: string) => void;
  setAttendance: (id: string, attendance: Attendance) => void;
  setMatch: (patch: Partial<MatchConfig>) => void;
  setAssignment: (id: string, team: Team) => void;
  setScore: (team: Team, delta: number) => void;
  setStat: (id: string, field: keyof PlayerStats, delta: number) => void;
  setMvp: (id: string) => void;
  finalizeMatch: () => void;
  prepareNextMatch: () => void;
  resetSeason: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.getItem<AppState>(STORAGE_KEY, initialState).then((saved) => {
      if (saved) setState({ ...initialState, ...saved });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) void storage.setItem(STORAGE_KEY, state);
  }, [hydrated, state]);

  const update = useCallback((fn: (current: AppState) => AppState) => setState((current) => fn(current)), []);
  const addPlayer = useCallback((name: string, number: string, position: Position) => {
    update((current) => ({ ...current, players: [...current.players, { id: `${Date.now()}-${Math.random()}`, name, number, position, attendance: "pending", points: 0, matches: 0, goals: 0, assists: 0, mvps: 0 }] }));
  }, [update]);
  const removePlayer = useCallback((id: string) => update((current) => ({ ...current, players: current.players.filter((player) => player.id !== id) })), [update]);
  const setAttendance = useCallback((id: string, attendance: Attendance) => update((current) => ({ ...current, players: current.players.map((player) => player.id === id ? { ...player, attendance } : player) })), [update]);
  const setMatch = useCallback((patch: Partial<MatchConfig>) => update((current) => ({ ...current, match: { ...current.match, ...patch } })), [update]);
  const setAssignment = useCallback((id: string, team: Team) => update((current) => ({ ...current, assignments: { ...current.assignments, [id]: team } })), [update]);
  const setScore = useCallback((team: Team, delta: number) => update((current) => team === "green" ? { ...current, scoreGreen: Math.max(0, current.scoreGreen + delta) } : { ...current, scoreYellow: Math.max(0, current.scoreYellow + delta) }), [update]);
  const setStat = useCallback((id: string, field: keyof PlayerStats, delta: number) => update((current) => ({ ...current, stats: { ...current.stats, [id]: { goals: Math.max(0, current.stats[id]?.goals ?? 0 + (field === "goals" ? delta : 0)), assists: Math.max(0, current.stats[id]?.assists ?? 0 + (field === "assists" ? delta : 0)) } } })), [update]);
  const setMvp = useCallback((id: string) => update((current) => ({ ...current, mvpId: id })), [update]);
  const finalizeMatch = useCallback(() => update((current) => {
    if (current.finalized) return current;
    const winningTeam = current.scoreGreen === current.scoreYellow ? null : current.scoreGreen > current.scoreYellow ? "green" : "yellow";
    const players = current.players.map((player) => {
      const team = current.assignments[player.id];
      const stat = current.stats[player.id] ?? { goals: 0, assists: 0 };
      if (!team) return player;
      return { ...player, matches: player.matches + 1, points: player.points + (winningTeam === null ? 1 : team === winningTeam ? 3 : 0), goals: player.goals + stat.goals, assists: player.assists + stat.assists, mvps: player.mvps + (current.mvpId === player.id ? 1 : 0) };
    });
    return { ...current, players, finalized: true };
  }), [update]);
  const prepareNextMatch = useCallback(() => update((current) => ({ ...current, players: current.players.map((player) => ({ ...player, attendance: "pending" })), assignments: {}, scoreGreen: 0, scoreYellow: 0, stats: {}, mvpId: "", finalized: false })), [update]);
  const resetSeason = useCallback(() => update((current) => ({ ...initialState, players: current.players.map((player) => ({ ...player, attendance: "pending", points: 0, matches: 0, goals: 0, assists: 0, mvps: 0 })) })), [update]);

  const value = useMemo(() => ({ state, hydrated, addPlayer, removePlayer, setAttendance, setMatch, setAssignment, setScore, setStat, setMvp, finalizeMatch, prepareNextMatch, resetSeason }), [state, hydrated, addPlayer, removePlayer, setAttendance, setMatch, setAssignment, setScore, setStat, setMvp, finalizeMatch, prepareNextMatch, resetSeason]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useApp debe usarse dentro de AppProvider");
  return context;
}