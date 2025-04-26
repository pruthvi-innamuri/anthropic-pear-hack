"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookReservationParamsSchema = void 0;
const zod_1 = require("zod");
exports.bookReservationParamsSchema = zod_1.z.object({
    date: zod_1.z.string().describe('The desired date for the reservation (e.g., \"YYYY-MM-DD\").'),
    region: zod_1.z.string().describe('The region or neighborhood where the restaurant is located (e.g., \"SoHo, New York\").'),
    time_preference: zod_1.z.string().describe('The preferred time for the reservation (e.g., \"around 7 PM\", \"lunchtime\").'),
});
