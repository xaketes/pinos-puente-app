import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { EmptyState, Header, Screen, SectionTitle } from "@/src/components/screen";
import { useApp } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function StandingsScreen() {
  const { state, hydrated } = useApp();
  const { colors } = useTheme();
  const styles = useStyles();
  const players = [...state.players].sort((a, b) => b.points - a.points || b.mvps - a.mvps || b.goals - a.goals);
  if (!hydrated) return <Screen scroll={false}><View style={styles.center}><Text style={styles.loading}>Cargando clasificación…</Text></View></Screen>;
  return <Screen testID="standings-screen"><Header kicker="TEMPORADA ACTUAL" title="Clasificación" subtitle="El rendimiento de cada jugador, partido a partido." icon="format-list-numbered" />
    {players.length === 0 ? <EmptyState icon="trophy-outline" title="Aún no hay clasificación" message="Añade jugadores y finaliza el primer partido para ver la tabla." /> : <>
      <View style={styles.heroStats}><View><Text style={[styles.heroKicker, { color: colors.muted }]}>JUGADORES</Text><Text style={[styles.heroNumber, { color: colors.onSurface }]}>{players.length}</Text></View><View style={styles.heroDivider} /><View><Text style={[styles.heroKicker, { color: colors.muted }]}>PARTIDOS</Text><Text style={[styles.heroNumber, { color: colors.onSurface }]}>{Math.max(...players.map((player) => player.matches), 0)}</Text></View><View style={styles.heroDivider} /><View><Text style={[styles.heroKicker, { color: colors.muted }]}>MVPs</Text><Text style={[styles.heroNumber, { color: colors.brandSecondary }]}>{players.reduce((total, player) => total + player.mvps, 0)}</Text></View></View>
      <SectionTitle title="Tabla de posiciones" action="POR PUNTOS" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}><View style={[styles.table, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.divider }]}><Text style={[styles.rankCol, styles.headerText, { color: colors.muted }]}>#</Text><Text style={[styles.nameCol, styles.headerText, { color: colors.muted }]}>JUGADOR</Text><Text style={[styles.statCol, styles.headerText, { color: colors.muted }]}>PTS</Text><Text style={[styles.statCol, styles.headerText, { color: colors.muted }]}>PJ</Text><Text style={[styles.statCol, styles.headerText, { color: colors.muted }]}>GOL</Text><Text style={[styles.statCol, styles.headerText, { color: colors.muted }]}>AST</Text><Text style={[styles.statCol, styles.headerText, { color: colors.muted }]}>MVP</Text></View>
        {players.map((player, index) => <View key={player.id} style={[styles.tableRow, { borderBottomColor: colors.divider }]}><View style={[styles.rankCol, styles.rankBadge, { backgroundColor: index < 3 ? colors.brandTertiary : colors.surfaceTertiary }]}><Text style={[styles.rankText, { color: index < 3 ? colors.brandPrimary : colors.muted }]}>{index + 1}</Text></View><View style={styles.nameCol}><Text numberOfLines={1} style={[styles.nameText, { color: colors.onSurface }]}>{player.name}</Text><Text style={[styles.positionText, { color: colors.muted }]}>#{player.number} · {player.position}</Text></View><Text style={[styles.statCol, styles.pointsText, { color: colors.brandPrimary }]}>{player.points}</Text><Text style={[styles.statCol, { color: colors.onSurfaceSecondary }]}>{player.matches}</Text><Text style={[styles.statCol, { color: colors.onSurfaceSecondary }]}>{player.goals}</Text><Text style={[styles.statCol, { color: colors.onSurfaceSecondary }]}>{player.assists}</Text><View style={styles.mvpCol}><MaterialCommunityIcons name="trophy-outline" size={14} color={colors.brandSecondary} /><Text style={[styles.mvpText, { color: colors.onSurfaceSecondary }]}>{player.mvps}</Text></View></View>)}
      </View></ScrollView>
      <Text style={[styles.tableHint, { color: colors.muted }]}>Pts = victorias · PJ = partidos jugados · MVP = trofeos</Text>
    </>}
  </Screen>;
}

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, alignItems: "center", justifyContent: "center" }, loading: { color: colors.muted, fontSize: 15 },
  heroStats: { marginHorizontal: 18, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginBottom: 18 }, heroKicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1 }, heroNumber: { fontSize: 25, fontWeight: "900", marginTop: 3, textAlign: "center" }, heroDivider: { width: 1, height: 30, backgroundColor: colors.divider },
  tableScroll: { paddingHorizontal: 18 }, table: { minWidth: 590, borderRadius: 16, borderWidth: 1, overflow: "hidden" }, tableRow: { minHeight: 68, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1 }, tableHeader: { minHeight: 38 }, headerText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, rankCol: { width: 32, textAlign: "center" }, rankBadge: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" }, rankText: { fontSize: 12, fontWeight: "900" }, nameCol: { width: 205, paddingLeft: 8 }, nameText: { fontSize: 14, fontWeight: "800" }, positionText: { fontSize: 10, marginTop: 3 }, statCol: { width: 48, textAlign: "center", fontSize: 13, fontWeight: "800" }, pointsText: { fontSize: 16, fontWeight: "900" }, mvpCol: { width: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 }, mvpText: { fontSize: 13, fontWeight: "800" }, tableHint: { marginHorizontal: 18, marginTop: 10, fontSize: 11 },
}));