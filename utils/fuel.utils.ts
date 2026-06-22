import { Page } from "@playwright/test";

export class FuelUtils {
    maxFuelPrice : number;
    maxCo2Price : number;
    page : Page;

    constructor(page : Page) {
        this.maxFuelPrice = parseInt(process.env.MAX_FUEL_PRICE || '560');
        this.maxCo2Price = parseInt(process.env.MAX_CO2_PRICE || '120');
        this.page = page;

        console.log(`[INIT] ⚙️ Threshold Configured -> Max Fuel: $${this.maxFuelPrice} | Max CO2: $${this.maxCo2Price}`);
    }

    private async getCleanedNumber(locatorString: string, useTextSelector = false): Promise<number> {
        try {
            const locator = useTextSelector 
                ? this.page.getByText(locatorString).locator('b > span').first()
                : this.page.locator(locatorString);
                
            await locator.waitFor({ state: 'visible', timeout: 5000 });
            const rawText = await locator.innerText();
            const cleanText = rawText.replace(/[^\d]/g, ''); 
            return cleanText ? parseInt(cleanText) : 0;
        } catch (e) {
            console.log(`[WARN] ⚠️ Could not resolve a valid number from: ${locatorString}. Defaulting to 0.`);
            return 0;
        }
    }

    public async buyFuel() {
        console.log('\n⚡ [FUEL AUDIT] Scanning active fuel parameters...');

        const emptyFuel = await this.getCleanedNumber('#remCapacity');
        if (emptyFuel === 0) {
            console.log('--- [STATUS] 🟢 Tanks are completely full. Fuel purchase skipped. ---');
            return;
        }

        const curFuelPrice = await this.getCleanedNumber('Total price$', true);
        const curHolding = await this.getCleanedNumber('#holding');

        console.log(`[DATA] 📊 Market Price: $${curFuelPrice}/L | Current Reserves: ${curHolding.toLocaleString()} L | Empty Capacity: ${emptyFuel.toLocaleString()} L`);

        if (curFuelPrice === 0) {
            console.log('[ERROR] ❌ Unable to extract fuel cost details. Aborting operation step.');
            return;
        }

        let purchaseTarget = '';

        if (curFuelPrice < this.maxFuelPrice) {
            console.log(`[ANALYSIS] 🔥 Market price ($${curFuelPrice}) is cheaper than configuration maximum ($${this.maxFuelPrice}).`);
            purchaseTarget = emptyFuel.toString();
        } 
        else if (curHolding < 2000000 && curFuelPrice < 1250) {
            console.log(`[ANALYSIS] 🚨 Reserves are running critically low (${curHolding.toLocaleString()} L). Triggering panic purchase.`);
            purchaseTarget = '2000000';
        }

        if (purchaseTarget !== '') {
            console.log(`[ACTION] 💸 Executing purchase order for ${parseInt(purchaseTarget).toLocaleString()} Litres...`);
            
            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(purchaseTarget);
            await this.page.getByRole('button', { name: /Purchase/i }).click();

            await this.page.waitForTimeout(2000);
            
            const postEmptyFuel = await this.getCleanedNumber('#remCapacity');
            if (postEmptyFuel < emptyFuel) {
                console.log(`[VERIFIED] ✅ SUCCESS: In-game fuel purchase confirmed. ${parseInt(purchaseTarget).toLocaleString()} L added.`);
            } else {
                console.log(`[VERIFIED] ❌ FAILED: Transaction failed to execute on server. Structural values unchanged.`);
            }
        } else {
            console.log('--- [STATUS] 🟢 Fuel market costs are currently non-optimal. Order held. ---');
        }
    }

    public async buyCo2() {
        console.log('\n🍃 [CO2 AUDIT] Scanning active environmental parameters...');

        const emptyCo2 = await this.getCleanedNumber('#remCapacity');
        if (emptyCo2 === 0) {
            console.log('--- [STATUS] 🟢 CO2 Bank is full. Carbon quota purchase skipped. ---');
            return;
        }

        const curCo2Price = await this.getCleanedNumber('Total price$', true);
        const curHolding = await this.getCleanedNumber('#holding');

        console.log(`[DATA] 📊 Quota Price: $${curCo2Price}/T | Current Reserves: ${curHolding.toLocaleString()} | Empty Capacity: ${emptyCo2.toLocaleString()}`);

        if (curCo2Price === 0) {
            console.log('[ERROR] ❌ Unable to extract carbon allocation cost. Aborting operation step.');
            return;
        }

        let purchaseTarget = '';

        if (curCo2Price < this.maxCo2Price) {
            console.log(`[ANALYSIS] 🔥 Quota price ($${curCo2Price}) is within safe target boundaries ($${this.maxCo2Price}).`);
            purchaseTarget = emptyCo2.toString();
        } 
        else if (curHolding < 1000000 && curCo2Price < 180) {
            console.log(`[ANALYSIS] 🚨 Carbon quotas are depleted (${curHolding.toLocaleString()}). Triggering safety buy.`);
            purchaseTarget = '1000000';
        }

        if (purchaseTarget !== '') {
            console.log(`[ACTION] 💸 Executing purchase order for ${parseInt(purchaseTarget).toLocaleString()} carbon allocations...`);
            
            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(purchaseTarget);
            await this.page.getByRole('button', { name: /Purchase/i }).click();

            await this.page.waitForTimeout(2000);
            
            const postEmptyCo2 = await this.getCleanedNumber('#remCapacity');
            if (postEmptyCo2 < emptyCo2) {
                console.log(`[VERIFIED] ✅ SUCCESS: In-game CO2 quota validation complete. ${parseInt(purchaseTarget).toLocaleString()} units added.`);
            } else {
                console.log(`[VERIFIED] ❌ FAILED: Transaction rejected by structural parameters. Capacity unmodified.`);
            }
        } else {
            console.log('--- [STATUS] 🟢 Quota market rates are currently non-optimal. Order held. ---');
        }
    }
}
    }

    public async buyFuel() {
        console.log('\n⚡ [FUEL AUDIT] Scanning active fuel parameters...');

        const emptyFuel = await this.getCleanedNumber('#remCapacity');
        if (emptyFuel === 0) {
            console.log('--- [STATUS] 🟢 Tanks are completely full. Fuel purchase skipped. ---');
            return;
        }

        const curFuelPrice = await this.getCleanedNumber('Total price$', true);
        const curHolding = await this.getCleanedNumber('#holding');

        console.log(`[DATA] 📊 Market Price: $${curFuelPrice}/L | Current Reserves: ${curHolding.toLocaleString()} L | Empty Capacity: ${emptyFuel.toLocaleString()} L`);

        if (curFuelPrice === 0) {
            console.log('[ERROR] ❌ Unable to extract fuel cost details. Aborting operation step.');
            return;
        }

        let purchaseTarget = '';

        // Checking standard budget thresholds
        if (curFuelPrice < this.maxFuelPrice) {
            console.log(`[ANALYSIS] 🔥 Market price ($${curFuelPrice}) is cheaper than configuration maximum ($${this.maxFuelPrice}).`);
            purchaseTarget = emptyFuel.toString();
        } 
        // Checking critical depletion fail-safes
        else if (curHolding < 2000000 && curFuelPrice < 1250) {
            console.log(`[ANALYSIS] 🚨 Reserves are running critically low (${curHolding.toLocaleString()} L). Triggering panic purchase.`);
            purchaseTarget = '2000000';
        }

        if (purchaseTarget !== '') {
            console.log(`[ACTION] 💸 Executing purchase order for ${parseInt(purchaseTarget).toLocaleString()} Litres...`);
            
            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(purchaseTarget);
            await this.page.getByRole('button', { name: /Purchase/i }).click();

            // Transaction execution timeout delay
            await this.page.waitForTimeout(2000);
            
            // Post transaction evaluation
            const postEmptyFuel = await this.getCleanedNumber('#remCapacity');
            if (postEmptyFuel < emptyFuel) {
                console.log(`[VERIFIED] ✅ SUCCESS: In-game fuel purchase confirmed. ${parseInt(purchaseTarget).toLocaleString()} L added.`);
            } else {
                console.log(`[VERIFIED] ❌ FAILED: Transaction failed to execute on server. Structural values unchanged.`);
            }
        } else {
            console.log('--- [STATUS] 🟢 Fuel market costs are currently non-optimal. Order held. ---');
        }
    }

    public async buyCo2() {
        console.log('\n🍃 [CO2 AUDIT] Scanning active environmental parameters...');

        const emptyCo2 = await this.getCleanedNumber('#remCapacity');
        if (emptyCo2 === 0) {
            console.log('--- [STATUS] 🟢 CO2 Bank is full. Carbon quota purchase skipped. ---');
            return;
        }

        const curCo2Price = await this.getCleanedNumber('Total price$', true);
        const curHolding = await this.getCleanedNumber('#holding');

        console.log(`[DATA] 📊 Quota Price: $${curCo2Price}/T | Current Reserves: ${curHolding.toLocaleString()} | Empty Capacity: ${emptyCo2.toLocaleString()}`);

        if (curCo2Price === 0) {
            console.log('[ERROR] ❌ Unable to extract carbon allocation cost. Aborting operation step.');
            return;
        }

        let purchaseTarget = '';

        // Standard budget checks
        if (curCo2Price < this.maxCo2Price) {
            console.log(`[ANALYSIS] 🔥 Quota price ($${curCo2Price}) is within safe target boundaries ($${this.maxCo2Price}).`);
            purchaseTarget = emptyCo2.toString();
        } 
        // Critical depletion checks
        else if (curHolding < 1000000 && curCo2Price < 180) {
            console.log(`[ANALYSIS] 🚨 Carbon quotas are depleted (${curHolding.toLocaleString()}). Triggering safety buy.`);
            purchaseTarget = '1000000';
        }

        if (purchaseTarget !== '') {
            console.log(`[ACTION] 💸 Executing purchase order for ${parseInt(purchaseTarget).toLocaleString()} carbon allocations...`);
            
            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(purchaseTarget);
            await this.page.getByRole('button', { name: /Purchase/i }).click();

            // Transaction execution timeout delay
            await this.page.waitForTimeout(2000);
            
            // Post transaction evaluation
            const postEmptyCo2 = await this.getCleanedNumber('#remCapacity');
            if (postEmptyCo2 < emptyCo2) {
                console.log(`[VERIFIED] ✅ SUCCESS: In-game CO2 quota validation complete. ${parseInt(purchaseTarget).toLocaleString()} units added.`);
            } else {
                console.log(`[VERIFIED] ❌ FAILED: Transaction rejected by structural parameters. Capacity unmodified.`);
            }
        } else {
            console.log('--- [STATUS] 🟢 Quota market rates are currently non-optimal. Order held. ---');
        }
    }
}        const getEmptyFuel = async () => {
            const emptyText = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '')

            return parseInt(emptyText);
        }

        const emptyFuel = await getEmptyFuel();
        if(emptyFuel === 0) {
            return;
        }

        const curFuelPrice = await getCurrentFuelPrice();
        const curHolding = await getCurrentHolding();

        console.log('Current Fuel Price: ' + curFuelPrice);

        // Buy fuel if current price is lower than max price
        if(curFuelPrice < this.maxFuelPrice) {
            const emptyFuelCapacity = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');

            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(emptyFuelCapacity);
            await this.page.getByRole('button', { name: ' Purchase' }).click();

            console.log('Bought Fuel Successfully! Amount of fuel bought: ' + emptyFuelCapacity + ' Litres');
        }
        else if(curHolding < 2000000 && curFuelPrice < 1250) {
            const emptyFuelCapacity = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');

            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill('2000000');
            await this.page.getByRole('button', { name: ' Purchase' }).click();

            console.log('Bought Fuel Successfully! Amount of fuel bought: 2000000 Litres');
        } 
    }

    public async buyCo2() {
        const getCurrentCo2Price = async () => {
            let co2Text = await this.page.getByText('Total price$').locator('b > span').innerText();
            co2Text = co2Text.replaceAll(',', '');
            
            return parseInt(co2Text);
        }

        const getCurrentHolding = async () => {
            let holdingText = await this.page.locator('#holding').innerText();
            holdingText = holdingText.replaceAll(',', '');

            return parseInt(holdingText);
        }

        const getEmptyCO2 = async () => {
            const emptyText = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '')

            return parseInt(emptyText);
        }

        const emptyCo2 = await getEmptyCO2();
        if(emptyCo2 === 0) {
            return;
        }

        const curCo2Price = await getCurrentCo2Price();
        const curHolding = await getCurrentHolding();

        console.log('Current Co2 Price: ' + curCo2Price);

        // Buy co2 if current price is lower than max price
        if(curCo2Price < this.maxCo2Price) {
            const emptyCo2Capacity = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');

            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(emptyCo2Capacity);
            await this.page.getByRole('button', { name: ' Purchase' }).click();

            console.log('Bought Co2 Successfully! Amount of co2 bought: ' + emptyCo2Capacity);
        }
        else if(curHolding < 1000000 && curCo2Price < 180) {
            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill('1000000');
            await this.page.getByRole('button', { name: ' Purchase' }).click();

            console.log('Bought Co2 Successfully! Amount of co2 bought: 1000000');
        }
    }
}
