import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Eye,
  Filter, Glasses, Instagram, LoaderCircle, LogOut, Menu, MessageCircle,
  Package, Pencil, Plus, Search, Settings, ShieldCheck, ShoppingBag, Sparkles,
  Tag, Trash2, Upload, X
} from 'lucide-react'
import { supabase, rupiah, whatsappLink } from './lib/supabase'

const fallbackProducts = [
  { id: 'demo-1', name: 'Avery Classic', category: 'Optical', price: 249000, sale_price: 199000, discount_percent: 20, image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900', description: 'Frame minimalis dengan sentuhan klasik untuk gaya sehari-hari.', stock: 12 },
  { id: 'demo-2', name: 'Solana Sun', category: 'Sunglasses', price: 329000, sale_price: 279000, discount_percent: 15, image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900', description: 'Kacamata hitam modern yang nyaman dipakai sepanjang hari.', stock: 8 },
  { id: 'demo-3', name: 'Milo Round', category: 'Optical', price: 289000, sale_price: 289000, image_url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=900', description: 'Siluet round yang ringan dan mudah dipadukan.', stock: 15 },
  { id: 'demo-4', name: 'Noir Edge', category: 'Sunglasses', price: 359000, sale_price: 309000, discount_percent: 14, image_url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=900', description: 'Tampilan tegas dengan desain kontemporer.', stock: 6 },
]

const money = rupiah
const imageOf = (p) => p.image_url || p.images?.[0] || 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900'
const discounted = (p) => Number(p.sale_price ?? p.price) < Number(p.original_price ?? p.price)
const initialForm = { id: '', name: '', slug: '', description: '', price: '', category: 'Optical', stock: 0, image_url: '', is_active: true }

function Header({ onAdmin, onHome }) {
  const [menu, setMenu] = useState(false)
  return <header className="site-header">
    <div className="nav-wrap">
      <button className="brand" onClick={onHome}><span className="brand-mark"><Glasses size={22}/></span><span>KACAMATA<span className="brand-light">STORE.</span></span></button>
      <nav className={menu ? 'nav-links open' : 'nav-links'}>
        <a href="#koleksi" onClick={() => setMenu(false)}>Koleksi</a>
        <a href="#promo" onClick={() => setMenu(false)}>Promo</a>
        <a href="#tentang" onClick={() => setMenu(false)}>Tentang Kami</a>
      </nav>
      <div className="nav-actions"><button className="admin-link" onClick={onAdmin}><ShieldCheck size={16}/> Admin</button><a className="icon-button bag-button" href="#koleksi" aria-label="Lihat koleksi"><ShoppingBag size={19}/></a><button className="icon-button mobile-menu" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X/> : <Menu/>}</button></div>
    </div>
  </header>
}

function ProductCard({ product, onOpen }) {
  const sale = discounted(product)
  return <article className="product-card">
    <button className="product-image" onClick={() => onOpen(product)} aria-label={'Lihat ' + product.name}>
      <img src={imageOf(product)} alt={product.name} loading="lazy"/>
      {sale && <span className="discount-badge">-{product.discount_percent || Math.round((1 - Number(product.sale_price ?? product.price) / Number(product.original_price ?? product.price)) * 100)}%</span>}
      <span className="quick-view">Lihat detail <ArrowUpRight size={15}/></span>
    </button>
    <div className="product-info"><div className="product-meta"><span>{product.category || 'Eyewear'}</span><span className="stock-label">{Number(product.stock) > 0 ? 'Ready stock' : 'Habis'}</span></div><button className="product-name" onClick={() => onOpen(product)}>{product.name}</button><div className="price-line">{sale && <span className="old-price">{money(product.original_price ?? product.price)}</span>}<strong>{money(product.sale_price ?? product.price)}</strong></div></div>
  </article>
}

function ProductDetail({ product, onClose, whatsapp }) {
  if (!product) return null
  const sale = discounted(product)
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="detail-modal" onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X/></button><div className="detail-image"><img src={imageOf(product)} alt={product.name}/></div><div className="detail-copy"><span className="eyebrow">{product.category || 'EYEWEAR'}</span><h2>{product.name}</h2><p>{product.description || 'Desain pilihan untuk menemani aktivitas dan gaya sehari-hari.'}</p><div className="detail-price">{sale && <del>{money(product.original_price ?? product.price)}</del>}<strong>{money(product.sale_price ?? product.price)}</strong></div><p className="availability">{Number(product.stock) > 0 ? '✓ Tersedia · ' + product.stock + ' stok' : 'Stok sedang habis'}</p><a className="button button-dark full-button" href={whatsappLink(product, whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Pesan via WhatsApp <ArrowUpRight size={17}/></a><small>Anda akan diarahkan ke WhatsApp untuk konfirmasi pesanan.</small></div></section></div>
}

function Admin({ onClose }) {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [products, setProducts] = useState([])
  const [promos, setPromos] = useState([])
  const [settings, setSettings] = useState({ store_name: 'Kacamata Store', whatsapp_number: '6282144733128', contact_email: 'xcode6six@gmail.com', address: '', instagram: '' })
  const [tab, setTab] = useState('products')
  const [form, setForm] = useState(initialForm)
  const [promoForm, setPromoForm] = useState({ id: '', name: '', description: '', discount_type: 'percentage', discount_value: 10, starts_at: '', ends_at: '', is_active: true })
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)

  const callAdmin = async (action, payload = {}) => {
    const { data, error: invokeError } = await supabase.functions.invoke('store-admin', { body: { action, ...payload } })
    if (invokeError) throw invokeError
    if (data?.error) throw new Error(data.error)
    return data
  }
  const loadAdmin = async () => {
    const [p, pr, s] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('promotions').select('*').order('created_at', { ascending: false }),
      supabase.from('store_settings').select('*').limit(1).maybeSingle()
    ])
    if (p.error) throw p.error
    if (pr.error) throw pr.error
    setProducts(p.data || []); setPromos(pr.data || [])
    if (s.data) setSettings(s.data)
  }
  useEffect(() => {
    if (session) loadAdmin().catch(e => setError(e.message))
  }, [session])
  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => { if (data.session) setSession(data.session) })
  }, [])
  const login = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError(authError.message)
    else {
      const { data: profile } = await supabase.from('store_profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role !== 'admin') { await supabase.auth.signOut(); setError('Akun ini tidak memiliki akses admin.') }
      else setSession(data.session)
    }
    setBusy(false)
  }
  const logout = async () => { await supabase.auth.signOut(); setSession(null) }
  const saveProduct = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await callAdmin('save_product', { product: { ...form, price: Number(form.price), stock: Number(form.stock), slug: form.slug || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') } })
      setForm(initialForm); await loadAdmin(); setNotice('Produk berhasil disimpan.')
    } catch (e) { setError(e.message) }
    setBusy(false)
  }
  const deleteProduct = async (id) => {
    if (!confirm('Hapus produk ini?')) return
    setBusy(true)
    try { await callAdmin('delete_product', { product_id: id }); await loadAdmin(); setNotice('Produk dihapus.') }
    catch (e) { setError(e.message) }
    setBusy(false)
  }
  const uploadImage = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran gambar maksimal 5 MB.'); return }
    setUploading(true); setError('')
    const ext = file.name.split('.').pop().toLowerCase()
    const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
    const { error: uploadError } = await supabase.storage.from('eyewear-products').upload(path, file, { upsert: false, contentType: file.type })
    if (uploadError) setError(uploadError.message)
    else { const { data } = supabase.storage.from('eyewear-products').getPublicUrl(path); setForm(f => ({ ...f, image_url: data.publicUrl })) }
    setUploading(false)
  }
  const savePromo = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const { id, ...rest } = promoForm
      const result = await callAdmin('save_promotion', { promotion: { id, ...rest, discount_value: Number(rest.discount_value), starts_at: rest.starts_at ? new Date(rest.starts_at).toISOString() : null, ends_at: rest.ends_at ? new Date(rest.ends_at).toISOString() : null } })
      const promoId = id || result?.promotion?.id || result?.id
      if (promoId) {
        const { data: currentLinks, error: linksError } = await supabase.from('product_promotions').select('product_id').eq('promotion_id', promoId)
        if (linksError) throw linksError
        const currentIds = (currentLinks || []).map(link => link.product_id)
        const removedIds = currentIds.filter(productId => !selected.includes(productId))
        if (removedIds.length) {
          const { error: removeError } = await supabase.from('product_promotions').delete().eq('promotion_id', promoId).in('product_id', removedIds)
          if (removeError) throw removeError
        }
        const addedIds = selected.filter(productId => !currentIds.includes(productId))
        if (addedIds.length) await callAdmin('assign_promotion', { promotion_id: promoId, product_ids: addedIds })
      }
      await loadAdmin(); setSelected([]); setPromoForm({ id: '', name: '', description: '', discount_type: 'percentage', discount_value: 10, starts_at: '', ends_at: '', is_active: true }); setNotice('Promo berhasil disimpan.')
    } catch (e) { setError(e.message) }
    setBusy(false)
  }
  const editPromo = async (promo) => {
    setBusy(true); setError('')
    try {
      const { data: links, error: linksError } = await supabase.from('product_promotions').select('product_id').eq('promotion_id', promo.id)
      if (linksError) throw linksError
      setPromoForm({ ...promo, starts_at: promo.starts_at || '', ends_at: promo.ends_at || '' })
      setSelected((links || []).map(link => link.product_id))
    } catch (e) { setError('Gagal memuat produk promo: ' + e.message) }
    setBusy(false)
  }
  const deletePromo = async (promo) => {
    if (!confirm('Hapus promo "' + promo.name + '"? Promo ini tidak dapat dikembalikan.')) return
    setBusy(true); setError('')
    try {
      const { error: linksError } = await supabase.from('product_promotions').delete().eq('promotion_id', promo.id)
      if (linksError) throw linksError
      const { error: deleteError } = await supabase.from('promotions').delete().eq('id', promo.id)
      if (deleteError) throw deleteError
      await loadAdmin()
      if (promoForm.id === promo.id) {
        setPromoForm({ id: '', name: '', description: '', discount_type: 'percentage', discount_value: 10, starts_at: '', ends_at: '', is_active: true })
        setSelected([])
      }
      setNotice('Promo berhasil dihapus.')
    } catch (e) { setError('Gagal menghapus promo: ' + e.message) }
    setBusy(false)
  }
  const saveSettings = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try { await callAdmin('save_settings', { settings }); setNotice('Pengaturan toko disimpan.') }
    catch (e) { setError(e.message) }
    setBusy(false)
  }
  if (!supabase) return <div className="admin-screen"><div className="login-card"><button className="modal-close" onClick={onClose}><X/></button><h2>Konfigurasi belum tersedia</h2><p>Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY pada file .env.</p></div></div>
  if (!session) return <div className="admin-screen"><form className="login-card" onSubmit={login}><button type="button" className="modal-close" onClick={onClose}><X/></button><span className="eyebrow">KACAMATA STORE</span><h2>Admin login</h2><p>Masuk untuk mengelola produk dan promo toko.</p><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@email.com"/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"/></label>{error && <div className="alert-error">{error}</div>}<button className="button button-dark full-button" disabled={busy}>{busy ? <LoaderCircle className="spin"/> : 'Masuk ke dashboard'} <ArrowRight size={17}/></button></form></div>
  return <div className="admin-screen"><div className="admin-shell"><aside className="admin-sidebar"><button className="brand" onClick={onClose}><span className="brand-mark"><Glasses/></span>KACAMATA<span className="brand-light">STORE.</span></button><p className="side-caption">MENU UTAMA</p>{[['products',Package,'Produk'],['promotions',Tag,'Promosi'],['settings',Settings,'Pengaturan']].map(([key,Icon,label]) => <button key={key} className={'side-link '+(tab===key?'active':'')} onClick={() => setTab(key)}><Icon size={18}/>{label}</button>)}<button className="side-link logout-link" onClick={logout}><LogOut size={18}/>Keluar</button></aside><main className="admin-main"><div className="admin-top"><div><span className="eyebrow">DASHBOARD</span><h1>{tab==='products'?'Kelola Produk':tab==='promotions'?'Kelola Promosi':'Pengaturan Toko'}</h1></div><button className="button button-outline" onClick={onClose}><Eye size={16}/> Lihat toko</button></div>{error && <div className="alert-error">{error}</div>}{notice && <div className="alert-success"><Check size={16}/>{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}
  {tab==='products' && <div className="admin-grid"><section className="admin-panel"><h3>{form.id?'Edit produk':'Tambah produk'}</h3><form onSubmit={saveProduct} className="admin-form"><label>Nama produk<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Harga (Rp)<input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label><label>Kategori<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Optical</option><option>Sunglasses</option><option>Accessories</option></select></label><label>Stok<input type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label><label className="wide">Deskripsi<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="wide">Foto produk<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>uploadImage(e.target.files?.[0])}/>{uploading && <small>Mengunggah gambar…</small>}{form.image_url && <img className="upload-preview" src={form.image_url}/>}</label><label className="check-label"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Tampilkan di katalog</label><div className="form-actions wide"><button className="button button-dark" disabled={busy||uploading}>{busy?'Menyimpan…':'Simpan produk'}</button><button type="button" className="button button-outline" onClick={()=>setForm(initialForm)}>Reset</button></div></form></section><section className="admin-panel"><div className="panel-heading"><h3>Daftar produk</h3><span>{products.length} produk</span></div><div className="admin-product-list">{products.map(p=><div className="admin-product" key={p.id}><img src={imageOf(p)} alt=""/><div className="admin-product-copy"><strong>{p.name}</strong><small>{money(p.price)} · {p.stock} stok</small></div><button className="tiny-action" onClick={()=>setForm({...initialForm,...p,price:String(p.price),stock:p.stock||0})}><Pencil size={15}/></button><button className="tiny-action danger" onClick={()=>deleteProduct(p.id)}><Trash2 size={15}/></button></div>)}</div></section></div>}
  {tab==='promotions' && <div className="admin-grid"><section className="admin-panel"><h3>Buat / edit promo</h3><form onSubmit={savePromo} className="admin-form"><label className="wide">Nama promo<input value={promoForm.name} onChange={e=>setPromoForm({...promoForm,name:e.target.value})} required placeholder="Contoh: Payday Sale"/></label><label>Jenis diskon<select value={promoForm.discount_type} onChange={e=>setPromoForm({...promoForm,discount_type:e.target.value})}><option value="percentage">Persentase (%)</option><option value="fixed">Potongan harga (Rp)</option></select></label><label>Nilai diskon<input type="number" min="1" value={promoForm.discount_value} onChange={e=>setPromoForm({...promoForm,discount_value:e.target.value})} required/></label><label>Mulai<input type="datetime-local" value={promoForm.starts_at?.slice(0,16)||''} onChange={e=>setPromoForm({...promoForm,starts_at:e.target.value})}/></label><label>Berakhir<input type="datetime-local" value={promoForm.ends_at?.slice(0,16)||''} onChange={e=>setPromoForm({...promoForm,ends_at:e.target.value})}/></label><label className="wide">Deskripsi<input value={promoForm.description} onChange={e=>setPromoForm({...promoForm,description:e.target.value})}/></label><div className="wide"><p className="field-title">Terapkan ke produk</p><div className="select-products">{products.map(p=><label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))}/>{p.name}</label>)}</div></div><label className="check-label"><input type="checkbox" checked={promoForm.is_active} onChange={e=>setPromoForm({...promoForm,is_active:e.target.checked})}/> Promo aktif</label><div className="form-actions wide"><button className="button button-dark" disabled={busy}>{busy?'Menyimpan…':'Simpan promo'}</button></div></form></section><section className="admin-panel"><h3>Promo tersimpan</h3>{promos.map(p=><div className="promo-row" key={p.id}><div><strong>{p.name}</strong><small>{p.discount_type==='percentage'?p.discount_value+'%':'Rp '+Number(p.discount_value).toLocaleString('id-ID')} · {p.is_active?'Aktif':'Nonaktif'}</small></div><div className="row-actions"><button type="button" className="tiny-action" title="Edit promo" disabled={busy} onClick={()=>editPromo(p)}><Pencil size={15}/></button><button type="button" className="tiny-action danger" title="Hapus promo" disabled={busy} onClick={()=>deletePromo(p)}><Trash2 size={15}/></button></div></div>)}</section></div>}
  {tab==='settings' && <section className="admin-panel settings-panel"><h3>Informasi toko</h3><form onSubmit={saveSettings} className="admin-form"><label>Nama toko<input value={settings.store_name||''} onChange={e=>setSettings({...settings,store_name:e.target.value})}/></label><label>Nomor WhatsApp<input value={settings.whatsapp_number||''} onChange={e=>setSettings({...settings,whatsapp_number:e.target.value})}/></label><label>Email kontak<input type="email" value={settings.contact_email||''} onChange={e=>setSettings({...settings,contact_email:e.target.value})}/></label><label>Instagram<input value={settings.instagram||''} onChange={e=>setSettings({...settings,instagram:e.target.value})}/></label><label className="wide">Alamat<textarea rows="3" value={settings.address||''} onChange={e=>setSettings({...settings,address:e.target.value})}/></label><div className="form-actions wide"><button className="button button-dark" disabled={busy}>Simpan pengaturan</button></div></form></section>}</main></div></div>
}

export default function App() {
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [detail, setDetail] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [promo, setPromo] = useState(null)
  useEffect(() => {
    if (!supabase) { setProducts(fallbackProducts); setLoading(false); return }
    Promise.all([
      supabase.from('product_catalog').select('*').order('created_at', { ascending: false }),
      supabase.from('store_settings').select('*').limit(1).maybeSingle()
    ]).then(([p,s]) => {
      setProducts(p.error ? fallbackProducts : (p.data || []))
      setSettings(s.data || null)
    }).catch(() => setProducts(fallbackProducts)).finally(() => setLoading(false))
  }, [])
  const categories = useMemo(() => ['Semua', ...new Set(products.map(p=>p.category).filter(Boolean))], [products])
  const visible = useMemo(() => products.filter(p => (category==='Semua'||p.category===category) && (p.name+' '+(p.category||'')).toLowerCase().includes(search.toLowerCase())), [products,category,search])
  const promoProducts = products.filter(discounted)
  const whatsapp = settings?.whatsapp_number || '6282144733128'
  const promoName = promoProducts[0]?.promotion_name || 'Special Price'
  return <><Header onAdmin={()=>setAdmin(true)} onHome={()=>{setAdmin(false);window.scrollTo({top:0,behavior:'smooth'})}}/>
    <main>
      <section className="hero"><div className="hero-copy"><span className="eyebrow"><Sparkles size={14}/> YOUR EVERYDAY EYEWEAR</span><h1>See the world<br/><em>in your own style.</em></h1><p>Temukan frame yang tepat untuk setiap cerita. Koleksi kacamata pilihan dengan desain modern, nyaman, dan penuh karakter.</p><div className="hero-actions"><a href="#koleksi" className="button button-dark">Jelajahi koleksi <ArrowUpRight size={17}/></a><span className="hero-note"><span className="dot"/> Pilihan gaya untuk setiap hari</span></div><div className="hero-stats"><div><strong>{products.length ? products.length+'+' : '—'}</strong><span>Produk pilihan</span></div><div><strong>100%</strong><span>Style & comfort</span></div><div><strong>Easy</strong><span>Order via WhatsApp</span></div></div></div><div className="hero-visual"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200" alt="Koleksi kacamata modern"/></div><div className="floating-note"><span className="note-icon"><Glasses size={19}/></span><span><strong>Find your frame</strong><small>Made for your moments</small></span><ArrowUpRight size={17}/></div><div className="hero-index">01 / 04</div></div><div className="hero-watermark">VISION</div></section>
      <section className="trust-strip"><div><ShieldCheck/><span>Produk pilihan</span></div><div><Sparkles/><span>Style yang timeless</span></div><div><MessageCircle/><span>Pesan mudah via WhatsApp</span></div><div><Package/><span>Update stok berkala</span></div></section>
      <section className="collection section-wrap" id="koleksi"><div className="section-heading"><div><span className="eyebrow">THE COLLECTION</span><h2>Find your <em>perfect frame.</em></h2><p>Temukan kacamata yang paling cocok dengan karakter Anda.</p></div><span className="collection-count">{visible.length.toString().padStart(2,'0')} ITEMS</span></div><div className="catalog-tools"><div className="category-tabs">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kacamata..."/>{search&&<button onClick={()=>setSearch('')}><X size={15}/></button>}</label></div>{loading ? <div className="loading-state"><LoaderCircle className="spin"/> Memuat koleksi...</div> : visible.length ? <div className="product-grid">{visible.map(p=><ProductCard key={p.id} product={p} onOpen={setDetail}/>)}</div> : <div className="empty-state"><Glasses size={30}/><h3>Produk belum ditemukan</h3><p>Coba kata kunci atau kategori lainnya.</p></div>}</section>
      <section className="promo-section" id="promo"><div className="promo-inner"><div className="promo-copy"><span className="eyebrow"><Tag size={14}/> THE GOOD DEAL</span><h2>A little more<br/><em>style, less price.</em></h2><p>{promoProducts.length ? 'Dapatkan penawaran spesial untuk koleksi pilihan. Jangan lewatkan harga terbaiknya.' : 'Temukan koleksi favorit Anda dan tanyakan penawaran terbaru langsung kepada kami.'}</p><a className="button button-light" href={'https://wa.me/'+whatsapp+'?text='+encodeURIComponent('Halo Kacamata Store, boleh info promo terbaru?')} target="_blank" rel="noreferrer">Tanya promo <ArrowUpRight size={17}/></a></div><div className="promo-art"><div className="promo-circle"><span>UP TO</span><strong>{promoProducts.length ? Math.max(...promoProducts.map(p=>Number(p.discount_percent)||0))+'%' : 'NEW'}</strong><span>OFF SELECTED FRAMES</span></div><div className="promo-caption"><Sparkles size={15}/> {promoName}</div></div></div></section>
      <section className="about-section section-wrap" id="tentang"><div className="about-mark"><Glasses size={42}/><span>SEE<br/>BETTER.</span></div><div className="about-copy"><span className="eyebrow">A CLEARER POINT OF VIEW</span><h2>Good vision.<br/><em>Great expression.</em></h2><p>Kami percaya kacamata bukan hanya tentang melihat lebih jelas, tetapi juga cara mengekspresikan diri. Pilih frame yang membuat Anda nyaman menjadi diri sendiri.</p><a href={'https://wa.me/'+whatsapp} target="_blank" rel="noreferrer" className="text-link">Kenali kami lebih dekat <ArrowUpRight size={16}/></a></div></section>
    </main>
    <footer className="site-footer"><div className="footer-top"><button className="brand" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}><span className="brand-mark"><Glasses/></span>KACAMATA<span className="brand-light">STORE.</span></button><p>See the world in your own style.</p><a className="button button-light" href={'https://wa.me/'+whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Hubungi kami</a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Kacamata Store. All rights reserved.</span><span>Designed for your everyday vision.</span><button onClick={()=>setAdmin(true)}>Admin access</button></div></footer>
    {detail && <ProductDetail product={detail} onClose={()=>setDetail(null)} whatsapp={whatsapp}/>}
    {admin && <Admin onClose={()=>setAdmin(false)}/>}
    <a className="whatsapp-float" href={'https://wa.me/'+whatsapp+'?text='+encodeURIComponent('Halo Kacamata Store, saya ingin bertanya tentang produk.')} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp"><MessageCircle size={23}/></a>
  </>
}