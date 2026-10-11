import db from '../config/db.js';
import { CreateBookingSchema } from '../validators/bookings.validator.js';
import { z } from 'zod';

export const createBookingNaive = async (req, res) => {
    try {
        // validasi input
        const validatedData = CreateBookingSchema.parse(req.body);
        const { seat_id, user_email, idempotency_key } = validatedData;

        // mengecek apakah kursi tersedia (langkah naif)
        const seatCheck = await db.query(`SELECT * FROM seats WHERE id = $1`, [seat_id]);

        if (seatCheck.rows.length[0] === 0) {
            return res.status(404).json({ status: 'NOT_FOUND', message: 'Kursi tidak tersedia'});
        }

        const seat = seatCheck.rows[0];
        if (seat.status === 'sold') {
            return res.status(409).json({ status: 'CONFLICT', message: 'Kursi sudah terjual'});
        }

        // ubah status kursi menjadi sold
        await db.query('UPDATE seats SET status = \'sold\' WHERE id = $1', [seat_id]);

        // masukan data ke tabel booking
        const bookingResult = await db.query(
            'INSERT INTO bookings (seat_id, user_email, idempotency_key) VALUES ($1, $2, $3) RETURNING *',
            [seat_id, user_email, idempotency_key]
        );

        res.status(201).json({
            status: 'SUCCESS',
            message: 'kursi berhasil dipesan',
            data: bookingResult.rows[0]
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                status: 'VALIDATION_ERROR',
                error: error.errors.map(err => err.message)
            });
        }

         // menangani error jika idempotency_key error di tingkat database
         if (error.code === '23505') {
            return res.status(409).json({ status: 'CONFLICT', message: 'Transaksi duplikat (idempotency_key telah digunakan)'});
         }
         res.status(500).json({ status: 'ERROR', message: error.message });
    }
};