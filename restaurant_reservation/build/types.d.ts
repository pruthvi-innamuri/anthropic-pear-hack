import { z } from 'zod';
export declare const bookReservationParamsSchema: z.ZodObject<{
    date: z.ZodString;
    region: z.ZodString;
    time_preference: z.ZodString;
    search_term: z.ZodString;
    party_size: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    region: string;
    time_preference: string;
    search_term: string;
    party_size: number;
}, {
    date: string;
    region: string;
    time_preference: string;
    search_term: string;
    party_size?: number | undefined;
}>;
export type BookReservationParams = z.infer<typeof bookReservationParamsSchema>;
