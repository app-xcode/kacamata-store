import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key) : null
export const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '6282144733128'

export const rupiah = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(Number(value || 0))

export const whatsappLink = (product, number = whatsappNumber) => {
  const message = [
    'Halo Kacamata Store, saya tertarik dengan produk:',
    product.name,
    'Harga: ' + rupiah(product.sale_price ?? product.price),
    product.slug ? 'https://app-xcode.github.io/kacamata-store/#produk/' + product.slug : '',
    'Apakah produk ini masih tersedia?'
  ].filter(Boolean).join('\n')
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message)
}