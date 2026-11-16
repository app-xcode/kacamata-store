# Kacamata Store

Toko online kacamata berbasis React 19, Vite, Tailwind CSS v4, dan Supabase.

## Fitur
- Katalog produk, pencarian, kategori, detail produk, dan harga promo.
- Pemesanan langsung melalui WhatsApp.
- Dashboard admin untuk produk, foto, promosi, dan pengaturan toko.
- Supabase Auth, PostgreSQL, Storage, Row Level Security, dan Edge Function.

## Menjalankan lokal
```bash
npm install
cp .env.example .env
npm run dev
```
Isi konfigurasi Supabase pada `.env`. Jangan pernah memasukkan service-role key ke frontend.

## Deploy GitHub Pages
Aktifkan **Settings → Pages → Build and deployment → GitHub Actions**. Workflow pada `.github/workflows/deploy.yml` akan membangun dan menerbitkan situs secara otomatis setiap kali ada push ke `main`.

## Admin
Buat akun admin di Supabase Authentication dengan email admin yang sudah ditetapkan. Trigger database akan memberi role admin pada email tersebut.
