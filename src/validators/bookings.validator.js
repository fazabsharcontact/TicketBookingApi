import { z } from 'zod';

export const CreateBookingSchema = z.object({
    seat_id: z.number().int().positive({ message: 'ID kursi harus berupa angka bulat positif' }),
    user_email: z.string().email({ message: 'Format email tidak valid' }),
    idempotency_key: z.string().min(1, { message: 'Idempotency key wajib diisi' })
});