import { coverageGenerator } from '../generators/coverageGenerator';
import { CoverageInformationPage } from '../POM/patientInformation/coverageInformationPage';
const { POManager } = require('../POM/POManager');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { test, request, expect, chromium } = require('@playwright/test');
import { studyGenerator } from 'playwright/generators/studyGenerator';
import { payerGenerator } from 'playwright/generators/payerGenerator';
import { financialTypeGenerator } from 'playwright/generators/financialTypeGenerator';
let patientInfo;
let context;
let page;
let coverageInformationPage;
let utilFuncs;

test.describe.serial('Coverage information Tests', () => {
	test.beforeAll(async ({ browser }) => {
		const apiContext = await request.newContext();
		context = await browser.newContext();
		page = await context.newPage();
		utilFuncs = new postStudyNGetToken(apiContext);
		patientInfo = await studyGenerator.postStudy();
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		coverageInformationPage = new CoverageInformationPage(page);
	});

	test('View patient coverage details page all section', async () => {
		let newCoverageResponse = {};

		const { coverageResponse } = await coverageInformationPage.openCoverageInformationPageByURL(
			patientInfo?.patientId
		);
		if (coverageResponse.total === 0) {
			await coverageInformationPage.getAddNewCoverageButton().click();
			newCoverageResponse = await coverageInformationPage.setCoverageDetailsInformation();
		}
		// Extract actual coverage details from the page
		const actualCoverageDO = await coverageInformationPage.extractCoverageInfo();

		const expectedCoverageDO = coverageGenerator.getPatientCoverageDetail(
			coverageResponse?.entry?.[0]?.resource || newCoverageResponse
		);
		// Verify coverage details
		expect(actualCoverageDO).toEqual(expectedCoverageDO);
	});

	test('delete a coverage if total allowed coverages are already present and then add new patient coverage without adding new payer', async () => {
		await coverageInformationPage.openCoverageInformationPageByURL(patientInfo?.patientId);
		const initialCardCount = await coverageInformationPage.getVisibleCoverageCardsCount();
		if (initialCardCount === 3) {
			const isCoverageDeleted = await coverageInformationPage.holdToDeleteCoverage(0);
		}
		await coverageInformationPage.getAddNewCoverageButton().click();

		// Add new coverage details
		const newCoverageResponse = await coverageInformationPage.setCoverageDetailsInformation();
		const cardCount = await coverageInformationPage.getVisibleCoverageCardsCount();
		await coverageInformationPage.getSpecificCoverage(cardCount - 1).click();
		const actualCoverageDO = await coverageInformationPage.extractCoverageInfo(cardCount - 1);
		const expectedCoverageDO = coverageGenerator.getPatientCoverageDetail(newCoverageResponse);
		// Verify coverage details
		expect(actualCoverageDO).toEqual(expectedCoverageDO);
	});

	test('edit new patient coverage', async () => {
		await coverageInformationPage.openCoverageInformationPageByURL(patientInfo?.patientId);
		await coverageInformationPage.getSpecificCoverage(0).hover();
		await page.waitForTimeout(500);

		await coverageInformationPage.getEditButton().click();

		const newCoverageResponse = await coverageInformationPage.editCoverageDetailsInformation();

		const actualCoverageDO = await coverageInformationPage.extractCoverageInfo();
		await page.waitForTimeout(2000);
		const expectedCoverageDO = coverageGenerator.getPatientCoverageDetail(newCoverageResponse);
		// Verify coverage details
		expect(actualCoverageDO).toEqual(expectedCoverageDO);
	});

	test('delete coverage and then add new patient coverage', async () => {
		await coverageInformationPage.openCoverageInformationPageByURL(patientInfo?.patientId);
		const isCoverageDeleted = await coverageInformationPage.holdToDeleteCoverage(0);
		await page.waitForTimeout(2000);
		if (isCoverageDeleted) {
			const cardCount = await coverageInformationPage.getVisibleCoverageCardsCount();
			await coverageInformationPage.getAddNewCoverageButton().click();
			const [newCoverageResponse, , actualCoverageDO] = await Promise.all([
				coverageInformationPage.setCoverageDetailsInformation(),
				coverageInformationPage.getSpecificCoverage(cardCount).click(),
				coverageInformationPage.extractCoverageInfo(cardCount),
			]);

			const expectedCoverageDO = coverageGenerator.getPatientCoverageDetail(newCoverageResponse);
			// Verify coverage details
			expect(actualCoverageDO).toEqual(expectedCoverageDO);
		}
	});

	test('delete a coverage and then add new coverage and also add new payer from payer drawer', async () => {
		await coverageInformationPage.openCoverageInformationPageByURL(patientInfo?.patientId);
		await coverageInformationPage.holdToDeleteCoverage(0);
		await page.waitForTimeout(1000);
		// Need to post a financial type for this step when you enable the test
		let financialType1 = await financialTypeGenerator.postFinancialType();
		const payerDetails = await payerGenerator.generatePayerFormValues(financialType1?.name);
		await coverageInformationPage.getAddNewCoverageButton().click();
		const newCoverageResponse = await coverageInformationPage.setCoverageDetailsInformation({
			payer: payerDetails,
		});
		const cardCount = await coverageInformationPage.getVisibleCoverageCardsCount();
		await coverageInformationPage.getSpecificCoverage(cardCount - 1).click();
		const actualCoverageDO = await coverageInformationPage.extractCoverageInfo(cardCount - 1);

		const expectedCoverageDO = coverageGenerator.getPatientCoverageDetail(newCoverageResponse);
		// Verify coverage details
		expect(actualCoverageDO).toEqual(expectedCoverageDO);
	});
});
