import express from 'express';
import db from './config/db.js';
import eventRoutes from './routes/events.routes.js';
import bookingRoutes from './routes/bookings.routes.js';

const app = express();

app.use(express.json());

app.use(express.static('public'));

// route dasar & health check
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            status: 'OK',
            message: 'Server berhasil terhubung.',
            db_time: result.rows[0].now
        });
    } catch (error) {
        console.error(`Error saat health check:`, error.message);
        res.status(500).json({
            status: 'ERROR',
            message: 'Server gagal terhubung dengan database.',
            error: error.message
        });
    }
});

// mendaftarkan route event api
app.use('/api', eventRoutes);
app.use('/api', bookingRoutes);

export default app;