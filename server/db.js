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
  }
}

seed().catch(console.error)
