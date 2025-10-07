const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { orgGenerator } = require('../generators/organizationGenerator');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');
test.describe('Import to duplicated organization names', () => {
	let apiContext;
	let api;
	const studyUid = '3.2.836.0.1.3680043.2.404.20040927.155394848534';
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let childOrgId;
	const managingOrgId2 = playwrightConfig.uacManagingOrg.organizationId;
	const managingOrgName2 = playwrightConfig.uacManagingOrg.organizationName;
	let childOrgId2;

	test.beforeEach(async ({ page }) => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);

		// Create two child orgs with same name
		const organizationPayload = await orgGenerator.generateOrganizationPayload(
			true,
			true,
			true,
			true,
			null,
			{ id: managingOrgId, name: managingOrgName },
			'Test duplicated org name'
		);

		const child = await orgGenerator.postOrganization(organizationPayload);
		expect(child).not.toBeNull();
		expect(child.total).toBe(1);
		expect(child.entry[0].resource.id).not.toBeNull();
		childOrgId = child.entry[0].resource.id;

		const organizationPayload2 = await orgGenerator.generateOrganizationPayload(
			true,
			true,
			true,
			true,
			null,
			{ id: managingOrgId2, name: managingOrgName2 },
			'Test duplicated org name'
		);

		const child2 = await orgGenerator.postOrganization(organizationPayload2);
		expect(child2).not.toBeNull();
		expect(child2.total).toBe(1);
		expect(child2.entry[0].resource.id).not.toBeNull();
		childOrgId2 = child2.entry[0].resource.id;

		var respImportStudy = await api.importStudyToManaginOrg(
			path.relative(process.cwd(), path.join(__dirname, '../TestData/dicomImport/testDuplicatedOrg/dicom.dcm')),
			childOrgId
		);
		console.log('Import response: ', respImportStudy);
		// Handling sync delay for uploaded study
		await page.waitForTimeout(10000);

		// Handling sync delay for uploaded study
		await page.waitForTimeout(5000);

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Only one organization should be imported', async ({ page }) => {
		let resourceName = 'imagingstudy';
		let resposeOne = await api.getFhirResourceByCriteria(
			resourceName,
			`studyuid=${studyUid}&managingorganization=${childOrgId}`
		);
		let resposeTwo = await api.getFhirResourceByCriteria(
			resourceName,
			`studyuid=${studyUid}&managingorganization=${childOrgId2}`
		);

		expect(resposeOne.total).toBe(1);
		expect(resposeTwo.total).toBe(0);

		await api.deleteStudyFromMangingOrg(studyUid, childOrgId);

		await page.waitForTimeout(10000);

		let resposeAfterDelete = await api.getFhirResourceByCriteria(
			resourceName,
			`studyuid=${studyUid}&managingorganization=${childOrgId}`
		);
		expect(resposeAfterDelete.total).toBe(0);
	});
});
