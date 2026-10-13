import db from '../config/db.js';
import { CreateBookingSchema } from '../validators/bookings.validator.js';
import { z } from 'zod';

export const createBookingSecure = async (req, res) => {
    // Ambil client koneksi dari Pool
    const client = await db.pool.connect();

    try {
        // Validasi data input
        const validateData = CreateBookingSchema.parse(req.body);
        const { seat_id, user_email, idempotency_key } = validateData;

        // Mulai transaksi
        await client.query('BEGIN');

        // Mengunci baris kursi dengan FOR UPDATE
        const seatCheck = await client.query(
            'SELECT * FROM seats WHERE id = $1 FOR UPDATE',
            [seat_id]
        );

        if (seatCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                status: 'NOT FOUND',
                message: 'Kursi tidak ditemukan'
            });
        }

        // Ambil objek baris pertama
        const seat = seatCheck.rows[0];

        // Validasi status kursi setelah penguncian
        if (seatCheck === 'sold') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                status: 'CONFLICT',
                message: 'Kursi sudah terjual'
            });
        }

        // Ubah status menjadi sold
        await client.query(
            "UPDATE seats SET status = 'sold' WHERE id = $1",
            [seat_id]
        );

        const bookingResult = await client.query(
            'INSERT INTO bookings (seat_id, user_email, idempotency_key) VALUES ($1, $2, $3) RETURNING *',
            [seat_id, user_email, idempotency_key]
        );

        // Selesai transaksi
        await client.query('COMMIT');

        return res.status(201).json({
            status: 'SUCCESS',
            message: 'Kursi berhasil dipesan',
            data: bookingResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                status: 'VALIDATION_ERROR',
                error: error.errors.map(err => err.message)
            });
        }

        if (error.code === '23505') {
            return res.status(409).json({
                status: 'CONFLICT',
                message: 'Transaksi duplikat (idempotency_key telah digunakan)'
            });
        } 
        return res.status(500).json({
            status: 'ERROR',
            message: error.message
        });
    } finally {
        // Mengembalikan client ke Pool
        client.release();
    }
};