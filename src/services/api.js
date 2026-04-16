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
  createProducto: (body) => req('POST', '/productos', body),
  updateProducto: (id, body) => req('PUT', `/productos/${id}`, body),
  deleteProducto: (id) => req('DELETE', `/productos/${id}`),
  ajustarStock: (id, body) => req('PATCH', `/productos/${id}/stock`, body),

  // Ventas
  getVentas: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req('GET', `/ventas${q ? '?' + q : ''}`)
  },
  getVenta: (id) => req('GET', `/ventas/${id}`),
  createVenta: (body) => req('POST', '/ventas', body),
  cancelarVenta: (id) => req('PATCH', `/ventas/${id}/cancelar`),

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

  // Reportes
  getResumen: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req('GET', `/reportes/resumen${q ? '?' + q : ''}`)
  },
  descargarCSV: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const token = getToken()
    const url = `${BASE}/reportes/ventas-csv${q ? '?' + q : ''}`
    const a = document.createElement('a')
    a.href = url
    // Fetch con auth para descarga
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const burl = URL.createObjectURL(blob)
        a.href = burl
        a.download = `ventas_${params.desde || 'hoy'}.csv`
        a.click()
        URL.revokeObjectURL(burl)
      })
  }
}
