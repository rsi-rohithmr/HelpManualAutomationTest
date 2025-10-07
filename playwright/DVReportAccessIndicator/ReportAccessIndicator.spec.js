const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { login } = require('../POM/login');
const { POManager } = require('../POM/POManager');
const { documentViewer } = require('../POM/documentViewer');
const playwrightConfig = require('../../playwright.config');

let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let name = '';
let browser;
let page1;
let page2;
let poManager1;
let poManager2;

test.describe('dv report access indicator tests', () => {
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		browser = await chromium.launch({channel: 'chrome'});
		page1 = await browser.newPage();
		page2 = await browser.newPage();

		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});

		await api.getUserDetails().then(result => {
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
		console.log(name);
	});

	test.beforeEach('login to Omega-AI', async () => {
		try{

			poManager1 = new POManager(page1);
			poManager2 = new POManager(page2);

			//Login for user1 and user2 2 different browsers.
			await poManager1.loginPage.loginOmegaAI();
			console.log(`userName: ${playwrightConfig.userName}`);
			console.log(`password: ${playwrightConfig.password}`);

			await poManager2.loginPage.loginOmegaAIUser04();
			console.log(`userName2: ${playwrightConfig.userName2}`);
			console.log(`password2: ${playwrightConfig.password2}`);

		}catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}

	});


	test('report access indicator validation when user1 clicks on back button', async () => {
		try{
			const reportTxt1 = 'Editing test report\n';

			//Open DV for the user1 and add "Editing test report" in the document.		
			await poManager1.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);		
			await poManager1.documentViewer.addDiagnosticReportForNewEditor(reportTxt1, false);
			
			//Validate "You are editing" element is visible for user1
			const editIconContainer = poManager1.documentViewer.getCreateOutlinedTextContainer();
			await expect(editIconContainer).toBeVisible();
			await expect(editIconContainer).toHaveText('You are editing');
			console.log(`poManager1: Edit icon validated`);
			
			// Only after full validation, proceed with poManager2 then Open DV for the user2.		
			await poManager2.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);		
			await new Promise(resolve => setTimeout(resolve, 5000));
		
			// Validate user 2 shoul see LockedUserIcon, LockeduserEditIcon with texts.
			const lockedUserIcon = poManager2.documentViewer.getLockedUserIcon();
			await expect(lockedUserIcon).toBeVisible(); 
			await expect(lockedUserIcon).toHaveText(name);
			console.log(`poManager1: Locked user icon validated`); 	

			const lockIcon = poManager2.documentViewer.getLockOutlinedIcon();
			await expect(lockIcon).toBeVisible(); 
			await expect(lockIcon).toHaveText(name + ' is editing');
			console.log(`poManager1: Lock icon validated`);	

			await page1.waitForTimeout(5000);
			// Click on back button to worklist for user1 and verify that enables editing for user2 or not.	
			const backButton = poManager1.documentViewer.backBtnforTemplatemanagerDV();
			await expect(backButton).toBeVisible();
			await backButton.click({ force: true });

			await page2.waitForTimeout(5000);

			// Now user2 should see "Read-OnlyTakeover Editing".
			const readOnlyIcon = poManager2.documentViewer.getReadOnlyElement();
			await expect(readOnlyIcon).toBeVisible();
			await expect(readOnlyIcon).toHaveText('Read-OnlyTakeover Editing');	
			console.log(`poManager2: Read-Only Takeover icon validated`);

			// Click on the Takeover button, if it's visible.
			// It should allow to edit.
			const takeOverButton = poManager2.documentViewer.getTakeoverEditingButton();
			await expect(takeOverButton).toBeVisible(); 
			await expect(takeOverButton).toHaveText('Takeover Editing'); 	
			console.log(`poManager2: Takeover Editing button validated`);

			await takeOverButton.click({ force: true }); 
			await page2.waitForTimeout(5000);

			//Validate "You are editing" element is visible for user2
			const editIconContainer2 = poManager2.documentViewer.getCreateOutlinedTextContainer();
			await expect(editIconContainer2).toBeVisible();
			await expect(editIconContainer2).toHaveText('You are editing');
			console.log(`poManager2: Edit icon validated`);
		}catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});

	// This test is not stable, so skipped for now after a discussion.
	test.skip('report access indicator validation when user1 closes the browser', async () => {
		try{
			const reportTxt1 = 'Editing test report\n';

			//Open DV for the user1 and add "Editing test report" in the document.		
			await poManager1.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);		
			await poManager1.documentViewer.addDiagnosticReportForNewEditor(reportTxt1, false);
			
			//Validate "You are editing" element is visible for user1
			const editIconContainer = poManager1.documentViewer.getCreateOutlinedTextContainer();
			await expect(editIconContainer).toBeVisible();
			await expect(editIconContainer).toHaveText('You are editing');
			console.log(`poManager1: Edit icon validated`);
			
			// Only after full validation, proceed with poManager2 then Open DV for the user2.		
			await poManager2.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);		
			await new Promise(resolve => setTimeout(resolve, 5000));
		
			// Validate user 2 shoul see LockedUserIcon, LockeduserEditIcon with texts.
			const lockedUserIcon = poManager2.documentViewer.getLockedUserIcon();
			await expect(lockedUserIcon).toBeVisible(); 
			await expect(lockedUserIcon).toHaveText(name);
			console.log(`poManager1: Locked user icon validated`); 	

			const lockIcon = poManager2.documentViewer.getLockOutlinedIcon();
			await expect(lockIcon).toBeVisible(); 
			await expect(lockIcon).toHaveText(name + ' is editing');
			console.log(`poManager1: Lock icon validated`);	

			await page1.waitForTimeout(5000);

			// 1. Remove any attached listeners (if you've added any manually)
			page1.removeAllListeners();

			// 2. Close all popups that page1 may have opened
			const allPages = page1.context().pages();
			for (const page of allPages) {
				if (page.opener() === page1) {
					await page.close();
				}
			}

			// 3. Close page1
			await page1.close();

			await page2.waitForTimeout(5000);

			// Now user2 should see "Read-OnlyTakeover Editing".
			const readOnlyIcon = poManager2.documentViewer.getReadOnlyElement();
			await expect(readOnlyIcon).toBeVisible();
			await expect(readOnlyIcon).toHaveText('Read-OnlyTakeover Editing');	
			console.log(`poManager2: Read-Only Takeover icon validated`);

			// Click on the Takeover button, if it's visible.
			// It should allow to edit.
			const takeOverButton = poManager2.documentViewer.getTakeoverEditingButton();
			await expect(takeOverButton).toBeVisible(); 
			await expect(takeOverButton).toHaveText('Takeover Editing'); 	
			console.log(`poManager2: Takeover Editing button validated`);

			await takeOverButton.click({ force: true }); 
			await page2.waitForTimeout(5000);

			//Validate "You are editing" element is visible for user2
			const editIconContainer2 = poManager2.documentViewer.getCreateOutlinedTextContainer();
			await expect(editIconContainer2).toBeVisible();
			await expect(editIconContainer2).toHaveText('You are editing');
			console.log(`poManager2: Edit icon validated`);
		}catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});
});
