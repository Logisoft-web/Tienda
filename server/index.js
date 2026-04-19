import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db.js'

// ── ENV ───────────────────────────────────────────────────────────────────────
// Cargar .env si existe (sin depender de dotenv en producción)
try {
  const { readFileSync } = await import('fs')
  const { fileURLToPath } = await import('url')
  const { dirname, join } = await import('path')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const envPath = join(__dir, '.env')
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && !key.startsWith('#') && vals.length) {
      process.env[key.trim()] = vals.join('=').trim()
    }
  }
} catch { /* .env opcional */ }

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'enjoy_cheladas_dev_secret_change_in_production'

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET no definido en .env — usando secreto de desarrollo. NO usar en producción.')
}

// ── SEGURIDAD ─────────────────────────────────────────────────────────────────
// Eliminar header X-Powered-By
app.disable('x-powered-by')

// Headers de seguridad mínimos sin helmet
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

// CORS: solo orígenes permitidos
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173').split(',')
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error('CORS bloqueado: origen no permitido'))
  },
  credentials: true
}))

app.use(express.json({ limit: '1mb' }))

// ── RATE LIMITING (sin dependencias externas) ─────────────────────────────────
const loginAttempts = new Map()
const rateLimit = (max, windowMs) => (req, res, next) => {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const entry = loginAttempts.get(key) || { count: 0, reset: now + windowMs }
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs }
  entry.count++
  loginAttempts.set(key, entry)
  if (entry.count > max) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' })
  }
  next()
}
// Limpiar entradas viejas cada 10 minutos
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of loginAttempts) { if (now > v.reset) loginAttempts.delete(k) }
}, 10 * 60 * 1000)

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
app.post('/api/auth/login', rateLimit(10, 5 * 60 * 1000), async (req, res) => {
  try {
    const { usuario, password } = req.body
    if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    const user = await db.usuarios.findOne({ usuario: String(usuario).trim(), activo: true })
    if (!user || !bcrypt.compareSync(String(password), user.password))
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    const token = jwt.sign({ id: user._id, nombre: user.nombre, usuario: user.usuario, rol: user.rol }, JWT_SECRET, { expiresIn: '12h' })

    // Calcular días de gracia si el plan expiró
    let planGracia = null
    if (user.plan_expira) {
      const diasVencido = Math.floor((new Date() - new Date(user.plan_expira)) / (1000 * 60 * 60 * 24))
      if (diasVencido > 0 && diasVencido <= 5) planGracia = 5 - diasVencido
    }

    // Registrar sesión con IP y User-Agent
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'desconocida'
    const ua = req.headers['user-agent'] || 'desconocido'
    await db.sesiones.insert({
      usuario_id: user._id, usuario: user.usuario, nombre: user.nombre, rol: user.rol,
      ip, user_agent: ua, creado_en: now()
    })
    // Conservar solo los últimos 200 registros
    const total = await db.sesiones.count({})
    if (total > 200) {
      const viejas = await db.sesiones.find({}).sort({ creado_en: 1 }).limit(total - 200)
      for (const v of viejas) await db.sesiones.remove({ _id: v._id }, {})
    }

    res.json({ token, planGracia, user: { id: user._id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } })
  } catch (e) { res.status(500).json({ error: 'Error interno del servidor' }) }
})

// ── USUARIOS ─────────────────────────────────────────────────────────────────
const adminOrSuper = (req, res, next) => {
  if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin') return res.status(403).json({ error: 'Solo administradores' })
  next()
}

app.get('/api/usuarios', auth, adminOrSuper, async (req, res) => {
  const rows = await db.usuarios.find({}).sort({ creado_en: 1 })
  const todos = rows.map(u => ({ id: u._id, nombre: u.nombre, usuario: u.usuario, rol: u.rol, activo: u.activo, creado_en: u.creado_en }))
  // Admin solo ve cajeros — no ve otros admins ni superadmin
  if (req.user.rol === 'admin') {
    return res.json(todos.filter(u => u.rol === 'cajero' || u.id === req.user.id))
  }
  res.json(todos)
})

app.post('/api/usuarios', auth, adminOrSuper, async (req, res) => {
  const { nombre, usuario, password, rol } = req.body
  if (!nombre?.trim() || !usuario?.trim() || !password) return res.status(400).json({ error: 'Faltan campos requeridos' })
  if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínima 6 caracteres' })
  // Admin solo puede crear cajeros
  const rolFinal = req.user.rol === 'admin' ? 'cajero' : (rol || 'cajero')
  if (!['admin', 'cajero'].includes(rolFinal)) return res.status(400).json({ error: 'Rol inválido' })
  try {
    const hash = bcrypt.hashSync(password, 10)
    const doc = await db.usuarios.insert({ nombre: nombre.trim(), usuario: usuario.trim().toLowerCase(), password: hash, rol: rolFinal, activo: true, creado_en: now() })
    res.json({ id: doc._id, nombre: nombre.trim(), usuario: usuario.trim().toLowerCase(), rol: rolFinal })
  } catch { res.status(400).json({ error: 'El nombre de usuario ya existe' }) }
})

app.put('/api/usuarios/:id', auth, adminOrSuper, async (req, res) => {
  const { nombre, rol, activo, password } = req.body
  const upd = { nombre, rol, activo }
  if (password) upd.password = bcrypt.hashSync(password, 10)
  await db.usuarios.update({ _id: req.params.id }, { $set: upd })
  res.json({ ok: true })
})

app.delete('/api/usuarios/:id', auth, adminOrSuper, async (req, res) => {
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
  const { nombre, categoria, precio, costo, stock, stock_minimo, unidad, codigo, codigo_barras, proveedor, iva_pct, descripcion, imagen, tipo, porcion_venta, fecha_vencimiento, sabores_enlazados, bebidas_enlazadas, adiciones_enlazadas, bordes_enlazados } = req.body
  if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' })
  // precio de venta se define en el configurador de ventas, no es requerido en inventario
  const doc = await db.productos.insert({
    nombre: nombre.trim(),
    categoria: (categoria || '').trim(),
    precio: +precio,
    costo: +(costo||0),
    stock: +(stock||0),
    stock_minimo: +(stock_minimo||5),
    unidad: unidad||'unidad',
    tipo: tipo||'bebida',
    porcion_venta: +(porcion_venta||100),
    codigo: (codigo||'').trim(),
    codigo_barras: (codigo_barras||'').trim(),
    proveedor: (proveedor||'').trim(),
    iva_pct: +(iva_pct||0),
    descripcion: (descripcion||'').trim(),
    imagen: imagen||null,
    fecha_vencimiento: fecha_vencimiento||null,
    sabores_enlazados: sabores_enlazados||[],
    bebidas_enlazadas: bebidas_enlazadas||[],
    adiciones_enlazadas: adiciones_enlazadas||[],
    bordes_enlazados: bordes_enlazados||[],
    activo: true,
    creado_en: now()
  })
  res.json({ id: doc._id })
})
app.put('/api/productos/:id', auth, adminOnly, async (req, res) => {
  const { nombre, categoria, precio, costo, stock, stock_minimo, unidad, activo, codigo, codigo_barras, proveedor, iva_pct, descripcion, imagen, tipo, porcion_venta, fecha_vencimiento, sabores_enlazados, bebidas_enlazadas, adiciones_enlazadas, bordes_enlazados } = req.body
  await db.productos.update({ _id: req.params.id }, { $set: {
    nombre, categoria, precio: +precio, costo: +costo, stock: +stock, stock_minimo: +stock_minimo, unidad,
    tipo: tipo||'bebida', porcion_venta: +(porcion_venta||100),
    codigo: codigo||'', codigo_barras: codigo_barras||'', proveedor: proveedor||'',
    iva_pct: +(iva_pct||0), descripcion: descripcion||'', imagen: imagen||null,
    fecha_vencimiento: fecha_vencimiento||null,
    sabores_enlazados: sabores_enlazados||[],
    bebidas_enlazadas: bebidas_enlazadas||[],
    adiciones_enlazadas: adiciones_enlazadas||[],
    bordes_enlazados: bordes_enlazados||[],
    activo: activo ?? true
  }})
  res.json({ ok: true })
})

app.patch('/api/productos/:id/stock', auth, adminOnly, async (req, res) => {
  const { cantidad, tipo, costo_unitario, costo_total } = req.body
  const prod = await db.productos.findOne({ _id: req.params.id })
  if (!prod) return res.status(404).json({ error: 'No encontrado' })
  let nuevoStock = prod.stock
  if (tipo === 'entrada') nuevoStock += +cantidad
  else if (tipo === 'salida') nuevoStock -= +cantidad
  else nuevoStock = +cantidad

  // Calcular costo unitario: si viene costo_total lo dividimos entre cantidad
  // Si viene costo_unitario directo lo usamos, si no, mantenemos el actual
  let nuevoCostoUnitario = prod.costo
  if (costo_total && +costo_total > 0 && +cantidad > 0) {
    nuevoCostoUnitario = +costo_total / +cantidad
  } else if (costo_unitario && +costo_unitario > 0) {
    nuevoCostoUnitario = +costo_unitario
  }

  const updateData = { stock: nuevoStock }
  if (nuevoCostoUnitario !== prod.costo) updateData.costo = nuevoCostoUnitario

  await db.productos.update({ _id: req.params.id }, { $set: updateData })

  // Registrar compra si es entrada
  if (tipo === 'entrada' && +cantidad > 0) {
    const costoTotalFinal = costo_total ? +costo_total : nuevoCostoUnitario * +cantidad
    await db.compras.insert({
      producto_id: prod._id,
      producto_nombre: prod.nombre,
      producto_tipo: prod.tipo,
      cantidad: +cantidad,
      costo_unitario: nuevoCostoUnitario,
      costo_total: costoTotalFinal,
      unidad: prod.unidad || 'unidad',
      creado_en: now(),
      mes: now().slice(0, 7),
    })
  }

  res.json({ stock: nuevoStock, costo: nuevoCostoUnitario })
})

app.delete('/api/productos/:id', auth, adminOnly, async (req, res) => {
  await db.productos.update({ _id: req.params.id }, { $set: { activo: false } })
  res.json({ ok: true })
})

// ── INSUMOS ───────────────────────────────────────────────────────────────────
app.get('/api/insumos', auth, async (req, res) => {
  const rows = await db.insumos.find({ activo: true }).sort({ nombre: 1 })
  res.json(rows.map(i => ({ ...i, id: i._id })))
})

app.post('/api/insumos', auth, adminOnly, async (req, res) => {
  const { nombre, unidad, stock, stock_minimo } = req.body
  const doc = await db.insumos.insert({ nombre, unidad: unidad || 'pieza', stock: +(stock || 0), stock_minimo: +(stock_minimo || 10), activo: true, creado_en: now() })
  res.json({ id: doc._id })
})

app.put('/api/insumos/:id', auth, adminOnly, async (req, res) => {
  const { nombre, unidad, stock, stock_minimo, activo } = req.body
  await db.insumos.update({ _id: req.params.id }, { $set: { nombre, unidad, stock: +stock, stock_minimo: +stock_minimo, activo: activo ?? true } })
  res.json({ ok: true })
})

app.patch('/api/insumos/:id/stock', auth, adminOnly, async (req, res) => {
  const { cantidad, tipo } = req.body
  const ins = await db.insumos.findOne({ _id: req.params.id })
  if (!ins) return res.status(404).json({ error: 'No encontrado' })
  let nuevoStock = ins.stock
  if (tipo === 'entrada') nuevoStock += +cantidad
  else if (tipo === 'salida') nuevoStock -= +cantidad
  else nuevoStock = +cantidad
  await db.insumos.update({ _id: req.params.id }, { $set: { stock: nuevoStock } })
  res.json({ stock: nuevoStock })
})

app.delete('/api/insumos/:id', auth, adminOnly, async (req, res) => {
  await db.insumos.update({ _id: req.params.id }, { $set: { activo: false } })
  res.json({ ok: true })
})

// ── RECETAS ───────────────────────────────────────────────────────────────────
app.get('/api/recetas', auth, async (req, res) => {
  const rows = await db.recetas.find({})
  res.json(rows.map(r => ({ ...r, id: r._id })))
})

app.get('/api/recetas/:producto_id', auth, async (req, res) => {
  const receta = await db.recetas.findOne({ producto_id: req.params.producto_id })
  res.json(receta ? { ...receta, id: receta._id } : null)
})

app.post('/api/recetas', auth, adminOnly, async (req, res) => {
  const { producto_id, producto_nombre, ingredientes } = req.body
  // Upsert: si ya existe receta para ese producto, actualizar
  const existe = await db.recetas.findOne({ producto_id })
  if (existe) {
    await db.recetas.update({ producto_id }, { $set: { producto_nombre, ingredientes, actualizado_en: now() } })
    res.json({ id: existe._id })
  } else {
    const doc = await db.recetas.insert({ producto_id, producto_nombre, ingredientes, creado_en: now() })
    res.json({ id: doc._id })
  }
})

app.delete('/api/recetas/:producto_id', auth, adminOnly, async (req, res) => {
  await db.recetas.remove({ producto_id: req.params.producto_id }, {})
  res.json({ ok: true })
})


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
  const { items, metodo_pago, monto_recibido, descuento = 0, notas,
          cliente_id, pago_mixto, mixto_efectivo, mixto_metodo2, mixto_monto2 } = req.body
  if (!items?.length) return res.status(400).json({ error: 'Sin productos' })

  // Verificar que hay caja abierta para este cajero
  const cajaAbierta = await db.caja.findOne({ estado: 'abierta', usuario_id: req.user.id })
  if (!cajaAbierta) return res.status(403).json({ error: 'Debes abrir la caja antes de realizar ventas' })

  // Calcular subtotal (productos normales + combos)
  let subtotal = 0
  for (const item of items) {
    if (item.es_combo) {
      subtotal += item.precio_unitario * item.cantidad
    } else {
      subtotal += item.precio_unitario * item.cantidad
    }
  }
  const total = subtotal - descuento
  const cambio = metodo_pago === 'efectivo' && !pago_mixto ? (monto_recibido || 0) - total : 0
  const folio = genFolio()

  // Nombre del cliente si aplica
  let cliente_nombre = null
  if (cliente_id) {
    const cli = await db.clientes.findOne({ _id: cliente_id })
    cliente_nombre = cli?.nombre || null
  }

  try {
    // ── Validar stock antes de procesar ──────────────────────────────────────
    for (const item of items) {
      if (item.es_chelada && item.detalle) {
        const { sabor, bebida, adiciones: adics } = item.detalle

        if (sabor?.id) {
          const ingredientes = (await db.productos.find({ activo: true }))
            .filter(p => p.tipo === 'sabor' && Array.isArray(p.sabores_enlazados) && p.sabores_enlazados.includes(sabor.id))
          if (ingredientes.length === 0)
            return res.status(400).json({ error: `No hay ingredientes registrados para el sabor "${sabor.nombre}". Registra la fruta en inventario.` })
          for (const ing of ingredientes) {
            const necesario = (ing.porcion_venta || 100) * item.cantidad
            if (ing.stock < necesario)
              return res.status(400).json({ error: `Sin stock suficiente de "${ing.nombre}" para el sabor ${sabor.nombre}` })
          }
        }

        if (bebida?.id) {
          const vasos = (await db.productos.find({ activo: true }))
            .filter(p => (p.tipo==='bebida'||p.tipo==='objeto') && Array.isArray(p.bebidas_enlazadas) && p.bebidas_enlazadas.includes(bebida.id))
          if (vasos.length === 0)
            return res.status(400).json({ error: `No hay bebidas/vasos registrados para "${bebida.nombre} ${bebida.oz}". Registra la bebida en inventario.` })
          for (const vaso of vasos) {
            if (vaso.stock < item.cantidad)
              return res.status(400).json({ error: `Sin stock suficiente de "${vaso.nombre}" para ${bebida.nombre} ${bebida.oz}` })
          }
        }

        if (adics?.length) {
          for (const adicion of adics) {
            const ings = (await db.productos.find({ tipo: 'adicion', activo: true }))
              .filter(p => Array.isArray(p.adiciones_enlazadas) && p.adiciones_enlazadas.includes(adicion.id))
            if (ings.length === 0)
              return res.status(400).json({ error: `No hay ingredientes registrados para la adición "${adicion.nombre}". Registra el ingrediente en inventario.` })
            for (const ing of ings) {
              const necesario = (ing.porcion_venta || 100) * item.cantidad
              if (ing.stock < necesario)
                return res.status(400).json({ error: `Sin stock suficiente de "${ing.nombre}" para la adición ${adicion.nombre}` })
            }
          }
        }
      }
    }

    const venta = await db.ventas.insert({      folio, usuario_id: req.user.id, cajero: req.user.nombre,
      subtotal, descuento, total, metodo_pago,
      monto_recibido: monto_recibido || total, cambio,
      pago_mixto: pago_mixto || false,
      mixto_efectivo: mixto_efectivo || 0,
      mixto_metodo2: mixto_metodo2 || null,
      mixto_monto2: mixto_monto2 || 0,
      cliente_id: cliente_id || null,
      cliente_nombre,
      iva_pct: req.body.iva_pct ?? 0,
      iva_valor: req.body.iva_valor ?? 0,
      base_gravable: req.body.base_gravable ?? total,
      estado: 'completada', notas: notas || null, creado_en: now()
    })
    for (const item of items) {
      // Guardar costo_unitario en el momento de la venta para historial contable preciso
      let costoUnitario = item.costo_unitario || 0
      if (!costoUnitario && item.producto_id) {
        const prodCosto = await db.productos.findOne({ _id: item.producto_id })
        costoUnitario = prodCosto?.costo || 0
      }
      await db.ventaItems.insert({ venta_id: venta._id, ...item, costo_unitario: costoUnitario, subtotal: item.precio_unitario * item.cantidad })
      if (!item.es_combo) {
        // Para cheladas: solo descontar por enlaces, no por producto_id (es un ID virtual)
        if (!item.es_chelada) {
          // Descontar stock del producto normal
          const prod = await db.productos.findOne({ _id: item.producto_id })
          const descStock = prod?.tipo === 'comida'
            ? (prod.porcion_venta || 100) * item.cantidad
            : item.cantidad
          await db.productos.update({ _id: item.producto_id }, { $inc: { stock: -descStock } })
          // Descontar insumos de la receta si existe
          const receta = await db.recetas.findOne({ producto_id: item.producto_id })
          if (receta?.ingredientes?.length) {
            for (const ing of receta.ingredientes) {
              await db.insumos.update({ _id: ing.insumo_id }, { $inc: { stock: -(ing.cantidad * item.cantidad) } })
            }
          }
        }

        // ── Chelada: descontar ingredientes y vasos enlazados ──────────────
        if (item.es_chelada && item.detalle) {
          const { sabor, bebida, adiciones } = item.detalle

          // Descontar frutas/comidas enlazadas al sabor vendido
          if (sabor?.id) {
            const todosIngredientes = await db.productos.find({ activo: true })
            const ingredientes = todosIngredientes.filter(p =>
              p.tipo === 'sabor' &&
              Array.isArray(p.sabores_enlazados) && p.sabores_enlazados.includes(sabor.id)
            )
            for (const ing of ingredientes) {
              const gramos = ing.porcion_venta || 100
              await db.productos.update({ _id: ing._id }, { $inc: { stock: -(gramos * item.cantidad) } })
            }
          }

          // Descontar vasos/objetos enlazados a la bebida vendida (1 unidad por vaso, no por enlace)
          if (bebida?.id) {
            const todosObjetos = await db.productos.find({ activo: true })
            const vasos = todosObjetos.filter(p =>
              (p.tipo === 'objeto' || p.tipo === 'bebida') &&
              Array.isArray(p.bebidas_enlazadas) && p.bebidas_enlazadas.includes(bebida.id)
            )
            // Descontar exactamente 1 unidad por producto enlazado (no por cantidad de enlaces)
            const vasosUnicos = [...new Map(vasos.map(v => [v._id, v])).values()]
            for (const vaso of vasosUnicos) {
              await db.productos.update({ _id: vaso._id }, { $inc: { stock: -item.cantidad } })
            }
          }

          // Descontar ingredientes enlazados a las adiciones seleccionadas
          if (adiciones?.length) {
            const todosIngredientesAd = await db.productos.find({ tipo: 'comida', activo: true })
            for (const adicion of adiciones) {
              const ingredientesAd = todosIngredientesAd.filter(p =>
                Array.isArray(p.adiciones_enlazadas) && p.adiciones_enlazadas.includes(adicion.id)
              )
              for (const ing of ingredientesAd) {
                const gramos = ing.porcion_venta || 100
                await db.productos.update({ _id: ing._id }, { $inc: { stock: -(gramos * item.cantidad) } })
              }
            }
          }
        }
      } else {
        // Combo: descontar cada producto del combo
        const combo = await db.combos.findOne({ _id: item.combo_id })
        if (combo?.items?.length) {
          for (const ci of combo.items) {
            await db.productos.update({ _id: ci.producto_id }, { $inc: { stock: -(ci.cantidad * item.cantidad) } })
          }
        }
      }
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
    const prod = await db.productos.findOne({ _id: item.producto_id })
    const restaurar = prod?.tipo === 'comida'
      ? (prod.porcion_venta || 100) * item.cantidad
      : item.cantidad
    await db.productos.update({ _id: item.producto_id }, { $inc: { stock: restaurar } })
    // Restaurar insumos
    const receta = await db.recetas.findOne({ producto_id: item.producto_id })
    if (receta?.ingredientes?.length) {
      for (const ing of receta.ingredientes) {
        await db.insumos.update({ _id: ing.insumo_id }, { $inc: { stock: ing.cantidad * item.cantidad } })
      }
    }
  }
  await db.movimientos.insert({ tipo: 'egreso', concepto: `Cancelación ${venta.folio}`, monto: venta.total, usuario_id: req.user.id, usuario: req.user.nombre, creado_en: now() })
  res.json({ ok: true })
})

// ── CAJA ──────────────────────────────────────────────────────────────────────
app.get('/api/caja/estado', auth, async (req, res) => {
  const caja = await db.caja.findOne({ estado: 'abierta' })
  if (!caja) return res.json(null)

  // Calcular efectivo real disponible en caja:
  // monto_inicial + todo el efectivo recibido de clientes - cambios ya entregados - egresos manuales
  const hoy = new Date().toISOString().slice(0, 10)
  const ventasEfectivo = await db.ventas.find({ estado: 'completada', metodo_pago: 'efectivo' })
  const ventasHoy = ventasEfectivo.filter(v => v.creado_en >= caja.abierta_en)

  // Lo que entró físicamente a la caja = lo que pagó cada cliente (monto_recibido)
  const totalRecibido = ventasHoy.reduce((s, v) => s + (v.monto_recibido || v.total), 0)
  // Lo que salió de la caja = cambios entregados
  const totalCambios = ventasHoy.reduce((s, v) => s + (v.cambio || 0), 0)

  // Movimientos manuales de caja del día — solo los de esta caja (desde que se abrió)
  const movs = await db.movimientos.find({})
  const movsEstaCaja = movs.filter(m => m.creado_en >= caja.abierta_en)
  const egresosManual = movsEstaCaja.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const ingresosManual = movsEstaCaja.filter(m => m.tipo === 'ingreso_manual').reduce((s, m) => s + m.monto, 0)

  // Efectivo físico en caja = apertura + entradas - salidas
  const efectivo_disponible = caja.monto_inicial + totalRecibido - totalCambios - egresosManual + ingresosManual

  // Ventas totales del día (todos los métodos de pago)
  const todasVentasHoy = await db.ventas.find({ estado: 'completada' })
  const ventasTotalesHoy = todasVentasHoy.filter(v => v.creado_en >= caja.abierta_en)
  const ingresos_ventas_hoy = ventasTotalesHoy.reduce((s, v) => s + v.total, 0)
  const num_ventas_hoy = ventasTotalesHoy.length

  res.json({
    ...caja,
    id: caja._id,
    efectivo_disponible,
    monto_inicial: caja.monto_inicial,
    ventas_efectivo_hoy: totalRecibido,
    cambios_hoy: totalCambios,
    egresos_manual_hoy: egresosManual,
    ingresos_manual_hoy: ingresosManual,
    ingresos_ventas_hoy,
    num_ventas_hoy
  })
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

app.get('/api/caja/ultimo-cierre', auth, async (req, res) => {
  const cajas = await db.caja.find({ estado: 'cerrada' }).sort({ cerrada_en: -1 }).limit(1)
  const ultima = cajas[0]
  res.json({ monto_final: ultima?.monto_final || 0 })
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

  // Top productos — incluye datos de costo para calcular margen
  const ventaIds = ventasFiltradas.map(v => v._id)
  const itemsFiltrados = ventaIds.length > 0 ? await db.ventaItems.find({ venta_id: { $in: ventaIds } }) : []
  const prodMap = {}
  for (const i of itemsFiltrados) {
    if (!prodMap[i.nombre_producto]) prodMap[i.nombre_producto] = { nombre_producto: i.nombre_producto, cantidad: 0, total: 0, costo_total: 0 }
    prodMap[i.nombre_producto].cantidad += i.cantidad
    prodMap[i.nombre_producto].total += i.subtotal
    // Costo del producto para calcular margen
    const prod = await db.productos.findOne({ nombre: i.nombre_producto })
    if (prod) prodMap[i.nombre_producto].costo_total += (prod.costo || 0) * i.cantidad
  }
  const topProductos = Object.values(prodMap)
    .map(p => ({ ...p, margen: p.total > 0 ? ((p.total - p.costo_total) / p.total * 100).toFixed(1) : '0' }))
    .sort((a, b) => b.cantidad - a.cantidad).slice(0, 10)

  // Ganancia bruta total
  const ganancia_bruta = topProductos.reduce((s, p) => s + (p.total - p.costo_total), 0)
  const margen_bruto_pct = ingresos > 0 ? ((ganancia_bruta / ingresos) * 100).toFixed(1) : 0

  // Por hora
  const horaMap = {}
  for (const v of ventasFiltradas) {
    const hora = v.creado_en.slice(11, 13)
    if (!horaMap[hora]) horaMap[hora] = { hora, ventas: 0, total: 0 }
    horaMap[hora].ventas++
    horaMap[hora].total += v.total
  }
  const porHora = Object.values(horaMap).sort((a, b) => a.hora.localeCompare(b.hora))

  // Stock bajo — productos e insumos
  const todosProductos = await db.productos.find({ activo: true })
  const stockBajoFiltrado = todosProductos.filter(p => p.stock <= p.stock_minimo).map(p => ({ ...p, id: p._id, tipo: 'producto' }))
  const todosInsumos = await db.insumos.find({ activo: true })
  const insumosBajos = todosInsumos.filter(i => i.stock <= i.stock_minimo).map(i => ({ ...i, id: i._id, tipo: 'insumo' }))

  res.json({
    ventas: { total_ventas, ingresos, ticket_promedio, ganancia_bruta, margen_bruto_pct: +margen_bruto_pct },
    porMetodo: Object.values(metodoMap),
    topProductos,
    porHora,
    stockBajo: [...stockBajoFiltrado, ...insumosBajos]
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

// ── REPORTE CONTABLE DIAN ─────────────────────────────────────────────────────
app.get('/api/reportes/contable', auth, adminOnly, async (req, res) => {
  const { desde, hasta, formato = 'json' } = req.query
  const d = desde || todayStr()
  const h = hasta || d

  const ventas = await db.ventas.find({ estado: 'completada' })
  const filtradas = ventas.filter(v => v.creado_en.slice(0, 10) >= d && v.creado_en.slice(0, 10) <= h)

  // Para cada venta, obtener sus items
  const ventasDetalle = await Promise.all(filtradas.map(async (v) => {
    const items = await db.ventaItems.find({ venta_id: v._id })
    return { ...v, items }
  }))

  // Totales globales
  const totalBruto     = ventasDetalle.reduce((s, v) => s + v.total, 0)
  const totalDescuentos = ventasDetalle.reduce((s, v) => s + (v.descuento || 0), 0)
  const totalIva       = ventasDetalle.reduce((s, v) => s + (v.iva_valor || 0), 0)
  const baseGravable   = totalBruto - totalIva
  const numVentas      = ventasDetalle.length

  // Por método de pago
  const porMetodo = {}
  for (const v of ventasDetalle) {
    const m = v.metodo_pago || 'efectivo'
    if (!porMetodo[m]) porMetodo[m] = { metodo: m, cantidad: 0, total: 0 }
    porMetodo[m].cantidad++
    porMetodo[m].total += v.total
  }

  // Detalle por producto (para libro de ventas)
  const porProducto = {}
  for (const v of ventasDetalle) {
    for (const item of v.items || []) {
      const key = item.nombre_producto
      if (!porProducto[key]) porProducto[key] = { nombre: key, cantidad: 0, subtotal: 0, iva: 0 }
      porProducto[key].cantidad += item.cantidad
      porProducto[key].subtotal += item.subtotal || (item.precio_unitario * item.cantidad)
      porProducto[key].iva += item.iva_valor || 0
    }
  }

  if (formato === 'csv') {
    // CSV con todo el detalle para el contador
    let csv = '\uFEFF'

    // Hoja 1: Encabezado del período
    csv += `REPORTE CONTABLE - DOCUMENTO EQUIVALENTE POS\n`
    csv += `Período,${d},${h}\n`
    csv += `Total ventas,${numVentas}\n`
    csv += `Base gravable,${baseGravable.toFixed(2)}\n`
    csv += `IVA generado (19%),${totalIva.toFixed(2)}\n`
    csv += `Total ingresos brutos,${totalBruto.toFixed(2)}\n`
    csv += `Total descuentos,${totalDescuentos.toFixed(2)}\n\n`

    // Hoja 2: Detalle de ventas
    csv += `DETALLE DE VENTAS\n`
    csv += `Folio,Fecha,Hora,Cajero,Cliente,NIT Cliente,Método Pago,Base Gravable,IVA 19%,Descuento,Total,Estado\n`
    for (const v of ventasDetalle) {
      const fecha = v.creado_en.slice(0, 10)
      const hora  = v.creado_en.slice(11, 19)
      const base  = v.base_gravable || (v.total - (v.iva_valor || 0))
      const iva   = v.iva_valor || 0
      csv += `${v.folio},${fecha},${hora},${v.cajero || ''},${v.cliente_nombre || 'CONSUMIDOR FINAL'},${v.cliente_nit || '222222222222'},${v.metodo_pago},${base.toFixed(2)},${iva.toFixed(2)},${(v.descuento||0).toFixed(2)},${v.total.toFixed(2)},${v.estado}\n`
    }

    csv += `\nDETALLE DE ITEMS VENDIDOS\n`
    csv += `Folio Venta,Fecha,Producto,Cantidad,Precio Unitario,IVA%,Subtotal\n`
    for (const v of ventasDetalle) {
      for (const item of v.items || []) {
        csv += `${v.folio},${v.creado_en.slice(0,10)},${item.nombre_producto},${item.cantidad},${item.precio_unitario},${item.iva_pct||0},${(item.subtotal||(item.precio_unitario*item.cantidad)).toFixed(2)}\n`
      }
    }

    csv += `\nRESUMEN POR MÉTODO DE PAGO\n`
    csv += `Método,Cantidad Ventas,Total\n`
    for (const m of Object.values(porMetodo)) {
      csv += `${m.metodo},${m.cantidad},${m.total.toFixed(2)}\n`
    }

    csv += `\nRESUMEN POR PRODUCTO\n`
    csv += `Producto,Unidades Vendidas,Subtotal,IVA\n`
    for (const p of Object.values(porProducto).sort((a,b) => b.subtotal - a.subtotal)) {
      csv += `${p.nombre},${p.cantidad},${p.subtotal.toFixed(2)},${p.iva.toFixed(2)}\n`
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="reporte_contable_${d}_${h}.csv"`)
    return res.send(csv)
  }

  res.json({
    periodo: { desde: d, hasta: h },
    resumen: { numVentas, totalBruto, totalDescuentos, totalIva, baseGravable },
    porMetodo: Object.values(porMetodo),
    porProducto: Object.values(porProducto).sort((a,b) => b.subtotal - a.subtotal),
    ventas: ventasDetalle.map(v => ({
      folio: v.folio, fecha: v.creado_en.slice(0,10), hora: v.creado_en.slice(11,19),
      cajero: v.cajero, cliente: v.cliente_nombre || 'CONSUMIDOR FINAL',
      nit_cliente: v.cliente_nit || '222222222222',
      metodo_pago: v.metodo_pago,
      base_gravable: v.base_gravable || (v.total - (v.iva_valor||0)),
      iva_valor: v.iva_valor || 0,
      descuento: v.descuento || 0,
      total: v.total,
      items: v.items
    }))
  })
})

// ── CLIENTES ──────────────────────────────────────────────────────────────────
app.get('/api/clientes', auth, async (req, res) => {
  const { q } = req.query
  let rows = await db.clientes.find({ activo: true }).sort({ nombre: 1 })
  if (q) rows = rows.filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()) || (c.telefono||'').includes(q))
  res.json(rows.map(c => ({ ...c, id: c._id })))
})

app.post('/api/clientes', auth, async (req, res) => {
  const { nombre, telefono, email, notas } = req.body
  if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' })
  const doc = await db.clientes.insert({ nombre: nombre.trim(), telefono: telefono||'', email: email||'', notas: notas||'', activo: true, creado_en: now() })
  res.json({ id: doc._id, ...doc })
})

app.put('/api/clientes/:id', auth, async (req, res) => {
  const { nombre, telefono, email, notas } = req.body
  await db.clientes.update({ _id: req.params.id }, { $set: { nombre, telefono, email, notas } })
  res.json({ ok: true })
})

app.delete('/api/clientes/:id', auth, adminOnly, async (req, res) => {
  await db.clientes.update({ _id: req.params.id }, { $set: { activo: false } })
  res.json({ ok: true })
})

// ── CATEGORÍAS DE PRODUCTOS ───────────────────────────────────────────────────
app.get('/api/categorias', auth, async (req, res) => {
  const rows = await db.productos.find({ activo: true })
  const cats = [...new Set(rows.map(p => p.categoria).filter(Boolean))].sort()
  res.json(cats)
})

// ── PROVEEDORES ───────────────────────────────────────────────────────────────
app.get('/api/proveedores', auth, async (req, res) => {
  const rows = await db.productos.find({ activo: true })
  const provs = [...new Set(rows.map(p => p.proveedor).filter(Boolean))].sort()
  res.json(provs)
})

// ── SECCIONES (categorías visuales del POS) ───────────────────────────────────
app.get('/api/secciones', auth, async (req, res) => {
  const rows = await db.secciones.find({ activo: true }).sort({ orden: 1 })
  res.json(rows.map(s => ({ ...s, id: s._id })))
})

app.post('/api/secciones', auth, adminOnly, async (req, res) => {
  const { nombre, emoji, orden } = req.body
  if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' })
  const doc = await db.secciones.insert({ nombre: nombre.trim(), emoji: emoji||'🍺', orden: +(orden||0), activo: true, creado_en: now() })
  res.json({ id: doc._id, ...doc })
})

app.put('/api/secciones/:id', auth, adminOnly, async (req, res) => {
  const { nombre, emoji, orden } = req.body
  await db.secciones.update({ _id: req.params.id }, { $set: { nombre, emoji, orden: +(orden||0) } })
  res.json({ ok: true })
})

app.delete('/api/secciones/:id', auth, adminOnly, async (req, res) => {
  await db.secciones.update({ _id: req.params.id }, { $set: { activo: false } })
  res.json({ ok: true })
})

// Productos de una sección (por categoría)
app.get('/api/secciones/:id/productos', auth, async (req, res) => {
  const seccion = await db.secciones.findOne({ _id: req.params.id })
  if (!seccion) return res.status(404).json({ error: 'No encontrada' })
  const prods = await db.productos.find({ activo: true, categoria: seccion.nombre }).sort({ nombre: 1 })
  res.json(prods.map(p => ({ ...p, id: p._id })))
})

// ── COMBOS ────────────────────────────────────────────────────────────────────
app.get('/api/combos', auth, async (req, res) => {
  const rows = await db.combos.find({ activo: true }).sort({ nombre: 1 })
  res.json(rows.map(c => ({ ...c, id: c._id })))
})

app.post('/api/combos', auth, adminOnly, async (req, res) => {
  const { nombre, descripcion, precio, items, icono } = req.body
  if (!nombre?.trim() || !precio) return res.status(400).json({ error: 'Nombre y precio requeridos' })
  if (!items?.length) return res.status(400).json({ error: 'El combo debe tener al menos un producto' })
  const doc = await db.combos.insert({ nombre: nombre.trim(), descripcion: descripcion||'', precio: +precio, items, icono: icono||'🎁', activo: true, creado_en: now() })
  res.json({ id: doc._id })
})

app.put('/api/combos/:id', auth, adminOnly, async (req, res) => {
  const { nombre, descripcion, precio, items, activo, icono } = req.body
  await db.combos.update({ _id: req.params.id }, { $set: { nombre, descripcion, precio: +precio, items, icono: icono||'🎁', activo: activo ?? true } })
  res.json({ ok: true })
})

app.delete('/api/combos/:id', auth, adminOnly, async (req, res) => {
  await db.combos.update({ _id: req.params.id }, { $set: { activo: false } })
  res.json({ ok: true })
})

// ── PRODUCTOS — búsqueda por código de barras ─────────────────────────────────
app.get('/api/productos/buscar/:codigo', auth, async (req, res) => {
  const prod = await db.productos.findOne({ codigo_barras: req.params.codigo, activo: true })
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json({ ...prod, id: prod._id })
})

// Top 10 más vendidos
app.get('/api/productos/top', auth, async (req, res) => {
  const hoy = todayStr()
  const ventasHoy = await db.ventas.find({ estado: 'completada' })
  const ventasIds = ventasHoy.map(v => v._id)
  const items = ventasIds.length ? await db.ventaItems.find({ venta_id: { $in: ventasIds } }) : []
  const conteo = {}
  for (const i of items) {
    if (!conteo[i.producto_id]) conteo[i.producto_id] = { producto_id: i.producto_id, nombre: i.nombre_producto, cantidad: 0 }
    conteo[i.producto_id].cantidad += i.cantidad
  }
  const top = Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10)
  // Enriquecer con datos del producto
  const result = await Promise.all(top.map(async t => {
    const p = await db.productos.findOne({ _id: t.producto_id })
    return p ? { ...p, id: p._id, total_vendido: t.cantidad } : null
  }))
  res.json(result.filter(Boolean))
})

// ── RENDIMIENTO VENDEDORES ────────────────────────────────────────────────────
app.get('/api/caja/rendimiento-vendedores', auth, adminOnly, async (req, res) => {
  const { desde, hasta } = req.query
  const d = desde || todayStr()
  const h = hasta || d
  const ventas = await db.ventas.find({ estado: 'completada' })
  const filtradas = ventas.filter(v => v.creado_en.slice(0, 10) >= d && v.creado_en.slice(0, 10) <= h)
  const mapa = {}
  for (const v of filtradas) {
    const key = v.cajero || v.usuario_id
    if (!mapa[key]) mapa[key] = { cajero: v.cajero, ventas: 0, total: 0, descuentos: 0, canceladas: 0 }
    mapa[key].ventas++
    mapa[key].total += v.total
    mapa[key].descuentos += v.descuento || 0
  }
  const canceladas = await db.ventas.find({ estado: 'cancelada' })
  const cancelFiltradas = canceladas.filter(v => v.creado_en.slice(0, 10) >= d && v.creado_en.slice(0, 10) <= h)
  for (const v of cancelFiltradas) {
    const key = v.cajero || v.usuario_id
    if (mapa[key]) mapa[key].canceladas++
  }
  const result = Object.values(mapa).map(r => ({
    ...r,
    ticket_promedio: r.ventas > 0 ? r.total / r.ventas : 0
  })).sort((a, b) => b.total - a.total)
  res.json(result)
})

// ── VENTAS — actualizar para soportar cliente, pago mixto y combos ─────────────
// (el endpoint POST /api/ventas ya existe, solo agregamos campos opcionales)

// ── CONFIGURACIÓN EMPRESA ─────────────────────────────────────────────────────
app.get('/api/config', auth, async (req, res) => {
  const cfg = await db.config.findOne({ _id: 'empresa' })
  res.json(cfg || {
    nombre: '', nit: '', direccion: '', telefono: '', email: '',
    ciudad: '', descripcion: '', logo: null,
    iva: 19, tamano_impresion: '80mm',
    pie_factura: '¡Gracias por su compra!'
  })
})

app.put('/api/config', auth, adminOnly, async (req, res) => {
  const datos = { ...req.body, _id: 'empresa', actualizado_en: now() }
  const existe = await db.config.findOne({ _id: 'empresa' })
  if (existe) await db.config.update({ _id: 'empresa' }, { $set: datos })
  else await db.config.insert(datos)
  res.json({ ok: true })
})

// ── COMPRAS / CONTABILIDAD INVENTARIO ────────────────────────────────────────
app.get('/api/compras', auth, adminOnly, async (req, res) => {
  const { mes } = req.query // YYYY-MM
  let compras = await db.compras.find({}).sort({ creado_en: -1 })
  if (mes) compras = compras.filter(c => c.mes === mes)
  res.json(compras)
})

app.post('/api/compras', auth, adminOnly, async (req, res) => {
  const { producto_id, cantidad, costo_unitario, nota } = req.body
  const prod = await db.productos.findOne({ _id: producto_id })
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' })
  const costoTotal = +(costo_unitario || prod.costo || 0) * +cantidad
  // Actualizar costo unitario del producto si se especifica uno nuevo
  if (costo_unitario && +costo_unitario !== prod.costo) {
    await db.productos.update({ _id: producto_id }, { $set: { costo: +costo_unitario } })
  }
  // Sumar al stock
  await db.productos.update({ _id: producto_id }, { $set: { stock: prod.stock + +cantidad } })
  const doc = await db.compras.insert({
    producto_id, producto_nombre: prod.nombre, producto_tipo: prod.tipo,
    cantidad: +cantidad, costo_unitario: +(costo_unitario || prod.costo || 0),
    costo_total: costoTotal, unidad: prod.unidad || 'unidad',
    nota: nota || '', creado_en: now(), mes: now().slice(0, 7),
  })
  res.json({ id: doc._id, costo_total: costoTotal })
})

app.get('/api/reportes/contable-mensual', auth, adminOnly, async (req, res) => {
  const { meses = 6 } = req.query
  const ahora = new Date()
  const resultado = []

  // Cargar todos los datos una sola vez
  const todasVentas = await db.ventas.find({ estado: 'completada' })
  const todosItems  = await db.ventaItems.find({})
  const todasCompras = await db.compras.find({})
  const todosProductos = await db.productos.find({ activo: true })

  for (let i = 0; i < +meses; i++) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const mes = fecha.toISOString().slice(0, 7) // YYYY-MM
    const label = fecha.toLocaleString('es-CO', { month: 'long', year: 'numeric' })

    // Ventas del mes
    const ventasMes = todasVentas.filter(v => v.creado_en.slice(0, 7) === mes)
    const totalVentas = ventasMes.reduce((s, v) => s + v.total, 0)
    const numVentas = ventasMes.length

    // Costo de lo vendido: usa costo_unitario guardado en el item al momento de la venta
    // (se calcula como costo_total/cantidad al registrar la compra)
    const ventaIdsMes = new Set(ventasMes.map(v => v._id))
    const itemsMes = todosItems.filter(it => ventaIdsMes.has(it.venta_id))
    const costoVendido = itemsMes.reduce((s, it) => {
      // Solo usar costo_unitario si fue guardado explícitamente en el item
      const costo = it.costo_unitario || 0
      return s + costo * (it.cantidad || 1)
    }, 0)

    // Compras del mes (inversión en reposición de inventario)
    const comprasMes = todasCompras.filter(c => c.mes === mes)
    const totalCompras = comprasMes.reduce((s, c) => s + c.costo_total, 0)
    const numCompras = comprasMes.length

    // Ganancia real = Ventas - Costo de lo vendido
    // (las compras son inversión en inventario, no gasto directo del mes)
    const gananciaReal = totalVentas - costoVendido

    resultado.push({
      mes, label,
      totalVentas, numVentas,
      costoVendido,           // costo de los productos que se vendieron
      totalCompras, numCompras, // inversión en compras/reposición
      gananciaReal,           // ventas - costo vendido
    })
  }

  // Valor actual del inventario — costo guarda el valor total pagado por el lote
  const valorInventario = todosProductos.reduce((s, p) => s + (p.costo || 0), 0)
  const detalleInventario = todosProductos
    .filter(p => p.costo > 0)
    .map(p => ({ nombre: p.nombre, tipo: p.tipo, stock: p.stock, unidad: p.unidad, valor: p.costo }))
    .sort((a, b) => b.valor - a.valor)

  res.json({ meses: resultado.reverse(), valorInventario, detalleInventario })
})

// Ver sesiones / accesos recientes
app.get('/api/superadmin/sesiones', auth, adminOrSuper, async (req, res) => {
  const { limit = 50 } = req.query
  const sesiones = await db.sesiones.find({}).sort({ creado_en: -1 }).limit(+limit)
  res.json(sesiones.map(s => ({ ...s, id: s._id })))
})

// ── SUPERADMIN ────────────────────────────────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (req.user.rol !== 'superadmin') return res.status(403).json({ error: 'Solo superadministradores' })
  next()
}

const PLANES = {
  '1mes':  { label: '1 Mes',   dias: 30 },
  '6meses':{ label: '6 Meses', dias: 180 },
  '1año':  { label: '1 Año',   dias: 365 },
}

// Ver todos los usuarios (superadmin)
app.get('/api/superadmin/usuarios', auth, superAdminOnly, async (req, res) => {
  const rows = await db.usuarios.find({}).sort({ creado_en: 1 })
  res.json(rows.map(u => ({
    id: u._id, nombre: u.nombre, usuario: u.usuario, rol: u.rol,
    activo: u.activo, creado_en: u.creado_en,
    plan: u.plan || null, plan_expira: u.plan_expira || null,
  })))
})

// Asignar / renovar plan a un admin
app.post('/api/superadmin/usuarios/:id/plan', auth, superAdminOnly, async (req, res) => {
  const { plan } = req.body // '1mes' | '6meses' | '1año'
  if (!PLANES[plan]) return res.status(400).json({ error: 'Plan inválido. Usa: 1mes, 6meses, 1año' })
  const user = await db.usuarios.findOne({ _id: req.params.id })
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

  const ahora = new Date()
  // Si tiene plan activo, extender desde la fecha de expiración; si no, desde hoy
  const base = user.plan_expira && new Date(user.plan_expira) > ahora
    ? new Date(user.plan_expira)
    : ahora
  const expira = new Date(base.getTime() + PLANES[plan].dias * 24 * 60 * 60 * 1000)

  await db.usuarios.update({ _id: req.params.id }, { $set: {
    plan, plan_expira: expira.toISOString(), activo: true
  }})
  res.json({ ok: true, plan, plan_expira: expira.toISOString() })
})

// Reiniciar plan (desactivar acceso)
app.post('/api/superadmin/usuarios/:id/reset-plan', auth, superAdminOnly, async (req, res) => {
  await db.usuarios.update({ _id: req.params.id }, { $set: {
    plan: null, plan_expira: null, activo: false
  }})
  res.json({ ok: true })
})

// Cambiar contraseña de cualquier usuario
app.put('/api/superadmin/usuarios/:id/password', auth, superAdminOnly, async (req, res) => {
  const { password } = req.body
  if (!password || password.length < 6) return res.status(400).json({ error: 'Contraseña mínima 6 caracteres' })
  await db.usuarios.update({ _id: req.params.id }, { $set: { password: bcrypt.hashSync(password, 10) } })
  res.json({ ok: true })
})

// Eliminar usuario permanentemente (solo superadmin)
app.delete('/api/superadmin/usuarios/:id', auth, superAdminOnly, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' })
  const user = await db.usuarios.findOne({ _id: req.params.id })
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
  if (user.rol === 'superadmin') return res.status(400).json({ error: 'No se puede eliminar otro superadmin' })
  await db.usuarios.remove({ _id: req.params.id }, {})
  res.json({ ok: true })
})
const checkPlan = async (req, res, next) => {
  if (req.user.rol === 'superadmin') return next()
  const user = await db.usuarios.findOne({ _id: req.user.id })
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })
  if (user.plan_expira) {
    const expira = new Date(user.plan_expira)
    const ahora = new Date()
    const diasVencido = Math.floor((ahora - expira) / (1000 * 60 * 60 * 24))
    if (diasVencido > 5) {
      // Pasó el período de gracia de 5 días — desactivar
      await db.usuarios.update({ _id: req.user.id }, { $set: { activo: false } })
      return res.status(403).json({ error: 'Plan expirado. Tu período de gracia terminó. Contacta al administrador para renovar.' })
    }
    if (diasVencido > 0) {
      // Dentro del período de gracia — dejar pasar pero informar
      req.planGracia = 5 - diasVencido
    }
  }
  next()
}

// Backup manual a Google Drive
app.post('/api/superadmin/backup-drive', auth, superAdminOnly, async (req, res) => {
  try {
    const { execSync } = await import('child_process')
    const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const destino = `gdrive:Bk_enjoy/${fecha}`
    execSync(`rclone copy /app/data ${destino} --config /app/rclone.conf --log-level INFO`, {
      timeout: 60000,
      stdio: 'pipe'
    })
    res.json({ ok: true, destino, mensaje: `Backup subido a Drive: ${destino}` })
  } catch (e) {
    res.status(500).json({ error: 'Error al subir backup: ' + (e.stderr?.toString() || e.message) })
  }
})
app.post('/api/superadmin/limpiar-bd', auth, superAdminOnly, async (req, res) => {
  try {
    await db.ventas.remove({}, { multi: true })
    await db.ventaItems.remove({}, { multi: true })
    await db.productos.remove({}, { multi: true })
    await db.insumos.remove({}, { multi: true })
    await db.recetas.remove({}, { multi: true })
    await db.caja.remove({}, { multi: true })
    await db.movimientos.remove({}, { multi: true })
    await db.compras.remove({}, { multi: true })
    await db.combos.remove({}, { multi: true })
    await db.clientes.remove({}, { multi: true })
    // Compactar las colecciones
    db.ventas.compactDatafile()
    db.ventaItems.compactDatafile()
    db.productos.compactDatafile()
    db.insumos.compactDatafile()
    db.caja.compactDatafile()
    db.movimientos.compactDatafile()
    res.json({ ok: true, mensaje: 'Base de datos limpiada. Usuarios y configuración conservados.' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})
async function seedSuperAdmin() {
  const existe = await db.usuarios.findOne({ usuario: 'superadmin' })
  if (!existe) {
    const hash = bcrypt.hashSync('D4n3r&2026*.', 10)
    await db.usuarios.insert({
      nombre: 'Super Administrador', usuario: 'superadmin',
      password: hash, rol: 'superadmin', activo: true, creado_en: now()
    })
    console.log('✅ Superadmin creado')
  }
}
seedSuperAdmin().catch(console.error)

app.listen(PORT, () => console.log(`🍺 Enjoy Cheladas POS → http://localhost:${PORT}`))
