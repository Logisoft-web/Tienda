import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Save, Building2, Printer, Percent, Upload, X, CheckCircle } from 'lucide-react'

const TAMANOS = [
  { value: '58mm',  label: '58mm — Rollo pequeño' },
  { value: '80mm',  label: '80mm — Rollo estándar (más común)' },
  { value: 'carta', label: 'Carta — Hoja completa' },
  { value: 'media', label: 'Media carta' },
]

export default function Configuracion() {
  const [form, setForm] = useState({
    nombre: '', nit: '', direccion: '', telefono: '', email: '',
    ciudad: '', descripcion: '', logo: null,
    iva: 19, tamano_impresion: '80mm',
    pie_factura: '¡Gracias por su compra!'
  })
  const [loading, setLoading] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    api.getConfig().then(cfg => setForm(f => ({ ...f, ...cfg }))).catch(console.error)
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500 * 1024) { setMsg('El logo no debe superar 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => set('logo', ev.target.result)
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

        {/* Preview factura */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-dark mb-4">Vista previa del encabezado</h2>
          <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-sm max-w-xs mx-auto font-mono">
            {form.logo && <img src={form.logo} alt="logo" className="h-12 object-contain mx-auto mb-2" />}
            <p className="font-bold text-base">{form.nombre || 'Nombre del negocio'}</p>
            {form.nit && <p className="text-xs text-gray-500">NIT: {form.nit}</p>}
            {form.direccion && <p className="text-xs text-gray-500">{form.direccion}</p>}
            {form.ciudad && <p className="text-xs text-gray-500">{form.ciudad}</p>}
            {form.telefono && <p className="text-xs text-gray-500">Tel: {form.telefono}</p>}
            {form.descripcion && <p className="text-xs text-gray-400 italic mt-1">{form.descripcion}</p>}
            <div className="border-t border-dashed border-gray-300 my-2" />
            <p className="text-xs text-gray-400">Ticket #{form.tamano_impresion}</p>
            <p className="text-xs text-gray-400">IVA incluido {form.iva}%</p>
            <div className="border-t border-dashed border-gray-300 my-2" />
            <p className="text-xs text-gray-400">{form.pie_factura}</p>
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
