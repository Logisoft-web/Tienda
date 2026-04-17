const BASE = '/api'

const getToken = () => localStorage.getItem('pos_token')

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
})

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en servidor')
  return data
}

export const api = {
  // Auth
  login: (body) => req('POST', '/auth/login', body),

  // Usuarios
  getUsuarios: () => req('GET', '/usuarios'),
  createUsuario: (body) => req('POST', '/usuarios', body),
  updateUsuario: (id, body) => req('PUT', `/usuarios/${id}`, body),
  deleteUsuario: (id) => req('DELETE', `/usuarios/${id}`),

  // Productos
  getProductos: () => req('GET', '/productos'),
  getProductosTop: () => req('GET', '/productos/top'),
  buscarPorCodigo: (codigo) => req('GET', `/productos/buscar/${encodeURIComponent(codigo)}`),
  createProducto: (body) => req('POST', '/productos', body),
  updateProducto: (id, body) => req('PUT', `/productos/${id}`, body),
  deleteProducto: (id) => req('DELETE', `/productos/${id}`),
  ajustarStock: (id, body) => req('PATCH', `/productos/${id}/stock`, body),

  // Categorías y Proveedores
  getCategorias: () => req('GET', '/categorias'),
  getProveedores: () => req('GET', '/proveedores'),

  // Clientes
  getClientes: (q = '') => req('GET', `/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createCliente: (body) => req('POST', '/clientes', body),
  updateCliente: (id, body) => req('PUT', `/clientes/${id}`, body),
  deleteCliente: (id) => req('DELETE', `/clientes/${id}`),

  // Secciones
  getSecciones: () => req('GET', '/secciones'),
  createSeccion: (body) => req('POST', '/secciones', body),
  updateSeccion: (id, body) => req('PUT', `/secciones/${id}`, body),
  deleteSeccion: (id) => req('DELETE', `/secciones/${id}`),
  getProductosSeccion: (id) => req('GET', `/secciones/${id}/productos`),

  // Combos
  getCombos: () => req('GET', '/combos'),
  createCombo: (body) => req('POST', '/combos', body),
  updateCombo: (id, body) => req('PUT', `/combos/${id}`, body),
  deleteCombo: (id) => req('DELETE', `/combos/${id}`),

  // Ventas
  getVentas: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req('GET', `/ventas${q ? '?' + q : ''}`)
  },
  getVenta: (id) => req('GET', `/ventas/${id}`),
  createVenta: (body) => req('POST', '/ventas', body),
  cancelarVenta: (id) => req('PATCH', `/ventas/${id}/cancelar`),

  // Insumos
  getInsumos: () => req('GET', '/insumos'),
  createInsumo: (body) => req('POST', '/insumos', body),
  updateInsumo: (id, body) => req('PUT', `/insumos/${id}`, body),
  deleteInsumo: (id) => req('DELETE', `/insumos/${id}`),
  ajustarStockInsumo: (id, body) => req('PATCH', `/insumos/${id}/stock`, body),

  // Recetas
  getRecetas: () => req('GET', '/recetas'),
  getReceta: (producto_id) => req('GET', `/recetas/${producto_id}`),
  saveReceta: (body) => req('POST', '/recetas', body),
  deleteReceta: (producto_id) => req('DELETE', `/recetas/${producto_id}`),

  // Caja
  getCajaEstado: () => req('GET', '/caja/estado'),
  getCajasActivas: () => req('GET', '/caja/activas'),
  abrirCaja: (body) => req('POST', '/caja/abrir', body),
  cerrarCaja: (body) => req('POST', '/caja/cerrar', body),
  getMovimientos: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req('GET', `/caja/movimientos${q ? '?' + q : ''}`)
  },
  addMovimiento: (body) => req('POST', '/caja/movimiento', body),
  getRendimientoVendedores: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req('GET', `/caja/rendimiento-vendedores${q ? '?' + q : ''}`)
  },

  // Configuración empresa
  getConfig: () => req('GET', '/config'),
  updateConfig: (body) => req('PUT', '/config', body),

  // Reportes
  getResumen: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req('GET', `/reportes/resumen${q ? '?' + q : ''}`)
  },
  descargarCSV: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const token = getToken()
    const url = `${BASE}/reportes/ventas-csv${q ? '?' + q : ''}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const burl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = burl
        a.download = `ventas_${params.desde || 'hoy'}.csv`
        a.click()
        URL.revokeObjectURL(burl)
      })
  },

  descargarContable: (params = {}) => {
    const q = new URLSearchParams({ ...params, formato: 'csv' }).toString()
    const token = getToken()
    const url = `${BASE}/reportes/contable?${q}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const burl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = burl
        a.download = `reporte_contable_${params.desde || 'hoy'}_${params.hasta || 'hoy'}.csv`
        a.click()
        URL.revokeObjectURL(burl)
      })
  }
}
