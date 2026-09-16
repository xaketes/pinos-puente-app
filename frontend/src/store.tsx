import {
  addCloudPlayer,
  deleteCloudMatch,
  ensureSession,
  finalizeCloudMatch,
  loadSnapshot,
  loginAdmin as loginAdminCloud,
  logoutAdmin as logoutAdminCloud,
  removeCloudPlayer,
  resetCloudSeason,
  saveCloudAttendance,
  saveCloudMatch,
  saveCloudMvp,
  saveCloudScore,
  saveCloudStat,
  subscribeCloud,
  updateCloudPlayedMatch,
  type CloudSnapshot,
} from "@/src/lib/cloud";
import { supabaseConfigured } from "@/src/lib/supabase";
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createContext, useContext } from "react";

export type Attendance = "pending" | "yes" | "no";
export type Position = "Portero" | "Cierre" | "Ala" | "Pívot";
export type Team = "green" | "yellow";
export type Player = { id: string; name: string; number: string; position: Position; attendance: Attendance; points: number; matches: number; goals: number; assists: number; mvps: number };
export type MatchConfig = { date: string; time: string; venue: string };
export type PlayerStats = { goals: number; assists: number };
export type MatchPlayerDetail = { id: string; name: string; number: string; team: Team; goals: number; assists: number; mvp: boolean };
export type MatchHistory = { id: string; date: string; time: string; venue: string; green: number; yellow: number; mvpName: string; participants: number; goals: number; assists: number; greenPlayers: string; yellowPlayers: string; details: MatchPlayerDetail[] };
export type PlayedMatchEdit = { date: string; time: string; venue: string; green: number; yellow: number; mvpId: string; rows: { player_id: string; team: Team; goals: number; assists: number }[] };
export type AppState = { players: Player[]; match: MatchConfig; upcomingMatchId: string; assignments: Record<string, Team>; scoreGreen: number; scoreYellow: number; stats: Record<string, PlayerStats>; mvpId: string; finalized: boolean; history: MatchHistory[] };

type CloudStatus = "loading" | "ready" | "missing" | "error";
type Store = {
  state: AppState;
  hydrated: boolean;
  cloudStatus: CloudStatus;
  syncError: string;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  addPlayer: (name: string, number: string, position: Position) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  setAttendance: (id: string, attendance: Attendance) => void;
  setMatch: (patch: Partial<MatchConfig>) => void;
  saveMatch: () => Promise<void>;
  setAssignment: (id: string, team: Team) => void;
  setScore: (team: Team, delta: number) => void;
  setStat: (id: string, field: keyof PlayerStats, delta: number) => void;
  setMvp: (id: string) => void;
  finalizeMatch: () => Promise<boolean>;
  updatePlayedMatch: (id: string, input: PlayedMatchEdit) => Promise<boolean>;
  deletePlayedMatch: (id: string) => Promise<boolean>;
  prepareNextMatch: () => void;
  resetSeason: () => Promise<void>;
};

const initialState: AppState = { players: [], match: { date: "", time: "", venue: "" }, upcomingMatchId: "", assignments: {}, scoreGreen: 0, scoreYellow: 0, stats: {}, mvpId: "", finalized: false, history: [] };
const StoreContext = createContext<Store | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(!supabaseConfigured);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(supabaseConfigured ? "loading" : "missing");
  const [syncError, setSyncError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const applySnapshot = useCallback((snapshot: CloudSnapshot) => {
    const upcoming = snapshot.matches.find((match) => match.status === "scheduled");
    const played = snapshot.matches.filter((match) => match.status === "played");
    const playerNames = new Map(snapshot.players.map((player) => [player.id, player.name]));
    const playerNumbers = new Map(snapshot.players.map((player) => [player.id, player.number]));
    const activePlayers = snapshot.players.filter((player) => player.active);
    const totals = new Map<string, PlayerStats & { points: number; matches: number; mvps: number }>();
    activePlayers.forEach((player) => totals.set(player.id, { goals: 0, assists: 0, points: 0, matches: 0, mvps: 0 }));
    played.forEach((match) => {
      const rows = snapshot.stats.filter((stat) => stat.match_id === match.id);
      const winner = match.home_score === match.away_score ? null : match.home_score > match.away_score ? "green" : "yellow";
      rows.forEach((row) => {
        const total = totals.get(row.player_id);
        if (!total) return;
        total.goals += row.goals; total.assists += row.assists; total.matches += 1; total.points += winner === null ? 1 : row.team === winner ? 3 : 0; total.mvps += match.mvp_player_id === row.player_id ? 1 : 0;
      });
    });
    const attendance = new Map(snapshot.attendance.filter((item) => item.match_id === upcoming?.id).map((item) => [item.player_id, item.attending ? "yes" : "no"] as const));
    const assignments: Record<string, Team> = {};
    const stats: Record<string, PlayerStats> = {};
    if (upcoming) snapshot.stats.filter((stat) => stat.match_id === upcoming.id).forEach((stat) => { assignments[stat.player_id] = stat.team; stats[stat.player_id] = { goals: stat.goals, assists: stat.assists }; });
    const players = activePlayers.map((player) => ({ ...player, attendance: (attendance.get(player.id) ?? "pending") as Attendance, ...(totals.get(player.id) ?? { points: 0, matches: 0, goals: 0, assists: 0, mvps: 0 }) }));
    const history = played.map((match) => { const rows = snapshot.stats.filter((stat) => stat.match_id === match.id); return { id: match.id, date: formatDate(match.played_at), time: formatTime(match.played_at), venue: match.location, green: match.home_score, yellow: match.away_score, mvpName: match.mvp_player_id ? playerNames.get(match.mvp_player_id) ?? "Sin MVP" : "Sin MVP", participants: rows.length, goals: rows.reduce((total, row) => total + row.goals, 0), assists: rows.reduce((total, row) => total + row.assists, 0), greenPlayers: rows.filter((row) => row.team === "green").map((row) => playerNames.get(row.player_id) ?? "Jugador").join(", ") || "—", yellowPlayers: rows.filter((row) => row.team === "yellow").map((row) => playerNames.get(row.player_id) ?? "Jugador").join(", ") || "—", details: rows.map((row) => ({ id: row.player_id, name: playerNames.get(row.player_id) ?? "Jugador", number: playerNumbers.get(row.player_id) ?? "", team: row.team, goals: row.goals, assists: row.assists, mvp: match.mvp_player_id === row.player_id })) }; });
    setState({ players, match: upcoming ? { date: formatDate(upcoming.played_at), time: formatTime(upcoming.played_at), venue: upcoming.location } : { date: "", time: "", venue: "" }, upcomingMatchId: upcoming?.id ?? "", assignments, scoreGreen: upcoming?.home_score ?? 0, scoreYellow: upcoming?.away_score ?? 0, stats, mvpId: upcoming?.mvp_player_id ?? "", finalized: false, history });
    setIsAdmin(snapshot.isAdmin);
    setCloudStatus("ready");
    setSyncError("");
  }, []);

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) return;
    try { await ensureSession(); applySnapshot(await loadSnapshot()); }
    catch (error) { setCloudStatus("error"); setSyncError(error instanceof Error ? error.message : "No se pudo sincronizar con Supabase"); }
    finally { setHydrated(true); }
  }, [applySnapshot]);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let unsubscribe: (() => void) | undefined;
    void ensureSession().then(() => {
      unsubscribe = subscribeCloud(() => { void refresh(); });
    }).catch(() => undefined).finally(() => { void refresh(); });
    return () => unsubscribe?.();
  }, [refresh]);

  const adminAction = useCallback(async (action: () => Promise<void>) => {
    if (!isAdmin) { setSyncError("Solo el administrador puede editar estos datos."); return; }
    try { setSyncError(""); await action(); await refresh(); } catch (error) { setSyncError(error instanceof Error ? error.message : "No se pudo guardar el cambio"); }
  }, [isAdmin, refresh]);
  const addPlayer = useCallback((name: string, number: string, position: Position) => adminAction(async () => { await addCloudPlayer(name, number, position); }), [adminAction]);
  const removePlayer = useCallback((id: string) => adminAction(async () => { await removeCloudPlayer(id); }), [adminAction]);
  const loginAdmin = useCallback(async (email: string, password: string) => { try { await loginAdminCloud(email, password); await refresh(); } catch (error) { setSyncError(error instanceof Error ? error.message : "No se pudo iniciar sesión"); } }, [refresh]);
  const logoutAdmin = useCallback(async () => { try { await logoutAdminCloud(); await refresh(); } catch (error) { setSyncError(error instanceof Error ? error.message : "No se pudo cerrar sesión"); } }, [refresh]);
  const setAttendance = useCallback((id: string, attendance: Attendance) => {
    setState((current) => ({ ...current, players: current.players.map((player) => player.id === id ? { ...player, attendance } : player) }));
    if (!state.upcomingMatchId) return;
    void saveCloudAttendance(state.upcomingMatchId, id, attendance).then(() => refresh()).catch((error) => setSyncError(error instanceof Error ? error.message : "No se pudo guardar la asistencia"));
  }, [refresh, state.upcomingMatchId]);
  const setMatch = useCallback((patch: Partial<MatchConfig>) => setState((current) => ({ ...current, match: { ...current.match, ...patch } })), []);
  const saveMatch = useCallback(() => adminAction(async () => { await saveCloudMatch(state.match, state.upcomingMatchId || undefined); }), [adminAction, state.match, state.upcomingMatchId]);
  const setAssignment = useCallback((id: string, team: Team) => {
    setState((current) => ({ ...current, assignments: { ...current.assignments, [id]: team } }));
    if (!isAdmin || !state.upcomingMatchId) return;
    void saveCloudStat(state.upcomingMatchId, id, team, state.stats[id] ?? { goals: 0, assists: 0 }).catch((error) => setSyncError(error instanceof Error ? error.message : "No se pudo guardar el equipo"));
  }, [isAdmin, state.stats, state.upcomingMatchId]);
  const setScore = useCallback((team: Team, delta: number) => {
    const green = team === "green" ? Math.max(0, state.scoreGreen + delta) : state.scoreGreen;
    const yellow = team === "yellow" ? Math.max(0, state.scoreYellow + delta) : state.scoreYellow;
    setState((current) => ({ ...current, scoreGreen: green, scoreYellow: yellow }));
    if (isAdmin && state.upcomingMatchId) void saveCloudScore(state.upcomingMatchId, green, yellow).catch((error) => setSyncError(error instanceof Error ? error.message : "No se pudo guardar el marcador"));
  }, [isAdmin, state.scoreGreen, state.scoreYellow, state.upcomingMatchId]);
  const setStat = useCallback((id: string, field: keyof PlayerStats, delta: number) => {
    const currentStat = state.stats[id] ?? { goals: 0, assists: 0 };
    const next = { goals: Math.max(0, currentStat.goals + (field === "goals" ? delta : 0)), assists: Math.max(0, currentStat.assists + (field === "assists" ? delta : 0)) };
    setState((current) => ({ ...current, stats: { ...current.stats, [id]: next } }));
    if (isAdmin && state.upcomingMatchId && state.assignments[id]) void saveCloudStat(state.upcomingMatchId, id, state.assignments[id], next).catch((error) => setSyncError(error instanceof Error ? error.message : "No se pudo guardar la estadística"));
  }, [isAdmin, state.assignments, state.stats, state.upcomingMatchId]);
  const setMvp = useCallback((id: string) => {
    setState((current) => ({ ...current, mvpId: id }));
    if (isAdmin && state.upcomingMatchId) void saveCloudMvp(state.upcomingMatchId, id).catch((error) => setSyncError(error instanceof Error ? error.message : "No se pudo guardar el MVP"));
  }, [isAdmin, state.upcomingMatchId]);
  const finalizeMatch = useCallback(async () => {
    if (!isAdmin) { setSyncError("Solo el administrador puede editar estos datos."); return false; }
    try {
      setSyncError("");
      if (!state.upcomingMatchId) throw new Error("Guarda primero el próximo partido");
      await finalizeCloudMatch(state.upcomingMatchId, state.scoreGreen, state.scoreYellow, state.mvpId, state.assignments, state.stats);
      await refresh();
      return true;
    } catch (error) { setSyncError(error instanceof Error ? error.message : "No se pudo guardar el cambio"); return false; }
  }, [isAdmin, refresh, state.assignments, state.mvpId, state.scoreGreen, state.scoreYellow, state.stats, state.upcomingMatchId]);
  const updatePlayedMatch = useCallback(async (id: string, input: PlayedMatchEdit) => {
    if (!isAdmin) { setSyncError("Solo el administrador puede editar estos datos."); return false; }
    try { setSyncError(""); await updateCloudPlayedMatch(id, input); await refresh(); return true; }
    catch (error) { setSyncError(error instanceof Error ? error.message : "No se pudo guardar el cambio"); return false; }
  }, [isAdmin, refresh]);
  const deletePlayedMatch = useCallback(async (id: string) => {
    if (!isAdmin) { setSyncError("Solo el administrador puede editar estos datos."); return false; }
    try { setSyncError(""); await deleteCloudMatch(id); await refresh(); return true; }
    catch (error) { setSyncError(error instanceof Error ? error.message : "No se pudo borrar el partido"); return false; }
  }, [isAdmin, refresh]);
  const prepareNextMatch = useCallback(() => setState((current) => ({ ...current, match: { date: "", time: "", venue: "" }, upcomingMatchId: "", assignments: {}, scoreGreen: 0, scoreYellow: 0, stats: {}, mvpId: "", finalized: false, players: current.players.map((player) => ({ ...player, attendance: "pending" })) })), []);
  const resetSeason = useCallback(() => adminAction(resetCloudSeason), [adminAction]);
  const value = useMemo(() => ({ state, hydrated, cloudStatus, syncError, isAdmin, refresh, loginAdmin, logoutAdmin, addPlayer, removePlayer, setAttendance, setMatch, saveMatch, setAssignment, setScore, setStat, setMvp, finalizeMatch, updatePlayedMatch, deletePlayedMatch, prepareNextMatch, resetSeason }), [state, hydrated, cloudStatus, syncError, isAdmin, refresh, loginAdmin, logoutAdmin, addPlayer, removePlayer, setAttendance, setMatch, saveMatch, setAssignment, setScore, setStat, setMvp, finalizeMatch, updatePlayedMatch, deletePlayedMatch, prepareNextMatch, resetSeason]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useApp debe usarse dentro de AppProvider");
  return context;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`; }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; }