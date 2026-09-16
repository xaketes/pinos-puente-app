import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";

import { EmptyState, Header, PrimaryButton, Screen, SectionTitle, sharedStyles } from "@/src/components/screen";
import { type Position, useApp } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

const positions: Position[] = ["Portero", "Cierre", "Ala", "Pívot"];

export default function AdminScreen() {
  const { state, addPlayer, removePlayer, resetSeason } = useApp();
  const { colors } = useTheme();
  const styles = useStyles();
  const [name, setName] = useState(""); const [number, setNumber] = useState(""); const [position, setPosition] = useState<Position>("Ala");
  const add = () => { if (!name.trim() || !number.trim()) { Alert.alert("Faltan datos", "Escribe el nombre y el dorsal del jugador."); return; } addPlayer(name.trim(), number.trim(), position); setName(""); setNumber(""); setPosition("Ala"); };
  const reset = () => Alert.alert("Reiniciar temporada", "Se borrarán puntos, partidos, goles, asistencias y MVP. La plantilla se conservará.", [{ text: "Cancelar", style: "cancel" }, { text: "Reiniciar", style: "destructive", onPress: resetSeason }]);
  return <Screen testID="admin-screen"><Header kicker="GESTIÓN DE PLANTILLA" title="Administración" subtitle="Mantén la plantilla lista para cada jornada." icon="account-group-outline" />
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SectionTitle title="Añadir jugador" action="NUEVO" />
      <View style={[sharedStyles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Text style={[sharedStyles.fieldLabel, { color: colors.muted }]}>Nombre</Text><TextInput testID="player-name" value={name} onChangeText={setName} placeholder="Ej. Dani García" placeholderTextColor={colors.muted} style={[sharedStyles.input, styles.formInput, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} />
        <Text style={[sharedStyles.fieldLabel, styles.formLabel, { color: colors.muted }]}>Dorsal</Text><TextInput testID="player-number" value={number} onChangeText={setNumber} keyboardType="number-pad" placeholder="10" placeholderTextColor={colors.muted} style={[sharedStyles.input, styles.formInput, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]} />
        <Text style={[sharedStyles.fieldLabel, styles.formLabel, { color: colors.muted }]}>Posición</Text><View style={styles.positionGrid}>{positions.map((item) => <Pressable testID={`position-${item}`} key={item} accessibilityRole="button" onPress={() => setPosition(item)} style={[styles.positionChip, { backgroundColor: position === item ? colors.brandTertiary : colors.surfaceTertiary, borderColor: position === item ? colors.borderStrong : colors.border }]}><Text style={{ color: position === item ? colors.onBrandTertiary : colors.muted, fontSize: 12, fontWeight: "800" }}>{item}</Text></Pressable>)}</View>
        <View style={styles.addButton}><PrimaryButton testID="add-player" label="Añadir a la plantilla" icon="account-plus-outline" onPress={add} /></View>
      </View>
    </KeyboardAvoidingView>
    <SectionTitle title="Plantilla" action={`${state.players.length} JUGADORES`} />
    {state.players.length === 0 ? <EmptyState icon="account-multiple-outline" title="Todavía no hay jugadores" message="Añade el primer jugador con el formulario de arriba." /> : <View style={[styles.rosterCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>{state.players.map((player) => <View key={player.id} style={styles.rosterRow}><View style={[styles.rosterNumber, { backgroundColor: colors.surfaceTertiary }]}><Text style={[styles.rosterNumberText, { color: colors.brandSecondary }]}>{player.number}</Text></View><View style={styles.rosterCopy}><Text style={[styles.rosterName, { color: colors.onSurface }]}>{player.name}</Text><Text style={[styles.rosterPosition, { color: colors.muted }]}>{player.position}</Text></View><Pressable testID={`delete-player-${player.id}`} accessibilityRole="button" onPress={() => Alert.alert("Eliminar jugador", `¿Quieres quitar a ${player.name} de la plantilla?`, [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => removePlayer(player.id) }])} style={styles.deleteButton}><MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} /></Pressable></View>)}</View>}
    <SectionTitle title="Temporada" />
    <View style={[styles.resetCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}><View style={[styles.resetIcon, { backgroundColor: colors.surfaceTertiary }]}><MaterialCommunityIcons name="restart" size={22} color={colors.warning} /></View><View style={styles.resetCopy}><Text style={[styles.resetTitle, { color: colors.onSurface }]}>Reiniciar estadísticas</Text><Text style={[styles.resetText, { color: colors.muted }]}>Conserva los jugadores y borra el marcador de la temporada.</Text></View><Pressable testID="reset-season" accessibilityRole="button" onPress={reset} style={[styles.resetButton, { borderColor: colors.warning }]}><Text style={{ color: colors.warning, fontWeight: "900", fontSize: 12 }}>REINICIAR</Text></Pressable></View>
  </Screen>;
}

const useStyles = makeStyles((colors) => ({
  formInput: { marginBottom: 0 }, formLabel: { marginTop: 14 }, positionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, positionChip: { minHeight: 42, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" }, addButton: { marginTop: 18 },
  rosterCard: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 }, rosterRow: { minHeight: 68, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 11 }, rosterNumber: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" }, rosterNumberText: { fontSize: 15, fontWeight: "900" }, rosterCopy: { flex: 1 }, rosterName: { fontSize: 14, fontWeight: "800" }, rosterPosition: { fontSize: 12, marginTop: 3 }, deleteButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  resetCard: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }, resetIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }, resetCopy: { flex: 1 }, resetTitle: { fontSize: 14, fontWeight: "900" }, resetText: { fontSize: 11, lineHeight: 16, marginTop: 3 }, resetButton: { minHeight: 38, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, justifyContent: "center" },
}));