import Datastore from 'nedb-promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = join(__dirname, 'data')

export const db = {
  usuarios:    Datastore.create({ filename: join(dir, 'usuarios.db'),    autoload: true }),
  productos:   Datastore.create({ filename: join(dir, 'productos.db'),   autoload: true }),
  ventas:      Datastore.create({ filename: join(dir, 'ventas.db'),      autoload: true }),
  ventaItems:  Datastore.create({ filename: join(dir, 'venta_items.db'), autoload: true }),
  movimientos: Datastore.create({ filename: join(dir, 'movimientos.db'), autoload: true }),
  caja:        Datastore.create({ filename: join(dir, 'caja.db'),        autoload: true }),
  insumos:     Datastore.create({ filename: join(dir, 'insumos.db'),     autoload: true }),
  recetas:     Datastore.create({ filename: join(dir, 'recetas.db'),     autoload: true }),
  config:      Datastore.create({ filename: join(dir, 'config.db'),      autoload: true }),
  clientes:    Datastore.create({ filename: join(dir, 'clientes.db'),    autoload: true }),
  combos:      Datastore.create({ filename: join(dir, 'combos.db'),      autoload: true }),
  secciones:   Datastore.create({ filename: join(dir, 'secciones.db'),   autoload: true }),
}

// Índices únicos
db.usuarios.ensureIndex({ fieldName: 'usuario', unique: true })
db.ventas.ensureIndex({ fieldName: 'folio', unique: true })

// Seed admin por defecto
async function seed() {
  const admin = await db.usuarios.findOne({ usuario: 'admin' })
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10)
    await db.usuarios.insert({ nombre: 'Administrador', usuario: 'admin', password: hash, rol: 'admin', activo: true, creado_en: new Date().toISOString() })

    const productos = [
      { nombre: 'Chelada Clásica',   categoria: 'Chelada',   precio: 35, costo: 12, stock: 100, stock_minimo: 10, unidad: 'vaso', activo: true },
      { nombre: 'Chelada Picante',   categoria: 'Chelada',   precio: 40, costo: 14, stock: 80,  stock_minimo: 10, unidad: 'vaso', activo: true },
      { nombre: 'Chelada Mango',     categoria: 'Chelada',   precio: 45, costo: 16, stock: 60,  stock_minimo: 10, unidad: 'vaso', activo: true },
      { nombre: 'Chelada Tamarindo', categoria: 'Chelada',   precio: 40, costo: 14, stock: 70,  stock_minimo: 10, unidad: 'vaso', activo: true },
      { nombre: 'Chelada Pepino',    categoria: 'Chelada',   precio: 38, costo: 13, stock: 50,  stock_minimo: 10, unidad: 'vaso', activo: true },
      { nombre: 'Chelada Especial',  categoria: 'Chelada',   precio: 55, costo: 20, stock: 40,  stock_minimo: 5,  unidad: 'vaso', activo: true },
      { nombre: 'Agua Mineral',      categoria: 'Bebida',    precio: 20, costo: 8,  stock: 50,  stock_minimo: 10, unidad: 'botella', activo: true },
      { nombre: 'Refresco',          categoria: 'Bebida',    precio: 25, costo: 10, stock: 40,  stock_minimo: 10, unidad: 'lata', activo: true },
      { nombre: 'Vaso Grande',       categoria: 'Accesorio', precio: 15, costo: 5,  stock: 200, stock_minimo: 20, unidad: 'pieza', activo: true },
      { nombre: 'Vaso Mediano',      categoria: 'Accesorio', precio: 12, costo: 4,  stock: 200, stock_minimo: 20, unidad: 'pieza', activo: true },
    ]
    for (const p of productos) {
      await db.productos.insert({ ...p, creado_en: new Date().toISOString() })
    }
    console.log('✅ Base de datos inicializada con datos de ejemplo')

    // Insumos de ejemplo
    const insumosSeed = [
      // Vasos por tamaño
      { nombre: 'Vaso 20oz',            unidad: 'pieza',   stock: 500, stock_minimo: 50, activo: true },
      { nombre: 'Vaso 32oz',            unidad: 'pieza',   stock: 500, stock_minimo: 50, activo: true },
      { nombre: 'Vaso 12oz',            unidad: 'pieza',   stock: 300, stock_minimo: 30, activo: true },
      { nombre: 'Vaso desechable 16oz', unidad: 'pieza',   stock: 300, stock_minimo: 30, activo: true },
      // Pitillos
      { nombre: 'Pitillo grueso',       unidad: 'pieza',   stock: 600, stock_minimo: 60, activo: true },
      { nombre: 'Pitillo delgado',      unidad: 'pieza',   stock: 600, stock_minimo: 60, activo: true },
      // Bebidas base
      { nombre: 'Cerveza 330ml',        unidad: 'botella', stock: 200, stock_minimo: 24, activo: true },
      { nombre: 'Cerveza 710ml',        unidad: 'botella', stock: 100, stock_minimo: 12, activo: true },
      // Frutas
      { nombre: 'Mango en cubos',       unidad: 'gramo',   stock: 2000, stock_minimo: 300, activo: true },
      { nombre: 'Pepino en rodajas',    unidad: 'gramo',   stock: 1000, stock_minimo: 150, activo: true },
      { nombre: 'Limón',               unidad: 'unidad',  stock: 300,  stock_minimo: 50,  activo: true },
      { nombre: 'Sandía en cubos',      unidad: 'gramo',   stock: 1000, stock_minimo: 200, activo: true },
      { nombre: 'Jícama en tiras',      unidad: 'gramo',   stock: 500,  stock_minimo: 100, activo: true },
      // Salsas y condimentos
      { nombre: 'Chamoy',              unidad: 'ml',      stock: 1500, stock_minimo: 200, activo: true },
      { nombre: 'Tamarindo líquido',   unidad: 'ml',      stock: 1000, stock_minimo: 150, activo: true },
      { nombre: 'Chile en polvo',      unidad: 'gramo',   stock: 500,  stock_minimo: 50,  activo: true },
      { nombre: 'Sal de mar',          unidad: 'gramo',   stock: 1000, stock_minimo: 100, activo: true },
      { nombre: 'Miguelito (polvo)',   unidad: 'gramo',   stock: 300,  stock_minimo: 50,  activo: true },
      // Otros
      { nombre: 'Servilleta',          unidad: 'pieza',   stock: 1000, stock_minimo: 100, activo: true },
      { nombre: 'Bolsa para llevar',   unidad: 'pieza',   stock: 200,  stock_minimo: 20,  activo: true },
    ]
    const insumosInsertados = {}
    for (const ins of insumosSeed) {
      const doc = await db.insumos.insert({ ...ins, creado_en: new Date().toISOString() })
      insumosInsertados[ins.nombre] = doc._id
    }

    // Buscar productos para crear recetas
    const prods = await db.productos.find({})
    const prodMap = {}
    for (const p of prods) prodMap[p.nombre] = p._id

    // Recetas de ejemplo — qué insumos usa cada chelada
    const recetasSeed = [
      {
        producto_id: prodMap['Chelada Clásica'],
        producto_nombre: 'Chelada Clásica',
        ingredientes: [
          { insumo_id: insumosInsertados['Vaso Mediano (16oz)'], insumo_nombre: 'Vaso Mediano (16oz)', cantidad: 1 },
          { insumo_id: insumosInsertados['Pitillo grueso'],       insumo_nombre: 'Pitillo grueso',      cantidad: 1 },
          { insumo_id: insumosInsertados['Cerveza 330ml'],        insumo_nombre: 'Cerveza 330ml',       cantidad: 1 },
          { insumo_id: insumosInsertados['Limón'],               insumo_nombre: 'Limón',               cantidad: 1 },
          { insumo_id: insumosInsertados['Sal de mar'],          insumo_nombre: 'Sal de mar',          cantidad: 5 },
          { insumo_id: insumosInsertados['Servilleta'],          insumo_nombre: 'Servilleta',          cantidad: 1 },
        ]
      },
      {
        producto_id: prodMap['Chelada Picante'],
        producto_nombre: 'Chelada Picante',
        ingredientes: [
          { insumo_id: insumosInsertados['Vaso Mediano (16oz)'], insumo_nombre: 'Vaso Mediano (16oz)', cantidad: 1 },
          { insumo_id: insumosInsertados['Pitillo grueso'],       insumo_nombre: 'Pitillo grueso',      cantidad: 1 },
          { insumo_id: insumosInsertados['Cerveza 330ml'],        insumo_nombre: 'Cerveza 330ml',       cantidad: 1 },
          { insumo_id: insumosInsertados['Limón'],               insumo_nombre: 'Limón',               cantidad: 1 },
          { insumo_id: insumosInsertados['Chamoy'],              insumo_nombre: 'Chamoy',              cantidad: 20 },
          { insumo_id: insumosInsertados['Chile en polvo'],      insumo_nombre: 'Chile en polvo',      cantidad: 5 },
          { insumo_id: insumosInsertados['Servilleta'],          insumo_nombre: 'Servilleta',          cantidad: 1 },
        ]
      },
      {
        producto_id: prodMap['Chelada Mango'],
        producto_nombre: 'Chelada Mango',
        ingredientes: [
          { insumo_id: insumosInsertados['Vaso Grande (32oz)'],  insumo_nombre: 'Vaso Grande (32oz)',  cantidad: 1 },
          { insumo_id: insumosInsertados['Pitillo grueso'],       insumo_nombre: 'Pitillo grueso',      cantidad: 1 },
          { insumo_id: insumosInsertados['Cerveza 330ml'],        insumo_nombre: 'Cerveza 330ml',       cantidad: 1 },
          { insumo_id: insumosInsertados['Mango en cubos'],      insumo_nombre: 'Mango en cubos',      cantidad: 80 },
          { insumo_id: insumosInsertados['Chamoy'],              insumo_nombre: 'Chamoy',              cantidad: 15 },
          { insumo_id: insumosInsertados['Chile en polvo'],      insumo_nombre: 'Chile en polvo',      cantidad: 3 },
          { insumo_id: insumosInsertados['Servilleta'],          insumo_nombre: 'Servilleta',          cantidad: 1 },
        ]
      },
    ]
    for (const r of recetasSeed) {
      if (r.producto_id) await db.recetas.insert({ ...r, creado_en: new Date().toISOString() })
    }
    console.log('✅ Insumos y recetas de ejemplo creados')
  }
}

seed().catch(console.error)
