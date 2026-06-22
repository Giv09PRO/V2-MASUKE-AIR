import { Page } from "@playwright/test";

// Fallback logic to support local .env files if present
require('dotenv').config();

export class GeneralUtils {
    username : string;
    password : string;
    page : Page;

    constructor(page : Page) {
        // Provide clear fallbacks or helpful error logs if environment variables are missing
        this.username = process.env.EMAIL || '';
        this.password = process.env.PASSWORD || '';
        this.page = page; // Bound to the class instance
    }

    public static async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Removed the redundant 'page: Page' parameter to use the class instance 'this.page'
    public async login() {
        if (!this.username || !this.password) {
            throw new Error("CRITICAL: Login credentials are missing! Check your GitHub Secrets or local .env file.");
        }

        console.log('Logging in...');

        await this.page.goto('https://www.airlinemanager.com/');

        // UI Interactions using the internal class page state
        await this.page.getByRole('button', { name: 'PLAY FREE NOW' }).click();
        await this.page.getByRole('button', { name: 'Log in' }).click();
        
        await this.page.locator('#lEmail').click();
        await this.page.locator('#lEmail').fill(this.username);
        await this.page.locator('#lEmail').press('Tab');
        
        await this.page.locator('#lPass').click();
        await this.page.locator('#lPass').fill(this.password);
        await this.page.getByRole('button', { name: 'Log In', exact: true }).click();

        console.log('Credentials submitted. Handling potential popups...');

        // DEFENSIVE: Handle the intro popup optionally. 
        // If it shows up, click it. If it doesn't, don't crash the test.
        try {
            const introPopup = this.page.locator('#intro_popup span');
            // Give it a short 5-second window to appear instead of waiting the default 30s
            await introPopup.waitFor({ state: 'visible', timeout: 5000 });
            await introPopup.click();
            console.log('Intro popup cleared.');
        } catch (e) {
            console.log('Intro popup did not appear or was already dismissed. Moving on...');
        }

        console.log('Logged in successfully!');
    }
}
