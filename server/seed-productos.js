/**
 * Seed de productos Enjoy Cheladas según carta oficial
 * Ejecutar: node seed-productos.js
 */
import Datastore from 'nedb-promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = join(__dirname, 'data')
const db = {
  productos: Datastore.create({ filename: join(dir, 'productos.db'), autoload: true })
}

const PRODUCTOS = [
  // ── CHELADAS BASE (Canada Dry 22oz) ──────────────────────────
  { nombre: 'Frutos Amarillos', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosos y dulcecitos pedacitos de piña, mango.', emoji: '🍍', stock: 50, stock_minimo: 5 },
  { nombre: 'Sandía Hierbabuena', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, jugosos y dulcecitos pedacitos de sandía, hierbabuena.', emoji: '🍉', stock: 50, stock_minimo: 5 },
  { nombre: 'Pepino Limón Hierbabuena', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, saludables rodajas de pepino, zumo de limón, hierbabuena.', emoji: '🥒', stock: 50, stock_minimo: 5 },
  { nombre: 'Frutos Verdes', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosos y saludables pedacitos de manzana verde, pera y mango.', emoji: '🍏', stock: 50, stock_minimo: 5 },
  { nombre: 'Fresa Mandarina', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosas fresas, pedacitos de mandarina.', emoji: '🍓', stock: 50, stock_minimo: 5 },
  { nombre: 'Cereza Limón', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, zumo de limón, hielo, deliciosas y dulcecitas cerezas, pedacitos de limón, hierbabuena.', emoji: '🍒', stock: 50, stock_minimo: 5 },
  { nombre: 'Maracuyá', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosos y jugosos pedacitos de maracuyá.', emoji: '🌟', stock: 50, stock_minimo: 5 },
  { nombre: 'Mango Biche', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosos y ácidos pedacitos de mango.', emoji: '🥭', stock: 50, stock_minimo: 5 },
  { nombre: 'Coco', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosos pedacitos de coco.', emoji: '🥥', stock: 50, stock_minimo: 5 },
  { nombre: 'Lulo', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosos y cítricos pedacitos de lulo.', emoji: '🍊', stock: 50, stock_minimo: 5 },
  { nombre: 'Tamarindo', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosos y cítricos pedacitos de tamarindo.', emoji: '🌰', stock: 50, stock_minimo: 5 },
  { nombre: 'Limón Hierbabuena', categoria: 'Canada Dry 22oz', precio: 8000, costo: 3500, descripcion: 'Michelado al gusto, limón, hielo, jugosos y deliciosos pedacitos de limón, hierbabuena.', emoji: '🍋', stock: 50, stock_minimo: 5 },
  { nombre: 'Frutos Rojos', categoria: 'Canada Dry 22oz', precio: 9000, costo: 4000, descripcion: 'Michelado al gusto, néctar, hielo, deliciosa mezcla y extracto de uvas, fresas y moras.', emoji: '🫐', stock: 50, stock_minimo: 5 },

  // ── CANADA DRY 16oz ──────────────────────────────────────────
  { nombre: 'Frutas 16oz', categoria: 'Canada Dry 16oz', precio: 8000, costo: 3500, descripcion: 'Enjoy Cheladas con Canada Dry 16 onzas, frutas al gusto.', emoji: '🍹', stock: 50, stock_minimo: 5 },

  // ── HATSU 22oz ───────────────────────────────────────────────
  { nombre: 'Frutas Hatsu 22oz', categoria: 'Hatsu 22oz', precio: 10000, costo: 5000, descripcion: 'Enjoy Cheladas con Hatsu 22 onzas, frutas al gusto.', emoji: '🧃', stock: 50, stock_minimo: 5 },

  // ── HATSU 16oz ───────────────────────────────────────────────
  { nombre: 'Frutas Hatsu 16oz', categoria: 'Hatsu 16oz', precio: 9000, costo: 4500, descripcion: 'Enjoy Cheladas con Hatsu 16 onzas, frutas al gusto.', emoji: '🧃', stock: 50, stock_minimo: 5 },

  // ── SMIRNOFF 16oz ────────────────────────────────────────────
  { nombre: 'Frutas Smirnoff 16oz', categoria: 'Smirnoff 16oz', precio: 14000, costo: 7000, descripcion: 'Enjoy Cheladas con Smirnoff 16 onzas, frutas al gusto.', emoji: '🍸', stock: 50, stock_minimo: 5 },

  // ── ADICIONES ────────────────────────────────────────────────
  { nombre: 'Adición Fruta', categoria: 'Adiciones', precio: 1500, costo: 500, descripcion: 'Adición de fruta extra a tu chelada.', emoji: '🍑', stock: 100, stock_minimo: 10 },
  { nombre: 'Adición Gomitas', categoria: 'Adiciones', precio: 1200, costo: 400, descripcion: 'Adición de gomitas a tu chelada.', emoji: '🍬', stock: 100, stock_minimo: 10 },
  { nombre: 'Frutos Rojos Extra', categoria: 'Adiciones', precio: 1800, costo: 600, descripcion: 'Adición de frutos rojos extra.', emoji: '🍓', stock: 100, stock_minimo: 10 },
  { nombre: 'Frutos Verdes Extra', categoria: 'Adiciones', precio: 1800, costo: 600, descripcion: 'Adición de frutos verdes extra.', emoji: '🍏', stock: 100, stock_minimo: 10 },
  { nombre: 'Perlas Explosivas', categoria: 'Adiciones', precio: 2000, costo: 700, descripcion: 'Adición de perlas explosivas a tu chelada.', emoji: '✨', stock: 100, stock_minimo: 10 },
]

async function seed() {
  console.log('🌱 Iniciando seed de productos Enjoy Cheladas...')
  let creados = 0
  let omitidos = 0

  for (const p of PRODUCTOS) {
    const existe = await db.productos.findOne({ nombre: p.nombre })
    if (existe) {
      console.log(`  ⏭  Ya existe: ${p.nombre}`)
      omitidos++
      continue
    }
    await db.productos.insert({
      ...p,
      unidad: 'unidad',
      iva_pct: 0,
      activo: true,
      codigo: `EC-${Date.now().toString(36).toUpperCase()}`,
      creado_en: new Date().toISOString(),
    })
    console.log(`  ✅ Creado: ${p.nombre} — $${p.precio.toLocaleString('es-CO')}`)
    creados++
  }

  console.log(`\n🍺 Seed completado: ${creados} creados, ${omitidos} omitidos`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
