import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db.js'

const app = express()
const PORT = 3001
const JWT_SECRET = 'enjoy_cheladas_secret_2024'

app.use(cors())
app.use(express.json())

// ── HELPERS ──────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString()
const todayStr = () => new Date().toISOString().slice(0, 10)

const genFolio = () => {
  const d = todayStr().replace(/-/g, '')
  const r = Math.floor(Math.random() * 9000) + 1000
  return `EC-${d}-${r}`
}

// ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Sin token' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Token inválido' }) }
}

const adminOnly = (req, res, next) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' })
  next()
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usuario, password } = req.body
    const user = await db.usuarios.findOne({ usuario, activo: true })
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    const token = jwt.sign({ id: user._id, nombre: user.nombre, usuario: user.usuario, rol: user.rol }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ token, user: { id: user._id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── USUARIOS ─────────────────────────────────────────────────────────────────
app.get('/api/usuarios', auth, adminOnly, async (req, res) => {
  const rows = await db.usuarios.find({}).sort({ creado_en: 1 })
  res.json(rows.map(u => ({ id: u._id, nombre: u.nombre, usuario: u.usuario, rol: u.rol, activo: u.activo, creado_en: u.creado_en })))
})

app.post('/api/usuarios', auth, adminOnly, async (req, res) => {
  const { nombre, usuario, password, rol } = req.body
  if (!nombre || !usuario || !password) return res.status(400).json({ error: 'Faltan campos' })
  try {
    const hash = bcrypt.hashSync(password, 10)
    const doc = await db.usuarios.insert({ nombre, usuario, password: hash, rol: rol || 'cajero', activo: true, creado_en: now() })
    res.json({ id: doc._id, nombre, usuario, rol: rol || 'cajero' })
  } catch { res.status(400).json({ error: 'Usuario ya existe' }) }
})

app.put('/api/usuarios/:id', auth, adminOnly, async (req, res) => {
  const { nombre, rol, activo, password } = req.body
  const upd = { nombre, rol, activo }
  if (password) upd.password = bcrypt.hashSync(password, 10)
  await db.usuarios.update({ _id: req.params.id }, { $set: upd })
  res.json({ ok: true })
})

app.delete('/api/usuarios/:id', auth, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte' })
  await db.usuarios.update({ _id: req.params.id }, { $set: { activo: false } })
  res.json({ ok: true })
})

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────
app.get('/api/productos', auth, async (req, res) => {
  const rows = await db.productos.find({ activo: true }).sort({ categoria: 1, nombre: 1 })
  res.json(rows.map(p => ({ ...p, id: p._id })))
})

app.post('/api/productos', auth, adminOnly, async (req, res) => {
  const { nombre, categoria, precio, costo, stock, stock_minimo, unidad } = req.body
  const doc = await db.productos.insert({ nombre, categoria, precio: +precio, costo: +(costo||0), stock: +(stock||0), stock_minimo: +(stock_minimo||5), unidad: unidad||'unidad', activo: true, creado_en: now() })
  res.json({ id: doc._id })
})

app.put('/api/productos/:id', auth, adminOnly, async (req, res) => {
  const { nombre, categoria, precio, costo, stock, stock_minimo, unidad, activo } = req.body
  await db.productos.update({ _id: req.params.id }, { $set: { nombre, categoria, precio: +precio, costo: +costo, stock: +stock, stock_minimo: +stock_minimo, unidad, activo: activo ?? true } })
  res.json({ ok: true })
})

app.patch('/api/productos/:id/stock', auth, adminOnly, async (req, res) => {
  const { cantidad, tipo } = req.body
  const prod = await db.productos.findOne({ _id: req.params.id })
  if (!prod) return res.status(404).json({ error: 'No encontrado' })
  let nuevoStock = prod.stock
  if (tipo === 'entrada') nuevoStock += +cantidad
  else if (tipo === 'salida') nuevoStock -= +cantidad
  else nuevoStock = +cantidad
  await db.productos.update({ _id: req.params.id }, { $set: { stock: nuevoStock } })
  res.json({ stock: nuevoStock })
})

app.delete('/api/productos/:id', auth, adminOnly, async (req, res) => {
  await db.productos.update({ _id: req.params.id }, { $set: { activo: false } })
  res.json({ ok: true })
})

// ── VENTAS ────────────────────────────────────────────────────────────────────
app.get('/api/ventas', auth, async (req, res) => {
  const { desde, hasta, limit = 100 } = req.query
  let query = { estado: { $ne: null } }
  const ventas = await db.ventas.find(query).sort({ creado_en: -1 }).limit(+limit)
  // Filtrar por fecha si aplica
  let result = ventas
  if (desde) result = result.filter(v => v.creado_en.slice(0, 10) >= desde)
  if (hasta) result = result.filter(v => v.creado_en.slice(0, 10) <= hasta)
  res.json(result.map(v => ({ ...v, id: v._id })))
})

app.get('/api/ventas/:id', auth, async (req, res) => {
  const venta = await db.ventas.findOne({ _id: req.params.id })
  if (!venta) return res.status(404).json({ error: 'No encontrada' })
  const items = await db.ventaItems.find({ venta_id: req.params.id })
  res.json({ ...venta, id: venta._id, items })
})

app.post('/api/ventas', auth, async (req, res) => {
  const { items, metodo_pago, monto_recibido, descuento = 0, notas } = req.body
  if (!items?.length) return res.status(400).json({ error: 'Sin productos' })
  const subtotal = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0)
  const total = subtotal - descuento
  const cambio = metodo_pago === 'efectivo' ? (monto_recibido || 0) - total : 0
  const folio = genFolio()
  try {
    const venta = await db.ventas.insert({
      folio, usuario_id: req.user.id, cajero: req.user.nombre,
      subtotal, descuento, total, metodo_pago,
      monto_recibido: monto_recibido || total, cambio,
      estado: 'completada', notas: notas || null, creado_en: now()
    })
    for (const item of items) {
      await db.ventaItems.insert({ venta_id: venta._id, ...item, subtotal: item.precio_unitario * item.cantidad })
      await db.productos.update({ _id: item.producto_id }, { $inc: { stock: -item.cantidad } })
    }
    await db.movimientos.insert({ tipo: 'ingreso', concepto: `Venta ${folio}`, monto: total, usuario_id: req.user.id, usuario: req.user.nombre, referencia_id: venta._id, creado_en: now() })
    res.json({ id: venta._id, folio, total, cambio })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.patch('/api/ventas/:id/cancelar', auth, adminOnly, async (req, res) => {
  const venta = await db.ventas.findOne({ _id: req.params.id })
  if (!venta) return res.status(404).json({ error: 'No encontrada' })
  if (venta.estado === 'cancelada') return res.status(400).json({ error: 'Ya cancelada' })
  await db.ventas.update({ _id: req.params.id }, { $set: { estado: 'cancelada' } })
  const items = await db.ventaItems.find({ venta_id: req.params.id })
  for (const item of items) {
    await db.productos.update({ _id: item.producto_id }, { $inc: { stock: item.cantidad } })
  }
  await db.movimientos.insert({ tipo: 'egreso', concepto: `Cancelación ${venta.folio}`, monto: venta.total, usuario_id: req.user.id, usuario: req.user.nombre, creado_en: now() })
  res.json({ ok: true })
})

// ── CAJA ──────────────────────────────────────────────────────────────────────
app.get('/api/caja/estado', auth, async (req, res) => {
  const caja = await db.caja.findOne({ estado: 'abierta' })
  res.json(caja ? { ...caja, id: caja._id } : null)
})

// Todas las cajas abiertas con info del usuario (para admin)
app.get('/api/caja/activas', auth, adminOnly, async (req, res) => {
  const cajas = await db.caja.find({ estado: 'abierta' }).sort({ abierta_en: -1 })
  // Para cada caja, contar ventas del día
  const hoy = new Date().toISOString().slice(0, 10)
  const result = await Promise.all(cajas.map(async (c) => {
    const ventas = await db.ventas.find({ usuario_id: c.usuario_id, estado: 'completada' })
    const ventasHoy = ventas.filter(v => v.creado_en.slice(0, 10) === hoy)
    const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0)
    return {
      id: c._id,
      usuario: c.usuario,
      usuario_id: c.usuario_id,
      monto_inicial: c.monto_inicial,
      abierta_en: c.abierta_en,
      ventas_hoy: ventasHoy.length,
      total_hoy: totalHoy
    }
  }))
  res.json(result)
})

app.post('/api/caja/abrir', auth, async (req, res) => {
  const abierta = await db.caja.findOne({ estado: 'abierta' })
  if (abierta) return res.status(400).json({ error: 'Caja ya abierta' })
  const doc = await db.caja.insert({ usuario_id: req.user.id, usuario: req.user.nombre, monto_inicial: +(req.body.monto_inicial || 0), estado: 'abierta', abierta_en: now() })
  await db.movimientos.insert({ tipo: 'apertura', concepto: 'Apertura de caja', monto: +(req.body.monto_inicial || 0), usuario_id: req.user.id, usuario: req.user.nombre, creado_en: now() })
  res.json({ id: doc._id })
})

app.post('/api/caja/cerrar', auth, async (req, res) => {
  const caja = await db.caja.findOne({ estado: 'abierta' })
  if (!caja) return res.status(400).json({ error: 'No hay caja abierta' })
  const mf = +(req.body.monto_final || 0)
  await db.caja.update({ _id: caja._id }, { $set: { estado: 'cerrada', monto_final: mf, cerrada_en: now() } })
  await db.movimientos.insert({ tipo: 'cierre', concepto: 'Cierre de caja', monto: mf, usuario_id: req.user.id, usuario: req.user.nombre, creado_en: now() })
  res.json({ ok: true })
})

app.get('/api/caja/movimientos', auth, async (req, res) => {
  const { fecha } = req.query
  let movs = await db.movimientos.find({}).sort({ creado_en: -1 }).limit(200)
  if (fecha) movs = movs.filter(m => m.creado_en.slice(0, 10) === fecha)
  res.json(movs.map(m => ({ ...m, id: m._id })))
})

app.post('/api/caja/movimiento', auth, adminOnly, async (req, res) => {
  const { tipo, concepto, monto } = req.body
  await db.movimientos.insert({ tipo, concepto, monto: +monto, usuario_id: req.user.id, usuario: req.user.nombre, creado_en: now() })
  res.json({ ok: true })
})

// ── REPORTES ──────────────────────────────────────────────────────────────────
app.get('/api/reportes/resumen', auth, async (req, res) => {
  const { desde, hasta } = req.query
  const d = desde || todayStr()
  const h = hasta || d

  const todasVentas = await db.ventas.find({ estado: 'completada' })
  const ventasFiltradas = todasVentas.filter(v => v.creado_en.slice(0, 10) >= d && v.creado_en.slice(0, 10) <= h)

  const total_ventas = ventasFiltradas.length
  const ingresos = ventasFiltradas.reduce((s, v) => s + v.total, 0)
  const ticket_promedio = total_ventas > 0 ? ingresos / total_ventas : 0

  // Por método de pago
  const metodoMap = {}
  for (const v of ventasFiltradas) {
    if (!metodoMap[v.metodo_pago]) metodoMap[v.metodo_pago] = { metodo_pago: v.metodo_pago, cantidad: 0, monto: 0 }
    metodoMap[v.metodo_pago].cantidad++
    metodoMap[v.metodo_pago].monto += v.total
  }

  // Top productos
  const ventaIds = ventasFiltradas.map(v => v._id)
  const itemsFiltrados = ventaIds.length > 0 ? await db.ventaItems.find({ venta_id: { $in: ventaIds } }) : []
  const prodMap = {}
  for (const i of itemsFiltrados) {
    if (!prodMap[i.nombre_producto]) prodMap[i.nombre_producto] = { nombre_producto: i.nombre_producto, cantidad: 0, total: 0 }
    prodMap[i.nombre_producto].cantidad += i.cantidad
    prodMap[i.nombre_producto].total += i.subtotal
  }
  const topProductos = Object.values(prodMap).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10)

  // Por hora
  const horaMap = {}
  for (const v of ventasFiltradas) {
    const hora = v.creado_en.slice(11, 13)
    if (!horaMap[hora]) horaMap[hora] = { hora, ventas: 0, total: 0 }
    horaMap[hora].ventas++
    horaMap[hora].total += v.total
  }
  const porHora = Object.values(horaMap).sort((a, b) => a.hora.localeCompare(b.hora))

  // Stock bajo
  const stockBajo = await db.productos.find({ activo: true })
  const stockBajoFiltrado = stockBajo.filter(p => p.stock <= p.stock_minimo).map(p => ({ ...p, id: p._id }))

  res.json({
    ventas: { total_ventas, ingresos, ticket_promedio },
    porMetodo: Object.values(metodoMap),
    topProductos,
    porHora,
    stockBajo: stockBajoFiltrado
  })
})

app.get('/api/reportes/ventas-csv', auth, adminOnly, async (req, res) => {
  const { desde, hasta } = req.query
  const d = desde || todayStr()
  const h = hasta || d
  const ventas = await db.ventas.find({}).sort({ creado_en: 1 })
  const filtradas = ventas.filter(v => v.creado_en.slice(0, 10) >= d && v.creado_en.slice(0, 10) <= h)

  const header = 'Folio,Fecha,Cajero,Subtotal,Descuento,Total,Método Pago,Estado\n'
  const rows = filtradas.map(v =>
    `${v.folio},${v.creado_en},${v.cajero || ''},${v.subtotal},${v.descuento},${v.total},${v.metodo_pago},${v.estado}`
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="ventas_${d}_${h}.csv"`)
  res.send('\uFEFF' + header + rows)
})

app.listen(PORT, () => console.log(`🍺 Enjoy Cheladas POS → http://localhost:${PORT}`))
