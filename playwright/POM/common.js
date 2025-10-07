import { ApiWaitUtils } from './apiWaitUtils';

const playwrightConfig = require('../../playwright.config');
const { faker } = require('@faker-js/faker');

const { expect, request } = require('@playwright/test');
// import { menuItems, sidebar } from '../sidebar';
const fs = require('fs');
const path = require('path');

export class Common {
	static mailsacAPIKey1 = playwrightConfig.mailsacAPIKey1;
	static mailsacAPIKey2 = playwrightConfig.mailsacAPIKey2;
	static mailsacAPIKey3 = playwrightConfig.mailsacAPIKey3;
	static mailsacAPIKey4 = playwrightConfig.mailsacAPIKey4;
	static mailsacAPIKey5 = playwrightConfig.mailsacAPIKey5;
	static mailsacAPIKey6 = playwrightConfig.mailsacAPIKey6;

	static generateAdultDOB(minAge = 16, maxAge = 90) {
		const today = new Date();
		const maxDOB = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
		const minDOB = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

		return faker.date.between({ from: minDOB, to: maxDOB }).toISOString().split('T')[0];
	}

	static convertToMMDDYYYY(dateString) {
		const [year, month, day] = dateString.split('-');
		return `${month}/${day}/${year}`;
	}

	constructor(page, apiContext, testInfo) {
		this.page = page;
		this.apiContext = apiContext;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.testInfo = testInfo;
	}

	async selectOptionFromSingleSelection(comboField, option) {
		await comboField.click();
		await this.page
			.locator(`ul > li`)
			.filter({ hasText: new RegExp(option) })
			.click();
	}

	async selectOptionFromSingleSelectionSuggestion(comboField, option) {
		await comboField.click();
		await comboField.clear();
		await comboField.pressSequentially(option);
		await this.page.keyboard.press('ArrowDown');
		await this.page.keyboard.press('Enter');
	}

	buildSearchPattern(searchText, flag = 'g') {
		return new RegExp(`^${searchText}$`, flag);
	}

	async postResource(resourceName, payload, tokenObj, isBundle) {
		if (!tokenObj || !resourceName || !payload) {
			return;
		}

		const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		fs.writeFileSync(`${resourceName}PostPayload${randomNum}.json`, JSON.stringify(payload, null, 2));

		const urlLastPart = isBundle ? 'fhir/' : `fhir/${resourceName}/`;
		const apiContext = await this.apiContext({
			baseURL: process.env.BASE_API_URL,
			extraHTTPHeaders: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
			},
		});

		const response = await apiContext.post(urlLastPart, {
			data: payload,
		});

		const responseBody = await response.json();
		fs.writeFileSync(`${resourceName}PostRes${randomNum}.json`, JSON.stringify(responseBody, null, 2));

		return responseBody;
	}

	async filterRecordsBySingleColumn(columnName, criteria) {
		await this.page.locator(`[data-cy="${columnName}_filter"]`, { timeout: 10000 }).click({ force: true });
		await this.page.waitForTimeout(2000);
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).clear();
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).pressSequentially(criteria);
		await this.page.keyboard.press('ArrowDown');
		await this.page.keyboard.press('Enter');
		await this.page.keyboard.press('Escape');
	}

	async filterRecordsBySuggestionColumn(columnName, criteria) {
		const criteriaFullEncode = `${encodeURI(criteria)}`.replace(/\'/g, `%27`);
		await this.page.route(`**${criteriaFullEncode}*`, route => route.continue());
		await this.page.locator(`[data-cy="${columnName}_filter"]`, { timeout: 10000 }).click({ force: true });
		await this.page.waitForTimeout(2000);
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).clear();
		await this.page.waitForTimeout(10000);
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).pressSequentially(criteria, { delay: 0 });
		await this.apiWaitUtils.waitForAPI(`${criteriaFullEncode}`, 'GET');
		await this.page
			.locator(`[aria-labelledby="search-as-you-type-label"] :has-text("${String(criteria).toUpperCase()}")`)
			.first()
			.click();
	}

	async updateResourceById(resourceName, internalId, payload, tokenObj) {
		if (!tokenObj || !internalId || !resourceName || !payload) {
			console.error('Missing required parameters.');
			return;
		}

		try {
			// Generate a random number
			const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;

			// Write payload to a file
			// const payloadFilePath = path.join(__dirname, `${resourceName}PutPayload${randomNum}.json`);
			// fs.writeFileSync(payloadFilePath, JSON.stringify(payload, null, 2));

			// Perform the PUT request
			const requestPayload = await this.apiContext.put(
				`${playwrightConfig.baseApiUrl}/fhir/${resourceName}/${internalId}`,
				{
					headers: {
						Authorization: `bearer ${tokenObj.accessToken}`,
						SessionID: tokenObj.sessionID,
					},
					data: payload,
				}
			);
			// const response = await this.apiContext.post( `${playwrightConfig.baseApiUrl}/fhir/${resourceName}/${internalId}`,requestPayload);
			const responseBody = await requestPayload.json();

			// // Write response body to a file
			// const responseFilePath = path.join(__dirname, `${resourceName}PutRes${randomNum}.json`);
			// fs.writeFileSync(responseFilePath, JSON.stringify(responseBody, null, 2));

			return responseBody;
		} catch (error) {
			console.error('Error updating resource:', error);
		}
	}

	async getResourceById(resourceName, internalId, tokenObj) {
		if (!tokenObj || !internalId || !resourceName) {
			return;
		}
		const response = await this.apiContext.get(
			`${playwrightConfig.baseApiUrl}/fhir/${resourceName}/${internalId}`,
			{
				headers: {
					Authorization: `bearer ${tokenObj.accessToken}`,
					SessionID: tokenObj.sessionID,
				},
			}
		);
		const responseBody = await response.json();
		return responseBody;
	}

	async filterRecordsByMultiSelectionColumn(columnName, criteria) {
		await this.page.click(`[data-cy="${columnName}_filter"]`);
		for (const element of criteria) {
			const listItem = await this.page
				.locator('[role="listbox"]')
				.getByText(new RegExp(`^${element}$`, 'g'))
				.first();
			await listItem.scrollIntoViewIfNeeded();
			await listItem.click({ force: true });
		}
		await this.page.keyboard.press('Escape');
	}
	
}
