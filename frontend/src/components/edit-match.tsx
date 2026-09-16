import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { PrimaryButton, SectionTitle, sharedStyles } from "@/src/components/screen";
import { type MatchHistory, type PlayerStats, useApp } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export function EditMatchForm({ match, onDone }: { match: MatchHistory; onDone: () => void }) {
  const { syncError, updatePlayedMatch } = useApp();
  const { colors } = useTheme();
  const styles = useStyles();
  const [date, setDate] = useState(match.date);
  const [time, setTime] = useState(match.time);
  const [venue, setVenue] = useState(match.venue);
  const [green, setGreen] = useState(match.green);
  const [yellow, setYellow] = useState(match.yellow);
  const [mvpId, setMvpId] = useState(match.details.find((detail) => detail.mvp)?.id ?? "");
  const [stats, setStats] = useState<Record<string, PlayerStats>>(() => Object.fromEntries(match.details.map((detail) => [detail.id, { goals: detail.goals, assists: detail.assists }])));
  const [saving, setSaving] = useState(false);

  const bump = (id: string, field: keyof PlayerStats, delta: number) => setStats((current) => { const base = current[id] ?? { goals: 0, assists: 0 }; return { ...current, [id]: { ...base, [field]: Math.max(0, base[field] + delta) } }; });

  const save = async () => {
    setSaving(true);
    const ok = await updatePlayedMatch(match.id, { date, time, venue, green, yellow, mvpId, rows: match.details.map((detail) => ({ player_id: detail.id, team: detail.team, goals: stats[detail.id]?.goals ?? 0, assists: stats[detail.id]?.assists ?? 0 })) });
    setSaving(false);
    if (ok) onDone();
  };

  return <View>
    <SectionTitle title="Datos del partido" action="MODO EDICIÓN" />
    <View style={[sharedStyles.card, styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.fieldRow}>
        <View style={styles.field}><Text style={[sharedStyles.fieldLabel, { color: colors.muted }]}>Fecha</Text><TextInput testID="edit-date" value={date} onChangeText={setDate} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} style={[sharedStyles.input, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} /></View>
        <View style={styles.field}><Text style={[sharedStyles.fieldLabel, { color: colors.muted }]}>Hora</Text><TextInput testID="edit-time" value={time} onChangeText={setTime} placeholder="20:30" placeholderTextColor={colors.muted} style={[sharedStyles.input, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} /></View>
      </View>
      <Text style={[sharedStyles.fieldLabel, { color: colors.muted }]}>Pabellón</Text>
      <TextInput testID="edit-venue" value={venue} onChangeText={setVenue} placeholder="Nombre del pabellón" placeholderTextColor={colors.muted} style={[sharedStyles.input, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} />
    </View>
    <SectionTitle title="Marcador" />
    <View style={[styles.scoreCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <ScoreEditor testID="edit-score-green" label="VERDE" accent={colors.brandPrimary} value={green} onMinus={() => setGreen((value) => Math.max(0, value - 1))} onPlus={() => setGreen((value) => value + 1)} colors={colors} styles={styles} />
      <Text style={[styles.scoreDash, { color: colors.muted }]}>:</Text>
      <ScoreEditor testID="edit-score-yellow" label="AMARILLO" accent={colors.brandSecondary} value={yellow} onMinus={() => setYellow((value) => Math.max(0, value - 1))} onPlus={() => setYellow((value) => value + 1)} colors={colors} styles={styles} />
    </View>
    <SectionTitle title="MVP del partido" action="TOCA PARA ELEGIR" />
    <View style={[styles.mvpCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.mvpGrid}>
        <Pressable testID="edit-mvp-none" accessibilityRole="button" onPress={() => setMvpId("")} style={[styles.mvpChip, { backgroundColor: mvpId === "" ? colors.brandTertiary : colors.surfaceTertiary, borderColor: mvpId === "" ? colors.borderStrong : colors.border }]}><Text style={{ color: mvpId === "" ? colors.onBrandTertiary : colors.muted, fontSize: 12, fontWeight: "800" }}>Sin MVP</Text></Pressable>
        {match.details.map((detail) => <Pressable testID={`edit-mvp-${detail.id}`} key={detail.id} accessibilityRole="button" onPress={() => setMvpId(detail.id)} style={[styles.mvpChip, { backgroundColor: mvpId === detail.id ? colors.brandTertiary : colors.surfaceTertiary, borderColor: mvpId === detail.id ? colors.borderStrong : colors.border }]}><Text style={{ color: mvpId === detail.id ? colors.onBrandTertiary : colors.muted, fontSize: 12, fontWeight: "800" }}>{detail.name}</Text></Pressable>)}
      </View>
    </View>
    <SectionTitle title="Goles y asistencias" action="TOCA + PARA SUMAR" />
    <View style={[styles.statsCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      {match.details.map((detail) => { const stat = stats[detail.id] ?? { goals: 0, assists: 0 }; return <View key={detail.id} style={[styles.statRow, { borderBottomColor: colors.divider }]}>
        <View style={styles.statName}><Text style={[styles.statPlayer, { color: colors.onSurface }]}>{detail.name}</Text><Text style={[styles.statTeam, { color: colors.muted }]}>{detail.team === "green" ? "Equipo Verde" : "Equipo Amarillo"}</Text></View>
        <StatEditor testID={`edit-goals-${detail.id}`} icon="soccer" value={stat.goals} onMinus={() => bump(detail.id, "goals", -1)} onPlus={() => bump(detail.id, "goals", 1)} colors={colors} styles={styles} />
        <StatEditor testID={`edit-assists-${detail.id}`} icon="shoe-print" value={stat.assists} onMinus={() => bump(detail.id, "assists", -1)} onPlus={() => bump(detail.id, "assists", 1)} colors={colors} styles={styles} />
      </View>; })}
    </View>
    {syncError ? <Text style={[styles.errorText, { color: colors.error }]}>{syncError}</Text> : null}
    <View style={styles.saveButton}><PrimaryButton testID="edit-save" label={saving ? "Guardando…" : "Guardar cambios"} icon="content-save-outline" disabled={saving} onPress={() => { void save(); }} /></View>
    <Pressable testID="edit-cancel" accessibilityRole="button" onPress={onDone} style={styles.cancelButton}><Text style={[styles.cancelText, { color: colors.muted }]}>Cancelar sin guardar</Text></Pressable>
  </View>;
}

function ScoreEditor({ testID, label, accent, value, onMinus, onPlus, colors, styles }: { testID: string; label: string; accent: string; value: number; onMinus: () => void; onPlus: () => void; colors: ReturnType<typeof useTheme>["colors"]; styles: ReturnType<typeof useStyles> }) {
  return <View style={styles.scoreSide}><Text style={[styles.scoreLabel, { color: accent }]}>{label}</Text><Text style={[styles.scoreNumber, { color: colors.onSurface }]}>{value}</Text><View style={styles.scoreActions}><Pressable testID={`${testID}-minus`} accessibilityRole="button" onPress={onMinus} style={[styles.scoreButton, { backgroundColor: colors.surfaceTertiary }]}><Text style={[styles.scoreButtonText, { color: colors.muted }]}>−</Text></Pressable><Pressable testID={`${testID}-plus`} accessibilityRole="button" onPress={onPlus} style={[styles.scoreButton, { backgroundColor: accent }]}><Text style={[styles.scoreButtonText, { color: colors.onBrandPrimary }]}>+</Text></Pressable></View></View>;
}

function StatEditor({ testID, icon, value, onMinus, onPlus, colors, styles }: { testID: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; value: number; onMinus: () => void; onPlus: () => void; colors: ReturnType<typeof useTheme>["colors"]; styles: ReturnType<typeof useStyles> }) {
  return <View style={styles.statEditor}><MaterialCommunityIcons name={icon} size={14} color={colors.brandPrimary} /><View style={styles.statCounter}><Pressable testID={`${testID}-minus`} accessibilityRole="button" onPress={onMinus}><Text style={[styles.counterButton, { color: colors.muted }]}>−</Text></Pressable><Text testID={`${testID}-value`} style={[styles.statValue, { color: colors.onSurface }]}>{value}</Text><Pressable testID={`${testID}-plus`} accessibilityRole="button" onPress={onPlus}><Text style={[styles.counterButton, { color: colors.brandPrimary }]}>+</Text></Pressable></View></View>;
}

const useStyles = makeStyles(() => ({
  card: { marginHorizontal: 18 },
  fieldRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  field: { flex: 1 },
  scoreCard: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 8 },
  scoreSide: { alignItems: "center", flex: 1 },
  scoreLabel: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  scoreNumber: { fontSize: 42, fontWeight: "900", lineHeight: 48, marginTop: 2 },
  scoreDash: { fontSize: 28, fontWeight: "900", marginTop: 18 },
  scoreActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  scoreButton: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  scoreButtonText: { fontSize: 23, lineHeight: 27 },
  mvpCard: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, padding: 13, marginBottom: 8 },
  mvpGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mvpChip: { minHeight: 40, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  statsCard: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, marginBottom: 8 },
  statRow: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 7, borderBottomWidth: 1 },
  statName: { flex: 1 },
  statPlayer: { fontSize: 14, fontWeight: "800" },
  statTeam: { fontSize: 11, marginTop: 3 },
  statEditor: { alignItems: "center", gap: 1 },
  statCounter: { flexDirection: "row", alignItems: "center", gap: 3 },
  counterButton: { fontSize: 22, fontWeight: "700", paddingHorizontal: 5 },
  statValue: { fontSize: 16, fontWeight: "900", minWidth: 16, textAlign: "center" },
  errorText: { marginHorizontal: 18, marginTop: 4, marginBottom: 6, fontSize: 12, fontWeight: "700", textAlign: "center" },
  saveButton: { marginHorizontal: 18, marginTop: 10 },
  cancelButton: { alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: 16 },
  cancelText: { fontSize: 13, fontWeight: "800" },
}));
