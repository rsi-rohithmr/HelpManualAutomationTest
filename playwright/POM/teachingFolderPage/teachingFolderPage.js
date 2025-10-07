import { TIMEOUT_IN_MSEC3 } from '../timeouts';
import { expect } from '@playwright/test';
const { Sidebar } = require('../sidebar');
const { ApiWaitUtils } = require('../apiWaitUtils');
export class TeachingFolderPage {
	constructor(page) {
		this.page = page;
		this.sidebar = new Sidebar(page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	addFolderBtn() {
		return this.page.locator('[data-cy="add-folder-button"]');
	}

	submitFolderNameBtn() {
		return this.page.locator('[data-cy="submit-folder-name-btn"]');
	}

	folderInputEle() {
		return this.page.getByTestId('folder-input');
	}

	addSubFolderBtn() {
		return this.page.locator('[data-cy="actions-add-sub"]:visible');
	}

	addStudiesToFolderSaveBtn() {
		return this.page.getByTestId('add-studies-to-folder');
	}

	renameFolderBtn() {
		return this.page.locator('[data-cy="actions-edit"]:visible');
	}

	removeFolderBtn() {
		return this.page.locator('[data-testid="progress-delete-button"]:visible');
	}

	addStudiesToFolderBtn() {
		return this.page.locator('[data-cy="add-to-tf"]');
	}

	removeStudiesFromFolderBtn() {
		return this.page.locator('[data-cy="remove-from-tf"]');
	}

	shareFolderBtn() {
		return this.page.getByTestId('ShareIcon');
	}

	teachingListTableRows() {
		return this.page.locator('[data-cy="study-status-table"] tbody > tr');
	}

	getFolder(folderName) {
		const folderAreas = this.page.getByTestId('folder-detail-area');
		const folderFound = folderAreas.filter({ hasText: folderName });
		return folderFound;
	}

	async addFolder(folderName) {
		await this.addFolderBtn().click();
		await expect(this.folderInputEle()).toBeVisible();
		await this.folderInputEle().click();
		await this.folderInputEle().fill(folderName);
		await expect(this.submitFolderNameBtn()).toBeEnabled();
		await this.submitFolderNameBtn().click();
	}

	async addSubFolder(parentFolderName, subFolderName) {
		const parentFolder = this.getFolder(parentFolderName);
		await parentFolder.hover();
		await this.addSubFolderBtn().click();
		await expect(this.folderInputEle()).toBeVisible();
		await this.folderInputEle().click();
		await this.folderInputEle().fill(subFolderName);
		await expect(this.submitFolderNameBtn()).toBeEnabled();
		await this.submitFolderNameBtn().click();
	}

	async editFolderName(currentFolder, newFolderName) {
		const folderWrapper = this.getFolder(currentFolder);
		await folderWrapper.hover();
		await this.renameFolderBtn().click();
		const input = this.folderInputEle();
		await expect(input).toBeVisible();
		await input.click();
		await input.fill(newFolderName);
		await expect(this.submitFolderNameBtn()).toBeEnabled();
		await this.submitFolderNameBtn().click();
	}

	async removeFolder(folderName) {
		const folderWrapper = this.getFolder(folderName);
		await folderWrapper.hover();
		const deleteBtn = this.removeFolderBtn();
		await expect(deleteBtn).toBeVisible();

		await this.page.evaluate((el) => {
			const event = new MouseEvent('mousedown', { bubbles: true });
    		el.dispatchEvent(event);
		}, await deleteBtn.elementHandle());
		await this.page.waitForTimeout(1500);
	}

	async openTeachingPage() {
		await this.sidebar.menuIcon('teaching-folder').click();
		await this.waitForTeachingFolderToLoad();
	}

	async waitForTeachingFolderToLoad() {
		await this.apiWaitUtils.waitForAPI('/TeachingFolder?', 'GET');
		await this.apiWaitUtils.waitForAPI('/ImagingStudyWorklist/elk?', 'GET');
		await expect(this.page.locator('[data-cy="study-status-table"]')).toBeVisible({ timeout: TIMEOUT_IN_MSEC3 });
		
		await this.page.waitForTimeout(3000);
	}

	async navigateTeachingFolder() {
		await this.sidebar.menuIcon('teaching-folder').click();
		await expect(this.page.locator('[data-cy="study-status-table"]')).toBeVisible({ timeout: TIMEOUT_IN_MSEC3 });
	}
}