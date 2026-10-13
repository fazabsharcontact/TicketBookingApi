import express from 'express';
import { createBookingSecure } from '../controllers/bookings.controller.js';

const router = express.Router();

router.post('/bookings', createBookingSecure);

export default router;