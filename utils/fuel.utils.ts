import { Page, expect } from "@playwright/test";

export class FuelUtils {
    maxFuelPrice: number;
    maxCo2Price: number;
    page: Page;

    constructor(page: Page) {
        this.maxFuelPrice = parseInt(process.env.MAX_FUEL_PRICE || '560');
        this.maxCo2Price = parseInt(process.env.MAX_CO2_PRICE || '120');
        this.page = page;

        console.log(`[INIT] ⚙️ Threshold Configured -> Max Fuel: $${this.maxFuelPrice} | Max CO2: $${this.maxCo2Price}`);
    }

    private async getCleanedNumber(selector: string, isTextSelector = false): Promise<number> {
        try {
            const locator = isTextSelector 
                ? this.page.getByText(selector).locator('b > span').first()
                : this.page.locator(selector);
                
            await locator.waitFor({ state: 'visible', timeout: 5000 });
            const rawText = await locator.innerText();
            const cleanText = rawText.replace(/[^\d]/g, ''); 
            return cleanText ? parseInt(cleanText) : 0;
        } catch (e) {
            console.log(`[WARN] ⚠️ Could not resolve number from: ${selector}`);
            return 0;
        }
    }

    private async executePurchase(purchaseTarget: string, resourceType: string) {
        const initialHolding = await this.getCleanedNumber('#holding');
        
        console.log(`[ACTION] 💸 Executing purchase order for ${parseInt(purchaseTarget).toLocaleString()} ${resourceType}...`);
        
        const input = this.page.getByPlaceholder('Amount to purchase');
        await input.click();
        await input.press('Control+a');
        await input.fill(purchaseTarget);
        await this.page.getByRole('button', { name: /Purchase/i }).click();

        // Robust Wait: Poll until #holding updates, confirming the server processed the transaction
        await expect.poll(async () => {
            return await this.getCleanedNumber('#holding');
        }, {
            message: 'Transaction failed to reflect in holdings',
            intervals: [500, 1000],
            timeout: 10000,
        }).not.toBe(initialHolding);

        console.log(`[VERIFIED] ✅ SUCCESS: ${resourceType} purchase confirmed.`);
    }

    public async buyFuel() {
        console.log('\n⚡ [FUEL AUDIT] Scanning active fuel parameters...');

        const emptyFuel = await this.getCleanedNumber('#remCapacity');
        if (emptyFuel === 0) return console.log('--- [STATUS] 🟢 Tanks full. Skipped. ---');

        const curFuelPrice = await this.getCleanedNumber('Total price$', true);
        const curHolding = await this.getCleanedNumber('#holding');

        let purchaseTarget = '';
        if (curFuelPrice < this.maxFuelPrice) {
            purchaseTarget = emptyFuel.toString();
        } else if (curHolding < 2000000 && curFuelPrice < 1250) {
            purchaseTarget = '2000000';
        }

        if (purchaseTarget) await this.executePurchase(purchaseTarget, 'Litres');
        else console.log('--- [STATUS] 🟢 Market rates non-optimal. Order held. ---');
    }

    public async buyCo2() {
        console.log('\n🍃 [CO2 AUDIT] Scanning active environmental parameters...');

        const emptyCo2 = await this.getCleanedNumber('#remCapacity');
        if (emptyCo2 === 0) return console.log('--- [STATUS] 🟢 CO2 Bank full. Skipped. ---');

        const curCo2Price = await this.getCleanedNumber('Total price$', true);
        const curHolding = await this.getCleanedNumber('#holding');

        let purchaseTarget = '';
        if (curCo2Price < this.maxCo2Price) {
            purchaseTarget = emptyCo2.toString();
        } else if (curHolding < 1000000 && curCo2Price < 180) {
            purchaseTarget = '1000000';
        }

        if (purchaseTarget) await this.executePurchase(purchaseTarget, 'Carbon Allocations');
        else console.log('--- [STATUS] 🟢 Market rates non-optimal. Order held. ---');
    }
}
