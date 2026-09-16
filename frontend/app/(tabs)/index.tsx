import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { EmptyState, Header, PrimaryButton, Screen, SectionTitle, sharedStyles } from "@/src/components/screen";
import { useApp } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function ConvocatoriaScreen() {
  const { state, hydrated, isAdmin, setAttendance, setMatch, saveMatch, prepareNextMatch } = useApp();
  const { colors } = useTheme();
  const styles = useStyles();
  const [date, setDate] = useState(state.match.date);
  const [time, setTime] = useState(state.match.time);
  const [venue, setVenue] = useState(state.match.venue);
  useEffect(() => { setDate(state.match.date); setTime(state.match.time); setVenue(state.match.venue); }, [state.match.date, state.match.time, state.match.venue]);
  const confirmed = state.players.filter((player) => player.attendance === "yes").length;

  if (!hydrated) return <Screen scroll={false}><View style={styles.center}><MaterialCommunityIcons name="soccer" color={colors.brandPrimary} size={36} /><Text style={styles.loading}>Cargando la plantilla…</Text></View></Screen>;

  return <Screen testID="convocatoria-screen">
    <Header kicker="PEÑA FUTSAL" title="Convocatoria" subtitle="Organiza el próximo partido y confirma la asistencia." icon="check-circle-outline" />
    <View style={[styles.counterCard, { backgroundColor: colors.brandPrimary }]}>
      <View><Text style={[styles.counterLabel, { color: colors.onBrandPrimary }]}>ASISTENCIA CONFIRMADA</Text><Text style={[styles.counterNumber, { color: colors.onBrandPrimary }]}>{confirmed}<Text style={styles.counterTotal}> / {state.players.length}</Text></Text></View>
      <View style={[styles.counterIcon, { backgroundColor: colors.onBrandPrimary }]}><MaterialCommunityIcons name="account-check" size={24} color={colors.brandPrimary} /></View>
    </View>
    <SectionTitle title="Próximo partido" action="SE GUARDA SOLO" />
    <View style={[sharedStyles.card, styles.matchCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.fieldRow}><View style={styles.field}><Text style={[sharedStyles.fieldLabel, { color: colors.muted }]}>Fecha</Text><TextInput editable={isAdmin} testID="match-date" value={date} onChangeText={(value) => { setDate(value); setMatch({ date: value }); }} placeholder="DD / MM / AAAA" placeholderTextColor={colors.muted} style={[sharedStyles.input, { color: isAdmin ? colors.onSurface : colors.muted, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} /></View><View style={styles.field}><Text style={[sharedStyles.fieldLabel, { color: colors.muted }]}>Hora</Text><TextInput editable={isAdmin} testID="match-time" value={time} onChangeText={(value) => { setTime(value); setMatch({ time: value }); }} placeholder="20:30" placeholderTextColor={colors.muted} style={[sharedStyles.input, { color: isAdmin ? colors.onSurface : colors.muted, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} /></View></View>
      <Text style={[sharedStyles.fieldLabel, { color: colors.muted }]}>Pabellón</Text><TextInput editable={isAdmin} testID="match-venue" value={venue} onChangeText={(value) => { setVenue(value); setMatch({ venue: value }); }} placeholder="Nombre del pabellón" placeholderTextColor={colors.muted} style={[sharedStyles.input, { color: isAdmin ? colors.onSurface : colors.muted, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} />
      {isAdmin ? <View style={styles.saveMatch}><PrimaryButton testID="save-match" label={state.upcomingMatchId ? "Guardar cambios" : "Crear próximo partido"} icon="cloud-upload-outline" onPress={() => { void saveMatch(); }} /> </View> : <Text style={[styles.readOnly, { color: colors.muted }]}>Solo el administrador puede editar los datos del partido.</Text>}
    </View>
    {state.finalized ? <View style={[styles.notice, { backgroundColor: colors.brandTertiary, borderColor: colors.borderStrong }]}><MaterialCommunityIcons name="check-decagram" size={20} color={colors.brandPrimary} /><View style={styles.noticeCopy}><Text style={[styles.noticeTitle, { color: colors.onSurface }]}>Partido finalizado</Text><Text style={[styles.noticeText, { color: colors.muted }]}>Las estadísticas ya están en la clasificación.</Text></View><Pressable onPress={prepareNextMatch} accessibilityRole="button"><Text style={[styles.noticeAction, { color: colors.brandPrimary }]}>Nuevo</Text></Pressable></View> : null}
    <SectionTitle title="Jugadores" action={`${state.players.length} EN PLANTILLA`} />
    {state.players.length === 0 ? <EmptyState icon="account-plus-outline" title="La plantilla está vacía" message="Añade tus jugadores desde Administración para empezar la convocatoria." /> : state.players.map((player) => <View key={player.id} style={[styles.playerCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={[styles.number, { backgroundColor: colors.surfaceTertiary }]}><Text style={[styles.numberText, { color: colors.brandSecondary }]}>{player.number || "—"}</Text></View><View style={styles.playerCopy}><Text style={[styles.playerName, { color: colors.onSurface }]}>{player.name}</Text><Text style={[styles.playerPosition, { color: colors.muted }]}>{player.position}</Text></View>
      <View style={styles.attendanceActions}><Pressable disabled={!state.upcomingMatchId} testID={`voy-${player.id}`} accessibilityRole="button" onPress={() => setAttendance(player.id, "yes")} style={[styles.attendanceButton, { backgroundColor: player.attendance === "yes" ? colors.success : colors.surfaceTertiary, opacity: state.upcomingMatchId ? 1 : 0.5 }]}><Text style={{ color: player.attendance === "yes" ? colors.onSuccess : colors.muted, fontWeight: "900", fontSize: 12 }}>VOY</Text></Pressable><Pressable disabled={!state.upcomingMatchId} testID={`no-voy-${player.id}`} accessibilityRole="button" onPress={() => setAttendance(player.id, "no")} style={[styles.attendanceButton, { backgroundColor: player.attendance === "no" ? colors.error : colors.surfaceTertiary, opacity: state.upcomingMatchId ? 1 : 0.5 }]}><Text style={{ color: player.attendance === "no" ? colors.onError : colors.muted, fontWeight: "900", fontSize: 12 }}>NO VOY</Text></Pressable></View>
    </View>)}
  </Screen>;
}

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loading: { color: colors.muted, fontSize: 15 },
  counterCard: { marginHorizontal: 18, marginBottom: 22, borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  counterLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  counterNumber: { fontSize: 42, lineHeight: 48, fontWeight: "900", marginTop: 2 },
  counterTotal: { fontSize: 20, fontWeight: "700", opacity: 0.7 },
  counterIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  matchCard: { marginHorizontal: 18 },
  fieldRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  field: { flex: 1 },
  saveMatch: { marginTop: 16 },
  readOnly: { fontSize: 11, lineHeight: 16, marginTop: 12 },
  notice: { marginHorizontal: 18, marginBottom: 16, padding: 13, borderRadius: 13, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  noticeCopy: { flex: 1 },
  noticeTitle: { fontSize: 14, fontWeight: "900" },
  noticeText: { fontSize: 12, marginTop: 2 },
  noticeAction: { fontSize: 13, fontWeight: "900" },
  playerCard: { marginHorizontal: 18, marginBottom: 10, borderWidth: 1, borderRadius: 14, padding: 11, minHeight: 70, flexDirection: "row", alignItems: "center", gap: 11 },
  number: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 16, fontWeight: "900" },
  playerCopy: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "800" },
  playerPosition: { fontSize: 12, marginTop: 3 },
  attendanceActions: { flexDirection: "row", gap: 6 },
  attendanceButton: { minWidth: 48, minHeight: 40, paddingHorizontal: 6, borderRadius: 9, alignItems: "center", justifyContent: "center" },
}));