import db from '../config/db.js';
import { CreateBookingSchema } from '../validators/bookings.validator.js';
import { z } from 'zod';

export const createBookingSecure = async (req, res) => {
    // 1. Ambil 1 client koneksi khusus dari pool untuk isolasi transaksi
    const client = await db.pool.connect();
    
    try {
        // Validasi input menggunakan zod
        const validatedData = CreateBookingSchema.parse(req.body);
        const { seat_id, user_email, idempotency_key } = validatedData;

        // 2. MULAI TRANSAKSI
        await client.query('BEGIN');

        // 3. Kunci baris kursi di PostgreSQL secara ketat
        const seatCheck = await client.query(
            'SELECT * FROM seats WHERE id = $1 FOR UPDATE', 
            [seat_id]
        );

        if (seatCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ status: 'NOT_FOUND', message: 'Kursi tidak tersedia'});
        }

        // AKURAT: Ambil baris pertama hasil query
        const seat = seatCheck.rows[0]; 
        
        // Cek status asli dari database pasca penguncian
        if (seat.status === 'sold') {
            await client.query('ROLLBACK');
            return res.status(409).json({ status: 'CONFLICT', message: 'Kursi sudah terjual'});
        }

        // 4. Ubah status kursi menjadi sold (WAJIB pakai client.query)
        await client.query("UPDATE seats SET status = 'sold' WHERE id = $1", [seat_id]);

        // 5. Masukkan data ke tabel booking (WAJIB pakai client.query)
        const bookingResult = await client.query(
            'INSERT INTO bookings (seat_id, user_email, idempotency_key) VALUES ($1, $2, $3) RETURNING *',
            [seat_id, user_email, idempotency_key]
        );

        // 6. KOMIT TRANSAKSI PERMANEN
        await client.query('COMMIT');

        return res.status(201).json({
            status: 'SUCCESS',
            message: 'Kursi berhasil dipesan',
            data: bookingResult.rows[0]
        });

    } catch (error) {
        // Batalkan seluruh rangkaian query di atas jika terjadi tabrakan/gagal di tengah jalan
        await client.query('ROLLBACK');

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                status: 'VALIDATION_ERROR',
                error: error.errors.map(err => err.message)
            });
        }

         if (error.code === '23505') {
            return res.status(409).json({ status: 'CONFLICT', message: 'Transaksi duplikat (idempotency_key telah digunakan)'});
         }
         return res.status(500).json({ status: 'ERROR', message: error.message });
    } finally {
        // 7. Selalu kembalikan client ke dalam pool
        client.release();
    }
};
