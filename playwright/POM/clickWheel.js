import { TIMEOUT_IN_MSEC2 } from './common';

export class ClickWheel {
    constructor(page) {
        this.page = page;
    }

    clickWheel() {
        return this.page.locator('[data-cy="wheeloption"]').first(); // Use `.first()` to match the first instance
    }

    closeClickWheel() {
        return this.page.locator('[data-cy="close-wheeloption"]');
    }

    patientIcon() {
        return this.clickWheel().locator('[name="patient"]');
    }

    visitIcon() {
        return this.clickWheel().locator('[name="visit"]');
    }

    orderIcon() {
        return this.clickWheel().locator('[name="order"]');
    }

    studyIcon() {
        return this.clickWheel().locator('[name="study"]');
    }

    documentViewerIcon() {
        return this.clickWheel().locator('[name="documentviewer"]');
    }

    imageViewerIcon() {
        return this.clickWheel().locator('[name="imageviewer"]');
    }

    studyExplorerIcon() {
        return this.clickWheel().locator('[name="studyexplorer"]');
    }

    sendStudyIcon() {
        return this.clickWheel().locator('[name="sendstudy"]');
    }

    studyHistory() {
        return this.clickWheel().locator('[name="studyexplorer"]');
    }

    billingIcon() {
        return this.clickWheel().locator('[name="billing"]');
    }
}
