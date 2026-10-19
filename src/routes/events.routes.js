import express from 'express';
import { createEvent, getEventSeats, getLatestEvent } from '../controllers/events.controller.js';

const router = express.Router();

router.post('/events', createEvent);
router.get('/events/:id/seats', getEventSeats);
router.get('/events/latest', getLatestEvent);

export default router;