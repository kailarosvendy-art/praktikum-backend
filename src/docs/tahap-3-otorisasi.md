# Tahap 3 — Authentication, role, dan otorisasi

## Aturan akses yang diterapkan

| Endpoint | Akses |
| --- | --- |
| `GET /api/v1/stalls`, `GET /api/v1/stalls/:id` | Publik |
| `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | Publik |
| `GET /api/v1/auth/me` | Semua role dengan Bearer token valid |
| `POST /api/v1/stalls/:id/reviews` | Semua role yang sudah login |
| `POST /api/v1/stalls` | `owner` atau `admin` |
| `PUT /api/v1/stalls/:id` | `admin`, atau `owner` untuk warung miliknya |
| `DELETE /api/v1/stalls/:id` | `admin` saja |

Route CRUD lain yang masih terbawa dari project Tugas 2 (`/users`,
`/menu-items`, `/reviews`, `/likes`, `/flags`, dan `/audit`) juga dibatasi
khusus admin agar tidak menjadi endpoint publik di luar matriks tugas.

Token tidak ada/tidak valid menghasilkan `401`. Token valid dengan role yang
tidak diizinkan, atau owner yang mengubah warung orang lain, menghasilkan
`403`. Saat membuat warung, `ownerId` diambil dari klaim JWT; saat membuat
review, `userId` juga diambil dari JWT. Kedua field tidak diterima dari body.
Pada endpoint like dan audit Tugas 2 yang dibatasi admin, identitas pelaku
juga berasal dari token admin, bukan `userId` di body.

## Persiapan akun owner/admin untuk pengujian

Register biasa menghasilkan akun `customer` dan endpoint publik tidak
memperbolehkan pengguna menaikkan role dirinya sendiri. Untuk menguji role
owner/admin di database development lokal:

1. Register tiga akun uji melalui `POST /api/v1/auth/register`, misalnya
   `owner-a@example.com`, `owner-b@example.com`, dan `admin@example.com`.
2. Ubah role hanya pada database lokal yang digunakan untuk praktikum:

   ```sql
   UPDATE dbo.USERS SET role = 'owner' WHERE email = N'owner-a@example.com';
   UPDATE dbo.USERS SET role = 'owner' WHERE email = N'owner-b@example.com';
   UPDATE dbo.USERS SET role = 'admin' WHERE email = N'admin@example.com';
   ```

3. Login kembali untuk masing-masing akun setelah perubahan role, lalu gunakan
   token baru. Role disimpan di dalam token saat login, sehingga token lama
   tetap membawa role lama sampai kedaluwarsa.
4. Buat satu warung dengan token owner A. Buat data uji seperlunya saja dan
   jangan menaikkan role akun di database produksi.

## Bukti screenshot yang disarankan

Di `http://localhost:3000/docs`, pakai **Authorize** untuk mengirim
`Bearer <token>` kepada endpoint terlindungi. Hapus token/keluar dari
Authorize untuk uji tanpa autentikasi.

1. **`01-401-tanpa-token.png`** — panggil
   `POST /api/v1/stalls` tanpa token. Harapkan `401`.
2. **`02-403-role-customer.png`** — login sebagai customer lalu panggil
   `POST /api/v1/stalls`. Harapkan `403`.
3. **`03-owner-buat-warung.png`** — login sebagai owner A, panggil
   `POST /api/v1/stalls` dengan `{"name":"Warung Uji A"}`. Harapkan `201`;
   tunjukkan `ownerId` pada respons sama dengan id pemilik token. Body tidak
   mengandung `ownerId`.
4. **`04-403-warung-owner-lain.png`** — login sebagai owner B, panggil
   `PUT /api/v1/stalls/{id-warung-milik-owner-A}` dengan body
   `{"name":"Percobaan ubah"}`. Harapkan `403`.
5. **`05-owner-ubah-warung-sendiri.png`** — sebagai owner A, ubah warungnya
   sendiri melalui `PUT /api/v1/stalls/{id}`. Harapkan `200`.
6. **`06-403-hapus-oleh-owner.png`** — coba
   `DELETE /api/v1/stalls/{id}` sebagai owner. Harapkan `403`.
7. **`07-admin-hapus-warung.png`** — ulangi delete memakai token admin.
   Harapkan `200`.
8. **`08-review-token-user.png`** — login sebagai customer (atau role lain),
   lalu panggil `POST /api/v1/stalls/{id}/reviews` dengan
   `{"rating":5,"comment":"Enak"}`. Harapkan `201`; identitas user di record
   berasal dari token. Menambahkan `userId` ke body sengaja ditolak `400`.
9. **`09-swagger-role-access.png`** — tunjukkan endpoint yang memiliki
   autentikasi Bearer pada Swagger UI.

Pada setiap bukti, pastikan URL/method, hasil status HTTP, dan response body
terlihat. Sensor token, password, dan informasi pribadi sebelum memasukkan
gambar ke PDF. Untuk owner B, pastikan id yang diuji memang milik owner A dan
sertakan caption yang menjelaskan kedua akun berbeda.

## Penjelasan laporan

Simpan laporan akhir sebagai `NIM_Nama.pdf`. Jelaskan urutan middleware:
verifikasi JWT (`401`), pemeriksaan role (`403`), validasi request, lalu
controller/service. Terangkan bahwa pemeriksaan kepemilikan dilakukan dengan
membandingkan id owner pada data warung dengan `id` dari JWT, dan bahwa
`ownerId`/`userId` tidak dipercaya dari body request.
