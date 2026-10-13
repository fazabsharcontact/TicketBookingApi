import request from 'supertest';
import app from '../src/app.js';
import db from '../src/config/db.js';

describe('Uji konkurensi pemesanan tiket versi naif (versi aman - transaksi & locking)', () => {
    let targetSeatId;

    beforeAll(async () => {
        await db.query('TRUNCATE bookings, seats, events RESTART IDENTITY CASCADE');

        const eventRes = await db.query(
            "INSERT INTO events (name, starts_at) VALUES ('Event Uji Konkurensi', NOW()) RETURNING id"
        );
        const evenId = eventRes.rows[0].id;

        const seatRes = await db.query(
            "INSERT INTO seats (event_id, label, status) VALUES (\$1, 'Seat-War-1', 'available') RETURNING id",
            [evenId]
        );
        targetSeatId = seatRes.rows[0].id;
    });

    afterAll(async () => {
        await db.pool.end();
    });

    it('HARUS BERHASILL: Membuktikan hanya satu pembeli yang lolos saat ada pemesanan serentak', async () => {
        const jumlahPermintaanSerentak = 10;
        const promises = [];

        // Siapkan 10 request serentak ke API api/bookings
        for (let i = 1; i <= jumlahPermintaanSerentak; i++) {
            promises.push(
                request(app)
                .post('/api/bookings')
                .send({
                    seat_id: targetSeatId,
                    user_email: `pembeli-${i}@example.com`,
                    idempotency_key: `key-konkuren-${i}`
                })
            );
        }

        // Eksekusi semua request secara bersamaan (simulasi war tiket)
        const response = await Promise.all(promises);

        // Hitung berapa banyak request yang mendapatkan status 201 (berhasil)
        const suksesPesan = response.filter(res => res.status === 201);

        console.log(`Hasil war tiket aman: terdapat ${suksesPesan.length} pemesanan yang sukses untuk 1 kursi yang sama`);

        // ambil data asli dari database
        const bookingDb = await db.query('SELECT * FROM bookings WHERE seat_id = \$1', [targetSeatId]);

        // seharusnya hanya boleh ada satu request yang mendapatkan status 201 (berhasil)
        // jika kode versi naif salah, terdapat lebih dari satu request yang berhasil 
        expect(bookingDb.rows.length).toBe(1);
    }, 15000);
});