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

## Backlog priorizado

### P0 — Completado

- Flujo local completo de convocatoria → partido → clasificación.
- Persistencia local y reinicio seguro.
- UI móvil en español, accesible y usable con controles grandes.

### P1 — Próximas mejoras

- Historial de partidos finalizados con fecha, marcador, equipos y MVP.
- Edición de jugadores existentes (nombre, dorsal y posición).
- Aviso visual de cambios guardados y recuperación ante datos locales corruptos.
- Exportación/importación de la temporada para transferir datos entre dispositivos.

### P2 — Ideas futuras

- Compartir convocatoria mediante enlace o mensaje.
- Resumen anual con evolución de puntos y premios.
- Sincronización opcional entre dispositivos con cuentas.

## Siguientes tareas

1. Validar con una plantilla real de la peña y ajustar etiquetas o posiciones si fuera necesario.
2. Añadir historial de partidos antes de incorporar sincronización.
3. Considerar exportación de datos para evitar pérdida al cambiar de dispositivo.