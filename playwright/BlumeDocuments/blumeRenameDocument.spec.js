const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { login } = require('../POM/login');
const { documentViewer } = require('../POM/documentViewer');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const path = require('path');
const { POManager } = require('../POM/POManager');

let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;

let UploadName;
let newName;

let currentDate = new Date(Date.now());
const newDateOptions = {
	year: 'numeric',
	month: 'numeric',
	day: '2-digit',
};
let reportDate = currentDate.toLocaleString('en-US', newDateOptions);
let date = currentDate.toLocaleString('en-US', newDateOptions);

test.describe('Blume Rename Document', () => {
	test.beforeEach(async ({ page }) => {
		const pom = new POManager(page);
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		});

		UploadName = `Upload ${randomNum}`;
		newName = `UploadRename ${randomNum}`;
		await pom.loginPage.loginBlume();
	});

	test('Rename Document ', async ({ page }) => {
		const pom = new POManager(page);
		await page.route('**/blume-api/Document', route => route.continue());
		await page.evaluate(() => {
			const el = document.querySelector('[data-cy="sidebar-profile"]');
			if (el) {
			  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
			}
		  });
		await page.locator('li:has-text("Profile")').click();

		await pom.apiWaitUtils.waitForAPI('/blume-api/Document', 'GET');
		const originalFilePath = path.resolve(__dirname, '../TestData/Upload.pdf');
		const renamedFilePath = path.resolve(__dirname, `../TestData/${UploadName}.pdf`);

		// Log the resolved paths for debugging
		console.log('Original file path:', originalFilePath);
		console.log('New file path:', renamedFilePath);

		fs.copyFileSync(originalFilePath, renamedFilePath);
		await page.route('**/blume-api/Document?*', route => route.continue());
		await page.setInputFiles('[id="file-upload-input"]', renamedFilePath);

		await page.click('[data-cy="consent-no"]');
		await pom.apiWaitUtils.waitForAPI('/blume-api/Document?', 'POST');
		await pom.blume.documentSearchBtn().click();
		await pom.blume.documentSearchTxtArea().fill(UploadName);
		await pom.page.route('**newDocumentName=**', route => route.continue());

		await pom.blume.documentThumbnail().hover();
		await pom.blume.documentCheckBtn().click();
		await pom.blume.renameDocumentBtn().click();
		await pom.blume.renameDocumentInput().clear();
		await pom.blume.renameDocumentInput().pressSequentially(newName);
		await pom.blume.saveBtn().click();

		await pom.apiWaitUtils.waitForAPI('newDocumentName=', 'PATCH');
		await page.waitForTimeout(6000);
		await page.locator('[data-testid="CloseOutlinedIcon"]').click();
		await pom.blume.documentSearchBtn().click();
		await pom.blume.documentSearchTxtArea().pressSequentially(newName);
		await expect(pom.blume.documentTitleTxt()).toContainText(`${newName}.pdf`);
		await pom.blume.documentThumbnail().hover();
		await pom.blume.documentCheckBtn().click();
		await page.unroute('**/**');
		await page.route('**/blume-api/Document?hash=**', route => route.continue());
		await page.locator('[data-testid="progress-delete-button"] [data-testid="DeleteOutlineIcon"]').hover();
		await page.mouse.down();
		await pom.apiWaitUtils.waitForAPI('/blume-api/Document?hash=', 'DELETE');
	});
});
