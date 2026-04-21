import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Save, Building2, Printer, Percent, Upload, X, CheckCircle, QrCode, FileText, Plus, GripVertical, Eye, EyeOff } from 'lucide-react'

const TAMANOS = [
  { value: '58mm',  label: '58mm — Rollo pequeño' },
  { value: '80mm',  label: '80mm — Rollo estándar (más común)' },
  { value: 'carta', label: 'Carta — Hoja completa' },
  { value: 'media', label: 'Media carta' },
]

// Campos por defecto de la factura
const CAMPOS_DEFAULT = [
  { id: 'numero',      label: 'Número de factura (No.)',   visible: true,  editable: false },
  { id: 'fecha',       label: 'Fecha y hora',              visible: true,  editable: false },
  { id: 'pago',        label: 'Método de pago',            visible: true,  editable: false },
  { id: 'cliente',     label: 'Nombre del cliente',        visible: true,  editable: false },
  { id: 'doc_cliente', label: 'Documento del cliente',     visible: true,  editable: false },
  { id: 'subtotal',    label: 'Subtotal',                  visible: true,  editable: false },
  { id: 'descuento',   label: 'Descuento',                 visible: true,  editable: false },
  { id: 'iva',         label: 'IVA',                       visible: true,  editable: false },
  { id: 'total',       label: 'Total',                     visible: true,  editable: false },
  { id: 'cambio',      label: 'Cambio (efectivo)',         visible: true,  editable: false },
  { id: 'qr',          label: 'QR de transferencia',       visible: true,  editable: false },
  { id: 'llamar_a',    label: 'Llamar a (nombre cliente)', visible: true,  editable: false },
  { id: 'mensaje',     label: 'Mensaje aleatorio',         visible: true,  editable: false },
  { id: 'pie',         label: 'Pie de factura',            visible: true,  editable: false },
]

export default function Configuracion() {
  const [form, setForm] = useState({
    nombre: '', nit: '', direccion: '', telefono: '', email: '',
    ciudad: '', descripcion: '', logo: null,
    iva: 19, tamano_impresion: '80mm',
    pie_factura: '¡Gracias por su compra!',
    qr_transferencia: null,
    factura_campos: CAMPOS_DEFAULT,
  })
  const [loading, setLoading] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()
  const qrRef = useRef()

  // Estado para nuevo campo personalizado
  const [nuevoCampo, setNuevoCampo] = useState({ label: '', valor: '' })
  const [mostrandoNuevoCampo, setMostrandoNuevoCampo] = useState(false)

  useEffect(() => {
    api.getConfig().then(cfg => {
      // Merge campos guardados con defaults para no perder campos nuevos del sistema
      if (cfg.factura_campos?.length) {
        const guardados = cfg.factura_campos
        const merged = CAMPOS_DEFAULT.map(d => {
          const guardado = guardados.find(g => g.id === d.id)
          return guardado ? { ...d, ...guardado } : d
        })
        // Agregar campos personalizados (los que no están en CAMPOS_DEFAULT)
        const personalizados = guardados.filter(g => !CAMPOS_DEFAULT.find(d => d.id === g.id))
        cfg.factura_campos = [...merged, ...personalizados]
      } else {
        cfg.factura_campos = CAMPOS_DEFAULT
      }
      setForm(f => ({ ...f, ...cfg }))
    }).catch(console.error)
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleCampo = (id) => {
    setForm(f => ({
      ...f,
      factura_campos: f.factura_campos.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
    }))
  }

  const eliminarCampoPersonalizado = (id) => {
    setForm(f => ({ ...f, factura_campos: f.factura_campos.filter(c => c.id !== id) }))
  }

  const agregarCampoPersonalizado = () => {
    if (!nuevoCampo.label.trim()) return
    const id = 'custom_' + Date.now()
    setForm(f => ({
      ...f,
      factura_campos: [...f.factura_campos, { id, label: nuevoCampo.label.trim(), valor: nuevoCampo.valor.trim(), visible: true, editable: true, personalizado: true }]
    }))
    setNuevoCampo({ label: '', valor: '' })
    setMostrandoNuevoCampo(false)
  }

  const editarCampoPersonalizado = (id, key, val) => {
    setForm(f => ({
      ...f,
      factura_campos: f.factura_campos.map(c => c.id === id ? { ...c, [key]: val } : c)
    }))
  }

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500 * 1024) { setMsg('El logo no debe superar 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => set('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleQR = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500 * 1024) { setMsg('El QR no debe superar 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => set('qr_transferencia', ev.target.result)
    reader.readAsDataURL(file)
  }

  const guardar = async () => {
    setLoading(true); setMsg('')
    try {
      await api.updateConfig(form)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const campo = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-dark">Configuración</h1>
          <p className="text-gray-500 text-sm">Datos de empresa, facturación e impresión</p>
        </div>
        <button onClick={guardar} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
          {guardado ? <><CheckCircle size={15} /> Guardado</> : <><Save size={15} /> {loading ? 'Guardando...' : 'Guardar'}</>}
        </button>
      </div>

      {msg && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{msg}</div>}

      <div className="space-y-5">

        {/* ── Datos de la empresa ── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
            <Building2 size={17} className="text-primary" /> Datos de la empresa
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {campo('Nombre del negocio', 'nombre', 'text', 'Ej: Enjoy Cheladas')}
            {campo('NIT / RUT', 'nit', 'text', 'Ej: 900.123.456-7')}
            {campo('Dirección', 'direccion', 'text', 'Calle 10 # 5-20')}
            {campo('Teléfono / WhatsApp', 'telefono', 'text', '+57 300 000 0000')}
            {campo('Correo electrónico', 'email', 'email', 'ventas@empresa.com')}
            {campo('Ciudad', 'ciudad', 'text', 'San Gil, Santander')}
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción o slogan (aparece en factura)</label>
            <textarea value={form.descripcion || ''} onChange={e => set('descripcion', e.target.value)}
              rows={2} placeholder="La mejor chelada de la ciudad..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </section>

        {/* ── Logo ── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
            <Upload size={17} className="text-primary" /> Logo de la empresa
          </h2>
          <div className="flex items-start gap-4">
            {form.logo ? (
              <div className="relative shrink-0">
                <img src={form.logo} alt="Logo" className="w-24 h-24 object-contain rounded-xl border border-gray-200 bg-gray-50 p-1" />
                <button onClick={() => set('logo', null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0">
                <Upload size={20} />
                <span className="text-xs mt-1">Logo</span>
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-3">El logo aparece en la cabecera de cada factura/ticket. Formatos: PNG, JPG. Máximo 500KB.</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              <button onClick={() => fileRef.current.click()}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                {form.logo ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </button>
            </div>
          </div>
        </section>

        {/* ── QR Transferencia ── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
            <QrCode size={17} className="text-primary" /> QR para pago por transferencia
          </h2>
          <div className="flex items-start gap-4">
            {form.qr_transferencia ? (
              <div className="relative shrink-0">
                <img src={form.qr_transferencia} alt="QR Transferencia" className="w-32 h-32 object-contain rounded-xl border border-gray-200 bg-gray-50 p-1" />
                <button onClick={() => set('qr_transferencia', null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0">
                <QrCode size={24} />
                <span className="text-xs mt-1 text-center px-1">QR pago</span>
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-3">
                Este QR aparecerá en el ticket cuando el cliente pague por transferencia. Sube la imagen del QR de tu Nequi, Daviplata o cuenta bancaria. Formatos: PNG, JPG. Máximo 500KB.
              </p>
              <input ref={qrRef} type="file" accept="image/*" onChange={handleQR} className="hidden" />
              <button onClick={() => qrRef.current.click()}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                {form.qr_transferencia ? 'Cambiar QR' : 'Seleccionar imagen QR'}
              </button>
            </div>
          </div>
        </section>

        {/* ── IVA ── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
            <Percent size={17} className="text-primary" /> Configuración de IVA
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Porcentaje de IVA</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={form.iva}
                  onChange={e => set('iva', +e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Explicación del cálculo */}
          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
            <p className="font-semibold">¿Cómo funciona el IVA incluido?</p>
            <p>El precio que ingresas ya incluye el IVA. El sistema lo descompone automáticamente:</p>
            <div className="bg-white rounded-lg p-3 mt-2 font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span>Precio con IVA:</span>
                <span className="font-bold">$10.000</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Base gravable ({100 - form.iva}%):</span>
                <span>${Math.round(10000 / (1 + form.iva / 100)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>IVA ({form.iva}%):</span>
                <span>${Math.round(10000 - (10000 / (1 + form.iva / 100))).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total:</span>
                <span>$10.000</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Impresión ── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
            <Printer size={17} className="text-primary" /> Configuración de impresión
          </h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Tamaño del papel / ticket</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {TAMANOS.map(t => (
                <button key={t.value} onClick={() => set('tamano_impresion', t.value)}
                  className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    form.tamano_impresion === t.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}>
                  <span className="font-semibold block">{t.value}</span>
                  <span className="text-xs opacity-70">{t.label.split('—')[1]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje al pie de la factura</label>
            <input type="text" value={form.pie_factura || ''} onChange={e => set('pie_factura', e.target.value)}
              placeholder="¡Gracias por su compra!"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </section>

        {/* ── Diseño de factura ── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-1 flex items-center gap-2">
            <FileText size={17} className="text-primary" /> Diseño de factura
          </h2>
          <p className="text-xs text-gray-400 mb-4">Activa o desactiva cada sección que aparece en el ticket. También puedes agregar campos personalizados.</p>

          <div className="space-y-2">
            {(form.factura_campos || CAMPOS_DEFAULT).map(campo => (
              <div key={campo.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${campo.visible ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100 bg-gray-50'}`}>
                <GripVertical size={14} className="text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  {campo.personalizado ? (
                    <div className="flex gap-2">
                      <input
                        value={campo.label}
                        onChange={e => editarCampoPersonalizado(campo.id, 'label', e.target.value)}
                        placeholder="Etiqueta"
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <input
                        value={campo.valor || ''}
                        onChange={e => editarCampoPersonalizado(campo.id, 'valor', e.target.value)}
                        placeholder="Valor (texto fijo)"
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  ) : (
                    <span className={`text-sm font-medium ${campo.visible ? 'text-gray-700' : 'text-gray-400'}`}>{campo.label}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleCampo(campo.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${campo.visible ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                    {campo.visible ? <><Eye size={12}/> Visible</> : <><EyeOff size={12}/> Oculto</>}
                  </button>
                  {campo.personalizado && (
                    <button onClick={() => eliminarCampoPersonalizado(campo.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Agregar campo personalizado */}
          {mostrandoNuevoCampo ? (
            <div className="mt-3 p-3 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/30 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Nuevo campo personalizado</p>
              <div className="flex gap-2">
                <input
                  value={nuevoCampo.label}
                  onChange={e => setNuevoCampo(n => ({ ...n, label: e.target.value }))}
                  placeholder="Etiqueta (ej: Instagram)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={nuevoCampo.valor}
                  onChange={e => setNuevoCampo(n => ({ ...n, valor: e.target.value }))}
                  placeholder="Valor (ej: @enjoycheladas)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={agregarCampoPersonalizado}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
                  Agregar
                </button>
                <button onClick={() => { setMostrandoNuevoCampo(false); setNuevoCampo({ label: '', valor: '' }) }}
                  className="px-4 py-2 rounded-xl text-sm text-gray-500 border border-gray-200">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setMostrandoNuevoCampo(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors">
              <Plus size={15} /> Agregar campo personalizado
            </button>
          )}
        </section>

        {/* Preview factura */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-4">Vista previa del ticket</h2>
          <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs max-w-xs mx-auto font-mono space-y-0.5" style={{ color: '#1a1a1a' }}>
            {form.logo && <img src={form.logo} alt="logo" className="h-10 object-contain mx-auto mb-1" />}
            <p className="font-bold text-sm uppercase">{form.nombre || 'ENJOY CHELADAS'}</p>
            {form.nit && <p className="text-gray-500">NIT: {form.nit}</p>}
            {form.direccion && <p className="text-gray-500">{form.direccion}</p>}
            {form.ciudad && <p className="text-gray-500">{form.ciudad}</p>}
            {form.telefono && <p className="text-gray-500">Tel: {form.telefono}</p>}
            {form.descripcion && <p className="text-gray-400 italic">{form.descripcion}</p>}
            <div className="border-t border-dashed border-gray-300 my-1.5" />
            <p className="font-bold text-xs">DOCUMENTO EQUIVALENTE POS</p>
            <div className="border-t border-dashed border-gray-300 my-1.5" />
            {(form.factura_campos || CAMPOS_DEFAULT).filter(c => c.visible).map(c => {
              const ejemplos = {
                numero: ['No.', 'EC-20260421-1234'],
                fecha: ['Fecha', '21/04/26, 8:42 AM'],
                pago: ['Pago', 'Efectivo'],
                cliente: ['Cliente', 'Juan Pérez'],
                doc_cliente: ['Doc.', '1234567890'],
                subtotal: ['Subtotal', '$8.403'],
                descuento: ['Descuento', '-$500'],
                iva: ['IVA 19%', '$1.597'],
                total: ['TOTAL', '$10.000'],
                cambio: ['Cambio', '$0'],
                qr: null,
                llamar_a: null,
                mensaje: null,
                pie: null,
              }
              if (c.id === 'qr') return <p key={c.id} className="text-gray-400 text-xs">[QR transferencia]</p>
              if (c.id === 'llamar_a') return <div key={c.id} className="bg-orange-50 rounded py-1 my-1"><p className="text-orange-500 font-bold text-sm">JUAN PÉREZ</p></div>
              if (c.id === 'mensaje') return <p key={c.id} className="text-gray-400">¡Que la disfrutes! 🎉</p>
              if (c.id === 'pie') return <p key={c.id} className="text-gray-400">{form.pie_factura || '¡Gracias por su compra!'}</p>
              if (c.personalizado) return (
                <div key={c.id} className="flex justify-between">
                  <span className="text-gray-500">{c.label}</span>
                  <span>{c.valor || '—'}</span>
                </div>
              )
              const ej = ejemplos[c.id]
              if (!ej) return null
              return (
                <div key={c.id} className="flex justify-between">
                  <span className="text-gray-500">{ej[0]}</span><span>{ej[1]}</span>
                </div>
              )
            })}
          </div>
        </section>

      </div>

      {/* Botón guardar fijo en mobile */}
      <div className="mt-6 flex justify-end">
        <button onClick={guardar} disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
          {guardado ? <><CheckCircle size={16} /> ¡Guardado!</> : <><Save size={16} /> {loading ? 'Guardando...' : 'Guardar configuración'}</>}
        </button>
      </div>
    </div>
  )
}
