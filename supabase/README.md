# Configuración de Supabase

La app ya no guarda roster, partidos ni clasificación en localStorage. Supabase es la fuente cloud; AsyncStorage solo conserva la sesión de Supabase.

## Pasos únicos

1. Crea un proyecto en [supabase.com/dashboard](https://supabase.com/dashboard).
2. En **Authentication → Providers**, activa **Anonymous sign-ins** y **Email**.
3. En **Authentication → Users**, crea el usuario administrador con tu email y contraseña inicial `1234`.
4. Abre **SQL Editor**, pega y ejecuta todo `/app/supabase/schema.sql`.
5. Sustituye `TU_EMAIL_ADMIN` al final del SQL y ejecuta la sentencia `update auth.users` para asignar el rol `admin`.
6. En **Project Settings → API**, copia `Project URL` y la clave pública `anon` (o `publishable`). Nunca uses `service_role` o `sb_secret` en Expo.
7. Añádelas a `/app/frontend/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_anon
```

8. Reinicia Expo. El panel Administración permitirá iniciar sesión; el resto de usuarios entrará anónimamente.

## Seguridad y uso

- La app usa RLS: solo el usuario con `app_metadata.role = admin` puede editar jugadores, partidos, equipos, marcadores, estadísticas y reiniciar la temporada.
- Los usuarios anónimos pueden leer los datos y guardar su asistencia. Al no existir cuentas individuales, el jugador se identifica seleccionando su fila desde el dispositivo; para una identidad verificable por jugador habría que añadir login individual.
- El historial vive en `matches` + `match_player_stats` y se sincroniza mediante Realtime en todos los móviles.
- Cambia la contraseña `1234` inmediatamente después del primer acceso del administrador.