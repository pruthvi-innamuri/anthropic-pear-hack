var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";
// import { Browserbase } from '@browserbasehq/sdk'; // May not be needed directly
// Helper function to format date for Stagehand instruction (example)
const getDayAriaLabel = (dateString) => {
    try {
        const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    catch (e) {
        console.error('Error parsing date:', e);
        return 'invalid date';
    }
};
// Helper function to map time preference to dropdown value (example)
const mapTimeToValue = (timePref) => {
    const timeMatch = timePref.match(/(\d{1,2}):?(\d{2})?\s?(AM|PM)/i);
    if (!timeMatch)
        return undefined;
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3].toUpperCase();
    if (period === 'PM' && hour !== 12)
        hour += 12;
    if (period === 'AM' && hour === 12)
        hour = 0;
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    return `2000-02-01T${formattedHour}:${formattedMinute}:00`;
};
// Define the input schema shape
const bookReservationParamsShape = {
    date: z.string().describe('The desired date for the reservation (e.g., "YYYY-MM-DD").'),
    region: z.string().describe('The region or neighborhood where the restaurant is located (e.g., "SoHo, New York", "San Francisco Bay Area").'),
    time_preference: z.string().describe('The preferred time for the reservation (e.g., "around 7 PM", "lunchtime", "8:30 PM").'),
    search_term: z.string().describe('The restaurant name, cuisine, or type of place to search for (e.g., "Italian food", "Nobu").'),
    party_size: z.number().int().positive().optional().default(2).describe('The number of people in the party (defaults to 2).'),
};
const bookReservationParamsSchema = z.object(bookReservationParamsShape);
// Create server instance
const server = new McpServer({
    name: "restaurant_reservation",
    version: "0.1.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Register the reservation tool with the correct Stagehand usage
server.tool("book_reservation", "Finds and initiates a reservation booking process on OpenTable using browser automation.", bookReservationParamsShape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, region, time_preference, search_term, party_size } = params;
    console.log(`Attempting to book reservation via OpenTable for ${party_size} people on ${date} in ${region} around ${time_preference} for \"${search_term}\"`);
    // Check for necessary environment variables
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY; // Use Anthropic key
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;
    if (!anthropicApiKey) { // Check for Anthropic key
        const errorMsg = 'LLM API key (ANTHROPIC_API_KEY) is not set in environment variables.';
        console.error(errorMsg);
        return { content: [{ type: 'text', text: `Error: ${errorMsg}` }], isError: true };
    }
    if (!browserbaseApiKey || !browserbaseProjectId) {
        const errorMsg = 'Browserbase API key or Project ID is not set in environment variables.';
        console.error(errorMsg);
        return { content: [{ type: 'text', text: `Error: ${errorMsg}` }], isError: true };
    }
    // Initialize Stagehand for Anthropic
    const stagehand = new Stagehand({
        env: "BROWSERBASE",
        modelName: "claude-3-5-sonnet-latest", // Use Anthropic model
        modelClientOptions: {
            apiKey: anthropicApiKey, // Pass Anthropic key
        },
    });
    let resultMessage = `Failed to automate OpenTable for region ${region}.`;
    let isResultError = true;
    let isStagehandInitialized = false; // Flag to track successful init
    try {
        // Initialize the Stagehand session
        yield stagehand.init();
        isStagehandInitialized = true; // Set flag on successful init
        console.log('Stagehand initialized and browser session connected.');
        // Get the augmented Playwright Page object
        const page = stagehand.page;
        if (!page) { // Add null check for safety
            throw new Error('Failed to get page object from Stagehand.');
        }
        // Use page.goto for navigation
        yield page.goto('https://www.opentable.com');
        console.log('Navigated to OpenTable.');
        // Use page.act({ action: '...' })
        yield page.act({ action: 'Click the button with aria-label "Toggle location picker"' });
        console.log('Clicked location picker.');
        yield new Promise(resolve => setTimeout(resolve, 500));
        yield page.act({ action: `Click the link for the region "${region}"` });
        console.log(`Selected region: ${region}`);
        yield page.act({ action: `Type "${search_term}" into the input field with placeholder "Location, Restaurant or Cuisine"` });
        console.log(`Typed search term: "${search_term}"`);
        yield page.act({ action: 'Click the button with aria-label "Find a table"' });
        console.log('Clicked "Find a table". Waiting for page load...');
        yield new Promise(resolve => setTimeout(resolve, 2000));
        yield page.act({ action: `Select the option for "${party_size}" in the party size dropdown` });
        console.log(`Set party size to: ${party_size}`);
        const timeValue = mapTimeToValue(time_preference);
        if (timeValue) {
            yield page.act({ action: `Select the time option with value "${timeValue}" in the time dropdown` });
            console.log(`Set time preference to: ${time_preference} (value: ${timeValue})`);
        }
        else {
            console.log(`Could not map time preference "${time_preference}" to a value. Skipping time selection.`);
        }
        yield page.act({ action: 'Click the date picker button' });
        console.log('Clicked date picker.');
        yield new Promise(resolve => setTimeout(resolve, 500));
        const dateLabel = getDayAriaLabel(date);
        // TODO: Handle month navigation if needed
        yield page.act({ action: `Click the button with aria-label "${dateLabel}"` });
        console.log(`Selected date: ${date} (label: ${dateLabel})`);
        // Select Restaurant Logic
        console.log('Selecting the first restaurant from search results...');
        yield page.act({ action: 'Click the first element matching selector `[data-test="restaurant-card"]`' });
        console.log('Clicked the first restaurant card. Waiting for restaurant page load...');
        yield new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Restaurant page loaded. Further actions needed to book.');
        resultMessage = `Successfully selected the first restaurant for "${search_term}" on ${date}. Further steps needed.`;
        isResultError = false;
    }
    catch (error) {
        console.error('Error during OpenTable automation:', error);
        resultMessage = `Failed during OpenTable automation for region ${region}. Error: ${error instanceof Error ? error.message : String(error)}`;
        isResultError = true;
    }
    finally {
        // Close the Stagehand session only if it was successfully initialized
        if (stagehand && isStagehandInitialized) {
            try {
                console.log('Closing Stagehand session...');
                yield stagehand.close();
                console.log('Stagehand session closed.');
            }
            catch (closeError) {
                console.error('Error closing Stagehand session:', closeError);
            }
        }
    }
    return { content: [{ type: 'text', text: resultMessage }], isError: isResultError };
}));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = new StdioServerTransport();
        yield server.connect(transport);
        console.error("Restaurant Reservation MCP Server running on stdio");
    });
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
