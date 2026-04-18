// Script de seed — inventario inicial Enjoy Cheladas
// Ejecutar: node server/seed-inventario.js
import { db } from './db.js'

const now = () => new Date().toISOString()

const productos = [
  // ── SABORES / FRUTAS ──────────────────────────────────────────────────────
  // Cada fruta enlazada a los sabores del configurador que la usan
  {
    nombre: 'Piña / Mango',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 100,
    stock: 2000, stock_minimo: 300, costo: 8000, precio: 8000,
    sabores_enlazados: ['frutos-amarillos', 'mango-biche'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Sandía',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 100,
    stock: 2000, stock_minimo: 300, costo: 6000, precio: 6000,
    sabores_enlazados: ['sandia-hierbabuena'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Pepino',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 80,
    stock: 1500, stock_minimo: 200, costo: 4000, precio: 4000,
    sabores_enlazados: ['pepino-limon-hierbabuena'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Manzana Verde / Pera',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 100,
    stock: 1500, stock_minimo: 300, costo: 7000, precio: 7000,
    sabores_enlazados: ['frutos-verdes'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Fresa',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 100,
    stock: 2000, stock_minimo: 300, costo: 8000, precio: 8000,
    sabores_enlazados: ['fresa-mandarina'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Mandarina',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 80,
    stock: 1500, stock_minimo: 200, costo: 5000, precio: 5000,
    sabores_enlazados: ['fresa-mandarina'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Cereza',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 80,
    stock: 1000, stock_minimo: 200, costo: 10000, precio: 10000,
    sabores_enlazados: ['cereza-limon'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Maracuyá',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 100,
    stock: 1500, stock_minimo: 300, costo: 7000, precio: 7000,
    sabores_enlazados: ['maracuya'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Coco',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 80,
    stock: 1000, stock_minimo: 200, costo: 6000, precio: 6000,
    sabores_enlazados: ['coco'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Lulo',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 100,
    stock: 1500, stock_minimo: 300, costo: 7000, precio: 7000,
    sabores_enlazados: ['lulo'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Tamarindo',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 80,
    stock: 1000, stock_minimo: 200, costo: 5000, precio: 5000,
    sabores_enlazados: ['tamarindo'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Limón',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 60,
    stock: 1500, stock_minimo: 200, costo: 3000, precio: 3000,
    sabores_enlazados: ['limon-hierbabuena', 'pepino-limon-hierbabuena', 'cereza-limon'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Hierbabuena',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 20,
    stock: 500, stock_minimo: 100, costo: 2000, precio: 2000,
    sabores_enlazados: ['limon-hierbabuena', 'sandia-hierbabuena', 'pepino-limon-hierbabuena'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Frutos Rojos (mora, uva, fresa)',
    tipo: 'sabor', unidad: 'gramo', porcion_venta: 100,
    stock: 1500, stock_minimo: 300, costo: 9000, precio: 9000,
    sabores_enlazados: ['frutos-rojos'],
    bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  {
    nombre: 'Soda / Canada Dry 22oz',
    tipo: 'bebida', unidad: 'unidad',
    stock: 100, stock_minimo: 10, costo: 2500, precio: 2500,
    sabores_enlazados: [], bebidas_enlazadas: ['soda-22'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Soda / Canada Dry 16oz',
    tipo: 'bebida', unidad: 'unidad',
    stock: 100, stock_minimo: 10, costo: 2000, precio: 2000,
    sabores_enlazados: [], bebidas_enlazadas: ['soda-16'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Hatsu 22oz',
    tipo: 'bebida', unidad: 'unidad',
    stock: 60, stock_minimo: 10, costo: 4500, precio: 4500,
    sabores_enlazados: [], bebidas_enlazadas: ['hatsu-22'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Hatsu 16oz',
    tipo: 'bebida', unidad: 'unidad',
    stock: 60, stock_minimo: 10, costo: 3500, precio: 3500,
    sabores_enlazados: [], bebidas_enlazadas: ['hatsu-16'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Smirnoff 16oz',
    tipo: 'bebida', unidad: 'unidad',
    stock: 40, stock_minimo: 5, costo: 8000, precio: 8000,
    sabores_enlazados: [], bebidas_enlazadas: ['smirnoff-16'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },

  // ── OBJETOS ───────────────────────────────────────────────────────────────
  {
    nombre: 'Vaso 22oz',
    tipo: 'objeto', unidad: 'unidad',
    stock: 200, stock_minimo: 20, costo: 500, precio: 500,
    sabores_enlazados: [], bebidas_enlazadas: ['soda-22', 'hatsu-22'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Vaso 16oz',
    tipo: 'objeto', unidad: 'unidad',
    stock: 200, stock_minimo: 20, costo: 400, precio: 400,
    sabores_enlazados: [], bebidas_enlazadas: ['soda-16', 'hatsu-16', 'smirnoff-16'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Pitillo',
    tipo: 'objeto', unidad: 'unidad',
    stock: 500, stock_minimo: 50, costo: 100, precio: 100,
    sabores_enlazados: [], bebidas_enlazadas: ['soda-22','soda-16','hatsu-22','hatsu-16','smirnoff-16'], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Bolsa / Empaque',
    tipo: 'objeto', unidad: 'unidad',
    stock: 300, stock_minimo: 30, costo: 150, precio: 150,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },

  // ── ADICIONES ─────────────────────────────────────────────────────────────
  {
    nombre: 'Fruta adicional',
    tipo: 'adicion', unidad: 'gramo', porcion_venta: 80,
    stock: 1000, stock_minimo: 200, costo: 3000, precio: 3000,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: ['fruta'],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Gomitas',
    tipo: 'adicion', unidad: 'gramo', porcion_venta: 30,
    stock: 500, stock_minimo: 100, costo: 2000, precio: 2000,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: ['gomitas'],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Frutos Rojos extra',
    tipo: 'adicion', unidad: 'gramo', porcion_venta: 80,
    stock: 800, stock_minimo: 150, costo: 4000, precio: 4000,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: ['f-rojos'],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Frutos Verdes extra',
    tipo: 'adicion', unidad: 'gramo', porcion_venta: 80,
    stock: 800, stock_minimo: 150, costo: 3500, precio: 3500,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: ['f-verdes'],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Perlas Explosivas',
    tipo: 'adicion', unidad: 'gramo', porcion_venta: 20,
    stock: 400, stock_minimo: 80, costo: 5000, precio: 5000,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: ['perlas'],
    activo: true, creado_en: now()
  },

  // ── BORDES ────────────────────────────────────────────────────────────────
  {
    nombre: 'Sal Limón',
    tipo: 'borde', unidad: 'gramo', porcion_venta: 10,
    stock: 500, stock_minimo: 50, costo: 1000, precio: 1000,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Sal Pimienta',
    tipo: 'borde', unidad: 'gramo', porcion_venta: 10,
    stock: 500, stock_minimo: 50, costo: 1000, precio: 1000,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Sal Tajín',
    tipo: 'borde', unidad: 'gramo', porcion_venta: 10,
    stock: 500, stock_minimo: 50, costo: 1500, precio: 1500,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Azúcar',
    tipo: 'borde', unidad: 'gramo', porcion_venta: 10,
    stock: 1000, stock_minimo: 100, costo: 500, precio: 500,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
  {
    nombre: 'Azúcar Tajín',
    tipo: 'borde', unidad: 'gramo', porcion_venta: 10,
    stock: 500, stock_minimo: 50, costo: 1500, precio: 1500,
    sabores_enlazados: [], bebidas_enlazadas: [], adiciones_enlazadas: [],
    activo: true, creado_en: now()
  },
]

// Limpiar productos existentes e insertar nuevos
await db.productos.remove({}, { multi: true })
for (const p of productos) {
  await db.productos.insert(p)
}

console.log(`✅ ${productos.length} productos insertados correctamente`)
console.log('   - Sabores/Frutas: 14')
console.log('   - Bebidas: 5')
console.log('   - Objetos: 4')
console.log('   - Adiciones: 5')
console.log('   - Bordes: 5')
process.exit(0)
