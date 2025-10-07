export class DetailedTablePopper {
	constructor(page) {
		this.page = page;
	}

	// Get the first data row
	firstRow() {
		return this.page.locator('[role="row"][aria-rowindex="2"]');
	}

	// Get row by index (0-based)
	rowByIndex(index) {
		return this.page.locator(`[role="row"][aria-rowindex="${index + 2}"]`);
	}

	// Get cell in first row by field name
	firstRowCellByField(fieldName) {
		return this.firstRow().locator(`[role="cell"][data-field="${fieldName}"]`);
	}

	// Get cell by row index and field name
	cellByRowAndField(rowIndex, fieldName) {
		return this.rowByIndex(rowIndex).locator(`[role="cell"][data-field="${fieldName}"]`);
	}

	// Get column header by field name
	columnHeaderByField(fieldName) {
		return this.page.locator(`.MuiDataGrid-columnHeader[data-field="${fieldName}"]`);
	}

	// Get column header by visible title (fallback if needed)
	columnHeaderByTitle(titleText) {
		return this.page.locator(`.MuiDataGrid-columnHeaderTitle`, { hasText: titleText });
	}

	// Find a row containing specific text anywhere
	rowContainingText(text) {
		return this.page.locator('[role="row"]').filter({ hasText: text });
	}

	// Count number of data rows (excluding header)
	async rowCount() {
		return (await this.page.locator('[role="row"]').count()) - 1; // subtract header row
	}

	// Example: Click on first row
	async clickFirstRow() {
		await this.firstRow().click();
	}

	// Example: Get all visible cell texts in a row
	async getRowCellTexts(rowIndex) {
		const row = this.rowByIndex(rowIndex);
		const cells = row.locator('[role="cell"]');
		const count = await cells.count();
		const texts = [];
		for (let i = 0; i < count; i++) {
			texts.push(await cells.nth(i).innerText());
		}
		return texts;
	}
	// Get popper container
	getPopperContainer() {
		return this.page.getByTestId('table-popper-container');
	}

	// Get Add New button with multiple strategies
	getAddNewButton() {
		return {
			// By text (uppercase as shown in styles)
			byText: this.page.getByText('ADD NEW', { exact: true }),

			// By icon and text combination
			byIcon: this.page.getByRole('button').filter({
				has: this.page.locator('svg[data-testid="AddIcon"]'),
			}),

			// By parent stack
			byStack: this.page.locator('div.MuiStack-root').filter({
				hasText: 'ADD NEW',
			}),

			//By Label
			byLabel: this.page.getByTestId('table-popper-container').getByLabel('Add new'),
		};
	}

	// Helper method to wait for and click Add New
	async clickAddNew() {
		// Wait for popper to be visible first
		await this.getPopperContainer().waitFor({ state: 'visible' });

		// Click the Add New button
		await this.getAddNewButton().byText.click();
	}

	// Helper method to wait for and click Add New using label
	async clickAddNewUsingLabel() {
		// Wait for popper to be visible first
		await this.getPopperContainer().waitFor({ state: 'visible' });

		// Click the Add New buttonusing label text
		await this.getAddNewButton().byLabel.click();
	}

	// Check if Add New is visible
	async isAddNewVisible() {
		return await this.getAddNewButton().byText.isVisible();
	}
}
