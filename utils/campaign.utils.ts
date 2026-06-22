import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class CampaignUtils {
    page : Page;

    constructor(page : Page) {
        this.page = page;
    }

    public async createCampaign() {
        console.log('--- STARTING CAMPAIGN CHECKS ---');

        // 1. Open Marketing Dashboard
        await this.page.getByRole('button', { name: /Marketing/i }).click();
        await GeneralUtils.sleep(2500); // Give the active list full time to render

        // 2. Define the campaigns we want to manage
        const campaigns = [
            { 
                name: "Eco Friendly", 
                searchRegex: /Eco friendly/i, 
                selectRegex: /Eco-friendly Increases/i 
            },
            { 
                name: "Airline Reputation", 
                searchRegex: /Airline reputation/i, 
                selectRegex: /Airline reputation/i 
            },
            { 
                name: "Cargo Reputation", 
                searchRegex: /Cargo reputation/i, 
                selectRegex: /Cargo reputation/i 
            }
        ];

        // 3. Loop through each campaign type dynamically
        for (const campaign of campaigns) {
            const isAlreadyActive = await this.page.getByRole('cell', { name: campaign.searchRegex }).isVisible();

            if (isAlreadyActive) {
                console.log(`[STATUS] 🟢 ${campaign.name} Campaign is already active. Skipping purchase.`);
                continue; // Move to the next campaign type safely
            }

            console.log(`[STATUS] 🔴 ${campaign.name} Campaign NOT found active. Attempting to purchase...`);

            // Trigger Campaign Creation flow
            await this.page.getByRole('button', { name: /New campaign/i }).click();
            await GeneralUtils.sleep(800);

            // Select the specific campaign type from the menu
            await this.page.getByRole('cell', { name: campaign.selectRegex }).click();
            await GeneralUtils.sleep(500);

            // Click the buy button ($ symbol)
            await this.page.getByRole('button', { name: '$', exact: true }).click();
            
            // Critical: Wait for the purchase modal/animation to process and go away
            await GeneralUtils.sleep(2000);

            // 4. VERIFICATION: Read the active dashboard again to confirm the transaction cleared
            const verifyPurchase = await this.page.getByRole('cell', { name: campaign.searchRegex }).isVisible();

            if (verifyPurchase) {
                console.log(`[VERIFIED] ✅ SUCCESS: ${campaign.name} Campaign was successfully bought and is now live!`);
            } else {
                console.log(`[VERIFIED] ❌ FAILED: Clicked buy for ${campaign.name}, but it is NOT showing active in-game. (Check funds or server lag)`);
            }
        }

        console.log('--- CAMPAIGN CHECKS COMPLETED ---');
    }
}
