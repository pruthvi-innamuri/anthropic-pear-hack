import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";
import * as readline from 'readline';
// import { Browserbase } from '@browserbasehq/sdk'; // May not be needed directly

// Helper function to format date for Stagehand instruction (example)
const getDayAriaLabel = (dateString: string): string => {
  try {
    const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch (e) {
    console.error('Error parsing date:', e);
    return 'invalid date';
  }
};

// Helper function to map time preference to dropdown value (example)
const mapTimeToValue = (timePref: string): string | undefined => {
  const timeMatch = timePref.match(/(\d{1,2}):?(\d{2})?\s?(AM|PM)/i);
  if (!timeMatch) return undefined;

  let hour = parseInt(timeMatch[1], 10);
  const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const period = timeMatch[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

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
type BookReservationParams = z.infer<typeof bookReservationParamsSchema>;

// Create server instance
const server = new McpServer({
  name: "restaurant_reservation",
  version: "0.1.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Define the expected return type for the handler (restored local type)
// Based on McpServer library expectations
type McpContent = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string } | { type: "audio"; data: string; mimeType: string } | { type: "resource"; resource: any };
type McpToolResult = {
  content: McpContent[];
  _meta?: { [key: string]: any };
  isError?: boolean;
  [key: string]: unknown; // Allow other properties
};

// Core reservation logic extracted into a function
async function handleReservationRequest(params: BookReservationParams): Promise<McpToolResult> {
    console.error("[handleReservationRequest] Starting...");
    const { date, region, time_preference, search_term, party_size } = params;
    console.error(`[handleReservationRequest] Params: date=${date}, region=${region}, time=${time_preference}, term=${search_term}, size=${party_size}`);

    // Check for necessary environment variables
    console.error("[handleReservationRequest] Checking environment variables...");
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
    console.error("[handleReservationRequest] Initializing Stagehand...");
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
      console.error("[handleReservationRequest] Calling stagehand.init()...");
      await stagehand.init();
      isStagehandInitialized = true; // Set flag on successful init
      console.error('[handleReservationRequest] Stagehand initialized and browser session connected.');

      // Get the augmented Playwright Page object
      const page = stagehand.page;
      if (!page) { // Add null check for safety
        throw new Error('[handleReservationRequest] Failed to get page object from Stagehand.');
      }

      // Use page.goto for navigation
      console.error("[handleReservationRequest] Navigating to OpenTable...");
      await page.goto('https://www.opentable.com');
      console.error('[handleReservationRequest] Navigated to OpenTable.');

      // Use page.act({ action: '...' })
      console.error("[handleReservationRequest] Clicking location picker...");
      await page.act({ action: 'Click the button with aria-label "Toggle location picker"'});
      console.error('[handleReservationRequest] Clicked location picker.');
      await new Promise(resolve => setTimeout(resolve, 500));

      console.error(`[handleReservationRequest] Selecting region: ${region}...`);
      await page.act({ action: `Click the link for the region "${region}"`});
      console.error(`[handleReservationRequest] Selected region: ${region}`);

      console.error(`[handleReservationRequest] Typing search term: ${search_term}...`);
      await page.act({ action: `Type "${search_term}" into the input field with placeholder "Location, Restaurant or Cuisine"`});
      console.error(`[handleReservationRequest] Typed search term: "${search_term}"`);

      console.error("[handleReservationRequest] Clicking 'Find a table'...");
      await page.act({ action: 'Click the button with aria-label "Find a table"'});
      console.error('[handleReservationRequest] Clicked "Find a table". Waiting for page load...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.error(`[handleReservationRequest] Setting party size to ${party_size}...`);
      await page.act({ action: `Select the option for "${party_size}" in the party size dropdown`});
      console.error(`[handleReservationRequest] Set party size to: ${party_size}`);

      console.error(`[handleReservationRequest] Mapping time preference: ${time_preference}...`);
      const timeValue = mapTimeToValue(time_preference);
      if (timeValue) {
         console.error(`[handleReservationRequest] Selecting time value: ${timeValue}...`);
         await page.act({ action: `Select the time option with value "${timeValue}" in the time dropdown` });
         console.error(`[handleReservationRequest] Set time preference to: ${time_preference} (value: ${timeValue})`);
      } else {
        console.error(`[handleReservationRequest] Could not map time preference "${time_preference}" to a value. Skipping time selection.`);
      }

      console.error("[handleReservationRequest] Clicking date picker...");
      await page.act({ action: 'Click the date picker button'});
      console.error('[handleReservationRequest] Clicked date picker.');
      await new Promise(resolve => setTimeout(resolve, 500));
      const dateLabel = getDayAriaLabel(date);
      console.error(`[handleReservationRequest] Selecting date label: ${dateLabel}...`);
      // TODO: Handle month navigation if needed
      await page.act({ action: `Click the button with aria-label "${dateLabel}"`});
      console.error(`[handleReservationRequest] Selected date: ${date} (label: ${dateLabel})`);
      
      // Select Restaurant Logic
      console.error('[handleReservationRequest] Selecting the first restaurant from search results...');
      await page.act({ action: 'Click the first element matching selector `[data-test="restaurant-card"]`'});
      console.error('[handleReservationRequest] Clicked the first restaurant card. Waiting for restaurant page load...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.error('[handleReservationRequest] Restaurant page loaded. Further actions needed to book.');

      resultMessage = `Successfully selected the first restaurant for "${search_term}" on ${date}. Further steps needed.`;
      isResultError = false;
      console.error("[handleReservationRequest] Automation step completed successfully.");

    } catch (error) {
      console.error('[handleReservationRequest] Error during OpenTable automation:', error);
      resultMessage = `Failed during OpenTable automation for region ${region}. Error: ${error instanceof Error ? error.message : String(error)}`;
      isResultError = true;
    } finally {
        // Close the Stagehand session only if it was successfully initialized
        if (stagehand && isStagehandInitialized) { 
             try {
                console.error('[handleReservationRequest] Closing Stagehand session...');
                await stagehand.close();
                console.error('[handleReservationRequest] Stagehand session closed.');
            } catch (closeError) {
                console.error('[handleReservationRequest] Error closing Stagehand session:', closeError);
            }
        }
    }
    console.error(`[handleReservationRequest] Returning result: isError=${isResultError}, message="${resultMessage}"`);
    return { content: [{ type: 'text', text: resultMessage }], isError: isResultError };
}

async function main() {
  console.error("Restaurant Reservation Service Initializing (Direct Stdio Mode)");

  // Use readline for potentially multi-line or buffered input handling
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout, // We'll write manually, but readline needs an output
    terminal: false // Important for non-interactive use
  });

  rl.on('line', async (line) => {
    console.error(`Received Line: ${line}`);
    let result: McpToolResult;
    const rawInputString = line.trim(); // Use the received line as input

    if (!rawInputString) {
      console.error("Received empty line, ignoring.");
      return; // Skip empty lines
    }

    try {
      // 1. Pre-process: Replace backticks with double quotes
      console.error("[main] Pre-processing input string...");
      const correctedJsonString = rawInputString.replace(/`/g, '"');
      console.error("[main] Corrected JSON String:", correctedJsonString);

      // 2. Parse the corrected string
      console.error("[main] Parsing JSON string...");
      const parsedInput = JSON.parse(correctedJsonString);
      console.error("[main] Parsing complete.");

      // 3. Validate against the schema
      console.error("[main] Validating parsed object against schema...");
      const validationResult = bookReservationParamsSchema.safeParse(parsedInput);

      if (!validationResult.success) {
        console.error("[main] Schema validation failed:", validationResult.error.errors);
        const errorMsg = `Invalid input parameters: ${validationResult.error.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')}`;
        result = { content: [{ type: 'text', text: errorMsg }], isError: true };
      } else {
        // 4. If valid, call the core logic
        console.error("[main] Validation successful, calling handleReservationRequest...");
        result = await handleReservationRequest(validationResult.data);
        console.error("[main] handleReservationRequest completed.");
      }
    } catch (error: any) {
      console.error("[main] Error processing line:", error);
      const errorDetail = error instanceof Error ? error.message : String(error);
      result = { 
        content: [{ type: 'text', text: `Fatal error processing request: ${errorDetail}. Raw input: ${rawInputString}` }], 
        isError: true 
      };
    }

    // 5. Write the result back to stdout as a JSON string on its own line
    try {
      console.error("[main] Stringifying result...");
      const resultString = JSON.stringify(result);
      console.error("[main] Writing result to stdout...");
      process.stdout.write(resultString + '\n'); // Write result and newline
      console.error("[main] Sent Result:", resultString);
    } catch (writeError) {
      console.error("[main] Failed to write result message:", writeError);
      // Attempt to write a basic error to stderr if stdout fails
      process.stderr.write(`{"error": "Failed to serialize or write result: ${writeError}"}\n`);
    }
  });

  rl.on('close', () => {
    console.error("[main] Input stream closed.");
    // Perform any cleanup if needed
  });

  // Note: We are NOT calling server.connect or using StdioServerTransport here.
  // The script now runs entirely based on reading stdin lines.
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 