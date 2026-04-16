# Enjoy Cheladas — Sistema POS

Sistema de punto de venta completo para la venta de cheladas artesanales.
Desarrollado con React + Vite (frontend) y Node.js + Express (backend).

---

## Acceso

| URL | http://localhost:5173 |
|-----|----------------------|
| Usuario admin | `admin` |
| Contraseña | `admin123` |

Roles disponibles: **admin** (acceso total) y **cajero** (solo ventas y caja).

---

## Módulos

### 1. Login
Pantalla de acceso con diseño split: panel de marca a la izquierda y formulario a la derecha.
Muestra el logo de Enjoy Cheladas. Redirige automáticamente al Dashboard tras autenticarse.

---

### 2. Dashboard
Vista general del día. Se refresca con los datos actuales cada vez que se carga.

Métricas en tiempo real:
- Total de ventas del día
- Ingresos totales cobrados
- Ticket promedio por venta
- Cantidad de productos con stock bajo

Gráficas del día:
- Top productos más vendidos (con barra de progreso relativa)
- Ventas por hora (gráfica de barras)
- Desglose por método de pago (efectivo, tarjeta, transferencia)
- Alertas de stock bajo en productos e insumos

Panel exclusivo para admin — Cajas activas:
- Muestra en tiempo real qué usuario tiene la caja abierta
- Hora de apertura y tiempo transcurrido
- Ventas realizadas y total acumulado por cajero
- Se actualiza automáticamente cada 30 segundos

---

### 3. Ventas (Caja registradora)
Pantalla principal de venta. Diseñada para uso táctil en tablet y clic en portátil.

Funcionalidades:
- Catálogo de productos en grid con búsqueda y filtro por categoría
- Agregar/quitar productos del carrito con botones +/-
- Descuento manual en pesos sobre el total
- 3 métodos de pago: efectivo, tarjeta, transferencia
- Cálculo automático de cambio para pagos en efectivo
- Campo de notas para instrucciones especiales
- Confirmación con folio único de venta (EC-YYYYMMDD-XXXX)

Al completar una venta:
- Se descuenta el stock del producto automáticamente
- Se descuentan los insumos de la receta del producto (vasos, pitillos, etc.)
- Se registra el movimiento en caja
- Se muestra el ticket de confirmación con cambio

Elementos de psicología aplicados (marketing psychology skill):
- Badge "🔥 Popular" en los 3 productos más vendidos del día (Social Proof)
- Alerta "¡Solo X!" con animación en productos con stock ≤ 3 (Scarcity)
- Indicador "⚠ Quedan X" en stock bajo (Loss Aversion)
- Barra de progreso de 3 pasos: Productos → Pago → Listo (Goal-Gradient Effect)
- Botón de cobro cambia dinámicamente: muestra el total exacto a cobrar (BJ Fogg Prompt)
- Mensaje aleatorio de cierre en el ticket (Peak-End Rule)
- Subtotal visible antes del total para anclar la percepción de precio (Anchoring)

---

### 4. Caja
Control del flujo de dinero del día.

Funcionalidades:
- Apertura de caja con monto inicial (solo admin)
- Cierre de caja con monto físico contado
- Comparación automática entre saldo calculado y monto físico (muestra diferencia)
- Registro de movimientos manuales: ingresos y egresos con concepto
- Historial de todos los movimientos del día con hora y usuario
- Resumen: total ingresos, total egresos, saldo actual

El saldo se calcula automáticamente sumando todas las ventas del día más el monto inicial menos los egresos.

---

### 5. Inventario (solo admin)
Gestión completa del inventario en 3 pestañas:

#### Pestaña Productos
Productos que aparecen en la caja registradora.
- Crear, editar y desactivar productos
- Campos: nombre, categoría, precio de venta, costo, stock actual, stock mínimo, unidad
- Ajuste de stock: entrada (compra), salida (merma) o ajuste directo
- Alertas visuales de stock bajo y agotado
- Margen de ganancia calculable (precio - costo)

#### Pestaña Insumos
Materiales y suministros que se usan para preparar los productos (no aparecen en la caja).
- Crear, editar y desactivar insumos
- Ejemplos: vaso grande, vaso mediano, pitillo grueso, cerveza 330ml, limón, sal, chamoy, chile, mango, tamarindo, pepino, servilleta, bolsa
- Ajuste de stock por entrada, salida o ajuste directo
- Tarjetas visuales con alerta de stock bajo
- Unidades configurables: pieza, botella, ml, gramo, etc.

#### Pestaña Recetas
Define qué insumos y en qué cantidad consume cada producto al venderse.
- Asociar ingredientes a cada chelada o bebida
- Cantidad por insumo configurable (ej: 1 vaso + 1 pitillo + 80g mango + 15ml chamoy)
- Al vender 1 chelada, el sistema descuenta automáticamente todos sus insumos
- Al cancelar una venta, los insumos se restauran
- Edición en tiempo real sin necesidad de recargar

Datos de ejemplo precargados:
- Chelada Clásica → vaso mediano + pitillo + cerveza + limón + sal + servilleta
- Chelada Picante → vaso mediano + pitillo + cerveza + limón + chamoy + chile + servilleta
- Chelada Mango → vaso grande + pitillo + cerveza + mango + chamoy + chile + servilleta

---

### 6. Reportes (solo admin)
Análisis de ventas por período.

Filtros de rango:
- Hoy, Ayer, Últimos 7 días, Últimos 30 días
- Rango personalizado con fechas de inicio y fin

Métricas del período:
- Total de ventas, ingresos totales, ticket promedio
- Cantidad de productos con stock bajo

Gráficas:
- Top 10 productos más vendidos con barra de progreso y monto total
- Métodos de pago con porcentaje del total y cantidad de ventas
- Ventas por hora (gráfica de barras)
- Lista de productos e insumos con stock bajo

Descarga:
- Botón "Descargar CSV" exporta todas las ventas del período seleccionado
- Formato: Folio, Fecha, Cajero, Subtotal, Descuento, Total, Método Pago, Estado
- Compatible con Excel y Google Sheets
- Incluye BOM UTF-8 para correcta visualización de caracteres especiales

---

### 7. Usuarios (solo admin)
Gestión de accesos al sistema.

Funcionalidades:
- Crear usuarios con nombre, usuario, contraseña y rol
- Editar datos y cambiar contraseña
- Activar/desactivar usuarios (no se eliminan, se desactivan)
- No permite eliminar el usuario con el que estás logueado
- Roles: admin (acceso total) y cajero (ventas + caja)

---

## Tecnología

| Componente | Tecnología |
|-----------|-----------|
| Frontend | React 18 + Vite 5 |
| Estilos | Tailwind CSS |
| Iconos | Lucide React |
| Fechas | date-fns |
| Rutas | React Router v6 |
| Backend | Node.js + Express |
| Base de datos | NeDB (archivos .db locales, sin instalación) |
| Autenticación | JWT (12h de expiración) |
| Contraseñas | bcryptjs |
| PWA | vite-plugin-pwa + Workbox |

---

## Dispositivos compatibles

| Dispositivo | Comportamiento |
|------------|---------------|
| Móvil (<768px) | Menú hamburguesa, vista apilada |
| Tablet (768–1023px) | Sidebar colapsable con íconos |
| Portátil/Desktop (≥1024px) | Sidebar completo con etiquetas |

---

## Instalación local

```bash
# Terminal 1 — Backend (puerto 3001)
cd Enjoy_Cheladas/pos/server
npm install
node index.js

# Terminal 2 — Frontend (puerto 5173)
cd Enjoy_Cheladas/pos
npm install
npm run dev
```

Abrir: http://localhost:5173

La base de datos se crea automáticamente en `server/data/` con datos de ejemplo en el primer arranque.

---

## Repositorio GitHub

https://github.com/Logisoft-web/enjoy-cheladas-pos

---

## Flujo de una venta completa

1. Cajero abre caja con monto inicial
2. Cliente pide una chelada
3. Cajero toca el producto en la pantalla de Ventas
4. Sistema muestra badge "Popular" si es de los más pedidos del día
5. Cajero selecciona método de pago y registra monto recibido
6. Sistema calcula cambio automáticamente
7. Cajero presiona "Cobrar $XX.XX →"
8. Sistema:
   - Descuenta 1 unidad del producto
   - Descuenta todos los insumos de la receta (vaso, pitillo, cerveza, etc.)
   - Registra la venta con folio único
   - Registra ingreso en caja
9. Aparece ticket de confirmación con mensaje de cierre
10. Al cerrar caja, admin ve resumen del día con total real vs conteo físico
