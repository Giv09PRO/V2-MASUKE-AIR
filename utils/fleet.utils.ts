import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class FleetUtils {
    page : Page;

    constructor(page : Page) {
        this.page = page;
    }

    public async departPlanes() {
        console.log('--- STARTING FLEET DEPARTURES ---');
        
        const departButton = this.page.locator('#departAll');

        if (!(await departButton.isVisible())) {
            console.log('[FLEET] 🟢 No planes are currently waiting for departure.');
            return;
        }

        let totalBatches = 0;

        while (await departButton.isVisible() && await departButton.isEnabled()) {
            totalBatches++;
            console.log(`[FLEET] 🛫 Attempting departure for Batch #${totalBatches}...`);

            await departButton.click();
            await GeneralUtils.sleep(2000);

            // FIX: Scope the locator to the alert/modal container.
            // Replace '.alert-danger' or '.modal-content' with the actual class of your error popup.
            // If you don't know the class, use .first() to pick only the top-most/first match.
            const errorAlert = this.page
                .locator('.alert-danger, .modal-body') // Add the specific classes of your popups here
                .getByText(/Unable to depart|Not enough fuel|co2/i)
                .first(); 

            // Use isVisible() on the locator to check existence safely
            if (await errorAlert.isVisible()) {
                const errorText = await errorAlert.innerText();
                console.log(`[FLEET] 🛑 FAILURE: Departure stopped on Batch #${totalBatches}!`);
                console.log(`[GAME ERROR MESSAGE]: "${errorText.trim()}"`);
                break; 
            }

            console.log(`[FLEET] ✅ Success: Batch #${totalBatches} cleared!`);
        }

        console.log(`--- FLEET DEPARTURES FINISHED (Total Batches Sent: ${totalBatches}) ---`);
    }
}
