import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { EditMatchForm } from "@/src/components/edit-match";
import { EmptyState, Screen, SectionTitle } from "@/src/components/screen";
import { type MatchPlayerDetail, type Team, useApp } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, hydrated, isAdmin } = useApp();
  const { colors } = useTheme();
  const styles = useStyles();
  const [editing, setEditing] = useState(false);
  const match = state.history.find((item) => item.id === id);

  if (!hydrated) return <Screen scroll={false}><View style={styles.center}><MaterialCommunityIcons name="soccer" color={colors.brandPrimary} size={36} /><Text style={[styles.loading, { color: colors.muted }]}>Cargando el partido…</Text></View></Screen>;

  if (!match) return <Screen testID="history-detail-screen">
    <BackRow onBack={() => router.back()} colors={colors} styles={styles} />
    <EmptyState icon="cloud-search-outline" title="Partido no encontrado" message="Este partido ya no está en el historial de la temporada." />
  </Screen>;

  if (editing) return <Screen testID="history-detail-screen">
    <BackRow onBack={() => setEditing(false)} colors={colors} styles={styles} />
    <EditMatchForm match={match} onDone={() => setEditing(false)} />
  </Screen>;

  const winner: Team | null = match.green === match.yellow ? null : match.green > match.yellow ? "green" : "yellow";
  const greenPlayers = match.details.filter((detail) => detail.team === "green");
  const yellowPlayers = match.details.filter((detail) => detail.team === "yellow");

  return <Screen testID="history-detail-screen">
    <BackRow onBack={() => router.back()} colors={colors} styles={styles} action={isAdmin ? <Pressable testID="history-edit" accessibilityRole="button" onPress={() => setEditing(true)} style={[styles.backButton, { backgroundColor: colors.surfaceTertiary }]}><MaterialCommunityIcons name="pencil-outline" size={19} color={colors.onSurface} /></Pressable> : null} />
    <View style={[styles.scoreCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Text style={[styles.dateText, { color: colors.muted }]}>{match.date}{match.venue ? ` · ${match.venue}` : ""}</Text>
      <View style={styles.scoreRow}>
        <View style={styles.scoreSide}><View style={[styles.teamDot, { backgroundColor: colors.brandPrimary }]} /><Text style={[styles.teamLabel, { color: colors.brandPrimary }]}>VERDE</Text><Text style={[styles.scoreNumber, { color: colors.onSurface }]}>{match.green}</Text>{winner === "green" ? <Text style={[styles.winnerBadge, { color: colors.brandPrimary }]}>GANADOR</Text> : null}</View>
        <Text style={[styles.scoreDash, { color: colors.muted }]}>:</Text>
        <View style={styles.scoreSide}><View style={[styles.teamDot, { backgroundColor: colors.brandSecondary }]} /><Text style={[styles.teamLabel, { color: colors.brandSecondary }]}>AMARILLO</Text><Text style={[styles.scoreNumber, { color: colors.onSurface }]}>{match.yellow}</Text>{winner === "yellow" ? <Text style={[styles.winnerBadge, { color: colors.brandSecondary }]}>GANADOR</Text> : null}</View>
      </View>
      {winner === null ? <Text style={[styles.drawText, { color: colors.muted }]}>Empate · +1 punto para cada jugador</Text> : null}
    </View>
    <View testID="history-mvp" style={[styles.mvpCard, { backgroundColor: colors.brandTertiary, borderColor: colors.borderStrong }]}>
      <MaterialCommunityIcons name="trophy" size={22} color={colors.brandSecondary} />
      <View style={styles.mvpCopy}><Text style={[styles.mvpKicker, { color: colors.muted }]}>MVP DEL PARTIDO</Text><Text style={[styles.mvpName, { color: colors.onSurface }]}>{match.mvpName}</Text></View>
    </View>
    <TeamSection title="Equipo Verde" accent={colors.brandPrimary} players={greenPlayers} colors={colors} styles={styles} testID="history-green-team" />
    <TeamSection title="Equipo Amarillo" accent={colors.brandSecondary} players={yellowPlayers} colors={colors} styles={styles} testID="history-yellow-team" />
  </Screen>;
}

function BackRow({ onBack, colors, styles, action }: { onBack: () => void; colors: ReturnType<typeof useTheme>["colors"]; styles: ReturnType<typeof useStyles>; action?: ReactNode }) {
  return <View style={styles.backRow}><Pressable testID="history-back" accessibilityRole="button" onPress={onBack} style={[styles.backButton, { backgroundColor: colors.surfaceTertiary }]}><MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} /></Pressable><Text style={[styles.backTitle, { color: colors.onSurface }]}>Detalle del partido</Text>{action}</View>;
}

function TeamSection({ title, accent, players, colors, styles, testID }: { title: string; accent: string; players: MatchPlayerDetail[]; colors: ReturnType<typeof useTheme>["colors"]; styles: ReturnType<typeof useStyles>; testID: string }) {
  return <View testID={testID} style={styles.teamSection}>
    <View style={styles.teamHeader}><View style={[styles.teamDot, { backgroundColor: accent }]} /><Text style={[styles.teamTitle, { color: colors.onSurface }]}>{title}</Text><Text style={[styles.teamCount, { color: colors.muted }]}>{players.length}</Text></View>
    <View style={[styles.teamCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      {players.length === 0 ? <Text style={[styles.emptyTeam, { color: colors.muted }]}>Sin jugadores registrados.</Text> : players.map((player) => <View key={player.id} style={[styles.playerRow, { borderBottomColor: colors.divider }]}>
        <View style={[styles.numberBadge, { backgroundColor: colors.surfaceTertiary }]}><Text style={[styles.numberText, { color: accent }]}>{player.number || "—"}</Text></View>
        <View style={styles.playerCopy}><View style={styles.playerNameRow}><Text style={[styles.playerName, { color: colors.onSurface }]}>{player.name}</Text>{player.mvp ? <MaterialCommunityIcons name="trophy" size={14} color={colors.brandSecondary} /> : null}</View></View>
        <View style={styles.statPill}><MaterialCommunityIcons name="soccer" size={14} color={colors.brandPrimary} /><Text testID={`history-goals-${player.id}`} style={[styles.statText, { color: colors.onSurfaceSecondary }]}>{player.goals}</Text></View>
        <View style={styles.statPill}><MaterialCommunityIcons name="shoe-print" size={14} color={colors.brandSecondary} /><Text testID={`history-assists-${player.id}`} style={[styles.statText, { color: colors.onSurfaceSecondary }]}>{player.assists}</Text></View>
      </View>)}
    </View>
  </View>;
}

const useStyles = makeStyles(() => ({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loading: { fontSize: 15 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 18, marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  backTitle: { flex: 1, fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  scoreCard: { marginHorizontal: 18, borderRadius: 18, borderWidth: 1, padding: 18, alignItems: "center", marginBottom: 14 },
  dateText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", alignSelf: "stretch", marginTop: 12 },
  scoreSide: { alignItems: "center", flex: 1, gap: 4 },
  teamDot: { width: 9, height: 9, borderRadius: 5 },
  teamLabel: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  scoreNumber: { fontSize: 46, fontWeight: "900", lineHeight: 52 },
  scoreDash: { fontSize: 30, fontWeight: "900", marginTop: 18 },
  winnerBadge: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  drawText: { fontSize: 12, marginTop: 10 },
  mvpCard: { marginHorizontal: 18, borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 8 },
  mvpCopy: { flex: 1 },
  mvpKicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  mvpName: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  teamSection: { marginTop: 14 },
  teamHeader: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 18, marginBottom: 9 },
  teamTitle: { fontSize: 17, fontWeight: "900", flex: 1 },
  teamCount: { fontSize: 13, fontWeight: "800" },
  teamCard: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, paddingHorizontal: 13 },
  emptyTeam: { paddingVertical: 18, fontSize: 13, textAlign: "center" },
  playerRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1 },
  numberBadge: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 13, fontWeight: "900" },
  playerCopy: { flex: 1 },
  playerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  playerName: { fontSize: 14, fontWeight: "800" },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 40, justifyContent: "center" },
  statText: { fontSize: 14, fontWeight: "900" },
}));
