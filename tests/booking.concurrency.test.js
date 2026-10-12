import request from 'supertest';
import app from '../src/app.js';
import db from '../src/config/db.js';

describe('Uji konkurensi pemesanan tiket versi naif', () => {
    let targetSeatID;

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
        targetSeatID = seatRes.rows[0].id;
    });

    afterAll(async () => {
        await db.pool.emd();
    });
})