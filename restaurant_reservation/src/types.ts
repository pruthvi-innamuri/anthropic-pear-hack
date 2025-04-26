import { z } from 'zod';

export const bookReservationParamsSchema = z.object({
  date: z.string().describe('The desired date for the reservation (e.g., \"YYYY-MM-DD\").'),
  region: z.string().describe('The region or neighborhood where the restaurant is located (e.g., \"SoHo, New York\").'),
  time_preference: z.string().describe('The preferred time for the reservation (e.g., \"around 7 PM\", \"lunchtime\").'),
});

export type BookReservationParams = z.infer<typeof bookReservationParamsSchema>; 