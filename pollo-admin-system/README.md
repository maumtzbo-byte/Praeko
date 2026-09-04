# Pollo Admin System

Panel de administración multi-sucursal para una cadena de pollerías: reportes
diarios, ventas, gastos, inventario, pedidos entre sucursales, mermas,
notificaciones y reportes exportables. Proyecto nuevo e independiente, sin
relación con ningún otro proyecto del repositorio.

**Stack:** React 19 + TypeScript + Vite · Tailwind CSS v4 · shadcn/ui (Radix) ·
React Router · TanStack Query · React Hook Form + Zod · Supabase (Postgres +
Auth + Storage + RLS) · Recharts · Lucide React.

---

## 1. Estructura del proyecto

```
pollo-admin-system/
├── supabase/
│   ├── migrations/0001_init_schema.sql   # Esquema completo: tablas, FKs, índices, triggers, RLS
│   └── seed.sql                          # Datos de referencia (categorías, productos, sucursales)
├── scripts/
│   └── seed-demo-data.ts                 # Usuarios demo + datos transaccionales (Admin API)
├── src/
│   ├── components/
│   │   ├── ui/          # Primitivos shadcn/ui (button, card, dialog, table, select…)
│   │   ├── layout/      # AppShell, Sidebar, Topbar
│   │   ├── shared/      # PageHeader, StatCard, EmptyState, GlobalSearch, ConfirmDialog…
│   │   └── charts/      # Wrappers de Recharts (tendencia de ventas, comparativos, top productos)
│   ├── pages/            # Una carpeta por módulo (dashboard, sucursales, gastos, inventario…)
│   ├── hooks/             # TanStack Query hooks (use-sucursales, use-inventario, use-dashboard…)
│   ├── services/          # Acceso a Supabase (una función por operación, sin lógica de UI)
│   ├── context/           # AuthContext (sesión, perfil, rol)
│   ├── routes/            # AppRoutes, guardas de autenticación/rol
│   ├── lib/               # cliente Supabase, utilidades, rangos de fecha, paleta de gráficas
│   ├── types/             # Tipos de dominio (reflejan el esquema SQL)
│   └── utils/             # Exportación a PDF/Excel
├── .env.example
└── package.json
```

**Arquitectura:** cada página delega la lectura/escritura de datos a un hook de
`hooks/`, que a su vez llama a una función pura en `services/` (esta es la
única capa que importa el cliente de Supabase). Los componentes de página no
hacen fetch directo; esto mantiene la UI desacoplada de Supabase y facilita
tests o un futuro cambio de backend.

Roles soportados: **administrador** (acceso total), **encargado** (gestiona su
sucursal y su equipo) y **empleado** (operación diaria dentro de su
sucursal). El menú lateral, las rutas y las políticas RLS de la base de datos
se ajustan automáticamente según el rol.

---

## 2. Crear un nuevo proyecto en Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) y pulsa
   **New project**.
2. Elige tu organización, un nombre (por ejemplo `pollo-admin-system`), una
   contraseña segura para la base de datos y la región más cercana a tus
   sucursales.
3. Espera a que aprovisione el proyecto (1-2 minutos).
4. Ve a **SQL Editor** → **New query**, pega el contenido completo de
   [`supabase/migrations/0001_init_schema.sql`](./supabase/migrations/0001_init_schema.sql)
   y ejecútalo. Esto crea todas las tablas, índices, funciones, triggers y
   políticas de Row Level Security.
5. Repite el paso anterior con
   [`supabase/seed.sql`](./supabase/seed.sql) para cargar las categorías,
   productos y sucursales de referencia.
   - Alternativa con la CLI de Supabase, si prefieres migraciones versionadas:
     ```bash
     npx supabase link --project-ref <tu-project-ref>
     npx supabase db push
     psql "$(npx supabase status -o env | grep DB_URL)" -f supabase/seed.sql
     ```
6. Ve a **Storage** y confirma que el bucket `comprobantes` se haya creado
   (lo crea la migración); si tu plan no permite crearlo por SQL, créalo
   manualmente como bucket **privado** con ese mismo nombre.
7. (Opcional pero recomendado) Genera los datos y cuentas demo — ver sección 6.

---

## 3. Conectar el proyecto de Supabase a la app

1. En el dashboard de Supabase ve a **Project Settings → API**.
2. Copia **Project URL** y la clave **anon / public**.
3. En la raíz de `pollo-admin-system/`:
   ```bash
   cp .env.example .env
   ```
4. Edita `.env`:
   ```bash
   VITE_SUPABASE_URL=https://<tu-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<tu-clave-anon-publica>

   # Solo necesaria para scripts/seed-demo-data.ts (nunca se usa en el navegador)
   SUPABASE_SERVICE_ROLE_KEY=<tu-clave-service-role>
   ```
5. Instala dependencias y arranca:
   ```bash
   npm install
   npm run dev
   ```
6. Abre `http://localhost:5173` — verás la pantalla de login.

`.env` está en `.gitignore`: nunca subas tus claves reales al repositorio.
Solo `.env.example` (sin valores reales) se versiona.

---

## 4. Crear un nuevo proyecto en Vercel

1. Sube este proyecto a su propio repositorio de GitHub (o usa una carpeta
   dedicada si despliegas un monorepo — ver nota abajo).
2. Entra a [vercel.com/new](https://vercel.com/new) e importa el repositorio.
3. Framework preset: **Vite** (Vercel lo detecta automáticamente).
4. **Root Directory**: si el repositorio contiene más proyectos además de
   este, selecciona la carpeta `pollo-admin-system` como raíz del proyecto
   Vercel.
5. Build command: `npm run build` · Output directory: `dist` (valores por
   defecto de Vite, no requieren cambios).
6. Agrega las variables de entorno (ver sección 5) antes de desplegar.
7. Pulsa **Deploy**. Cada push a la rama configurada generará un nuevo
   deployment.

---

## 5. Dónde colocar las variables de entorno

| Entorno              | Dónde                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| Desarrollo local      | Archivo `.env` en la raíz de `pollo-admin-system/` (basado en `.env.example`) |
| Vercel (producción)   | Project Settings → **Environment Variables**, agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para los entornos Production/Preview/Development |
| Script de datos demo  | Mismo archivo `.env` local, agrega además `SUPABASE_SERVICE_ROLE_KEY` (**nunca** la agregues en Vercel: es una clave de administrador que no debe llegar al navegador) |

Variables usadas por el cliente (con prefijo `VITE_`, se incluyen en el
bundle del navegador):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Variable solo de servidor/CLI (nunca en el frontend):

- `SUPABASE_SERVICE_ROLE_KEY`

---

## 6. Datos demo

Con `.env` completo (incluyendo `SUPABASE_SERVICE_ROLE_KEY`):

```bash
npm run seed
```

Esto crea, usando la Admin API de Supabase Auth (por eso requiere la service
role key y se ejecuta desde tu máquina, no desde el navegador):

- 1 administrador, 3 encargados (uno por sucursal) y 2 empleados
- Inventario inicial por sucursal y producto (algunos artículos quedan por
  debajo del stock mínimo a propósito, para probar las alertas)
- 14 días de reportes diarios, ventas por producto, gastos, pedidos y mermas
  por sucursal

Cuentas de acceso (contraseña para todas: `Pollo123!`):

| Rol          | Correo                          |
| ------------- | -------------------------------- |
| Administrador | `admin@pollo.com`                |
| Encargado     | `encargado.centro@pollo.com`     |
| Encargado     | `encargado.norte@pollo.com`      |
| Encargado     | `encargado.sur@pollo.com`        |
| Empleado      | `empleado1@pollo.com`            |
| Empleado      | `empleado2@pollo.com`            |

El script es idempotente: puedes volver a ejecutarlo y no duplicará cuentas
ni sucursales.

---

## 7. Esquema SQL

El esquema completo (tablas, foreign keys, índices, funciones, triggers y
políticas RLS) vive en
[`supabase/migrations/0001_init_schema.sql`](./supabase/migrations/0001_init_schema.sql).
Resumen:

- **Tablas**: `roles`, `sucursales`, `usuarios`, `categorias`, `productos`,
  `inventario`, `reportes_diarios`, `ventas`, `gastos`, `pedidos`, `mermas`,
  `notificaciones`, `historial_cambios`.
- **Seguridad**: RLS habilitado en todas las tablas. Cada sucursal solo ve y
  gestiona su propia información (`sucursal_id = current_usuario_sucursal()`);
  el rol `administrador` ve y gestiona todo. Las funciones
  `current_usuario_rol()`, `current_usuario_sucursal()`, `is_admin()` e
  `is_encargado_o_admin()` son `SECURITY DEFINER` para evitar recursión de
  RLS al consultar el propio perfil.
- **Automatizaciones**: triggers para `updated_at`, notificación automática
  de inventario bajo, notificación de merma alta (≥ 20 unidades) y registro
  de historial (auditoría) en `pedidos`, `reportes_diarios` e `inventario`.
- **Cálculos automáticos**: `ventas_totales` y `ganancia_estimada` en
  `reportes_diarios`, y `subtotal` en `ventas`, son columnas generadas
  (`GENERATED ALWAYS AS … STORED`) — nunca se calculan a mano ni pueden
  desincronizarse.

---

## 8. Verificación

```bash
npm install
npm run build   # tsc -b && vite build — compila sin errores
npm run lint     # oxlint
```

Ambos comandos se ejecutaron sobre el código final de este proyecto sin
errores. `npm run dev` fue probado en navegador (Chromium) para confirmar que
la pantalla de login renderiza sin errores de consola; el resto de los
módulos requieren credenciales reales de Supabase (ver secciones 2 y 3) para
probarse end-to-end, ya que dependen de datos y autenticación en vivo.

---

## Scripts disponibles

| Comando           | Descripción                                    |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Servidor de desarrollo (Vite)                   |
| `npm run build`    | Type-check + build de producción a `dist/`      |
| `npm run preview`  | Sirve el build de producción localmente         |
| `npm run lint`     | Linter (oxlint)                                 |
| `npm run seed`     | Genera usuarios y datos demo en Supabase         |
