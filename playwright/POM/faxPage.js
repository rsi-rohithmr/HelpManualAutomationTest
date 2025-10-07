const { HomePage } = require('./homePage/homePage');
const { Sidebar } = require('./sidebar');
const { Common } = require('./common');
const { ApiWaitUtils } = require('./apiWaitUtils');

export class FaxPage {
	constructor(page) {
		this.page = page;
		this.homePage = new HomePage(this.page);
		this.sidebar = new Sidebar(this.page);
		this.common = new Common(this.page, '');
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	async sendFax({patientName, faxNumber}) {
		await this.page.route('**/ImagingStudy?*', async route => route.continue());
		await this.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientName}$`, 'g'))
			.first()
			.click({ force: true });
		await this.page.waitForTimeout(10000);
		await this.page.locator('svg[name="sendstudy"]').click({ force: true });

		await this.page.locator('input[name="fax"]').pressSequentially(faxNumber);
		await this.page.waitForTimeout(5000);
		await Promise.all([
			this.page.locator(`button:has-text("SEND REPORT")`).nth(1).click(),
			this.apiWaitUtils.waitForAPI('ImagingStudy/', 'GET'),
		]);
	}

	async filterFax({patientName, accessionNum, faxNumber}) {
		await this.page.route('**/fax?*', async route => route.continue());
		await this.sidebar.menuIcon('log').click();
		await this.page.locator(`button:has-text("DICOM")`).click();
		await Promise.all([
			this.page.locator(`button:has-text("FL")`).click(),
			this.apiWaitUtils.waitForAPI('/fax?', 'GET'),
		]);

		await this.page.locator('svg[name="clearFilter"]').click();
		await this.page.route('**/fax?*', async route => route.continue());
		await this.page.locator(`[data-cy="Direction_filter"]`).click({ force: true });
		await this.page.locator(`[data-cy="Direction_filter"] [type="text"]`).clear();
		await this.page.locator(`[data-cy="Direction_filter"]`).pressSequentially("outbound");
		await Promise.all([
			await this.page
				.locator(`li:has-text("outbound")`)
				.first()
				.click(),
			this.apiWaitUtils.waitForAPI('/fax?', 'GET'),
		]);
		
		await this.page.route('**/fax?*', async route => route.continue());
		await this.page.locator('[data-cy="Patient_filter"]').click();
		await this.page.locator('[data-cy="Patient_filter"] [placeholder="Search"]').clear();
		await Promise.all([
			this.page.locator('[data-cy="Patient_filter"] [placeholder="Search"]').pressSequentially(patientName),
			this.apiWaitUtils.waitForAPI('/fax?', 'GET'),
		]);

		await this.page.route('**/fax?*', async route => route.continue());
		await this.page.locator('[data-cy="Accession #_filter"]').click();
		await this.page.locator('[data-cy="Accession #_filter"] [placeholder="Search"]').clear();
		await Promise.all([
			this.page.locator('[data-cy="Accession #_filter"] [placeholder="Search"]').pressSequentially(accessionNum),
			this.apiWaitUtils.waitForAPI('/fax?', 'GET'),
		]);

		await this.page.route('**/fax?*', async route => route.continue());
		await this.page.locator('[data-cy="To_filter"]').click();
		await this.page.locator('[data-cy="To_filter"] [placeholder="Search"]').clear();
		await Promise.all([
			this.page.locator('[data-cy="To_filter"] [placeholder="Search"]').pressSequentially(faxNumber),
			this.apiWaitUtils.waitForAPI('/fax?', 'GET'),
		]);
	}
}
