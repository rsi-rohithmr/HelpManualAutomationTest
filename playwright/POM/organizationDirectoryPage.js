// import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC3 } from '../common';
// import { sidebar } from '../sidebar';
// import { orgDb } from './organizationDb';
const { test, request, expect } = require('@playwright/test');
const { Sidebar } = require('./sidebar');
const playwrightConfig = require('../../playwright.config');
const { ApiWaitUtils } = require('./apiWaitUtils');

const TIMEOUT_IN_MSEC2 = 20000;
const TIMEOUT_IN_MSEC1 = 10000;
const TIMEOUT_IN_MSEC3 = 60000;
export class OrganizationDirectoryPage {
	constructor(page) {
		this.page = page;
		this.sidebar = new Sidebar(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	//#region Master organization list
	favoriteOrgHeader() {
		return this.page.locator('[data-cy="organization-list-headers"]').nth(0);
	}

	masterOrgHeader() {
		return this.page.locator('[data-cy="organization-list-headers"]').nth(1).waitFor({ timeout: TIMEOUT_IN_MSEC1 });
	}

	masterOrglist() {
		return this.page
			.locator('[data-cy="master-org-list"] [data-cy="organization-item"]')
			.waitFor({ timeout: TIMEOUT_IN_MSEC2 });
	}
	//#endregion Master organization list

	//#region Child organization levels
	childOrgSubTitle() {
		return this.page.locator('[data-cy="child-orgs-subtitle"]').waitFor({ timeout: TIMEOUT_IN_MSEC2 });
	}

	childOrgAddNewBtn() {
		return this.page.locator('[data-cy="add-new-btn"]');
	}

	childOrgList(childOrgLevel) {
		if (childOrgLevel === 1) {
			return this.page.locator('[data-cy="child-org-levels"] [data-cy="organization-item"]');
		}

		if (childOrgLevel > 1) {
			return this.page
				.locator('[data-cy="child-org-levels"]')
				.nth(childOrgLevel - 1)
				.locator('[data-cy="organization-item"]');
		}
	}
	//#endregion Child organization levels

	//#region Preview Panel
	numOfChildOrgsLbl() {
		return this.page.locator('[data-cy="num-of-child-orgs"]');
	}

	numOfUsersLbl() {
		return this.page.locator('[data-cy="num-of-users"]');
	}

	headerWhenSingleColumn(tableIndex) {
		return this.page
			.locator('[data-cy="org-info-table"]')
			.nth(tableIndex)
			.locator('..')
			.locator('h2')
			.waitFor({ timeout: TIMEOUT_IN_MSEC3 });
	}

	headerWhenMultiColumns() {
		return this.page
			.locator('[data-cy="org-info-table"]')
			.locator('..')
			.locator('h2')
			.waitFor({ timeout: TIMEOUT_IN_MSEC3 });
	}

	organizationTab() {
		return this.page.locator('div[role="tablist"] >> text=Organization');
	}

	addressTab() {
		return this.page.locator('div[role="tablist"] >> text=Address');
	}

	contactTab() {
		return this.page.locator('div[role="tablist"] >> text=Contact');
	}

	organizationInfoTbl() {
		return this.page.locator('[data-cy="org-info-table"]');
	}

	async getOrganizationPreviewInfo(tableIndex) {
		const rows = {};
		const orgInfoTbl =
			tableIndex === -1
				? this.page.locator('[data-cy="org-info-table"]')
				: this.page.locator('[data-cy="org-info-table"]').nth(tableIndex);

		const rowElements = await orgInfoTbl.locator('tr').elementHandles();
		for (const row of rowElements) {
			const tds = await row.$$('td');
			const fieldLabel = await (await tds[0].textContent()).trim();
			const fieldValue = await (await tds[1].textContent()).trim();
			rows[fieldLabel] = fieldValue;
		}
		return rows;
	}

	detailsBtn() {
		return this.page.locator('[data-cy="details-button"]');
	}

	favoriteBtn() {
		return this.page.locator('[data-cy="favorite-button"]');
	}
	//#endregion Preview panel

	async openOrganizationDirectoryPage() {
		await this.sidebar.menuIcon('organization').click();
		await this.waitForMasterOrganizationListToLoad();
	}

	async selectMasterOrganization(masterOrgName, waitForLoad = true) {
		const { organizationId: orgId } = playwrightConfig.managingOrg;

		// Intercept API calls
		await this.page.route(`**&partof=${orgId}*`, route => route.continue());

		const orgSubtitleLocator = this.page.locator('[data-cy="child-orgs-subtitle"]').getByText(masterOrgName);
		const masterOrgLocator = this.page.locator('[data-cy="master-org-list"] [data-cy="organization-item"]');
		const isOrgPresent = (await orgSubtitleLocator.count()) > 0;

		if (isOrgPresent) {
			await masterOrgLocator.filter({ hasText: masterOrgName }).scrollIntoViewIfNeeded();

			await masterOrgLocator.filter({ hasText: masterOrgName }).click();

			if (waitForLoad) {
				await this.apiWaitUtils.waitForAPI(`&partof=${orgId}`, 'GET');
			}

			console.log(`Master organization \"${masterOrgName}\" selected.`);
		} else {
			console.log(`Master organization \"${masterOrgName}\" is already selected or not available.`);
		}
	}

	async selectChildOrganization(childOrgName, childOrgLevel) {
		let scrollNum = 0;
		let orgIsFound = false;

		await this.page.waitForFunction(
			async () => {
				const elements = await this.page
					.locator(`[data-cy="child-org-levels"]`)
					.nth(childOrgLevel - 1)
					.locator('span')
					.elementHandles();
				for (const el of elements) {
					const text = await el.textContent();
					if (text.toUpperCase() === childOrgName.toUpperCase()) {
						orgIsFound = true;
					}
				}

				if (!orgIsFound) {
					scrollNum++;
					const lastElement = elements[elements.length - 1];
					await lastElement.scrollIntoViewIfNeeded();
					await this.page.waitForTimeout(1000);
				}

				return orgIsFound === true;
			},
			{ timeout: TIMEOUT_IN_MSEC3 }
		);

		const orgRows = await orgDb.getOrganizations({ OrganizationName: childOrgName });
		const orgId = orgRows[0].InternalOrganizationID;

		await this.page.route(`**&partof=${orgId}*`, async route => route.continue());

		await this.page
			.locator(`[data-cy="child-org-levels"]`)
			.nth(childOrgLevel - 1)
			.locator('span')
			.filter({ hasText: childOrgName })
			.scrollIntoViewIfNeeded();
		await this.page
			.locator(`[data-cy="child-org-levels"]`)
			.nth(childOrgLevel - 1)
			.locator('span')
			.filter({ hasText: childOrgName })
			.click();

		await this.waitForChildOrganizationListToLoad(childOrgLevel, `getChildOfOrganizationId${orgId}`);
	}

	async waitForMasterOrganizationListToLoad() {
		const elements = await this.page.locator('[data-cy="master-org-list"] [data-cy="organization-item"]').nth(0);
	}

	async waitForChildOrganizationListToLoad(childOrgLevel, aliasName) {
		const response = await this.page.waitForResponse(
			response => response.url().includes(aliasName) && response.status() === 200
		);
		const totalChildOrgs = response.json();

		if (totalChildOrgs > 0) {
			await this.page.waitForFunction(
				async () => {
					const elements = await this.page
						.locator(`[data-cy="child-org-levels"]`)
						.nth(childOrgLevel - 1)
						.locator('[data-cy="organization-item"]')
						.elementHandles();
					return elements.length > 0;
				},
				{ timeout: TIMEOUT_IN_MSEC2, interval: 300 }
			);
		} else {
			await this.page.locator('[data-cy="child-orgs-subtitle"]').nth(childOrgLevel).waitFor();
		}
	}
}
