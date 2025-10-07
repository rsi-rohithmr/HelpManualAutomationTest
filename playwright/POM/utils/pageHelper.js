import { TIMEOUT_IN_MSEC2 } from '../timeouts';

export class PageHelper {
	constructor(page) {
		this.page = page;
	}

	async selectDateFromDatePicker(datePickerLocator, date) {
		const dateValue = new Date(date);
		const year = dateValue?.getFullYear();
		const month = dateValue?.toLocaleString('en-US', { month: 'short' });
		const day = dateValue?.getDate();

		await datePickerLocator?.click();

		// Date pickers may have different aria-labels
		const switchBtn = this.page.locator('[aria-label="calendar view is open, switch"]');
		const switchToYearViewBtn = this.page.locator('[aria-label="calendar view is open, switch to year view"]');

		// Check which one exists and is visible, click the first available
		if (await switchBtn.isVisible().catch(() => false)) {
			console.log(
				`PageHelpers - selectDateFromDatePicker - found the year view by 'calendar view is open, switch' aria-label`
			);
			await switchBtn.click();
		} else if (await switchToYearViewBtn.isVisible().catch(() => false)) {
			console.log(
				`PageHelpers - selectDateFromDatePicker - found the year view by 'calendar view is open, switch to year view' aria-label`
			);
			await switchToYearViewBtn.click();
		} else {
			await this.page.getByText(`${month} ${year}`).click();
			console.log(
				`PageHelpers - selectDateFromDatePicker - opened the year view by clicking on ${month} ${year} text`
			);
		}

		await this.page
			.locator('div')
			.filter({ hasText: new RegExp(`^${year}$`) })
			.getByRole('button')
			.click();
		await this.page.getByRole('button', { name: month, exact: true }).click();

		await this.page.getByRole('button', { name: `${month} ${day}, ${year}`, exact: true }).click();

		// Close the date picker
		if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
			// When running the tests in headless mode on pipeline, the MUI date picker GUI looks different. It shows Clear, Cancel and OK buttons,
			// and the startDatePicker elelent is not visible. So the step closing the date picker needs to be different for headless and headed modes
			await this.page.getByRole('button', { name: 'OK' }).click();
		} else {
			await datePickerLocator?.click(); // click on the date field itself to close the date picker
		}
	}

	async clearTextFieldValue(fieldLocator) {
		await fieldLocator?.click();
		await fieldLocator?.press('ControlOrMeta+a');
		await fieldLocator?.press('Backspace');
	}

	async selectComboBoxOption(optionName, isExactMatch) {
		await this.page.getByRole('option', { name: optionName, exact: isExactMatch ?? true }).click();
	}

	//#region functions for form fields that can be edited by hovering on the fields, and have different IDs in view and edit mode

	async selectOptionFromCombo(fieldInView, fieldInEdit, optionName, isMultiSelect) {
		await this.hoverOnFieldIfVisible(fieldInView);
		await fieldInEdit?.click();
		await this.selectComboBoxOption(optionName);
		if (isMultiSelect) {
			await this.page.keyboard.press('Escape');
		}
	}

	async searchAndSelectOptionFromAutocompleteCombo(
		fieldInView,
		fieldInEdit,
		optionName,
		seachKey,
		isExactMatch,
		delayInMsec
	) {
		await this.hoverOnFieldIfVisible(fieldInView);
		await fieldInEdit?.click();
		await fieldInEdit?.pressSequentially(seachKey ?? optionName, {
			delay: delayInMsec ?? 500,
		});
		await this.page
			.getByRole('option', { name: optionName })
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		await this.selectComboBoxOption(optionName, isExactMatch);
	}

	async inputValueForTextField(fieldInView, fieldInEdit, value) {
		await this.hoverOnFieldIfVisible(fieldInView);
		await fieldInEdit?.click();
		await this.clearTextFieldValue(fieldInEdit);
		await fieldInEdit?.fill(value);
	}

	async hoverOnFieldIfVisible(field) {
		if (field && (await field.isVisible().catch(() => false))) {
			await field?.hover();
		}
	}
	//#endregion functions for form fields that can be edited by hovering on the fields, and have differnt IDs in view and edit mode
}
