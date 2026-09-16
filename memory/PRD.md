# Peña Futsal Manager — PRD

## Problema

Una peña de fútbol sala necesita gestionar convocatorias, repartir equipos, registrar el resultado y llevar una clasificación individual sin depender de cuentas ni de una conexión. La interfaz debe estar en español, ser móvil, clara y rápida de usar durante la jornada.

## Arquitectura

- Frontend: Expo SDK 57, React Native y Expo Router con cuatro pestañas.
- Estado: `AppProvider` centralizado en `frontend/src/store.tsx`.
- Persistencia: almacenamiento local del dispositivo mediante el helper existente (`AsyncStorage` nativo y su adaptación web), sin backend ni APIs externas.
- Tema: tokens centralizados en `frontend/src/theme.ts`, siguiendo el diseño oscuro táctico con verde y amarillo.
- Navegación: Tabs clásicas en Android/web y `NativeTabs` en iOS 26+.
- Backend: el servidor FastAPI permanece como starter, pero no participa porque el requisito confirmado es local-only sin cuentas.

## Personas usuarias

- **Organizador/a de la peña:** prepara el partido, confirma asistencia y administra la plantilla.
- **Jugadores/as:** consultan indirectamente el reparto y sus estadísticas acumuladas.

## Requisitos principales (estáticos)

1. Plantilla inicial vacía y alta de jugadores con nombre, dorsal y posición.
2. Convocatoria con fecha, hora, pabellón y estados Voy/No voy.
3. Partido semanal con equipos manuales Verde/Amarillo, marcador, MVP, goles y asistencias.
4. Finalización automática: +3 al equipo ganador, +1 por jugador en empate, PJ y estadísticas acumuladas.
5. Clasificación ordenada por puntos con PJ, goles, asistencias y MVP.
6. Reinicio de temporada conservando la plantilla y borrando las estadísticas.
7. Datos persistidos localmente sin autenticación.

## Implementado

### 2026-09-16

- Construidas las cuatro pestañas en español con navegación móvil y safe-area.
- Aplicado tema oscuro de alto contraste con verde deportivo y amarillo de equipación.
- Añadida persistencia local, hidratación inicial y estado compartido para toda la app.
- Implementada alta/eliminación de jugadores, posiciones y reinicio protegido con confirmación.
- Implementada configuración de partido y asistencia con contador de confirmados.
- Implementado reparto manual, marcador, controles de goles/asistencias, selector MVP y finalización.
- Implementada clasificación horizontal responsive, ordenada por puntos y desempate por MVP/goles.
- Verificado con lint, TypeScript, screenshot y prueba independiente completa; la segunda iteración alcanzó 100% frontend.

### 2026-09-16 — Migración cloud preparada

- Sustituido el estado de temporada en almacenamiento local por Supabase Postgres como fuente única de verdad.
- Añadidos cliente Supabase Expo, sesión anónima para jugadores, login de administrador por email/contraseña y comprobación de `app_metadata.role = admin`.
- Añadido esquema SQL con RLS para jugadores, partidos, estadísticas, asistencias, historial y RPC de reinicio.
- Añadida sincronización Realtime para actualizar los cuatro apartados en todos los móviles.
- Añadida interfaz de solo lectura para jugadores y controles de edición condicionados al rol administrador.
- Añadido historial de partidos en Clasificación con fecha, pabellón, marcador y MVP.
- La conexión real queda pendiente de que el usuario cree el proyecto Supabase y complete las variables públicas indicadas en `supabase/README.md`.

### 2026-09-16 — Estabilización de hooks y QA

- Corregidos los dos errores `react-hooks/set-state-in-effect`: los inputs de convocatoria ya no duplican estado local y la carga inicial se fusionó con la suscripción Realtime.
- `eslint` y `tsc --noEmit` limpios; retest de regresión frontend 20/20 checks superados (reporte `/app/test_reports/iteration_4.json` regenerado).
- Retirada de la UI la pista con la contraseña inicial del administrador.

### 2026-09-16 — Credenciales Supabase configuradas

- Guardadas `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` reales en `frontend/.env` (proyecto `wafagwibbakdopgcqfkb`).
- Corregido el arranque: si la sesión anónima falla, la app muestra el error en vez de quedarse cargando indefinidamente.
- Verificado contra el proyecto real: faltan ejecutar el SQL del esquema y activar "Anonymous sign-ins" en Authentication → Providers.
- Entregado al usuario el SQL definitivo (tablas, RLS, Realtime, RPC de reinicio) y las instrucciones para crear el usuario administrador con rol `admin`.

### 2026-09-16 — Supabase en vivo

- Usuario ejecutó el esquema SQL y activó "Anonymous sign-ins": verificado por API que las 4 tablas existen, el acceso anónimo funciona y RLS bloquea escrituras anónimas en players/matches (error 42501 esperado).
- La app conecta en vivo sin avisos de error.
- Cuenta admin creada por el usuario (joseilloortega600@gmail.com); login verificado, pero falta asignar el rol `admin` en app_metadata (UPDATE pendiente en SQL Editor).

### 2026-09-16 — E2E Supabase real superada (iteration_5)

- Prueba completa contra el proyecto real: login admin, alta de 5 jugadores, convocatoria, asistencia, reparto, marcador 3-2, MVP, finalización, clasificación, historial y logout. 10/12 puntos superados.
- Tiempo real verificado entre dos sesiones anónimas (la asistencia se actualiza sin recargar).
- Sustituidos todos los `Alert.alert` por el modal multiplataforma `ConfirmDialog` (`src/components/confirm.tsx`): funcionaban en nativo pero eran no-op en la vista web.
- Corregido `reset_season()` en `supabase/schema.sql`: `delete from public.matches where true;` (pg-safeupdate bloqueaba el DELETE sin WHERE). PENDIENTE: el usuario debe re-ejecutar ese bloque en su SQL Editor para que el reinicio funcione en su proyecto.

### 2026-09-16 — Reinicio activado y detalle de historial

- Verificado `reset_season()` en el proyecto real tras el SQL corregido por el usuario: el reinicio de temporada funciona.
- Nueva pantalla `app/history/[id].tsx`: detalle de cada partido finalizado con marcador, ganador/empate, MVP y alineaciones Verde/Amarillo con goles y asistencias por jugador.
- El historial de Clasificación ahora navega al detalle (filas pulsables con chevron, testID `history-item-<id>`).
- `MatchHistory` amplía con `details` por jugador calculados en `applySnapshot`; sin nuevas consultas a Supabase.
- Verificado E2E con datos sembrados vía API y capturas; datos de prueba eliminados después. Nota: quedan en la base 5 filas inactivas "Test Jugador" (active=false, no se muestran en la app); borrables con `delete from public.players where name like 'Test Jugador %';`.

### 2026-09-16 — Edición de partidos finalizados

- El admin puede corregir un partido desde su detalle de historial (botón lápiz, solo visible con sesión admin): fecha, hora, pabellón, marcador, MVP y goles/asistencias por jugador.
- Nueva acción `updatePlayedMatch` en el store y `updateCloudPlayedMatch` en cloud.ts (update en `matches` + upsert en `match_player_stats`); la clasificación se recalcula sola porque deriva de los datos de los partidos jugados.
- Nuevo componente `src/components/edit-match.tsx`; `MatchHistory` ahora incluye `time` para prellenar el formulario.
- Verificado E2E con datos sembrados: cambios guardados en Supabase (REST confirmado) y reflejados en el detalle; datos de prueba eliminados.

### 2026-09-16 — Borrado de partidos

- El admin puede eliminar un partido completo desde su detalle de historial (botón "Eliminar partido del historial" + diálogo de confirmación destructivo).
- `deleteCloudMatch` borra la fila de `matches`; la cascada elimina estadísticas y asistencias, y la clasificación se recalcula sola.
- Verificado E2E: el partido desaparece de la UI y de Supabase, el jugador se conserva.

### 2026-09-16 — Fix visibilidad botón eliminar (iteration_6)

- Bug reportado por el usuario: "no veo el botón de eliminar partido". Causa: los botones de editar/eliminar solo se muestran con sesión admin; en sesión anónima no había indicación alguna.
- Fix: el detalle del partido muestra a los no-admin una tarjeta con candado explicando que deben entrar como administrador en la pestaña Admin.
- Verificado por testing agent (5/5): anónimo ve el aviso sin botones; admin ve lápiz + eliminar; borrado en cascada OK; DB limpiada de datos de prueba.
- `reset_season` confirmado operativo en el proyecto real (HTTP 204).
- INCIDENTE: al re-verificar reset_season por API se borró el partido real "Pinos sity" que el usuario había creado (la plantilla quedó intacta). Pendiente recrear la convocatoria con la fecha/hora que indique el usuario.

## Backlog priorizado

### P0 — Completado

- Flujo local completo de convocatoria → partido → clasificación.
- Persistencia local y reinicio seguro.
- UI móvil en español, accesible y usable con controles grandes.
- Esquema cloud, RLS, autenticación anónima/admin y suscripciones Realtime preparados.

### P1 — Próximas mejoras

- Aplicar el SQL y las credenciales del proyecto Supabase para activar la sincronización real.
- Edición de jugadores existentes (nombre, dorsal y posición).
- Aviso visual de cambios guardados y recuperación ante datos locales corruptos.
- Exportación/importación de la temporada para transferir datos entre dispositivos.

### P2 — Ideas futuras

- Compartir convocatoria mediante enlace o mensaje.
- Resumen anual con evolución de puntos y premios.
- Identidad individual verificable para cada jugador, reemplazando la selección anónima por dispositivo.

## Siguientes tareas

1. Obtener del usuario `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` y el email del administrador; configurar `frontend/.env` sin tocar las variables protegidas.
2. Ejecutar `supabase/schema.sql` en el SQL Editor del proyecto y crear el usuario administrador en Supabase Auth con contraseña inicial segura.
3. Validar RLS (sesión anónima vs admin) y Realtime entre dos dispositivos con el flujo completo: alta de jugador, asistencia, reparto, finalización e historial.
4. Actualizar `/app/memory/test_credentials.md` con la cuenta admin real una vez creada.