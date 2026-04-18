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
      // Canada Dry 22oz
      { nombre: 'Frutos Amarillos',        categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🍍', descripcion: 'Michelado al gusto, nectar, hielo, deliciosos pedacitos de pina, mango.' },
      { nombre: 'Sandia Hierbabuena',      categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🍉', descripcion: 'Michelado al gusto, nectar, hielo, jugosos pedacitos de sandia, hierbabuena.' },
      { nombre: 'Pepino Limon Hierbabuena',categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🥒', descripcion: 'Michelado al gusto, nectar, hielo, rodajas de pepino, zumo de limon, hierbabuena.' },
      { nombre: 'Frutos Verdes',           categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🍏', descripcion: 'Michelado al gusto, nectar, hielo, manzana verde, pera y mango.' },
      { nombre: 'Fresa Mandarina',         categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🍓', descripcion: 'Michelado al gusto, nectar, hielo, fresas, pedacitos de mandarina.' },
      { nombre: 'Cereza Limon',            categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🍒', descripcion: 'Michelado al gusto, nectar, zumo de limon, hielo, cerezas, hierbabuena.' },
      { nombre: 'Maracuya',                categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🌟', descripcion: 'Michelado al gusto, nectar, hielo, jugosos pedacitos de maracuya.' },
      { nombre: 'Mango Biche',             categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🥭', descripcion: 'Michelado al gusto, nectar, hielo, acidos pedacitos de mango.' },
      { nombre: 'Coco',                    categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🥥', descripcion: 'Michelado al gusto, nectar, hielo, deliciosos pedacitos de coco.' },
      { nombre: 'Lulo',                    categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🍊', descripcion: 'Michelado al gusto, nectar, hielo, citricos pedacitos de lulo.' },
      { nombre: 'Tamarindo',               categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🌰', descripcion: 'Michelado al gusto, nectar, hielo, citricos pedacitos de tamarindo.' },
      { nombre: 'Limon Hierbabuena',       categoria: 'Canada Dry 22oz', precio: 8000, costo: 3500, emoji: '🍋', descripcion: 'Michelado al gusto, limon, hielo, pedacitos de limon, hierbabuena.' },
      { nombre: 'Frutos Rojos',            categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, emoji: '🫐', descripcion: 'Michelado al gusto, nectar, hielo, mezcla de uvas, fresas y moras.' },
      // Canada Dry 16oz
      { nombre: 'Frutas 16oz',             categoria: 'Canada Dry 16oz', precio: 8000, costo: 3500, emoji: '🍹', descripcion: 'Enjoy Cheladas con Canada Dry 16 onzas, frutas al gusto.' },
      // Hatsu 22oz
      { nombre: 'Frutas Hatsu 22oz',       categoria: 'Hatsu 22oz',      precio: 10000, costo: 5000, emoji: '🧃', descripcion: 'Enjoy Cheladas con Hatsu 22 onzas, frutas al gusto.' },
      // Hatsu 16oz
      { nombre: 'Frutas Hatsu 16oz',       categoria: 'Hatsu 16oz',      precio: 9000, costo: 4500, emoji: '🧃', descripcion: 'Enjoy Cheladas con Hatsu 16 onzas, frutas al gusto.' },
      // Smirnoff 16oz
      { nombre: 'Frutas Smirnoff 16oz',    categoria: 'Smirnoff 16oz',   precio: 14000, costo: 7000, emoji: '🍸', descripcion: 'Enjoy Cheladas con Smirnoff 16 onzas, frutas al gusto.' },
      // Adiciones
      { nombre: 'Adicion Fruta',           categoria: 'Adiciones',       precio: 1500, costo: 500,  emoji: '🍑', descripcion: 'Adicion de fruta extra a tu chelada.' },
      { nombre: 'Adicion Gomitas',         categoria: 'Adiciones',       precio: 1200, costo: 400,  emoji: '🍬', descripcion: 'Adicion de gomitas a tu chelada.' },
      { nombre: 'Frutos Rojos Extra',      categoria: 'Adiciones',       precio: 1800, costo: 600,  emoji: '🍓', descripcion: 'Adicion de frutos rojos extra.' },
      { nombre: 'Frutos Verdes Extra',     categoria: 'Adiciones',       precio: 1800, costo: 600,  emoji: '🍏', descripcion: 'Adicion de frutos verdes extra.' },
      { nombre: 'Perlas Explosivas',       categoria: 'Adiciones',       precio: 2000, costo: 700,  emoji: '✨', descripcion: 'Adicion de perlas explosivas a tu chelada.' },
    ]
    for (const p of productos) {
      await db.productos.insert({ ...p, stock: 100, stock_minimo: 5, unidad: 'unidad', iva_pct: 0, activo: true, codigo: `EC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,5).toUpperCase()}`, creado_en: new Date().toISOString() })
    }
    console.log('✅ Productos de la carta cargados:', productos.length)

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
    for (const ins of insumosSeed) {
      await db.insumos.insert({ ...ins, creado_en: new Date().toISOString() })
    }
    console.log('✅ Insumos creados:', insumosSeed.length)
  }
}

seed().catch(console.error)
