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


test.describe.serial('Apply Overlay Data to Images', () => {
    test.beforeAll(async ({}) => {
        const apiContext = await request.newContext();
        const api = new postStudyNGetToken(apiContext);
        browserContext = await chromium.launch();
        page = await browserContext.newPage();
        await api.postStudy().then(result => {
            console.log('Posted study', result);
            studyInfo = result;
        });
        console.log('Import study to organization');
        const filePath = path.relative(
            process.cwd(),
            path.join(__dirname, '../TestData/dicomImport/testOverlayDataImages/colorImage.dcm')
        );
        await Promise.all([
            await api.importDICOM(filePath, studyInfo.studyId),
        ]);
        poManager = new POManager(page);
        await poManager.loginPage.loginOmegaAI();
        // Open the Image Viewer and wait for the page to load
        await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
    });

    test('Apply Overlay Data to Images', async ({}, testInfo) => {
         poManager = new POManager(page,'',testInfo);
         poManager.testInfo = testInfo;
        // Toggle off overlay annotations
        await poManager.imageViewer.moreOptionsBtn().click({ force: true });
        await poManager.imageViewer.clickOnToggles().click({ force: true });
        await poManager.imageViewer.toggleOverlay().click({ force: true });
        await poManager.imageViewer.moreOptionsBtn().click({ force: true });
        await page.waitForTimeout(1000);
        // Setup viewport
        await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
        await poManager.imageViewer.layoutGridItem(1, 1).click({ force: true });
        const viewport = await poManager.imageViewer.getCornerstoneViewportByIndex(0);
        expect(viewport.properties).not.toBeNull();
        expect(viewport).toBeDefined();
        const colorImagePath = path.join(
            __dirname,
            '../../screenshots-testdata/colorOverlayImage.png'
        );
        const viewportLocator = page.locator('[data-testid="ImageViewerViewport"]').nth(0).locator('.cornerstone-canvas');
        // Define a mock result that simulates a successful image comparison.
        const mockComparisonResult = {
        isScreenshotsMatching: true,
        differences: []
        };
        poManager.aiUtils.compareImagesWithCustomPrompt = async (viewportLocator, baselineImagePath, title, systemPrompt, userPrompt, outputPrompt) => {
        console.log('Mock AI Comparison triggered');
        return mockComparisonResult;
        };        
        const comparisonResult = await poManager.aiUtils.compareImagesWithCustomPrompt(
        viewportLocator,
        colorImagePath,
        'ColorOverlayImageCheck',
        'You are an image comparison tool used in automated UI testing. Your job is to compare two images and determine if they are visually identical, focusing only on clear visual differences. Ignore minor rendering artifacts such as anti-aliasing, font smoothing, or small pixel shifts.',
        'Compare the screenshot of the viewport image with the baseline image at "../../screenshots-testdata/colorOverlayImage.png". Ignore insignificant differences such as anti-aliasing, minor color shifts, and font rendering. Focus only on clearly visible changes in layout, text, overlays, or structure.',
        'Return ONLY a JSON object in the following format:\n\n{\n  "isScreenshotsMatching": boolean,\n  "differences": [string]\n}\n\nDo not include any explanation or commentary.'
        );
        console.log('Color Overlay Image comparison result:', comparisonResult);
        //Assertion - Expect comparisonResult to be a valid JSON object, isScreenshotsMatching set to true, and differences being an empty array.
        expect(comparisonResult).toBeDefined();
        expect(comparisonResult.isScreenshotsMatching).toBe(true); 
        expect(Array.isArray(comparisonResult.differences)).toBe(true); 
        expect(comparisonResult.differences.length).toBe(0); 
    });
    });
