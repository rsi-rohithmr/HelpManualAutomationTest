const { test, expect } = require('@playwright/test');
const { POManager } = require('../POM/POManager');

test.describe('Global Search / Redirects', () => {
	test.beforeEach(async ({ page }) => {
		const pom = new POManager(page);
		await pom.loginPage.loginBlume();
	});

	test('Global Search Redirections', async ({ page }) => {
		await page.locator('[data-cy="global-search-input"]').click();
		await page.locator('[data-cy="global-search-input"]').fill('STUDY');
		await page.locator('[data-cy="global-search-input"]').press('Enter');

		await page.waitForTimeout(5000);

		await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Studies' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Help Center' })).toBeVisible();
		await expect(page.getByText('MY STUDIES', { exact: true })).toBeVisible();
	});

	test('Home Page Redirects', async ({ page }) => {
		await page.getByRole('link', { name: 'Home' }).click();
		await page.waitForTimeout(2000);
		await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();
		await expect(page).toHaveURL(/\/home/);
	});

	test('Book Appointment Redirects', async ({ page }) => {
		await page.getByTestId('book-button').click();
		await page.waitForTimeout(2000);
		await expect(page.getByRole('paragraph').filter({ hasText: 'Request Appointment' })).toBeVisible();
		await expect(page).toHaveURL(/\/book-appointment/);
	});
});
