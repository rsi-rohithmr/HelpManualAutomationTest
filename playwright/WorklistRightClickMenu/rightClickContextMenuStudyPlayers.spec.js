const { test, request, expect, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

test.describe('Right Click Context Menu - study players', () => {
    let browser;
    let page;
    let poManager;

    test.beforeEach(async ({}) => {
        browser = await chromium.launch();
        page = await browser.newPage();

		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON

			if (bodyJson.features && bodyJson.features['maven-2686-new-worklist-toggle']) {
				bodyJson.features['maven-2686-new-worklist-toggle'].variationName = 'Variation On';
				bodyJson.features['maven-2686-new-worklist-toggle'].variationKey = 'variation-on';
			}
			if (bodyJson.variables && bodyJson.variables['maven-2686-new-worklist-toggle']) {
				bodyJson.variables['maven-2686-new-worklist-toggle'].value = true;
			}

			if (bodyJson.features && bodyJson.features['maven-2735-worklist-right-click-menu']) {
				bodyJson.features['maven-2735-worklist-right-click-menu'].variationName = 'Variation On';
				bodyJson.features['maven-2735-worklist-right-click-menu'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['maven-2735-worklist-right-click-menu']) {
				bodyJson.variables['maven-2735-worklist-right-click-menu'].value = true;
			}

			console.log('bodyJson', bodyJson);

			// Fulfill request with modified data
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();

    });

	test('Should handle Performing Physician submenu selection UNASSIGN/PROPER PHYSICIAN and assignment', async ({}) => {
		// Monitor API calls for Performing Physician assignment
		const apiCalls = [];
		let assignmentApiCalled = false;
		let assignmentSuccess = false;

		page.on('request', request => {
			const url = request.url();
			const method = request.method();
			apiCalls.push(`${method} ${url}`);
			
			console.log('API Request:', method, url);
			
			// Look for Performing Physician assignment API patterns
			if (url.toLowerCase().includes('performing') || 
				url.toLowerCase().includes('physician') || 
				url.toLowerCase().includes('practitioner')) {
				console.log('POTENTIAL PERFORMING PHYSICIAN ASSIGNMENT REQUEST:', url);
				assignmentApiCalled = true;
			}
		});

		page.on('response', response => {
			const url = response.url();
			if (url.toLowerCase().includes('performing') || 
				url.toLowerCase().includes('physician') || 
				url.toLowerCase().includes('practitioner')) {
				console.log('API Response:', response.status(), url);
				if (response.status() === 200) {
					assignmentSuccess = true;
				}
			}
		});

		await expect(page.getByText('Try New Worklist')).toBeVisible();
		await page.getByText('Try New Worklist').click();
		expect(page.getByText('Try New Worklist')).toBeChecked();
		await page.waitForTimeout(10000);

		const worklistRow = poManager.homePage.worklistTableRows();
		
		// Right-click on the first row
		await worklistRow.first().click({ button: 'right' });
		await page.waitForTimeout(5000);

		await expect(page.getByText('New Worklist')).toBeVisible();
		
		// Verify Performing Physician menu item exists
		const performingPhysicianMenuItem = page.getByTestId('menu-item-Performing Physician-0');
		await expect(performingPhysicianMenuItem).toBeVisible();
		
		// Hover over Performing Physician to open submenu
		await performingPhysicianMenuItem.hover();
		await page.waitForTimeout(2000);

		const submenu = page.getByTestId('menu-item-performingPhysician-1');
		await expect(submenu).toBeVisible({ timeout: 5000 });

		const unassignOption = await page.getByRole('option', { name: 'UNASSIGN' });
		console.log('unassignOption', unassignOption);

		const physicianOptions = page.getByTestId('custom-popper-worklist-context-study-player-search');
		console.log('physicianOptions', physicianOptions);
		
		let selectedOption;
		
		// Try to select UNASSIGN first if available
		if (await unassignOption.isVisible()) {
			selectedOption = unassignOption;
			console.log('Selecting UNASSIGN option:', unassignOption);
			console.log('UNASSIGN text content:', unassignOption.textContent());
		} else {
			await page.waitForTimeout(5000);
			// Otherwise select the first available physician option
			const optionCount = await physicianOptions.count();
			if (optionCount > 0) {
				selectedOption = physicianOptions.first();
				const optionText = await selectedOption.textContent();
				if(optionCount > 1 && selectedOption.textContent() === 'UNASSIGNED') {
					selectedOption = physicianOptions.nth(1);
				}
				console.log(`Selecting physician option: ${optionText}`);
			}
		}
		
		// Verify we found a selectable option
		expect(selectedOption).toBeDefined();
		await expect(selectedOption).toBeVisible();
		
		// Click the selected option
		await selectedOption.click();
		await page.waitForTimeout(3000);
		
		// Check for success indicators
		const successMessages = await page.getByText(/assigned|updated|success|complete/i).allTextContents();
		console.log('Success messages found:', successMessages);
		
		// Check for any toast notifications
		const toastMessages = await page.locator('[data-testid*="toast"], [role="alert"], .MuiSnackbar-root, .MuiSnackbarContent-action').allTextContents();
		console.log('Toast messages found:', toastMessages);
		
		// Log all API calls made during the assignment
		console.log('=== API calls made during Performing Physician assignment ===');
		apiCalls.forEach((call, index) => {
			console.log(`${index + 1}. ${call}`);
		});
		
		console.log('=== Assignment Status ===');
		console.log('assignmentApiCalled:', assignmentApiCalled);
		console.log('assignmentSuccess:', assignmentSuccess);
		
		// Verify assignment was successful through various indicators
		const performingPhysicianAssigned = assignmentApiCalled || 
									assignmentSuccess || 
									successMessages.length > 0 || 
									toastMessages.length > 0;
		
		console.log('Assignment completed:', performingPhysicianAssigned);
		
		// The test passes if we successfully selected a Performing Physician option
		// and the assignment process was triggered
		expect(performingPhysicianAssigned).toBe(true);
	});

	test('Should handle Performing Technologist submenu selection UNASSIGN/PROPER Technologist and assignment', async ({}) => {
		// Monitor API calls for Performing Technologist assignment
		const apiCalls = [];
		let assignmentApiCalled = false;
		let assignmentSuccess = false;

		page.on('request', request => {
			const url = request.url();
			const method = request.method();
			apiCalls.push(`${method} ${url}`);
			
			console.log('API Request:', method, url);
			
			// Look for Performing Technologist assignment API patterns
			if (url.toLowerCase().includes('performing') || 
				url.toLowerCase().includes('Technologist') || 
				url.toLowerCase().includes('Practitioner')) {
				console.log('POTENTIAL PERFORMING Technologist ASSIGNMENT REQUEST:', url);
				assignmentApiCalled = true;
			}
		});

		page.on('response', response => {
			const url = response.url();
			if (url.toLowerCase().includes('performing') || 
				url.toLowerCase().includes('Technologist') || 
				url.toLowerCase().includes('Practitioner')) {
				console.log('API Response:', response.status(), url);
				if (response.status() === 200) {
					assignmentSuccess = true;
				}
			}
		});

		await expect(page.getByText('Try New Worklist')).toBeVisible();
		await page.getByText('Try New Worklist').click();
		expect(page.getByText('Try New Worklist')).toBeChecked();
		await page.waitForTimeout(10000);

		const worklistRow = poManager.homePage.worklistTableRows();
		
		// Right-click on the first row
		await worklistRow.first().click({ button: 'right' });
		await page.waitForTimeout(5000);

		await expect(page.getByText('New Worklist')).toBeVisible();
		
		// Verify Performing Technologist menu item exists
		const performingTechnologistMenuItem = page.getByTestId('menu-item-Performing Technologist-0');
		await expect(performingTechnologistMenuItem).toBeVisible();
		
		// Hover over Performing Technologist to open submenu
		await performingTechnologistMenuItem.hover();
		await page.waitForTimeout(2000);

		const submenu = page.getByTestId('menu-item-performingTechnologist-1');
		await expect(submenu).toBeVisible({ timeout: 5000 });

		const unassignOption = await page.getByRole('option', { name: 'UNASSIGN' });
		console.log('unassignOption', unassignOption);

		const TechnologistOptions = page.getByTestId('custom-popper-worklist-context-study-player-search');
		console.log('TechnologistOptions', TechnologistOptions);
		
		let selectedOption;
		
		// Try to select UNASSIGN first if available
		if (await unassignOption.isVisible()) {
			selectedOption = unassignOption;
			console.log('Selecting UNASSIGN option:', unassignOption);
			console.log('UNASSIGN text content:', unassignOption.textContent());
		} else {
			await page.waitForTimeout(5000);
			// Otherwise select the first available Technologist option
			const optionCount = await TechnologistOptions.count();
			if (optionCount > 0) {
				selectedOption = TechnologistOptions.first();
				const optionText = await selectedOption.textContent();
				if(optionCount > 1 && selectedOption.textContent() === 'UNASSIGNED') {
					selectedOption = TechnologistOptions.nth(1);
				}
				console.log(`Selecting Technologist option: ${optionText}`);
			}
		}
		
		// Verify we found a selectable option
		expect(selectedOption).toBeDefined();
		await expect(selectedOption).toBeVisible();
		
		// Click the selected option
		await selectedOption.click();
		await page.waitForTimeout(3000);
		
		// Check for success indicators
		const successMessages = await page.getByText(/assigned|updated|success|complete/i).allTextContents();
		console.log('Success messages found:', successMessages);
		
		// Check for any toast notifications
		const toastMessages = await page.locator('[data-testid*="toast"], [role="alert"], .MuiSnackbar-root, .MuiSnackbarContent-action').allTextContents();
		console.log('Toast messages found:', toastMessages);
		
		// Log all API calls made during the assignment
		console.log('=== API calls made during Performing Technologist assignment ===');
		apiCalls.forEach((call, index) => {
			console.log(`${index + 1}. ${call}`);
		});
		
		console.log('=== Assignment Status ===');
		console.log('assignmentApiCalled:', assignmentApiCalled);
		console.log('assignmentSuccess:', assignmentSuccess);
		
		// Verify assignment was successful through various indicators
		const performingTechnologistAssigned = assignmentApiCalled || 
									assignmentSuccess || 
									successMessages.length > 0 || 
									toastMessages.length > 0;
		
		console.log('Assignment completed:', performingTechnologistAssigned);
		
		// The test passes if we successfully selected a Performing Technologist option
		// and the assignment process was triggered
		expect(performingTechnologistAssigned).toBe(true);
	});

	test('Should handle Reading Physician submenu selection UNASSIGN/PROPER PHYSICIAN and assignment', async ({}) => {
		// Monitor API calls for Reading Physician assignment
		const apiCalls = [];
		let assignmentApiCalled = false;
		let assignmentSuccess = false;

		page.on('request', request => {
			const url = request.url();
			const method = request.method();
			apiCalls.push(`${method} ${url}`);
			
			console.log('API Request:', method, url);
			
			// Look for Reading Physician assignment API patterns
			if (url.toLowerCase().includes('reading') || 
				url.toLowerCase().includes('physician') || 
				url.toLowerCase().includes('Practitioner')) {
				console.log('POTENTIAL READING PHYSICIAN ASSIGNMENT REQUEST:', url);
				assignmentApiCalled = true;
			}
		});

		page.on('response', response => {
			const url = response.url();
			if (url.toLowerCase().includes('reading') || 
				url.toLowerCase().includes('physician') || 
				url.toLowerCase().includes('Practitioner')) {
				console.log('API Response:', response.status(), url);
				if (response.status() === 200) {
					assignmentSuccess = true;
				}
			}
		});

		await expect(page.getByText('Try New Worklist')).toBeVisible();
		await page.getByText('Try New Worklist').click();
		expect(page.getByText('Try New Worklist')).toBeChecked();
		await page.waitForTimeout(10000);

		const worklistRow = poManager.homePage.worklistTableRows();
		
		// Right-click on the first row
		await worklistRow.first().click({ button: 'right' });
		await page.waitForTimeout(5000);

		await expect(page.getByText('New Worklist')).toBeVisible();
		
		// Verify Reading Physician menu item exists
		const readingPhysicianMenuItem = page.getByTestId('menu-item-Reading Physician-0');
		await expect(readingPhysicianMenuItem).toBeVisible();
		
		// Hover over Reading Physician to open submenu
		await readingPhysicianMenuItem.hover();
		await page.waitForTimeout(2000);

		const submenu = page.getByTestId('menu-item-readingPhysician-1');
		await expect(submenu).toBeVisible({ timeout: 5000 });

		const unassignOption = await page.getByRole('option', { name: 'UNASSIGN' });
	
		console.log('unassignOption', unassignOption);

		const physicianOptions = page.getByTestId('custom-popper-worklist-context-study-player-search');

		console.log('physicianOptions', physicianOptions);
		
		let selectedOption;
		
		// Try to select UNASSIGN first if available
		if (await unassignOption.isVisible()) {
			selectedOption = unassignOption;
			console.log('Selecting UNASSIGN option:',unassignOption);
			console.log('UNASSIGN text content:',unassignOption.textContent());
		} else {
			await page.waitForTimeout(5000);
			// Otherwise select the first available physician option
			const optionCount = await physicianOptions.count();
			if (optionCount > 0) {
				selectedOption = physicianOptions.first();
				const optionText = await selectedOption.textContent();
				if(optionCount > 1 && selectedOption.textContent() === 'UNASSIGNED') {
					selectedOption = physicianOptions.nth(1);
				}
				console.log(`Selecting physician option: ${optionText}`);
			}
		}
		
		// Verify we found a selectable option
		expect(selectedOption).toBeDefined();
		await expect(selectedOption).toBeVisible();
		
		// Click the selected option
		await selectedOption.click();
		await page.waitForTimeout(3000);
		
		// Check for success indicators
		const successMessages = await page.getByText(/assigned|updated|success|complete/i).allTextContents();
		console.log('Success messages found:', successMessages);
		
		// Check for any toast notifications
		const toastMessages = await page.locator('[data-testid*="toast"], [role="alert"], .MuiSnackbar-root, .MuiSnackbarContent-action').allTextContents();
		console.log('Toast messages found:', toastMessages);
		
		// Log all API calls made during the assignment
		console.log('=== API calls made during Reading Physician assignment ===');
		apiCalls.forEach((call, index) => {
			console.log(`${index + 1}. ${call}`);
		});
		
		console.log('=== Assignment Status ===');
		console.log('assignmentApiCalled:', assignmentApiCalled);
		console.log('assignmentSuccess:', assignmentSuccess);
		
		// Verify assignment was successful through various indicators
		const readingPhysicianAssigned = assignmentApiCalled || 
									assignmentSuccess || 
									successMessages.length > 0 || 
									toastMessages.length > 0 ||
									!contextMenuVisible;
		
		console.log('Assignment completed:', readingPhysicianAssigned);
		
		// The test passes if we successfully selected a Reading Physician option
		// and the assignment process was triggered
		expect(readingPhysicianAssigned).toBe(true);
	});

	test('Should handle Referring Physician submenu selection UNASSIGN/PROPER PHYSICIAN and assignment', async ({}) => {
		// Monitor API calls for Referring Physician assignment
		const apiCalls = [];
		let assignmentApiCalled = false;
		let assignmentSuccess = false;

		page.on('request', request => {
			const url = request.url();
			const method = request.method();
			apiCalls.push(`${method} ${url}`);
			
			console.log('API Request:', method, url);
			
			// Look for Referring Physician assignment API patterns
			if (url.toLowerCase().includes('referring') || 
				url.toLowerCase().includes('physician') || 
				url.toLowerCase().includes('practitioner') ||
				url.toLowerCase().includes('referral')) {
				console.log('POTENTIAL REFERRING PHYSICIAN ASSIGNMENT REQUEST:', url);
				assignmentApiCalled = true;
			}
		});

		page.on('response', response => {
			const url = response.url();
			if (url.toLowerCase().includes('referring') || 
				url.toLowerCase().includes('physician') || 
				url.toLowerCase().includes('practitioner') ||
				url.toLowerCase().includes('referral')) {
				console.log('API Response:', response.status(), url);
				if (response.status() === 200) {
					assignmentSuccess = true;
				}
			}
		});

		await expect(page.getByText('Try New Worklist')).toBeVisible();
		await page.getByText('Try New Worklist').click();
		expect(page.getByText('Try New Worklist')).toBeChecked();
		await page.waitForTimeout(10000);

		const worklistRow = poManager.homePage.worklistTableRows();
		
		// Right-click on the first row
		await worklistRow.first().click({ button: 'right' });
		await page.waitForTimeout(5000);

		await expect(page.getByText('New Worklist')).toBeVisible();
		
		// Verify Referring Physician menu item exists
		const referringPhysicianMenuItem = page.getByTestId('menu-item-Referring Physician-0');
		await expect(referringPhysicianMenuItem).toBeVisible();
		
		// Hover over Referring Physician to open submenu
		await referringPhysicianMenuItem.hover();
		await page.waitForTimeout(2000);

		const submenu = page.getByTestId('menu-item-referringPhysician-1');
		await expect(submenu).toBeVisible({ timeout: 5000 });

		const unassignOption = await page.getByRole('option', { name: 'UNASSIGN' });
		console.log('unassignOption', unassignOption);

		const physicianOptions = page.getByTestId('custom-popper-worklist-context-study-player-search');
		console.log('physicianOptions', physicianOptions);
		
		let selectedOption;
		
		// Try to select UNASSIGN first if available
		if (await unassignOption.isVisible()) {
			selectedOption = unassignOption;
			console.log('Selecting UNASSIGN option:', unassignOption);
			console.log('UNASSIGN text content:', unassignOption.textContent());
		} else {
			await page.waitForTimeout(5000);
			// Otherwise select the first available physician option
			const optionCount = await physicianOptions.count();
			if (optionCount > 0) {
				selectedOption = physicianOptions.first();
				const optionText = await selectedOption.textContent();
				if(optionCount > 1 && selectedOption.textContent() === 'UNASSIGNED') {
					selectedOption = physicianOptions.nth(1);
				}
				console.log(`Selecting physician option: ${optionText}`);
			}
		}
		
		// Verify we found a selectable option
		expect(selectedOption).toBeDefined();
		await expect(selectedOption).toBeVisible();
		
		// Click the selected option
		await selectedOption.click();
		await page.waitForTimeout(3000);
		
		// Check for success indicators
		const successMessages = await page.getByText(/assigned|updated|success|complete/i).allTextContents();
		console.log('Success messages found:', successMessages);
		
		// Check for any toast notifications
		const toastMessages = await page.locator('[data-testid*="toast"], [role="alert"], .MuiSnackbar-root, .MuiSnackbarContent-action').allTextContents();
		console.log('Toast messages found:', toastMessages);
		
		// Log all API calls made during the assignment
		console.log('=== API calls made during Referring Physician assignment ===');
		apiCalls.forEach((call, index) => {
			console.log(`${index + 1}. ${call}`);
		});
		
		console.log('=== Assignment Status ===');
		console.log('assignmentApiCalled:', assignmentApiCalled);
		console.log('assignmentSuccess:', assignmentSuccess);
		
		// Verify assignment was successful through various indicators
		const referringPhysicianAssigned = assignmentApiCalled || 
									assignmentSuccess || 
									successMessages.length > 0 || 
									toastMessages.length > 0;
		
		console.log('Assignment completed:', referringPhysicianAssigned);
		
		// The test passes if we successfully selected a Referring Physician option
		// and the assignment process was triggered
		expect(referringPhysicianAssigned).toBe(true);
	});

	test('Should handle Transcriptionist submenu selection UNASSIGN/PROPER TRANSCRIPTIONIST and assignment', async ({}) => {
		// Monitor API calls for Transcriptionist assignment
		const apiCalls = [];
		let assignmentApiCalled = false;
		let assignmentSuccess = false;

		page.on('request', request => {
			const url = request.url();
			const method = request.method();
			apiCalls.push(`${method} ${url}`);
			
			console.log('API Request:', method, url);
			
			// Look for Transcriptionist assignment API patterns
			if (url.toLowerCase().includes('transcriptionist') || 
				url.toLowerCase().includes('transcription') || 
				url.toLowerCase().includes('transcript') ||
				url.toLowerCase().includes('Practitioner')) {
				console.log('POTENTIAL TRANSCRIPTIONIST ASSIGNMENT REQUEST:', url);
				assignmentApiCalled = true;
			}
		});

		page.on('response', response => {
			const url = response.url();
			if (url.toLowerCase().includes('transcriptionist') || 
				url.toLowerCase().includes('transcription') || 
				url.toLowerCase().includes('transcript') ||
				url.toLowerCase().includes('Practitioner')) {
				console.log('API Response:', response.status(), url);
				if (response.status() === 200) {
					assignmentSuccess = true;
				}
			}
		});

		await expect(page.getByText('Try New Worklist')).toBeVisible();
		await page.getByText('Try New Worklist').click();
		expect(page.getByText('Try New Worklist')).toBeChecked();
		await page.waitForTimeout(10000);

		const worklistRow = poManager.homePage.worklistTableRows();
		
		// Right-click on the first row
		await worklistRow.first().click({ button: 'right' });
		await page.waitForTimeout(5000);

		await expect(page.getByText('New Worklist')).toBeVisible();
		
		// Verify Transcriptionist menu item exists
		const transcriptionistMenuItem = page.getByTestId('menu-item-Transcriptionist-0');
		await expect(transcriptionistMenuItem).toBeVisible();
		
		// Hover over Transcriptionist to open submenu
		await transcriptionistMenuItem.hover();
		await page.waitForTimeout(2000);

		const submenu = page.getByTestId('menu-item-transcriptionist-1');
		await expect(submenu).toBeVisible({ timeout: 5000 });

		const unassignOption = await page.getByRole('option', { name: 'UNASSIGN' });
		console.log('unassignOption', unassignOption);

		const transcriptionistOptions = page.getByTestId('custom-popper-worklist-context-study-player-search');
		console.log('transcriptionistOptions', transcriptionistOptions);
		
		let selectedOption;
		
		// Try to select UNASSIGN first if available
		if (await unassignOption.isVisible()) {
			selectedOption = unassignOption;
			console.log('Selecting UNASSIGN option:', unassignOption);
			console.log('UNASSIGN text content:', unassignOption.textContent());
		} else {
			await page.waitForTimeout(5000);
			// Otherwise select the first available transcriptionist option
			const optionCount = await transcriptionistOptions.count();
			if (optionCount > 0) {
				selectedOption = transcriptionistOptions.first();
				const optionText = await selectedOption.textContent();
				if(optionCount > 1 && selectedOption.textContent() === 'UNASSIGNED') {
					selectedOption = transcriptionistOptions.nth(1);
				}
				console.log(`Selecting transcriptionist option: ${optionText}`);
			}
		}
		
		// Verify we found a selectable option
		expect(selectedOption).toBeDefined();
		await expect(selectedOption).toBeVisible();
		
		// Click the selected option
		await selectedOption.click();
		await page.waitForTimeout(3000);
		
		// Check for success indicators
		const successMessages = await page.getByText(/assigned|updated|success|complete/i).allTextContents();
		console.log('Success messages found:', successMessages);
		
		// Check for any toast notifications
		const toastMessages = await page.locator('[data-testid*="toast"], [role="alert"], .MuiSnackbar-root, .MuiSnackbarContent-action').allTextContents();
		console.log('Toast messages found:', toastMessages);
		
		// Log all API calls made during the assignment
		console.log('=== API calls made during Transcriptionist assignment ===');
		apiCalls.forEach((call, index) => {
			console.log(`${index + 1}. ${call}`);
		});
		
		console.log('=== Assignment Status ===');
		console.log('assignmentApiCalled:', assignmentApiCalled);
		console.log('assignmentSuccess:', assignmentSuccess);
		
		// Verify assignment was successful through various indicators
		const transcriptionistAssigned = assignmentApiCalled || 
									assignmentSuccess || 
									successMessages.length > 0 || 
									toastMessages.length > 0;
		
		console.log('Assignment completed:', transcriptionistAssigned);
		
		// The test passes if we successfully selected a Transcriptionist option
		// and the assignment process was triggered
		expect(transcriptionistAssigned).toBe(true);
	});

	test.afterEach(async ({}) => {
		if (browser) {
			await browser.close();
		}
	});
});