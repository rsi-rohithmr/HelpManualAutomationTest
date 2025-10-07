import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, common } from '../timeouts';

export class WorklistSpeedDial {
	constructor(page) {
		this.page = page;
	}

	//#region - Worklist speed dial elements
	worklistSpeedDialBtn() {
		return this.page.locator('[aria-label="Worklist Speed Dial"]');
	}

	searchBtn() {
		return this.page.locator('[data-cy="searchWorkListIcon"]');
	}

	searchTxt() {
		return this.page.locator('[data-cy="searchWorkListTextBox"]');
	}

	addNewWorklistBtn() {
		return this.page.locator('[data-cy="AddNewWorklist"]');
	}

	worklistSettingsBtn() {
		return this.page.locator('[data-cy="SettingsOutlinedIcon"]');
	}

	//#endregion - Worklist speed dial elements

	// New worklist drawer elements

	addNewWLDrawerLbl() {
		return this.page.locator('text=New Worklist');
	}

	AddWLUserSelect() {
		return this.page.locator('[data-cy="AddWLUserSelector"]');
	}

	addNewWLName() {
		return this.page.locator('[name="name"]');
	}

	addNewWLCancelBtn() {
		return this.page.locator('[data-cy="CancelSave"]');
	}

	closeAddNewWL() {
		return this.page.locator('[data-cy="New Worklist_close"]');
	}

	saveNewWL() {
		return this.page.locator('[data-cy="Save_"]');
	}

	columnFilter(colName) {
		return this.page.locator(`form [data-cy="${colName}_filter"]`);
	}

	columnClear(colName) {
		return this.page.locator(`form [data-cy="${colName}_clear"]`);
	}

	sortTab() {
		return this.page.locator('[data-cy="SORT_WorklistSpeedDial"]');
	}

	wLSettingsDrawerLbl() {
		return this.page.locator('text=Worklist Settings');
	}

	wlNameEditIcon(wlName) {
		return this.page.locator(`[data-cy="edit_${wlName}"]`);
	}

	wlNameEditText(wlName) {
		return this.page.locator(`[data-cy="input_${wlName}"]`);
	}

	wlNameEditSave(wlName) {
		return this.page.locator(`[data-cy="save_${wlName}"]`);
	}

	wlMoreOptions(wlName) {
		return this.page.locator(`[data-cy="moreWLOptions_${wlName}"]`);
	}

	wlSetDefault(wlName) {
		return this.page.locator(`[data-cy="${wlName}_SetDefault"]`);
	}

	DefaultWLcheck(wlName) {
		return this.page.locator(`[data-cy="Default_${wlName}"]`);
	}

	wlDelete(wlName) {
		return this.page.locator(`[data-cy="delete_${wlName}"]`);
	}

	saveAsNewWorklist() {
		return this.page.locator('text=SAVE AS NEW WORKLIST');
	}

	saveEdit() {
		return this.page.locator('[data-cy="Save_SAVE AS NEW WORKLIST"]');
	}

	closeWLSettings() {
		return this.page.locator('[data-cy="Worklist Settings_close"]');
	}

	columnSelector() {
		return this.page.locator('#searchable-user-selectory');
	}

	columnDelete(index) {
		return this.page.locator(`form [data-cy="delete${index}"]`);
	}

	sortIcon() {
		return this.page.locator('[data-cy="ArrowIcon"]');
	}

	sortColumnDelete(index) {
		return this.page.locator(`[data-cy="delete_${index}"]`);
	}

	sortColumnIcon(index) {
		return this.page.locator(`[data-cy="ArrowIcon_${index}"]`);
	}

	newWorklistName() {
		return this.page.locator('[name="name"]');
	}

	closeSaveAsWL() {
		return this.page.locator('[data-cy="Save For a New Worklist_close"]');
	}

	saveAsWLdrawerLbl() {
		return this.page.locator('text=Save For a New Worklist');
	}

	CancelSaveAs() {
		return this.page.locator('[data-cy="SaveAsCancel"]');
	}

	async addColumnsToWL(columnsList) {
		columnsList.forEach(async (column, index) => {
			await this.addColumnBtn().click();
			await this.columnSelector().fill(columnsList[index]);
		});
	}

	async openSpeedDialNewWL(wlName, columns) {
		await this.worklistSpeedDialBtn().click();
		await this.addNewWL().click();
		await this.addNewWLName().fill(wlName);
		await this.addColumnsToWL(columns);
	}

	async openSpeedDialSettings() {
		await this.worklistSpeedDialBtn().click();
		await this.worklistSettingsBtn().click();
	}

	async verifyWLInSpeedDialMenu(wlName, expected) {
		await this.worklistSpeedDialBtn().click();
		await expect(this.page.locator(`[data-cy="${wlName}"]`)).toHaveCount(expected ? 1 : 0);
		await this.worklistSpeedDialBtn().click();
	}

	async filterRecordsByMultiSelectionColumn(columnName, filterValues) {
		await this.page.locator(`form [data-cy="${columnName}_filter"]`).click();
		filterValues.forEach(async (value) => {
			await this.page.locator('.MuiAutocomplete-option').contains(value).click();
		});
	}

	// Open New Worklist Drawer
	async gotToAddNewWorklistDrawer() {
		await this.worklistSpeedDialBtn().click();
		await this.addNewWorklistBtn().click();
		await this.page.waitForTimeout(6000);
	}

	// Open Worklist Settings Drawer
	async goToWorklistSettingsDrawer() {
		await this.worklistSpeedDialBtn().click();
		await this.worklistSettingsBtn().click();
		await this.page.waitForTimeout(6000);
	}
}
