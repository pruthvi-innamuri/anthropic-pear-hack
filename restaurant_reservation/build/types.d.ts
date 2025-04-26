import { z } from 'zod';
export declare const bookReservationParamsSchema: z.ZodObject<{
    date: z.ZodString;
    region: z.ZodString;
    time_preference: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: string;
    region: string;
    time_preference: string;
}, {
    date: string;
    region: string;
    time_preference: string;
}>;
export type BookReservationParams = z.infer<typeof bookReservationParamsSchema>;
