const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let poManager;
let browserContext;
let page;
let studyInfo = {};

test.describe.serial('Minimum requirements to access IV', () => {
    test.beforeAll(async ({}) => {
        const apiContext = await request.newContext();
        const api = new postStudyNGetToken(apiContext);
        browserContext = await chromium.launch();
        page = await browserContext.newPage();
        await api.postStudy().then(result => {
            console.log('Posted study', result);
            studyInfo = result;
        });
        console.log('studyInfo:', studyInfo);
        console.log('Import study to organization');
        const filePath = path.relative(
            process.cwd(),
            path.join(__dirname, '../TestData/dicomImport/minimumAccessIV/IM-0001-0001.dcm')
        );
        await Promise.all([
            api.importDICOM(filePath, studyInfo.studyId),
        ]);
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
        await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);       
    });

    test('Minimum requirements to access IV', async ({}, testInfo) => {
        poManager = new POManager(page, '', testInfo);
        poManager.testInfo = testInfo;
        const currentUrl = page.url();
        console.log('Image viewer URL:', currentUrl);
        const url = new URL(currentUrl);
        const studyInstanceUIDs = url.searchParams.get('StudyInstanceUIDs');
        console.log('Extracted StudyInstanceUIDs:', studyInstanceUIDs);
        const PatientID = url.searchParams.get('PatientID');
        console.log('Extracted PatientID:', PatientID);

        // Construct URL with StudyUID and OrgID
        const baseUrl = playwrightConfig.logInOaiUrl.replace(/\/+$/, '');
        const viewerUrl = `${baseUrl}/imageviewer3d?StudyInstanceUIDs=${studyInstanceUIDs}&internalManagingOrganizationID=${playwrightConfig.managingOrg.organizationId}`;
        console.log('The viewer URL is:', viewerUrl);
        // Navigate to image viewer
        await page.goto(viewerUrl);
        
       // Verify image
	    await page.waitForTimeout(6000);
        await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
        await poManager.imageViewer.layoutGridItem(1, 1).click({ force: true });
		let viewport = await poManager.imageViewer.getCornerstoneViewportByIndex(0);     
		expect(viewport.properties).not.toBeNull();
		expect(viewport).toBeDefined();

        // Construct URL with AccessionNumber, PatientID, and OrgID
        const viewerUrl2 = `${baseUrl}/imageviewer3d?AccessionNumber=${studyInfo.accessionNum}&PatientID=${PatientID}&internalManagingOrganizationID=${playwrightConfig.managingOrg.organizationId}`;
        console.log('The viewer URL is:', viewerUrl2);        
        // Navigate to image viewer
        await page.goto(viewerUrl2);

       // Verify image
		await page.waitForTimeout(10000);
        await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
        await poManager.imageViewer.layoutGridItem(1, 1).click({ force: true });
		viewport = await poManager.imageViewer.getCornerstoneViewportByIndex(0);
		expect(viewport.properties).not.toBeNull();
		expect(viewport).toBeDefined();	        
    });
    });
