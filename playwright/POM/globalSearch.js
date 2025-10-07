import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC4 } from './common';
import { expect } from '@playwright/test';

export class GlobalSearch {
  constructor(page) {
    this.page = page;
  }

  async globalSearchCombo(menu) {
    return this.page.locator('[class="subheader"] div', { hasText: menu });
  }

  async globalSearchSelect(menu) {
    return this.page.locator(`[data-cy="${menu}"]`);
  }

  async itemsContainer() {
    return this.page.locator('[data-cy="search-items-container"] div');
  }

  async searchItemsContainer(datasetType) {
    return this.page.locator(`[data-cy="dataset-${datasetType}"]`);
  }

  async topSearchTxt() {
    return this.page.locator('[id="top-search"]');
  }

  searchOptions = {
    All: 'All',
    Study: 'Study',
    DICOM: 'DICOM Query',
    Patient: 'Patient',
    Organization: 'Organization',
    User: 'User',
  };

  async viewMoreBtn() {
    return this.page.locator('[class="autosuggest-dialog"] h6:has-text("VIEW MORE")');
  }

  async progressIcon() {
    return this.page.locator('[class="subheader"] span [role="progressbar"]');
  }

  async clearIcon() {
    return this.page.locator('.font-icon-wrapper');
  }

  async clearData() {
    if (await this.clearIcon().isVisible()) {
      await this.clearIcon().click();
    }
  }

  async recentViewedItems() {
    return this.page.locator('[data-cy="recent-viewed-items"] span');
  }

  async recentSearchedItems() {
    return this.page.locator('[data-cy="recent-searched-items"] span');
  }

  async autosuggestList(category) {
    return this.page.locator(`[data-cy="dataset-${category}"] span`);
  }

  resourceTypes = {
    Patient: 'Patient',
    Study: 'Study',
    Order: 'Order',
    Visit: 'Visit',
    Organization: 'Organization',
    User: 'User',
  };

  async searchDataSet(type) {
    return this.page.locator(`[data-cy="dataset-${type}"] span`);
  }

  resultTabs = {
    All: 'All',
    Patient: 'Patient',
    Study: 'Study',
    Order: 'Order',
    Visit: 'Visit',
    Organization: 'Organization',
    User: 'User',
  };

  async goToResultPage(tabName) {
    const tabIndex = Object.values(this.resultTabs).indexOf(tabName);
    if (tabIndex !== -1) {
      await this.page.locator(`[id="simple-tab-${tabIndex}"]`).click();
    }
  }

  async searchExecution(searchCriteria, method, category) {
    const fullEncodeURI = `${encodeURI(searchCriteria)}`.replace(/\'/g, `%27`);
    await this.page.route(`**_content=${fullEncodeURI}*`, route => route.continue());
    await this.topSearchTxt().fill('');
    if (category) {
      await this.searchType(category).click();
    }
    await this.topSearchTxt().type(searchCriteria, { delay: 10 });
    await this.page.waitForResponse(response => 
      response.url().includes(fullEncodeURI) && response.status() === 200
    );
  }

  async waitForSearchResultPageToLoad(searchCriteria, method) {
    const fullEncodeURI = `${encodeURI(searchCriteria)}`.replace(/\'/g, `%27`);
    await this.page.route(`**_content=${fullEncodeURI}*`, route => route.continue());
    await this.topSearchTxt().fill('');
    await this.topSearchTxt().type(searchCriteria, { delay: 10 });
    await this.page.waitForResponse(response => 
      response.url().includes(fullEncodeURI) && response.status() === 200
    );
    await this.page.waitForTimeout(3000);
    await this.topSearchTxt().press('Enter');
  }

  async checkElementThenClickingOn(locator) {
    const element = this.page.locator(locator);
    if (await element.isVisible()) {
      await element.click();
    }
  }

  async goToBtn() {
    return this.page.locator('[data-cy="search-items-container"] button:has-text("GO TO ")');
  }

  async goToPatientBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Patient"] button:has-text("GO TO ")');
  }

  async openPatientDetails(patientInfo) {
    return this.page.locator(`[data-cy="dataset-Patient"]:has-text("${patientInfo}")`);
  }

  async goToStudyBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Study"] button:has-text("GO TO ")');
  }

  async openStudyDetails(studyInfo) {
    return this.page.locator(`[data-cy="dataset-Study"]:has-text("${studyInfo}")`);
  }

  async goToOrderBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Order"] button:has-text("GO TO ")');
  }

  async openOrderDetails(orderInfo) {
    return this.page.locator(`[data-cy="dataset-Order"]:has-text("${orderInfo}")`);
  }

  async goToVisitBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Visit"] button:has-text("GO TO ")');
  }

  async openVisitDetails(visitInfo) {
    return this.page.locator(`[data-cy="dataset-Visit"]:has-text("${visitInfo}")`);
  }

  async goToOrganizationBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Organization"] button:has-text("GO TO ")');
  }

  async openOrganizationDetails(organizationInfo) {
    return this.page.locator(`[data-cy="dataset-Organization"]:has-text("${organizationInfo}")`);
  }

  async goToUserBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-User"] button:has-text("GO TO ")');
  }

  async openUserDetails(userInfo) {
    return this.page.locator(`[data-cy="dataset-User"]:has-text("${userInfo}")`);
  }

  async searchType(category) {
    return this.page.locator('[id="categoriesList"] span', { hasText: category });
  }
}


