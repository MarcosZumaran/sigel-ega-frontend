# Matriz de Roles y Permisos — SIGEL-EGA

## Roles del sistema

| Rol | Descripción | Origen |
|-----|-------------|--------|
| **ADMIN** | Administrador total del sistema | Spatie |
| **DIRECTOR** | Director de la IE (gestión académica) | Spatie |
| **DOCENTE** | Docente (calificaciones, asistencia) | Spatie |

## Matriz de acceso por ruta

| Ruta | ADMIN | DIRECTOR | DOCENTE | Anónimo |
|------|:-----:|:--------:|:-------:|:-------:|
| /login, /register | ❌ | ❌ | ❌ | ✅ |
| /dashboard | ✅ | ✅ | ✅ | ❌ |
| /matriculas | ✅ | ✅ | ❌ | ❌ |
| /estudiantes | ✅ | ✅ | ❌ | ❌ |
| /padres, /apoderados | ✅ | ✅ | ❌ | ❌ |
| /notas | ✅ | ✅ | ✅ | ❌ |
| /asistencias | ✅ | ✅ | ✅ | ❌ |
| /reportes, /estadisticas | ✅ | ✅ | ❌ | ❌ |
| /periodos, /grados, /secciones | ✅ | ❌ | ❌ | ❌ |

## Backend: middleware

- Rutas con `middleware('admin')` → solo ADMIN.
- Rutas con `permission:X` → cualquier rol con ese permiso.
- Rutas con `auth:sanctum` → cualquier usuario autenticado.

## Frontend: guards

- `authGuard` → cualquier usuario autenticado.
- `roleGuard(['ADMIN'])` → solo ADMIN.
- `roleGuard(['ADMIN', 'DIRECTOR'])` → ADMIN o DIRECTOR.

## Cómo probar

1. Login con admin@ega.edu.pe → ve todo.
2. Crear usuario con rol DOCENTE:
   ```bash
   php artisan tinker --execute="
   \$u = App\Models\User::create(['name'=>'Docente Test','email'=>'docente@ega.edu.pe','password'=>'password123']);
   \$u->assignRole('DOCENTE');
   "
   ```
3. Login con docente@ega.edu.pe → solo dashboard, notas, asistencias.
4. Intentar /periodos → redirige a /dashboard.
