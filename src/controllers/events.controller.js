import db from "../config/db.js";
import { createEventSchema } from '../validators/events.validator.js';
import { z } from 'zod';

export const createEvent = async (req, res) => {
    try {
        // validasi input menggunakan zod
        const validatedData = createEventSchema.parse(req.body);
        const { name, starts_at, total_seats } = validatedData;

        // menyimpan event ke database
        const eventResult = await db.query(
            `INSERT INTO events (name, starts_at) VALUES (\$1, \$2) RETURNING *`, [name, starts_at]
        );
        const newEvent = eventResult.rows[0];

        // generate kursi otomatis berdasarkan total_seats
        const seatQueries = [];
        for (let i = 1; i <= total_seats; i++) {
            const label = `Seat-${i}`;
            seatQueries.push(
                db.query('INSERT INTO seats (event_id, label) VALUES (\$1, \$2)', [newEvent.id, label]) 
            );
        }

        // jalankan semua query INSERT secara bersamaan
        await Promise.all(seatQueries);

        res.status(201).json({
            status: 'SUCCESS',
            message: 'Acara dan kursi berhasil dibuat',
            data: {
                event: newEvent,
                total_seats_created: total_seats
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            //mengembalikan pesan error dari zod
            return res.status(400).json({
                status: 'VALIDATION_ERROR',
                errors: error.errors.map(err => err.message)
            });
        }
        res.status(500).json({ status: 'ERROR', message: error.message});
    }
};

export const getEventSeats = async (req, res) => {
    try {
        const { id } = req.params;

        // mengecek ketersediaan event
        const eventCheck = await db.query('SELECT * FROM events WHERE id = \$1', [id]);
        if (eventCheck === 0) {
            return res.status(404).json({ status: 'NOT_FOUND', message: 'Acara tidak ditemukan' });
        };

        // ambil semua kursi milik event tersebut
        const seatsResult = await db.query(
            'SELECT id, label, status FROM seats WHERE event_id = \$1 ORDER BY id ASC', [id]
        );

        res.json({
            status: 'SUCCESS',
            data: {
                event: eventCheck.rows[0],
                seats: seatsResult.rows
            }
        });

    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
};

export const getLatestEvent = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM events ORDER BY id DESC LIMIT 1');

        if (result.rows.length === 0) {
            return res.json({ status: 'EMPTY', message: 'Belum ada acara di database' });
        }

        res.json({
            status: 'SUCCESS',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
};