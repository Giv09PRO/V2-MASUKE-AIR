import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class FleetUtils {
    page : Page;

    constructor(page : Page) {
        this.page = page;
    }

    public async departPlanes() {
        console.log('--- STARTING FLEET DEPARTURES ---');
        
        // 1. Target the departure button locator cleanly
        const departButton = this.page.locator('#departAll');

        // Check if the button is physically on the screen first
        let isButtonVisible = await departButton.isVisible();
        if (!isButtonVisible) {
            console.log('[FLEET] 🟢 No planes are currently waiting for departure. Hangar is empty.');
            return;
        }

        let totalBatches = 0;

        // 2. Loop dynamically as long as the button is visible AND enabled (interactable)
        while (await departButton.isVisible() && await departButton.isEnabled()) {
            totalBatches++;
            console.log(`[FLEET] 🛫 Attempting departure for Batch #${totalBatches}...`);

            // Click departure trigger
            await departButton.click();
            
            // Critical Pause: Wait for game server round-trip validation
            await GeneralUtils.sleep(2000);

            // 3. Error Validation Check
            // Using a regular expression to handle dynamic alert text strings natively
            const errorAlert = this.page.getByText(/Unable to depart|Not enough fuel|co2/i);
            const isErrorVisible = await errorAlert.isVisible();

            if (isErrorVisible) {
                console.log(`[FLEET] 🛑 FAILURE: Departure stopped on Batch #${totalBatches}! Game reported a blocker (Likely missing Fuel/CO2 or broken maintenance).`);
                
                // Print the actual error text on screen to the CI logs for easier debugging
                try {
                    const errorText = await errorAlert.innerText();
                    console.log(`[GAME ERROR MESSAGE]: "${errorText.trim()}"`);
                } catch (e) {
                    // Fallback if text extraction fails
                }
                break; 
            }

            console.log(`[FLEET] ✅ Success: Batch #${totalBatches} cleared the runway!`);
        }

        console.log(`--- FLEET DEPARTURES FINISHED (Total Batches Sent: ${totalBatches}) ---`);
    }
}
    }
}
