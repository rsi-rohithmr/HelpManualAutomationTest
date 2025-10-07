import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC3, TIMEOUT_IN_MSEC4 } from '../timeouts';
const { ApiWaitUtils } = require('../apiWaitUtils');

export class Scheduler {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	//#region Scheduler icon on feature bar
	schedulerIcon() {
		return this.page.locator('[data-testid="CalendarMonthOutlinedIcon"]');
	}
	//#endregion Scheduler icon on feature bar

	//#region Healthcare service setup
	editHealthcareServiceIcon() {
		return this.page.locator('[aria-label="collapse"] [data-testid="SettingsOutlinedIcon"]');
	}

	resourceIcon() {
		return this.page.locator('[id="relevant-resources-button"]');
	}

	resourceSearchTextBox() {
		return this.page.locator('[data-cy="Resource_filter"] input');
	}

	allCheckbox() {
		return this.page.locator('[data-testId="all-checkbox"]');
	}
	//#endregion Healthcare service setup

	//#region Calendar grid
	calendarGridCell(atHourAndMinuteCell) {
		return this.page.locator(`[data-cy="calendar-grid-row-${atHourAndMinuteCell}"]`);
	}

	liveTimeline() {
		return this.page.locator('[id="live-timeline"]');
	}
	//#endregion Calendar grid

	//#region Appointment Details card
	appointmentDetailsCard() {
		return this.page.locator('[data-testid="appointment-details-card-wrap"]');
	}

	statusOnAptDetailsCard() {
		return this.appointmentDetailsCard().locator('[data-testid="appointment-details-card-status-wrap"]');
	}

	editIconOnAptDetailsCard() {
		return this.appointmentDetailsCard().locator(':nth-child(2) :nth-child(2) [data-testid="EditOutlinedIcon"]');
	}

	priorityOnAptDetailsCard() {
		return this.appointmentDetailsCard().locator(':nth-child(2) :nth-child(3) :nth-child(1) p:nth-of-type(2)');
	}

	deleteIconOnAptDetailsCard() {
		return this.page.locator('[data-testid="DeleteOutlineIcon"]').first();
	}
	//#endregion Appointment Details card

	//#region Appointment form
	statusCombo() {
		return this.page.locator('[id="form-field-Status"]');
	}

	patientNameTextBox() {
		return this.page.locator('[id="autocomplete-field-Patient Name"]').nth(1);
	}

	referringPhysicianTextBox() {
		return this.page.locator('[id="autocomplete-field-Referring Physician"]').nth(1);
	}

	referringOrganizationCombo() {
		return this.page.locator('[id="form-field-Referring Organization"]').nth(1);
	}

	asapPriorityIcon() {
		return this.page.locator('[value="3"]');
	}

	orderDropdown() {
		return this.page.locator('[id="form-field-Order"]');
	}

	orderDropdownIcon() {
		return this.page.locator('[data-testid="ArrowDropDownIcon"]').first();
	}

	studySetsTextBox() {
		return this.page.locator('[id="autocomplete-field-Study Sets"]').nth(1);
	}

	studyIcon() {
		return this.page.locator('[data-testid="DescriptionOutlinedIcon"]').nth(1);
	}

	deleteStudyIcon() {
		return this.page.getByTestId('progress-delete-button');
	}

	createBtn() {
		return this.page.locator('[data-cy="CREATE_"]').nth(1);
	}

	closeBtnOnNewForm() {
		return this.page.locator('[data-cy="New Appointment_close"]');
	}

	closeBtnOnEditForm() {
		return this.page.locator('[data-cy="APPOINTMENT_close"]');
	}

	updateBtn() {
		return this.page.locator('[data-cy="Update_"]');
	}
	//#endregion Appointment form

	seriesBtn() {
		return this.page.getByRole('button', { name: 'Series' });
	}

	repeatCombo() {
		return this.page.getByLabel('Repeat');
	}

	dailyRepeatOption() {
		return this.page.getByRole('option', { name: 'Daily' });
	}

	blockTimeNoteTxt() {
		return this.page.getByRole('textbox', { name: 'Note' });
	}

	editBlockIcon() {
		return this.page.getByTestId('EditOutlinedIcon');
	}
	//#endregion Block Time form

	//#region Functions
	async openNextMonthCalendar() {
		await this.page.getByTestId('calendar-date-picker-expand-icon').click();
		await this.page.getByLabel('Next month').click();
		await this.page.getByTestId('calendar-date-picker-core-day-1').first().click();
	}

	async openSchedulerDrawer(healthcareService) {
		await (await this.schedulerIcon()).click();
		const noResources = this.page.locator('text=No resources selected');
		await noResources.isVisible();

		await this.openNextMonthCalendar();
		await noResources.isVisible();

		if (healthcareService) {
			await this.selectHealthcareService(healthcareService);
			await noResources.waitFor({ timeout: TIMEOUT_IN_MSEC4, state: 'hidden' });
		}
	}

	async selectHealthcareService(healthcareService) {
		await (await this.editHealthcareServiceIcon()).hover();
		const resourceIcon = await this.resourceIcon();
		await resourceIcon.waitFor({ state: 'visible' });
		await resourceIcon.click();

		const searchBox = await this.resourceSearchTextBox();
		await searchBox.type(healthcareService);

		const serviceOption = await this.page.getByRole('menuitem', { name: healthcareService }).getByRole('checkbox');
		await serviceOption.check();
		await serviceOption.waitFor({ timeout: TIMEOUT_IN_MSEC2 });

		await resourceIcon.click({ force: true }); // close the Resource popup
		await serviceOption.waitFor({ timeout: TIMEOUT_IN_MSEC1, state: 'hidden' });
		await this.page.waitForTimeout(TIMEOUT_IN_MSEC1);
	}

	async openNewAppointmentDrawer(atHourAndMinuteCell) {
		await (await this.calendarGridCell(atHourAndMinuteCell)).click();
		await this.page.locator('text=Shown as').waitFor({ timeout: TIMEOUT_IN_MSEC4 });
	}

	async openNewBlockTimeDrawer(atHourAndMinuteCell) {
		await this.openNewAppointmentDrawer(atHourAndMinuteCell);
		await this.page.getByRole('button', { name: 'BLOCK' }).click();
	}

	async openAppointmentDetailsCard(patientName) {
		const appointmentCard = this.page.locator(`[aria-label^="${patientName}"]`);
		// await appointmentCard.scrollIntoViewIfNeeded();
		await appointmentCard.click();
	}

	async openEditAppointmentDrawer(patientName) {
		// Route continuation for API
		await this.page.route('**/fhir/Patient/*', route => route.continue());

		// Open appointment details
		await this.openAppointmentDetailsCard(patientName);

		// Interact with the edit icon
		const editIcon = await this.editIconOnAptDetailsCard();
		if (await editIcon.isVisible()) {
			await editIcon.click(); // Ensure the edit icon is clickable
		} else {
			console.error('Edit icon not visible or interactable');
			throw new Error('Edit icon interaction failed');
		}

		// Wait for API response
		await this.page.waitForResponse(resp => resp.url().includes('fhir/Patient') && resp.status() === 200);

		// Ensure deleteStudyIcon is interactable
		const deleteStudyIcon = await this.deleteStudyIcon();
		await deleteStudyIcon.scrollIntoViewIfNeeded();
		await this.page.waitForTimeout(TIMEOUT_IN_MSEC3);
	}

	async autoCompleteSearchFormField(fieldLocator, criteria, resourceName, optionListTestId) {
		this.fieldLocator = fieldLocator;
		const aliasName = `searchFor${resourceName}`;
		const criteriaEncoded = encodeURIComponent(criteria).replace(/'/g, '%27');
		await this.page.route(`**${criteriaEncoded}*`, route => route.continue());

		// if (this.fieldLocator) await this.page.locator('[id="autocomplete-field-Patient Name"]').nth(1).pressSequentially(criteria);
		if (this.fieldLocator) await fieldLocator.pressSequentially(criteria);
		// await this.page.waitForResponse(resp => resp.url().includes(criteriaEncoded) && resp.status() === 200);
		await this.apiWaitUtils.waitForAPI(criteriaEncoded, 'GET');
		// added wait to handle the delay in rendering the resultss
		await this.page.waitForTimeout(3000);
		const options = this.page.locator(`[data-testid="${optionListTestId}"] li`);
		const optionCount = await options.count();

		for (let i = 0; i < optionCount; i++) {
			const text = await options.nth(i).textContent();
			if (text.toLowerCase().includes(criteria.toLowerCase())) {
				await options.nth(i).click({ force: true });
				break;
			}
		}
	}

	async expandSchedulerDrawer() {
		await this.page.locator('[aria-label="Expand Calendar"]').click();
		await this.page.locator('[data-testid="MoreVertIcon"]').click();
		await this.page.locator('.MuiListItemText-root .MuiTypography-body1 >> text=Month').click();
	}

	async collapseSchedulerDrawer() {
		await this.page.locator('[aria-label="Collapse Calendar"]').click();
	}
	//#endregion Functions
}
