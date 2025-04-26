"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookReservationParamsSchema = void 0;
const zod_1 = require("zod");
exports.bookReservationParamsSchema = zod_1.z.object({
    date: zod_1.z.string().describe('The desired date for the reservation (e.g., "YYYY-MM-DD").'),
    region: zod_1.z.string().describe('The region or neighborhood where the restaurant is located (e.g., "SoHo, New York", "San Francisco Bay Area").'),
    time_preference: zod_1.z.string().describe('The preferred time for the reservation (e.g., "around 7 PM", "lunchtime", "8:30 PM").'),
    search_term: zod_1.z.string().describe('The restaurant name, cuisine, or type of place to search for (e.g., "Italian food", "Nobu").'),
    party_size: zod_1.z.number().int().positive().optional().default(2).describe('The number of people in the party (defaults to 2).'),
});
