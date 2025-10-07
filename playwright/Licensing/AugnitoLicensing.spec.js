const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

test.describe('Augnito Licensing Tests', () => {
    let apiContext;
    let api;
    let studyInfo;
    const managingOrgName = playwrightConfig.managingOrg.organizationName;
    const managingOrgId = playwrightConfig.managingOrg.organizationId;

    test.beforeAll(async () => {
        apiContext = await request.newContext();
        api = new postStudyNGetToken(apiContext);

        await api.postStudy().then(result => {
            studyInfo = result;
        });
    });

    test.beforeEach(async ({ page }) => {
        const poManager = new POManager(page);
        await poManager.loginPage.loginOmegaAI();
    });

    test('Verify Augnito availability based on license', async ({ page }) => {
        const poManager = new POManager(page);
        let licenseId;
        
        // Step 1: Open document viewer and check if Augnito is already available
        await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);
        
        const tokenObj = await api.getTokenAndSessionId();
        
        // Check if Augnito button exists by checking its aria-label
        const augnitoButton = poManager.documentViewer.vrDicationBtnPoweredByAugnito();
        let isAugnitoAvailable = false;
        try {
            // Wait for the button to be visible first
            await augnitoButton.waitFor({ state: 'visible', timeout: 20000 });
            const ariaLabel = await augnitoButton.getAttribute('aria-label');
            isAugnitoAvailable = ariaLabel === 'Voice Dictation - Powered by Augnito';
        } catch (error) {
            console.log('Error checking Augnito button:', error.message);
        }
        
        if (isAugnitoAvailable) {
            console.log('Augnito is available, getting existing license');
            // If Augnito is already available, get the existing license ID
            const existingLicensesResponse = await apiContext.get(
                `${playwrightConfig.baseApiUrl}fhir/OrganizationLicense?organization=${managingOrgId}&applicationName=Augnito`,
                {
                    headers: {
                        'Authorization': `Bearer ${tokenObj.accessToken}`
                    }
                }
            );
            
            if (existingLicensesResponse.ok()) {
                const existingLicenses = await existingLicensesResponse.json();
                if (existingLicenses.entry && existingLicenses.entry.length > 0) {
                    licenseId = existingLicenses.entry[0].resource.id;
                    console.log('Found existing license ID:', licenseId);
                }
            }
        } else {
            console.log('Augnito is not available, creating new license');
            // Step 2: Create Augnito license for the organization
            const licenseData = {
                resourceType: "OrganizationLicense",
                organization: {
                    reference: `Organization/${managingOrgId}`,
                    id: managingOrgId,
                    display: managingOrgName
                },
                applicationName: "Augnito",
                numberOfLicense: 1,
                assignedLicense: 1,
                avaiableLicense: 0,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
                isActive: true,
                augnito: {
                    accountCode: "TEST-ACCOUNT",
                    accessKey: "TEST-ACCESS-KEY",
                    userEmails: playwrightConfig.userName,
                    domainUrl: "https://test.augnito.com"
                }
            };

            const response = await apiContext.post(`${playwrightConfig.baseApiUrl}fhir/OrganizationLicense`, {
                headers: {
                    'Authorization': `Bearer ${tokenObj.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: licenseData
            });

            expect(response.ok()).toBeTruthy();
            const licenseResponse = await response.json();
            licenseId = licenseResponse.id;
            console.log('Created new license with ID:', licenseId);

            // Step 3: Refresh page and verify Augnito is now available
            await page.reload();
            const voiceDictationBtnPoweredByAugnito = poManager.documentViewer.vrDicationBtnPoweredByAugnito();
            await expect(voiceDictationBtnPoweredByAugnito).toHaveAttribute('aria-label', 'Voice Dictation - Powered by Augnito');
        }

        // Step 4: Delete the license
        const deleteResponse = await apiContext.delete(`${playwrightConfig.baseApiUrl}fhir/OrganizationLicense/${licenseId}`, {
            headers: {
                'Authorization': `Bearer ${tokenObj.accessToken}`
            }
        });
        expect(deleteResponse.ok()).toBeTruthy();

        // Step 5: Refresh page and verify Augnito is no longer available
        await page.reload();
        const voiceDictationBtn = poManager.documentViewer.vrDicationBtn();
        await voiceDictationBtn.waitFor({ state: 'visible', timeout: 20000 });
        await expect(voiceDictationBtn).toHaveAttribute('aria-label', 'Voice Dictation');
    });
});
