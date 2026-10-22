# Tahap 2 — Register, login, password hash, dan JWT

## Konfigurasi dan menjalankan API

Pastikan `.env` berisi `JWT_SECRET` acak sekurang-kurangnya 32 byte. Buat nilai
rahasia baru dengan:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Tambahkan hasilnya sendiri ke `.env`; jangan masukkan secret asli ke laporan
atau commit. `.env.example` hanya berisi placeholder. Jalankan server dari
folder proyek:

```powershell
npm run dev
```

Base URL API adalah `http://localhost:3000/api/v1`; Swagger UI ada di
`http://localhost:3000/docs`.

## Endpoint autentikasi

### `POST /auth/register`

Body:

```json
{
  "name": "Budi Santoso",
  "email": "BUDI@example.com",
  "password": "password123"
}
```

Email di-trim dan diubah menjadi lowercase. Password di-hash dengan bcrypt
sebelum disimpan. Role pendaftaran baru ditentukan server (`customer`); field
`role` tidak diperbolehkan dari client. Respons `201` hanya berisi profil
publik, tanpa password atau hash. Email duplikat menghasilkan `409`.

### `POST /auth/login`

Gunakan email dan password yang sama seperti saat register. Jika kredensial
cocok, respons memberikan JWT bertipe Bearer yang kedaluwarsa dalam dua jam.
Email yang tidak terdaftar dan password yang salah sama-sama menghasilkan
`401` dengan pesan generik.

### `GET /auth/me`

Kirim header `Authorization: Bearer <token>` dari hasil login. Profil
dikembalikan dari klaim JWT yang sudah diverifikasi; endpoint ini tidak
mengambil identitas dari body request. Token hilang, invalid, atau kedaluwarsa
menghasilkan `401`.

## Uji lewat Swagger UI

1. Buka `http://localhost:3000/docs`, lalu jalankan `POST /api/v1/auth/register`
   dengan data baru. Screenshot request, HTTP `201`, dan profil tanpa password.
2. Jalankan `POST /api/v1/auth/login` dengan email hasil normalisasi (lowercase)
   serta password yang didaftarkan. Screenshot HTTP `200` dan respons token.
   Jangan tampilkan token di laporan yang dibagikan secara publik.
3. Salin token ke **Authorize** sebagai `Bearer <token>`, lalu jalankan
   `GET /api/v1/auth/me`. Screenshot status `200` dan profil yang sama.
4. Hapus token dari **Authorize**, panggil `GET /api/v1/auth/me` lagi, dan
   screenshot status `401`.
5. Gunakan email terdaftar tetapi password salah pada login dan screenshot
   status `401`.

Simpan bukti misalnya sebagai `04-register.png`, `05-login.png`,
`06-auth-me.png`, dan `07-auth-401.png`.

## Bukti password ter-hash di SQL Server

Jalankan query berikut pada database `review_kantin` menggunakan email uji
yang Anda daftarkan. Query menampilkan awalan algoritma, bukan password:

```sql
SELECT id, name, email, role, LEFT(password_hash, 7) AS hash_prefix
FROM dbo.USERS
WHERE email = N'budi@example.com';
```

Nilai `hash_prefix` yang diharapkan dimulai dengan `$2a$`, `$2b$`, atau `$2y$`
(format bcrypt); tidak sama dengan password yang dikirim. Untuk bukti yang
memperlihatkan nilai tersimpan, Anda bisa memilih `password_hash` di SSMS
secara lokal lalu menyensor sebagian hash pada screenshot. Jangan tampilkan
password asli atau JWT di screenshot database.

## Penjelasan untuk laporan PDF

Simpan laporan akhir sebagai `NIM_Nama.pdf`. Pada subbab autentikasi, jelaskan
alur register → bcrypt hash → database, alur login → verifikasi password →
JWT, dan penggunaan klaim token pada `GET /auth/me`. Sertakan screenshot
register, login, akses profil, uji `401`, serta hasil pemeriksaan hash database
dengan caption dan status HTTP yang diharapkan.

Untuk bukti pengujian role dan pemilik warung pada Tahap 3, lihat
[panduan Tahap 3](./tahap-3-otorisasi.md).
