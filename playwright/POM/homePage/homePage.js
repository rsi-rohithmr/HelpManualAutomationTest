// import { menuItems, sidebar } from '../sidebar';

import { Common } from '../common';

export class HomePage {
	constructor(page) {
		this.page = page;
		this.common = new Common(this.page, '');
	}

	worklistLbl() {
		return this.page.locator('.grid-toolbar >> text=Worklist');
	}

	pagination() {
		return this.page.locator('.grid-toolbar .pagination >> text=of');
	}

	studiesCount() {
		return this.page.locator('.pagination').last();
	}

	worklistTable() {
		return this.page.locator('[data-cy="study-status-table"]').first();
	}

	worklistTableHeader() {
		return this.page.locator('[data-cy="study-status-table"] th');
	}

	worklistTableRows() {
		return this.page.locator('[data-cy="study-status-table"] tbody > tr');
	}

	worklistPidRow() {
		return this.page.getByTestId('study-status-cell-0_patientID');
	}

	deleteFromFilterCapsule(filterName) {
		return this.page.locator(`[data-cy="${filterName}_capsule-delete"]`);
	}

	filterCapsule(filterName) {
		return this.page.locator(`[data-cy="${filterName}_capsule"]`);
	}

	clearFilterCapsule() {
		return this.page.locator('[name="clearFilter"]');
	}

	updateWL() {
		return this.page.locator('[data-cy="Save-grid"]');
	}

	columnFilter(columnName) {
		return this.page.locator(`[data-cy="${columnName}_filter"]`);
	}

	column(columnName) {
		return this.page.locator(`[data-cy="${columnName}_column"]`);
	}

	documentViewerBtn() {
		return this.page.locator('[name="documentviewer"]');
	}

	addNewBtn() {
		return this.page.locator('[aria-label="Add New button"]');
	}

	homePageBtn() {
		return this.page.locator('[data-cy="sidebar-home"]');
	}

	importBtn() {
		return this.page.locator('[data-cy="importBtn"]');
	}

	newOrderBtn() {
		return this.page.getByText('Order').first();
	}

	async waitForWorklistPageNumberChange() {
		const paginationText = await this.pagination().innerText();
		await this.page.waitForFunction(async () => (await this.pagination().innerText()) !== paginationText, {
			timeout: 5000,
		});
	}

	async getRowText(searchString) {
		const rowData = {};
		const row = await this.worklistTable().locator(`tr:has-text("${searchString}")`);
		const index = await row.evaluate(node => node.rowIndex);
		const cells = await this.page.locator(`#MUIDataTableBodyRow-worklist-${index} td div`);

		for (let i = 0; i < cells.count(); i += 2) {
			const colName = await cells.nth(i).innerText();
			const colVal = await cells.nth(i + 1).innerText();
			rowData[colName] = colVal;
		}

		return rowData;
	}

	async waitForWorklistTableToLoad(totalStudies) {
		const target = totalStudies > 0 ? 1 : 0;
		await this.page.waitForFunction(async () => (await this.worklistTableRows().count()) >= target, {
			timeout: TIMEOUT_IN_MSEC3,
		});
	}

	async openHomePage() {
		await this.page.route('**/ImagingStudyWorklist/elk*', route => route.continue());
		await sidebar.menuIcon('home').click({ force: true });

		await this.page.waitForResponse('**/ImagingStudyWorklist/elk*');
		await this.waitForWorklistTableToLoad(totalStudies);
		await this.page.waitForResponse('**/fhir/ValueSet*');
	}

	async filterStudiesBySingleColumn(columnName, criteria) {
		await this.page.route('**/ImagingStudyWorklist/elk*', route => route.continue());
		console.log('Patient name recevied in homepage Fn', criteria);
		await this.common.filterRecordsBySingleColumn(columnName, criteria);

		await this.page.waitForResponse('**/ImagingStudyWorklist/elk*');
		// await this.waitForWorklistTableToLoad(totalStudies);
	}

	async filterStudiesBySuggestionColumn(columnName, criteria) {
		await this.page.route('**/ImagingStudyWorklist/elk*', route => route.continue());

		await this.common.filterRecordsBySuggestionColumn(columnName, criteria);

		await this.page.waitForResponse('**/ImagingStudyWorklist/elk*');
	}

	async filterStudiesByMultiSelectionColumn(columnName, criteria) {
		await this.page.route('**/ImagingStudyWorklist/elk*', route => route.continue());
		await this.common.filterRecordsByMultiSelectionColumn(columnName, criteria);
		await this.page.waitForResponse('**/ImagingStudyWorklist/elk*');
		// await this.waitForWorklistTableToLoad(totalStudies);
	}

	async verifyNumberOfDicomObject(row, columnName, expectedValue) {
		const cellText = await this.page.evaluate(
			(row, colName) => {
				return window.getTableCellText(row, colName);
			},
			row,
			columnName
		);

		expect(cellText).toBe(expectedValue);
	}
}
