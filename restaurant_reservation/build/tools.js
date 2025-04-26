"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.book_reservation = void 0;
const agent_tools_1 = require("@shared/agent-tools");
const types_1 = require("./types");
const sdk_1 = require("@stagehand/sdk");
const sdk_2 = require("@browserbasehq/sdk");
// Helper function to format date for Stagehand instruction (example)
const getDayAriaLabel = (dateString) => {
    try {
        const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone
        // Format like "Saturday, April 27"
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    catch (e) {
        console.error('Error parsing date:', e);
        return 'invalid date'; // Handle error appropriately
    }
};
// Helper function to map time preference to dropdown value (example)
const mapTimeToValue = (timePref) => {
    const timeMatch = timePref.match(/(\d{1,2}):?(\d{2})?\s?(AM|PM)/i);
    if (!timeMatch)
        return undefined; // Handle cases like "lunchtime"
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3].toUpperCase();
    if (period === 'PM' && hour !== 12)
        hour += 12;
    if (period === 'AM' && hour === 12)
        hour = 0; // Midnight
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    // OpenTable uses values like "2000-02-01T19:00:00"
    return `2000-02-01T${formattedHour}:${formattedMinute}:00`;
};
exports.book_reservation = (0, agent_tools_1.defineTool)({
    name: 'book_reservation',
    description: 'Finds and initiates a reservation booking process on OpenTable based on the provided date, region, and time preference using browser automation.',
    inputSchema: types_1.bookReservationParamsSchema,
    // Note: Destructure all params including the new ones
    handler: (_a) => __awaiter(void 0, [_a], void 0, function* ({ date, region, time_preference, search_term, party_size }) {
        console.log(`Attempting to book reservation via OpenTable for ${party_size} people on ${date} in ${region} around ${time_preference} for "${search_term}"`);
        const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
        // const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID; // Removed
        if (!browserbaseApiKey) {
            throw new Error('Browserbase API key is not set in environment variables.');
        }
        const browserbase = new sdk_2.Browserbase({
            apiKey: browserbaseApiKey,
        });
        const stagehand = new sdk_1.Stagehand(browserbase, {
        // Optional: Configure Stagehand further if needed
        });
        let resultMessage = `Failed to automate OpenTable for region ${region}.`;
        try {
            yield stagehand.connect();
            console.log('Browser session connected.');
            yield stagehand.navigate('https://www.opentable.com');
            console.log('Navigated to OpenTable.');
            yield stagehand.act('Click the button with aria-label "Toggle location picker"');
            console.log('Clicked location picker.');
            // Added slight delay in case the location list needs time to render
            yield new Promise(resolve => setTimeout(resolve, 500));
            yield stagehand.act(`Click the link for the region "${region}"`);
            console.log(`Selected region: ${region}`);
            // --- New Steps --- 
            // 1. Type search term
            yield stagehand.act(`Type "${search_term}" into the input field with placeholder "Location, Restaurant or Cuisine"`);
            console.log(`Typed search term: "${search_term}"`);
            // 2. Click "Find a table" button
            yield stagehand.act('Click the button with aria-label "Find a table"');
            console.log('Clicked "Find a table". Waiting for page load...');
            // Add a wait/check here if needed to ensure search results page loads
            yield new Promise(resolve => setTimeout(resolve, 2000)); // Simple delay, might need better wait
            // 3. Update Party Size 
            yield stagehand.act(`Select the option for "${party_size}" in the party size dropdown`); // Stagehand should find the dropdown via label/test id
            console.log(`Set party size to: ${party_size}`);
            // 4. Update Time 
            const timeValue = mapTimeToValue(time_preference);
            if (timeValue) {
                yield stagehand.act(`Select the option with value "${timeValue}" in the time selector dropdown`);
                console.log(`Set time preference to: ${time_preference} (value: ${timeValue})`);
            }
            else {
                console.log(`Could not map time preference "${time_preference}" to a value. Skipping time selection.`);
            }
            // 5. Update Date
            yield stagehand.act('Click the date picker button'); // Clicks the button showing the current date
            console.log('Clicked date picker.');
            yield new Promise(resolve => setTimeout(resolve, 500)); // Wait for calendar
            const dateLabel = getDayAriaLabel(date);
            // TODO: Handle month navigation if needed - Stagehand might need help
            // e.g., observe() to check current month, act() to click next/prev if dateLabel not found
            yield stagehand.act(`Click the button with aria-label "${dateLabel}"`);
            console.log(`Selected date: ${date} (label: ${dateLabel})`);
            // --- End New Steps ---
            // --- Select Restaurant --- 
            console.log('Selecting the first restaurant from search results...');
            // TODO: Implement smarter selection logic. Observe/Extract details of top results 
            //       and choose based on relevance to search_term or other criteria.
            // Using a common selector pattern for OpenTable restaurant cards.
            yield stagehand.act('Click the first element matching selector `[data-test="restaurant-card"]`');
            console.log('Clicked the first restaurant card. Waiting for restaurant page load...');
            // Add a wait/check here if needed to ensure the restaurant page loads
            yield new Promise(resolve => setTimeout(resolve, 2000)); // Simple delay
            // Placeholder for subsequent steps (finding/clicking time slot, filling details)
            console.log('Restaurant page loaded. Further actions needed to book.');
            resultMessage = `Successfully selected the first restaurant for "${search_term}" on ${date}. Further steps needed.`; // Updated message
        }
        catch (error) {
            console.error('Error during OpenTable automation:', error);
            resultMessage = `Failed during OpenTable automation for region ${region}. Error: ${error instanceof Error ? error.message : String(error)}`;
        }
        finally {
            if (stagehand.isConnected) {
                yield stagehand.close();
                console.log('Browser session closed.');
            }
        }
        return resultMessage;
    }),
});
