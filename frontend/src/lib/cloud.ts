import { getSupabase } from "@/src/lib/supabase";
import type { Attendance, MatchConfig, PlayedMatchEdit, PlayerStats, Position, Team } from "@/src/store";

export type CloudPlayer = { id: string; name: string; number: string; position: Position; active: boolean };
export type CloudMatch = { id: string; played_at: string; location: string; home_score: number; away_score: number; status: "scheduled" | "played" | "cancelled"; mvp_player_id: string | null };
export type CloudStat = { match_id: string; player_id: string; team: Team; goals: number; assists: number };
export type CloudAttendance = { match_id: string; player_id: string; user_id: string; attending: boolean; updated_at: string };
export type CloudSnapshot = { players: CloudPlayer[]; matches: CloudMatch[]; stats: CloudStat[]; attendance: CloudAttendance[]; isAdmin: boolean };

export async function ensureSession() {
  const client = getSupabase();
  const current = await client.auth.getSession();
  if (current.data.session) return current.data.session;
  const result = await client.auth.signInAnonymously();
  if (result.error) throw result.error;
  return result.data.session;
}

export async function currentUser() {
  const result = await getSupabase().auth.getUser();
  if (result.error) throw result.error;
  return result.data.user;
}

export async function loadSnapshot(): Promise<CloudSnapshot> {
  const client = getSupabase();
  const [players, matches, stats, attendance, user] = await Promise.all([
    client.from("players").select("id,name,number,position,active").order("name"),
    client.from("matches").select("id,played_at,location,home_score,away_score,status,mvp_player_id").in("status", ["scheduled", "played"]).order("played_at", { ascending: false }),
    client.from("match_player_stats").select("match_id,player_id,team,goals,assists"),
    client.from("attendance").select("match_id,player_id,user_id,attending,updated_at").order("updated_at", { ascending: true }),
    currentUser(),
  ]);
  const results = [players, matches, stats, attendance];
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  return { players: players.data as CloudPlayer[], matches: matches.data as CloudMatch[], stats: stats.data as CloudStat[], attendance: attendance.data as CloudAttendance[], isAdmin: user.app_metadata?.role === "admin" };
}

export async function loginAdmin(email: string, password: string) {
  const result = await getSupabase().auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data.user;
}

export async function logoutAdmin() {
  const client = getSupabase();
  await client.auth.signOut();
  await ensureSession();
}

export async function addCloudPlayer(name: string, number: string, position: Position) {
  const result = await getSupabase().from("players").insert({ name, number, position }).select("id").single();
  if (result.error) throw result.error;
}

export async function removeCloudPlayer(id: string) {
  const result = await getSupabase().from("players").update({ active: false }).eq("id", id);
  if (result.error) throw result.error;
}

export async function saveCloudMatch(config: MatchConfig, id?: string) {
  const playedAt = toIso(config.date, config.time);
  if (id) {
    const result = await getSupabase().from("matches").update({ played_at: playedAt, location: config.venue }).eq("id", id);
    if (result.error) throw result.error;
    return id;
  }
  const result = await getSupabase().from("matches").insert({ played_at: playedAt, location: config.venue, status: "scheduled", home_score: 0, away_score: 0 }).select("id").single();
  if (result.error) throw result.error;
  return result.data.id as string;
}

export async function saveCloudScore(id: string, green: number, yellow: number) {
  const result = await getSupabase().from("matches").update({ home_score: green, away_score: yellow }).eq("id", id);
  if (result.error) throw result.error;
}

export async function saveCloudStat(matchId: string, playerId: string, team: Team, stats: PlayerStats) {
  const result = await getSupabase().from("match_player_stats").upsert({ match_id: matchId, player_id: playerId, team, goals: stats.goals, assists: stats.assists });
  if (result.error) throw result.error;
}

export async function saveCloudMvp(matchId: string, playerId: string) {
  const result = await getSupabase().from("matches").update({ mvp_player_id: playerId || null }).eq("id", matchId);
  if (result.error) throw result.error;
}

export async function saveCloudAttendance(matchId: string, playerId: string, attendance: Attendance) {
  const user = await currentUser();
  if (attendance === "pending") {
    const result = await getSupabase().from("attendance").delete().eq("match_id", matchId).eq("player_id", playerId).eq("user_id", user.id);
    if (result.error) throw result.error;
    return;
  }
  const result = await getSupabase().from("attendance").upsert({ match_id: matchId, player_id: playerId, user_id: user.id, attending: attendance === "yes", updated_at: new Date().toISOString() }, { onConflict: "match_id,player_id,user_id" });
  if (result.error) throw result.error;
}

export async function finalizeCloudMatch(id: string, green: number, yellow: number, mvpId: string, assignments: Record<string, Team>, stats: Record<string, PlayerStats>) {
  const rows = Object.entries(assignments).map(([playerId, team]) => ({ match_id: id, player_id: playerId, team, goals: stats[playerId]?.goals ?? 0, assists: stats[playerId]?.assists ?? 0 }));
  if (rows.length) {
    const statsResult = await getSupabase().from("match_player_stats").upsert(rows);
    if (statsResult.error) throw statsResult.error;
  }
  const result = await getSupabase().from("matches").update({ home_score: green, away_score: yellow, mvp_player_id: mvpId || null, status: "played" }).eq("id", id);
  if (result.error) throw result.error;
}

export async function resetCloudSeason() {
  const result = await getSupabase().rpc("reset_season");
  if (result.error) throw result.error;
}

export async function updateCloudPlayedMatch(id: string, input: PlayedMatchEdit) {
  const result = await getSupabase().from("matches").update({ played_at: toIso(input.date, input.time), location: input.venue, home_score: input.green, away_score: input.yellow, mvp_player_id: input.mvpId || null }).eq("id", id);
  if (result.error) throw result.error;
  if (input.rows.length) {
    const statsResult = await getSupabase().from("match_player_stats").upsert(input.rows.map((row) => ({ match_id: id, player_id: row.player_id, team: row.team, goals: row.goals, assists: row.assists })));
    if (statsResult.error) throw statsResult.error;
  }
}

export function subscribeCloud(onChange: () => void) {
  const channel = getSupabase().channel("pena-futsal-cloud");
  ["players", "matches", "match_player_stats", "attendance"].forEach((table) => channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange));
  channel.subscribe();
  return () => { void getSupabase().removeChannel(channel); };
}

function toIso(date: string, time: string) {
  const trimmedDate = date.trim();
  const match = trimmedDate.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  const normalized = match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : trimmedDate;
  const parsed = new Date(`${normalized}T${time || "20:30"}:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Usa una fecha como DD/MM/AAAA y una hora válida");
  return parsed.toISOString();
}