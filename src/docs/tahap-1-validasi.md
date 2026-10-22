# Tahap 1 — Validasi input dan format error

## Menjalankan API

Jalankan dari folder `tugas_3_validasi_error_auth`:

```powershell
npm install
npm run dev
```

API berjalan di `http://localhost:3000`; dokumentasi Swagger UI tersedia di
`http://localhost:3000/docs`. Rute API warung menggunakan prefix `/api/v1`.
Kegagalan validasi tidak mengakses database, jadi request invalid bisa diuji
tanpa SQL Server.

## Uji melalui HTTP

Contoh di bawah menggunakan PowerShell `Invoke-RestMethod`:

```powershell
try {
  Invoke-RestMethod -Method Get `
    -Uri 'http://localhost:3000/api/v1/stalls?page=0'
} catch {
  $_.ErrorDetails.Message
}
```

Respons harus berstatus HTTP `400` dan memiliki format yang sama untuk setiap
kesalahan input:

```json
{
  "status": "fail",
  "message": "Validasi gagal",
  "errors": [
    {
      "field": "page",
      "message": "page minimal 1"
    }
  ]
}
```

Request invalid lain yang dapat dipakai. Endpoint yang terlindungi (POST/PUT
warung dan POST review) membutuhkan token owner/admin; gunakan **Authorize**
di Swagger UI atau kirim header Authorization saat mengujinya.

```powershell
# Params id bukan bilangan bulat positif
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/v1/stalls/abc'

# Nama terlalu pendek; kirim header Authorization: Bearer <token-owner>
Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:3000/api/v1/stalls' `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $tokenOwner" } `
  -Body '{"name":"x"}'

# Nama dengan tipe tidak valid pada body update
Invoke-RestMethod -Method Put `
  -Uri 'http://localhost:3000/api/v1/stalls/1' `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $tokenOwner" } `
  -Body '{"name":42}'

# Rating di luar rentang 1–5
Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:3000/api/v1/stalls/1/reviews' `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $tokenCustomer" } `
  -Body '{"rating":9}'
```

`GET /api/v1/stalls` juga menerima `search`, `category`, `page`, dan `limit`;
nilai `page` minimal 1 dan `limit` berada dalam rentang 1–100. Query yang valid
akan dikonversi ke tipe number sebelum dipakai controller.

## Uji melalui Swagger UI dan bukti screenshot

1. Buka `http://localhost:3000/docs`, lalu cari `GET /api/v1/stalls/`.
2. Pilih **Try it out**, isi `page` dengan `0`, lalu pilih **Execute**.
3. Ambil screenshot yang menampilkan URL request, HTTP `400`, dan JSON
   `status`, `message`, serta array `errors`.
4. Body `{}` pada PUT valid sebagai update parsial tanpa perubahan. Untuk uji
   error body, kirim field yang tidak sesuai tipe, misalnya `{"name":42}`.
   Ulangi pada `GET /api/v1/stalls/{id}` dengan `id=abc`, atau
   `POST /api/v1/stalls/` dengan `name="x"` untuk membuktikan
   validasi params dan body (POST memerlukan token owner/admin).
5. Simpan bukti dengan nama yang jelas, misalnya
   `01-validasi-query.png`, `02-validasi-params.png`, dan
   `03-validasi-body.png`.

## Format penjelasan untuk laporan PDF

Simpan laporan akhir sebagai `NIM_Nama.pdf`. Untuk subbab Tahap 1, tulis:

- Tujuan: validasi query, params, dan body menggunakan Zod sebelum controller
  memproses request.
- Implementasi: middleware `validate` menyimpan hasil parse Zod dan meneruskan
  kegagalan ke error handler global.
- Hasil: request tidak valid mendapat HTTP `400` dengan satu bentuk respons
  `status: "fail"`, `message`, serta `errors` berisi `field` dan `message`.
- Bukti: masukkan screenshot pengujian query, params/body, dan Swagger UI
  beserta caption request dan hasil yang diharapkan.

Schema register, login, `GET /auth/me`, serta body review bertingkat juga telah
disiapkan. Panduan register dan login tersedia di
[tahap-2-autentikasi.md](./tahap-2-autentikasi.md); route review bertingkat
dilindungi autentikasi dan dokumentasinya ada di
[tahap-3-otorisasi.md](./tahap-3-otorisasi.md).
