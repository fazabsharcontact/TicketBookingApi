# API Pemesanan Tiket Konser (Anti Race Condition Engine)

Proyek ini adalah sistem backend **Ticket Booking API** berbasis Node.js dan PostgreSQL yang dirancang khusus untuk mengatasi masalah **Race Condition (Double-Booking)** pada skenario tingkat tinggi seperti simulasi *War Tiket Konser*. 

Sistem ini menjamin bahwa **satu kursi fisik hanya boleh sukses dipesan oleh tepat satu pembeli**, meskipun ribuan permintaan masuk pada milidetik yang sama secara serentak.

---

## Demo Antarmuka Visual

Berikut adalah tampilan visual denah kursi interaktif (Tingkat 2) yang tersinkronisasi langsung dengan basis data PostgreSQL di dalam Docker:

![Tampilan Denah Kursi Utama](./public/assets/screenshot-page.png)
*Gambar 1: Halaman utama denah kursi terintegrasi otomatis.*

### Bukti Simulasi War Tiket (Anti Race Condition)
Ketika dua pengguna membuka tab peramban terpisah secara berdampingan dan menekan tombol pesan pada satu kursi yang sama serentak, sistem mengantre transaksi secara aman:

| Tab Tercepat (Lolos Antrean) | Tab Terlambat (Ditolak) |
| --- | --- |
| ![Sukses Mengamankan Kursi](./public/assets/screenshot-success.png) | ![Gagal Terjual](./public/assets/screenshot-failed.png) |
| **Status 201 Created**: Kursi berhasil dibeli. | **Status 409 Conflict**: Kursi sudah terjual. |

---

## Fitur Utama

- **Pessimistic Locking (`FOR UPDATE`)**: Mengunci baris data kursi pada PostgreSQL selama proses validasi berlangsung agar transaksi lain mengantre secara linear.
- **Database Transactions (`BEGIN` & `COMMIT/ROLLBACK`)**: Menjaga integritas data; jika status kursi berubah di tengah jalan, seluruh rangkaian query otomatis dibatalkan bersih.
- **Automated Concurrency Testing**: Uji coba otomatis terintegrasi menggunakan Jest dan Supertest untuk menyerang API dengan 10 request serentak dalam hitungan milidetik.
- **Dynamic Local Storage Caching**: Frontend cerdas yang otomatis mendeteksi, menyimpan, dan membuat Event baru di latar belakang jika database kosong.
- **Strict Input Validation**: Validasi data aman menggunakan library `Zod`.

---

## Teknologi yang Digunakan

- **Backend**: Node.js, Express.js (ES Modules format)
- **Database**: PostgreSQL 16 (Berjalan di dalam Docker Container)
- **Testing**: Jest, Supertest
- **Validation**: Zod
- **Monitor**: Nodemon

---

## Cara Menjalankan Proyek Secara Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/fazabsharcontact/TicketBookingApi.git
cd TicketBookingApi
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Jalankan Database PostgreSQL via Docker Compose
Pastikan Docker Desktop Anda sudah menyala, kemudian ketik:
```bash
docker compose up -d
```

### 4. Masukkan Skema Database
```bash
docker exec -i ticket-booking-api-db-1 psql -U app -d tickets < db/schema.sql
```

### 5. Konfigurasi File `.env`
Buat file bernama `.env` di folder utama dan isi dengan konfigurasi berikut:
```env
PORT=3000
DATABASE_URL=postgres://app:app@localhost:5432/tickets
```

### 6. Nyalakan Aplikasi
```bash
npm run dev
```
Buka browser Anda dan akses `http://localhost:3000` untuk melihat denah kursi secara langsung.

---

## Menjalankan Uji Konkurensi Otomatis

Untuk membuktikan ketahanan sistem database *locking* terhadap serangan *race condition*, jalankan perintah pengetesan terintegrasi berikut:
```bash
npm run test
```

### Hasil Akhir Uji Coba (PASS):
```text
PASS  tests/booking.concurrency.test.js
Hasil war tiket aman: terdapat 1 pemesanan yang sukses untuk 1 kursi yang sama
```
