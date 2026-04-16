# 🍺 Enjoy Cheladas — Sistema POS

Sistema de punto de venta completo para Enjoy Cheladas. React + Vite + Express + NeDB.

## Módulos

| Módulo | Acceso | Descripción |
|--------|--------|-------------|
| Dashboard | Todos | Resumen del día, top productos, alertas de stock |
| Ventas | Todos | Caja registradora con carrito, descuentos, múltiples métodos de pago |
| Caja | Todos | Apertura/cierre, movimientos, saldo en tiempo real |
| Inventario | Admin | CRUD de productos, ajuste de stock, alertas |
| Reportes | Admin | Análisis por período, descarga CSV |
| Usuarios | Admin | Gestión de cajeros y administradores |

## Instalación

```bash
# 1. Instalar dependencias del frontend (ya instaladas)
cd pos
npm install

# 2. Instalar dependencias del backend (ya instaladas)
cd pos/server
npm install
```

## Ejecutar

Abrir **dos terminales**:

### Terminal 1 — Backend (puerto 3001)
```bash
cd Enjoy_Cheladas/pos/server
node index.js
```

### Terminal 2 — Frontend (puerto 5173)
```bash
cd Enjoy_Cheladas/pos
npm run dev
```

Abrir en el navegador: **http://localhost:5173**

## Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |

> ⚠️ Cambia la contraseña del admin después del primer login en Usuarios.

## Roles

- **admin** — Acceso completo a todos los módulos
- **cajero** — Solo Ventas y Caja

## Estructura

```
pos/
├── src/                  # Frontend React
│   ├── pages/            # Dashboard, Ventas, Caja, Inventario, Reportes, Usuarios
│   ├── components/       # Layout, sidebar
│   ├── context/          # AuthContext
│   └── services/         # api.js (cliente HTTP)
├── server/               # Backend Express
│   ├── index.js          # API REST completa
│   ├── db.js             # Base de datos NeDB
│   └── data/             # Archivos .db (generados automáticamente)
└── public/
    └── logo.png          # Logo Enjoy Cheladas
```

## Descargar ventas

En Reportes → selecciona el rango de fechas → botón **Descargar CSV**.
El archivo incluye: folio, fecha, cajero, subtotal, descuento, total, método de pago, estado.
