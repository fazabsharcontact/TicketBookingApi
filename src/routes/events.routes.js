import express from 'express';
import { createEvent, getEventSeats } from '../controllers/events.controller.js';

const router = express.Router();

router.post('/events', createEvent);
router.get('/events/:id/seats', getEventSeats);

export default router;