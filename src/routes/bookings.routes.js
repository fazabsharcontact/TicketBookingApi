import express from 'express';
import { createBookingNaive } from '../controllers/bookings.controller.js';

const router = express.Router();

router.post('/bookings', createBookingNaive);

export default router;