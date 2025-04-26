import { bookReservationParamsSchema, type BookReservationParams } from './types';
import { Browserbase } from '@browserbasehq/sdk';

async function book_reservation(params: BookReservationParams) {
  // Initialize Browserbase client
  const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

  try {
    // Create a new browser session
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID
    });

    // Connect to the session
    const browser = await bb.connect(session.id);
    const page = await browser.newPage();

    // Navigate to OpenTable
    await page.goto('https://www.opentable.com/');

    // Wait for the search form to load
    await page.waitForSelector('input[data-test="search-input"]');

    // Enter the search location
    await page.type('input[data-test="search-input"]', params.region);
    await page.keyboard.press('Enter');

    // Wait for search results
    await page.waitForSelector('[data-test="restaurant-card"]');

    // Select the first restaurant (you might want to add more sophisticated selection logic)
    await page.click('[data-test="restaurant-card"]');

    // Wait for the reservation form
    await page.waitForSelector('input[data-test="date-input"]');

    // Enter the date
    await page.type('input[data-test="date-input"]', params.date);
    
    // Enter the time
    await page.type('input[data-test="time-input"]', params.time_preference);

    // Click the find table button
    await page.click('button[data-test="find-table-button"]');

    // Wait for available time slots
    await page.waitForSelector('[data-test="time-slot"]');

    // Select the first available time slot
    await page.click('[data-test="time-slot"]');

    // Wait for the reservation form
    await page.waitForSelector('input[data-test="guest-count-input"]');

    // Enter guest count (defaulting to 2)
    await page.type('input[data-test="guest-count-input"]', '2');

    // Click the reserve button
    await page.click('button[data-test="reserve-button"]');

    // Wait for confirmation
    await page.waitForSelector('[data-test="reservation-confirmation"]');

    // Get confirmation details
    const confirmation = await page.evaluate(() => {
      const confirmationElement = document.querySelector('[data-test="reservation-confirmation"]');
      return confirmationElement?.textContent || 'Reservation confirmed';
    });

    // Close the browser
    await browser.close();

    return `Successfully booked a reservation in ${params.region} for ${params.date} around ${params.time_preference}. Confirmation: ${confirmation}`;
  } catch (error: unknown) {
    console.error('Error booking reservation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to book reservation: ${errorMessage}`);
  }
}

export const tools = [book_reservation];
