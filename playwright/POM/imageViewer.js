const faker = require('community-faker');
const playwrightConfig = require('../../playwright.config');
const { stringify } = require('querystring');
const { orgGenerator } = require('../generators/organizationGenerator');
const { expect, request } = require('@playwright/test');
const fs = require('fs');
const fs1 = require('fs').promises;
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
const { error } = require('console');
const { DocumentViewer } = require('./documentViewer');

const TIMEOUT_IN_MSEC2 = 20000;
const TIMEOUT_IN_MSEC1 = 10000;
const TIMEOUT_IN_MSEC3 = 60000;
const TIMEOUT_IN_MSEC4 = 60000;
exports.ImageViewer = class ImageViewer {
	constructor(page) {
		this.page = page;
		this.documentViewer = new DocumentViewer(this.page);
	}

	async openImageViewer(patientName, managingOrgName, skipFilter, doubleClickToOpen = false) {
		if (!skipFilter) {
			// Set up API interception before performing actions
			await this.page.route('**/organization?*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000)); // Delay by 2 seconds
					route.continue();
				} else {
					route.continue();
				}
			});
			await this.page.route('**/fhir/ImagingStudyWorklist/elk?*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					route.continue();
				} else {
					route.continue();
				}
			});
			// Action to trigger API call for Managing Organization filter
			await this.page.locator(`[data-cy="Managing Organization_filter"]`).click({ force: true });
			await this.page.locator(`[data-cy="Managing Organization_filter"] [type="text"]`).clear();
			await this.page.locator(`[data-cy="Managing Organization_filter"]`).pressSequentially(managingOrgName);
			await this.documentViewer.waitForAPI(`/organization?`, 'GET');
			await this.page
				.locator(`[aria-labelledby="search-as-you-type-label"] :has-text("${managingOrgName}")`)
				.first()
				.click();
			await this.documentViewer.waitForAPI('/fhir/ImagingStudyWorklist/elk?', 'GET');

			// Action to trigger API call for Patient Name filter
			await this.page.locator('[data-cy="Patient Name_filter"]').click();
			await this.page.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]').clear();
			await this.page
				.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]')
				.pressSequentially(patientName);

			await this.documentViewer.waitForAPI('fhir/ImagingStudyWorklist/elk?', 'GET');
		}
		await this.page.waitForTimeout(6000);

		if (doubleClickToOpen) {
			await this.page
				.locator('[data-cy="study-status-table"] tbody>tr')
				.getByText(new RegExp(`^${patientName}$`, 'g'))
				.first()
				.dblclick();
		} else {
			await this.page
				.locator('[data-cy="study-status-table"] tbody>tr')
				.getByText(new RegExp(`^${patientName}$`, 'g'))
				.first()
				.click();

			await this.page.evaluate(() => {
				const element = document.querySelector('svg[name="imageviewer"]');
				if (element) {
					element.scrollIntoView();
				}
			});

			await this.page.waitForTimeout(10000);
			await this.page.route('**/dicomweb/HangingProtocol*', async route => {
				route.continue();
			});

			await this.page.locator('svg[name="imageviewer"]').click({ force: true });

			// await this.documentViewer.waitForAPI('dicomweb/HangingProtocol', 'GET');
			// await this.documentViewer.waitForAPI('/fhir/Patient/', 'GET');
			await this.page.keyboard.press('Escape');
		}
	}

	async waitPageToLoad() {
		try {
			await this.page.waitUntil(async () => await this.page.locator('.css-2hqpna').isVisible('be.visible'), {
				timeout: 120000,
				interval: 1000,
			});
		} catch (error) {
			await console.log('Image took longer to load.');
		}
		await this.page.waitForTimeout(3000);
	}

	async isExplorerOpen() {
		try {
			await this.page.locator('.MuiBox-root.css-1owiyb4').isVisible('be.visible');
			await this.page.log('Explorer is open.');
			return true;
		} catch (error) {
			await this.page.log('Explorer NOT open.');
			return false;
		}
	}

	goBackBtn() {
		return this.page.locator('svg[data-testid="ArrowBackIcon"]', {
			timeout: TIMEOUT_IN_MSEC4,
		});
	}

	// Top bar
	doneBtn() {
		return this.page.locator('[data-testid="doneBtn"]', {
			timeout: TIMEOUT_IN_MSEC4,
		});
	}

	doneOpenNextBtn() {
		return this.page.locator('[data-testid="doneOpenNextBtn"]', {
			timeout: TIMEOUT_IN_MSEC4,
		});
	}

	topToolbar() {
		return this.page.locator('[data-testid="top-toolbar"]', {
			timeout: TIMEOUT_IN_MSEC4,
		});
	}

	patientBannerName(criteria) {
		return this.page
			.locator('[class="MuiBox-root css-2bz8jw"]', {
				timeout: TIMEOUT_IN_MSEC4,
			})
			.locator('div', {
				timeout: TIMEOUT_IN_MSEC4,
			})
			.getByText(criteria);
	}

	patientBannerLink() {
		return this.page
			.locator('[class="MuiBox-root css-2bz8jw"]', {
				timeout: TIMEOUT_IN_MSEC4,
			})
			.locator('a', {
				timeout: TIMEOUT_IN_MSEC4,
			});
	}

	changeLayoutBtn() {
		return this.page.locator('[data-testid="GridViewSharpIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	async initLayoutTo1x1() {
		console.log('Init layout to 1x1');
		this.changeLayoutBtn().click();
		await this.page.waitForTimeout(2000);
		this.layoutGridItem(1, 1).click();
		await this.page.waitForTimeout(2000);
		await expect(this.page.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(1);
	}

	changeLayoutTooltip() {
		return this.page.locator('.MuiBox-root.css-kjafn5', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	layoutSettingGrid() {
		return this.page.locator('[data-testid="LayoutSelectionGrid"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	changeLayoutHangingProtocolSection() {
		return this.page.locator('.MuiBox-root.css-n9d92i', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	changeLayoutAddHangingProtocolBtn() {
		return this.page
			.locator('.MuiBox-root.css-n9d92i', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('button');
	}

	getNthViewport(n) {
		return this.page.locator(
			`[data-testid="ImageViewerLayoutItem"]:eq(${n}) [data-testid="ImageViewerViewportCornerstone"]`
		);
	}

	getNthStudy(n) {
		return this.page.locator(`[data-testid="accordion-summary"]:eq(${n})`);
	}

	resetImageChangesBtn() {
		return this.page.locator('button[aria-label="Reset Image Changes"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	// signBtn() {
	// 	return this.page.locator('button[aria-label="Sign"]', {
	// 		timeout: TIMEOUT_IN_MSEC1,
	// 	});
	// }

	// signOpenNextBtn() {
	// 	return this.page.locator('button[aria-label="Sign & Open Next"]', {
	// 		timeout: TIMEOUT_IN_MSEC1,
	// 	});
	// }

	moreOptionsBtn() {
		return this.page.locator('[data-testid="MoreVertOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	moreOptionsMenu() {
		return this.page.locator('ul[class="MuiList-root MuiList-padding MuiMenu-list css-r8u8y9"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	coverBackground() {
		return this.page.locator('.MuiBackdrop-root.MuiBackdrop-invisible.css-esi9ax', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	shareBtn() {
		return this.page
			.locator('[data-testid="share-button"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	shareSection() {
		return this.page.locator('[class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium toolbar-btn-cls css-vubbuv"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	shareSectionCloseBtn() {
		return this.page
			.locator('[class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator(
				'[d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"]',
				{
					timeout: TIMEOUT_IN_MSEC4,
				}
			);
	}

	shareSectionAddBtn() {
		return this.page
			.locator('.MuiBox-root.css-1bzzss4', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('button[data-page="add-new-btn"]', {
				timeout: TIMEOUT_IN_MSEC4,
			});
	}

	// Floating bottom bar
	createKeyImageBtn() {
		return this.page.locator('button[aria-label="Create a Key Image"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	pinCurrentModeBtn() {
		return this.page.locator('button[aria-label="Pin Current View"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	tileModeBtn() {
		return this.page.locator('button[aria-label="Tile Mode"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	// DocumentViewer
	documentViewerBtn() {
		return this.page.locator('[data-testid="ImageViewerSplitButton"] [data-testid="ArticleOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	documentViewerCloseBtn() {
		return this.page.locator('[data-testid="ImageViewerSplitButton"] [data-testid="CloseIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	async openDocumentSplitView() {
		if (await this.documentViewerBtn().isVisible()) {
			return this.documentViewerBtn().click({ force: true });
		}
	}

	async closeDocumentSplitView() {
		if (await this.documentViewerCloseBtn().isVisible()) {
			return this.documentViewerCloseBtn().click({ force: true });
		}
	}

	DocumentSpiltView() {
		return this.page.locator('[data-testid="image-viewer-document-viewer-stack"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	documentViewerContainer() {
		return this.page.locator('.MuiBox-root.css-11ze7cv', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	documentViewerTools() {
		return this.page.locator('.react-draggable.MuiBox-root.css-1gvu2kf', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	documentViewerToolsLabel() {
		return this.page
			.locator('.react-draggable.MuiBox-root.css-1gvu2kf', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('p')
			.eq(0);
	}

	documentViewerToolsCurrentPage() {
		return this.page
			.locator('.react-draggable.MuiBox-root.css-1gvu2kf', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('p')
			.eq(1);
	}

	documentViewerToolsTotalPages() {
		return this.page
			.locator('.react-draggable.MuiBox-root.css-1gvu2kf', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('p')
			.eq(2);
	}

	documentViewerZoomOut() {
		return this.page.locator('[data-testid="RemoveIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	documentViewerZoomIn() {
		return this.page.locator('[data-testid="AddIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	documentViewerOpenInNewWindow() {
		return this.page.locator('[data-testid="OpenInNewIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	// Left section (Patient/Series/Studies)
	studyExplorerIcon() {
		return this.page.locator('[data-testid="ImageOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC4,
		});
	}

	leftPanel() {
		return this.page.locator('.SeriesDrawerPatientCardNormal', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}
	leftSectionExpandBtn() {
		return this.page.locator('[data-testid="KeyboardArrowRightOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	techformBtn() {
		return this.page.locator('[data-testid="active-tech-form-btn"] [data-testid="AssignmentOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	editTechFormBtn() {
		return this.page.locator('[data-testid="next"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	async openTechFormInSplitView() {
		if (await this.techformBtn().isVisible()) {
			return this.techformBtn().click({ force: true });
		}
	}

	async openLeftSection() {
		const isVisible = await this.seriesDrawer().isVisible();
		if (!(await this.seriesDrawer().isVisible())) {
			return this.leftSectionExpandBtn().click({ force: true });
		}
	}

	async closeLeftSection() {
		const isVisible = await this.seriesDrawer().isVisible();
		if (await this.seriesDrawer().isVisible()) {
			return this.leftSectionExpandBtn().click({ force: true });
		}
	}

	seriesDrawer() {
		return this.page.locator('[data-testid="ExpandableSection"] [data-testid="series-drawer"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	// Left section Patient card
	patientCard() {
		return this.page.locator('.SeriesDrawerPatientCardNormal.MuiBox-root.css-1u2hoio', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}
	patientCard3d() {
		return this.page.locator('[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-6 css-1s50f5r"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	patientCardPatientLink() {
		return this.page //SeriesDrawerPatientCardNormal.MuiBox-root.css-1u2hoio
			.locator('MuiGrid-root MuiGrid-item MuiGrid-grid-xs-6 css-1s50f5r', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('a', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	patientCardPatientLink3d() {
		return this.page.locator('[class="MuiTypography-root MuiTypography-caption css-1qfqre3"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	patientCardPatientStudyInfo(criteria) {
		return this.page
			.locator('.SeriesDrawerPatientCardNormal.MuiBox-root.css-1u2hoio', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span')
			.getByText(criteria);
	}

	patientCardPatientStudyInfo3d(criteria) {
		return this.page
			.locator('[class="MuiGrid-root MuiGrid-item css-1wxaqej"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span')
			.getByText(criteria);
	}

	patientCardPatientStudyPatientIDVerification(criteria) {
		return this.page
			.locator('[class="MuiGrid-root MuiGrid-item css-1hdkarc"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span')
			.getByText(criteria);
	}

	patientCardPatientStudyValueInfo3d(criteria) {
		return this.page
			.locator('[class="MuiGrid-root MuiGrid-item css-1hdkarc"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span')
			.getByText(criteria);
	}

	patientCardViewPatientIcon() {
		return this.page.locator('svg[data-testid="OpenInFullOutlinedIcon"]');
	}

	patientCardAccValue() {
		return this.page.locator('.MuiTypography-root.MuiTypography-body2.css-1ddh9mq', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	// Left section Series/Studies explorer
	seriesStudiesExplorerSwitchBtn() {
		return this.page.locator('svg[data-testid="ExpandMoreIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	seriesStudiesExplorerSwitchMenu() {
		return this.page.locator('.css-1rvpmo2', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	seriesStudiesExplorerIcon() {
		return this.page
			.locator('.MuiBox-root.css-y7qtsd', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg');
	}

	seriesStudiesExplorerIcon3d() {
		return this.page
			.locator(
				'[class="MuiAccordionSummary-content Mui-expanded MuiAccordionSummary-contentGutters css-17o5nyn"]',
				{
					timeout: TIMEOUT_IN_MSEC1,
				}
			)
			.locator('svg');
	}

	seriesStudiesExplorerLabel() {
		return this.page
			.locator('.MuiBox-root.css-y7qtsd', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('p');
	}

	seriesStudiesExplorerCount() {
		return this.page
			.locator('.MuiBox-root.css-y7qtsd', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span');
	}

	seriesStudiesExplorerThumbnails() {
		return this.page.locator('.MuiBox-root.css-1pcrg73', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	seriesStudiesExplorerThumbnails3d() {
		return this.page.locator(
			'[class="MuiButtonBase-root MuiAccordionSummary-root Mui-expanded MuiAccordionSummary-gutters css-1ty1ow3"]',
			{
				timeout: TIMEOUT_IN_MSEC1,
			}
		);
	}

	seriesStudiesExplorerRenameSeriesBtn() {
		return this.page
			.locator('[aria-label="Rename Series"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	seriesStudiesExplorerRenameSeriesInputField(index = 0) {
		return this.page
			.locator(`[data-testid="input-field"] > .MuiInputBase-input`, {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.nth(index);
	}

	seriesStudiesExplorerDeleteSeriesBtn() {
		return this.page
			.locator('[data-testid="remove-icon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.nth(0);
	}

	seriesStudiesExplorerDeleteSeriesBtnByIndex(idx = 0) {
		return this.page
			.locator('[data-testid="remove-icon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.nth(idx);
	}

	framesetSelectionCheckbox(index = 0) {
		return this.page
			.locator('[data-testid="checkbox-button"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.nth(index);
	}

	studyExplorerModalityList() {
		return this.page
			.locator('[data-testid="study-modality-list"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	studyMergeWindowSelectFirstStudy() {
		return this.page.locator('.MuiList-root > :nth-child(3) > .MuiBox-root');
	}

	studySelectorBox(index = 0) {
		return this.page.locator(`[data-testid="study-selector"] > .PrivateSwitchBase-input`).nth(index);
	}

	studyDeleteButton() {
		return this.page.locator(`[data-testid="delete-study-button"]`);
	}

	studyExplorerSeriesThumbnail(index = 0) {
		return this.page.locator(`[data-testid="series"] [data-testid="cornerstone-canvas-image"]`).nth(index);
	}

	studyExplorerSeriesStudy(index = 0) {
		return this.page.locator(`[data-testid="series"] [data-testid="draggable-element"]`).nth(index);
	}

	studyExplorerDroppableArea(index = 0) {
		return this.page.locator(`[data-testid="droppable-area"]`).nth(index);
	}

	studyMergeModalSubmitButton() {
		return this.page.locator('[data-testid="submit-button"]');
	}

	studyMergeButton() {
		return this.page.locator(`[data-testid="merge-button"]`);
	}

	studyAccordion(index = 0) {
		return this.page.locator(`[data-testid="accordion-summary"]`).nth(index);
	}

	studyUnmergeButton() {
		return this.page.locator(`[data-testid="unmerge-button"]`);
	}

	studyCollapseButton(index = 0) {
		return this.page.locator(`[data-testid="collapse-button"]`).nth(index);
	}

	// Right section (Patient/Series/Studies)
	rightSectionIcon() {
		return this.page.locator('[data-testid="StraightenOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	rightSectionExpandBtn() {
		return this.page.locator('[data-testid="KeyboardArrowLeftOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	async openRightSection() {
		if (!(await this.measurementsDrawer().isVisible())) {
			return this.rightSectionExpandBtn().click({ force: true });
		}
	}

	async closeRightSection() {
		if (await this.measurementsDrawer().isVisible()) {
			return this.rightSectionExpandBtn().click({ force: true });
		}
	}

	measurementsDrawer() {
		return this.page.locator('[data-testid="ExpandableSection"] [data-testid="measurements-drawer"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	measurementRecordIcon(position) {
		return this.page
			.locator('.MuiBox-root.css-1e68by0 > ul li', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.eq(position)
			.locator('svg');
	}

	measurementRecordLabel(position) {
		return this.page
			.locator('.MuiBox-root.css-1e68by0 > ul li', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.eq(position)
			.locator('span');
	}

	measurementRecordMeasure(position) {
		return this.page
			.locator('.MuiBox-root.css-1e68by0 > ul li', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.eq(position)
			.locator('p');
	}

	measurementRecordDeleteBtn(position) {
		return this.page
			.locator('.MuiBox-root.css-1e68by0 > ul li', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.eq(position)
			.locator('button');
	}

	clickOnChangeLayout() {
		return this.page.locator('[data-testid="changeLayoutBtn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	layoutGridItem(x = 0, y = 0) {
		return this.page.locator(`[data-testid="grid-item-${x}-${y}"]`, {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	seriesLayoutTabVisibilityCheck() {
		return this.page.locator('MuiBox-root css-1fcz8f6', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	hangingProtocol() {
		return this.page.locator('[data-testid="chevron-right-icon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	ClickonAddIconbtn() {
		return this.page.locator(
			'button[class="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root toolbar-btn-cls css-dx1h1o"]',
			{
				timeout: TIMEOUT_IN_MSEC1,
			}
		);
	}

	// clickNewHPbtn() {
	// 	return this.page.locator('[data-testid="share-button"]', {
	// 		timeout: TIMEOUT_IN_MSEC1,
	// 	});
	// }
	clickNewHPbtn() {
		return this.page.locator('[data-page="add-new-btn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	viewCodeCheck() {
		return this.page.locator('[class="MuiTypography-root MuiTypography-body1 css-1ta50wl"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	getViewPortSetup() {
		return this.page
			.locator('[class="MuiTypography-root MuiTypography-body1 css-1vrhhgm"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Drag View Code Here');
	}

	dragAndDropViewCode() {
		return this.page
			.locator('[class="MuiTypography-root MuiTypography-body1 css-1ta50wl"]')
			.drag('[class="MuiTypography-root MuiTypography-body1 css-1vrhhgm"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnelmentAfterElementDrag() {
		return this.page.locator('[class="MuiTypography-root MuiTypography-body1 css-1d9z9dn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	hangingProtocolRuleWindowCheck() {
		return this.page
			.locator('[class="MuiBox-root css-1yxqhn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.isVisible('be.visible');
	}

	hangingProtocolRuleCreate() {
		return this.page.locator('[class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-1uaefia"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	clickOnTogglesButton() {
		return this.page
			.locator('[class="material-icons notranslate MuiIcon-root MuiIcon-fontSizeMedium css-1jgtvd5"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('[clip-path="url(#clip0_32294_211219)"]', {
				timeout: TIMEOUT_IN_MSEC4,
			});
	}

	clickOnScallingButton() {
		return this.page
			.locator('[class="material-icons notranslate MuiIcon-root MuiIcon-fontSizeMedium css-1jgtvd5"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('[clip-path="url(#clip0_32294_211224)"]', {
				timeout: TIMEOUT_IN_MSEC4,
			});
	}

	clickOnWindowPresetsButton() {
		return this.page
			.locator('[class="material-icons notranslate MuiIcon-root MuiIcon-fontSizeMedium css-1jgtvd5"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('[clip-path="url(#clip0_32294_211241)"]', {
				timeout: TIMEOUT_IN_MSEC4,
			});
	}

	clickOnConditionsButton() {
		return this.page
			.locator('[class="material-icons notranslate MuiIcon-root MuiIcon-fontSizeMedium css-1jgtvd5"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator(
				'[d="M13.542 11.637H4.167c-1.146 0-2.083-.952-2.083-2.115V6.348c0-1.164.937-2.116 2.083-2.116h9.375v7.405ZM4.167 9.522h7.292V6.348H4.167v3.174Zm11.459 11.637H4.167c-1.146 0-2.083-.952-2.083-2.116V15.87c0-1.163.937-2.116 2.083-2.116h11.459v7.406ZM4.167 19.043h9.375V15.87H4.167v3.174Zm18.75-9.521h-2.083l2.083-5.29h-7.291v7.405h2.083v9.522l5.208-11.637ZM4.95 18.25H6.51v-1.587H4.95v1.587Zm0-9.522H6.51V7.141H4.95v1.587Z"]',
				{
					timeout: TIMEOUT_IN_MSEC4,
				}
			);
	}

	clickOnOrientationButton() {
		return this.page
			.locator('[class="material-icons notranslate MuiIcon-root MuiIcon-fontSizeMedium css-1jgtvd5"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('[clip-path="url(#clip0_32294_211231)"]', {
				timeout: TIMEOUT_IN_MSEC4,
			});
	}

	hangingProtocolSaveButtonVisibilityCheck() {
		return this.page
			.locator('[data-testid="StarBorderPurple500Icon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.isVisible('be.visible');
	}

	hangingProtocolName() {
		return this.page
			.locator('[name="protocolName"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.isVisible('be.visible');
	}

	hangingProtocolProcdureCode() {
		return this.page
			.locator('[placeholder="Select Procedure Code"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.isVisible('be.visible');
	}

	hangingProtocolSelectOrganisation() {
		return this.page
			.locator('[placeholder="Select Organization"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.isVisible('be.visible');
	}

	hangingProtocolModalityValuebutton() {
		return this.page.locator('[name="modality"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	hangingProtocolBodyPart() {
		return this.page.locator('[name="bodyPart"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	hangingProtocolLaterality() {
		return this.page.locator('[name="laterality"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	hangingProtocolLevel() {
		return this.page.locator('[name="level"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	hangingProtocolSetAsDefaultRadioBtn() {
		return this.page.locator('[class="PrivateSwitchBase-input css-1m9pwf3"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	hangingProtocolsave() {
		return this.page.locator(
			'[class="MuiLoadingButton-root MuiButton-root MuiButton-contained MuiButton-containedRsPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButtonBase-root css-158b96t"]',
			{
				timeout: TIMEOUT_IN_MSEC1,
			}
		);
	}

	// highlightedViewport() {
	// 	return this.page.locator('[data-testid="ImageViewerLayoutItem"]', {
	// 		timeout: TIMEOUT_IN_MSEC1,
	// 	});
	// }

	highlightedViewport(viewportNumber = 0) {
		return this.page.locator('[data-testid="ImageViewerLayoutItem"]').nth(viewportNumber);
	}

	nthLayoutItem(n) {
		return this.page
			.locator('[data-testid="ImageViewerLayoutItem"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.nth(n);
	}

	//Image Control Wheel
	controlWheelZoom() {
		return this.page.locator('[data-testid="zoom-tool-icon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	wheelTuneIcon() {
		return this.page.locator('[data-testid="TuneIcon"]');
	}

	controlWheelMagnify() {
		return this.page.locator('button[aria-label="Magnify"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelFlipHorizontal() {
		return this.page.locator('button[aria-label="FlipHorizontally"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelFlipVertical() {
		return this.page.locator('button[aria-label="FlipVertically"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelWindowLevel() {
		return this.page
			.locator('button[aria-label="WindowLevel"]  svg', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	controlWheelStackScroll() {
		return this.page.locator('button[aria-label="StackScroll"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelRotate() {
		return this.page.locator('[data-testid="free-rotate-tool-icon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelPan() {
		return this.page.locator('button[aria-label="Pan"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelMarkupMode() {
		return this.page.locator('button[type="button"][aria-label="MARKUP"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelCardiothoracic() {
		return this.page.locator('button[aria-label="Cardiothoracic"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelPlumbLine() {
		return this.page.locator('button[aria-label="PlumbLine"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelProbe() {
		return this.page.locator('[data-testid="probe-tool-icon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelAngle() {
		return this.page.locator('button[aria-label="Angle"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelLength() {
		return this.page.locator('[data-testid="length-tool-icon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	controlWheelAnnotate() {
		return this.page.locator('button[aria-label="ArrowAnnotate"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	//Wheel Customization window
	customizeWheelOption() {
		return this.page.locator('[role="menuitem"]').getByText('Customize Wheel');
	}

	wheelDivisionEight() {
		return this.page.locator('img[src="/f6ca8b596d911c97ec8a46e1ffb4748b.png"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	wheelDivisionSix() {
		return this.page.locator('img[src="/c2f2fec2137c37bc7f52f24dbcddcf1f.png"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	wheelDivisionFour() {
		return this.page.locator('img[src="/baef502aa99548819851cf511896652f.png"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	customizeWheelAdjustment() {
		return this.page.locator('[role="tablist"] button', { hasText: 'ADJUSTMENT' });
	}

	customizeWheelMarkup() {
		return this.page.locator('[role="tablist"] button', { hasText: 'MARKUP' });
	}

	saveWheelCustomization() {
		return this.page.locator('button[type="button"]').locator('Save', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	cancelWheelCustomization() {
		return this.page
			.locator('.MuiBox-root.css-wgsug1', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('button', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('CANCEL', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	async dragIndicatorIcon(dragToolLabel) {
		const dragLocator = this.page.locator(`div[data-rbd-draggable-id="${dragToolLabel}"]`);

		// Ensure the draggable element is visible before hovering
		await dragLocator.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
		await dragLocator.hover();

		// Define the icon locator
		const icon = this.page.locator(`[data-rbd-draggable-id="${dragToolLabel}"] [data-testid="DragIndicatorIcon"]`);

		// Modify icon properties in the browser context (to match Cypress `.invoke()` behavior)
		await this.page.evaluate(selector => {
			const element = document.querySelector(selector);
			if (element) {
				element.style.display = 'block'; // Make sure it's displayed
				element.removeAttribute('hidden'); // Remove hidden attribute
				element.style.visibility = 'visible'; // Ensure it's visible

				element.style.width = '20px'; // Set width
				element.style.height = '20px'; // Set height
			}
		}, '[data-testid="DragIndicatorIcon"]'); // Pass selector as a string

		// Ensure the icon is interactable
		await icon.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });

		if (!(await icon.isVisible())) {
			throw new Error(`Drag Indicator Icon is not visible for tool: ${dragToolLabel}`);
		}

		return icon;
	}

	async customizeWheelDropArea(dropArea) {
		const dropLocator = this.page.locator(`[data-testid="${dropArea}"]`);

		// Modify attributes and styles using Playwright's evaluate method
		await this.page.evaluate(testId => {
			const element = document.querySelector(`[data-testid="${testId}"]`);
			if (element) {
				element.style.display = 'block'; // Ensure it's visible
				element.removeAttribute('hidden'); // Remove hidden attribute if exists
				element.style.width = '20px'; // Set width
				element.style.height = '20px'; // Set height
			}
		}, dropArea);
		// Ensure the element exists before proceeding
		if (!(await dropLocator.isVisible())) {
			throw new Error(`Element with data-testid="${dropArea}" not found or not visible.`);
		}
		return dropLocator;
	}

	customizeWheelPan() {
		return this.page
			.locator('[data-rbd-draggable-id="Pan"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Pan', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelWL() {
		return this.page
			.locator('[data-rbd-draggable-id="WindowLevel"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Window Level', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelStackScroll() {
		return this.page
			.locator('[data-rbd-draggable-id="StackScroll"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Stack Scroll', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelZoom() {
		return this.page
			.locator('[data-rbd-draggable-id="Zoom"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Zoom', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelMagnify() {
		return this.page
			.locator('[data-rbd-draggable-id="Magnify"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Magnify', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelRotate() {
		return this.page
			.locator('[data-rbd-draggable-id="PlanarRotate"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Free Rotate', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelFlipV() {
		return this.page
			.locator('[data-rbd-draggable-id="FlipVertically"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Flip Vertically', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelFlipH() {
		return this.page
			.locator('[data-rbd-draggable-id="FlipHorizontally"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Flip Horizontally', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelInvert() {
		return this.page
			.locator('[data-rbd-draggable-id="Invert"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Invert', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelCrosshair() {
		return this.page
			.locator('[data-rbd-draggable-id="Crosshairs"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Crosshair', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelCrosshairPointer() {
		return this.page
			.locator('[data-rbd-draggable-id="CrosshairPointer"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Crosshair Pointer', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelShutter() {
		return this.page
			.locator('[data-rbd-draggable-id="ShutterRectangleTool"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Shutter Rectangle', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelLength() {
		return this.page
			.locator('[data-rbd-draggable-id="Length"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Length', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelSpineLabeling() {
		return this.page
			.locator('[data-rbd-draggable-id="SpineLabeling"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Spine Labeling', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelAnnotate() {
		return this.page
			.locator('[data-rbd-draggable-id="ArrowAnnotate"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Annotate', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelCardiothoracic() {
		return this.page
			.locator('[data-rbd-draggable-id="Cardiothoracic"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Cardiothoracic Ratio', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelPlumb() {
		return this.page
			.locator('[data-rbd-draggable-id="PlumbLine"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Plumb Line', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelProbe() {
		return this.page
			.locator('[data-rbd-draggable-id="Probe"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Probe', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelAngle() {
		return this.page
			.locator('[data-rbd-draggable-id="Angle"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Angle', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelBidirectional() {
		return this.page
			.locator('[data-rbd-draggable-id="Bidirectional"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Bidirectional', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelEllipticalROI() {
		return this.page
			.locator('[data-rbd-draggable-id="EllipticalROI"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Elliptical ROI', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelRectangleROI() {
		return this.page
			.locator('[data-rbd-draggable-id="RectangleROI"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Rectangle ROI', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelDragProbe() {
		return this.page
			.locator('[data-rbd-draggable-id="DragProbe"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Drag Probe', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelCobbAngle() {
		return this.page
			.locator('[data-rbd-draggable-id="CobbAngle"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Cobb Angle', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	customizeWheelFreehandROI() {
		return this.page
			.locator('[data-rbd-draggable-id="PlanarFreehandROI"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Freehand ROI', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnTopLeftDisplay() {
		return this.page
			.locator('[id="top-left-display"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.click({ force: true });
	}

	clickOnMoreOptions() {
		return this.page
			.locator('[data-testid="MoreVertOutlinedIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.click({ force: true });
	}

	clickOnPrintImage() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Print Image', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	moreOptionsCrossCheck() {
		return this.page.locator(
			'[class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary css-jh9kp8"]',
			{
				timeout: TIMEOUT_IN_MSEC1,
			}
		);
	}

	minimiseMoreOption() {
		return this.page.locator('[class="MuiBackdrop-root MuiBackdrop-invisible css-esi9ax"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	clickOnPlaySeries() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Play Series', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnStopSeries() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('Stop Series', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	toggleOverlay() {
		return this.page.locator(
			'li.MuiMenuItem-root',
			{ hasText: 'Overlay' },
			{
				timeout: TIMEOUT_IN_MSEC1,
			}
		);
	}

	toggleCheckIcon() {
		return this.page.locator('svg[data-testid="CheckIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	clickOnToggles() {
		return this.page.getByText('Toggles', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	clickOnToggleScoutLines() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Toggle Scout Lines', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnCustomizeWheel() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Customize Wheel', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnDicomHeaderTag() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('DICOM Header Tags', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	elementVerifyOnCustomizeWheel() {
		return this.page
			.locator('[class="MuiBox-root css-wgsug1"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('button', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('Save', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnAboutImageViewer() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('About Image Viewer', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnCloseButton() {
		return this.page
			.locator('[class="MuiBox-root css-wfsak8"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('[class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnPopoutInWindow() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Popout In Window', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnLinkSeries() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Link Series', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnUnlink() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Unlink', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnManualLink() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Manual Link', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnPlaneLink() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Plane Link', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	clickOnThumbnaildetails() {
		return this.page
			.locator('[data-testid="accordion-summary"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.eq(0);
	}

	expandLessIcon() {
		return this.page
			.locator('[data-testid="ImageViewerViewportButtons"] [data-testid="ExpandLessIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	CloseDicomHeaderTagPage() {
		return this.page
			.locator('[class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall css-1kezh91"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	downloadOption() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('span', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Download', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	//Customize Toolbar Edit Page
	customizeToolbarOption() {
		return this.page
			.locator('[class="MuiListItemText-root css-1tsvksn"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Customize Toolbar', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	saveCustomizeToolbarPage() {
		return this.page
			.locator('button[class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall css-1u4rb10"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="CloseIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	crosshairPointerBtn() {
		return this.page.locator('[data-testid="CrosshairPointerToolIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	flipBtn() {
		return this.page.locator('[data-testid="FlipIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	invertBtn() {
		return this.page.locator('[data-testid="InvertIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	magnifyBtn() {
		return this.page
			.locator('button[data-testid="icon-section"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="SearchIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	panBtn() {
		return this.page.locator('[data-testid="PanToolIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	quadBtn() {
		return this.page.locator('[data-testid="QuadToolIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	rotateBtn() {
		return this.page
			.locator('div[data-testid="tool-component-wrapper"][toolname="Free Rotate"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('button[data-testid="icon-section"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="LoopIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	shutterBtn() {
		return this.page.locator('[data-testid="ShutterIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	stackScrollBtn() {
		return this.page.locator('[data-testid="StackScrollIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	windowLevelBtn() {
		return this.page.locator('[data-testid="ContrastIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	zoomBtn() {
		return this.page.locator('[data-testid="ZoomIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	angleBtn() {
		return this.page.locator('[data-testid="AngleIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	annotateBtn() {
		return this.page.locator('[data-testid="TextRotationNoneIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	bidirectionalBtn() {
		return this.page.locator('[data-testid="BidirectionalToolIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	cardiothoracicBtn() {
		return this.page.locator('[data-testid="CTRIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	dragProbeBtn() {
		return this.page.locator('[data-testid="DragProbeToolIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	lengthBtn() {
		return this.page.locator('[data-testid="StraightenIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	plumbLineBtn() {
		return this.page.locator('[data-testid="PlumbLineIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	ROIBtn() {
		return this.page.locator('[data-testid="MarkROIIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	spineLabelingBtn() {
		return this.page.locator('[data-testid="SpineLabelToolIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	burnStudyBtn() {
		return this.page
			.locator('button[data-testid="icon-section"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="AlbumOutlinedIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	cineBtn() {
		return this.page
			.locator('button[data-testid="icon-section"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="PlayCircleFilledOutlinedIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	copyBtn() {
		return this.page.locator('[data-testid="ContentCopyRoundedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	downloadBtn() {
		return this.page.locator('[data-testid="SaveAltOutlinedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	fusionBtn() {
		return this.page.locator('[data-testid="FusionIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	keyImageBtn() {
		return this.page
			.locator('button[data-testid="icon-section"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="VpnKeyOutlinedIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	linkBtn() {
		return this.page.locator('[data-testid="InsertLinkRoundedIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	MPRBtn() {
		return this.page.locator('[data-testid="MPRIconIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	printBtn() {
		return this.page
			.locator('button[data-testid="icon-section"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="LocalPrintshopOutlinedIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	tileModeBtn() {
		return this.page
			.locator('button[data-testid="icon-section"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.locator('svg[data-testid="CalendarViewMonthOutlinedIcon"]', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	resetCustomizeToolbarBtn() {
		return this.page.locator('button.MuiButton-containedPrimary.css-8io534', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	resetAllConfirmBtn() {
		return this.page.locator('button').getByText('Confirm', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	resetAllCancelBtn() {
		return this.page.locator('button.MuiButton-root MuiButton-text MuiButton-textPrimary').locator('Cancel', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	undoCustomizeToolbarBtn() {
		return this.page.locator('button.css-1hvboeu', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	// Text Notes
	dictationsAndNotesBtn() {
		return this.page.locator('button[data-testid="mainBtn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	notesInputField() {
		return this.page.locator(`[data-testid="input"] > .MuiInputBase-input`, {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	voiceAndNoteList() {
		return this.page.locator('[data-testid="study-and-voice-notes-list"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	discardNoteBtn() {
		return this.page.locator('[data-testid="discardBtn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	deleteNoteBtn(textNote) {
		return this.page.locator(
			`[data-testid="study-and-voice-notes-list"] :has-text("${textNote}") + * [data-testid="progress-delete-button"]`,
			{ timeout: TIMEOUT_IN_MSEC1 }
		);
	}

	//Window Level Preset
	windowPresetMenu() {
		return this.page.locator('[data-testid="window-preset-menu-paper"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	configurePresetsBtn() {
		return this.page
			.locator('[data-testid="preset-button"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('Configure Presets', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	addWLPresetBtn() {
		return this.page.locator('[data-testid="add-button"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	presetNameInputField() {
		return this.page.locator('[name="presetName"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	windowLevelInputField() {
		return this.page.locator('[name="windowLevel"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	windowWidthInputField() {
		return this.page.locator('[name="windowWidth"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	windowLevelConfigSaveBtn() {
		return this.page
			.locator('button[type="button"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.getByText('SAVE', {
				timeout: TIMEOUT_IN_MSEC1,
			});
	}

	windowLevelConfigDrawer() {
		return this.page.locator('[data-testid="WindowLevelConfigDrawer"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	windowLevelConfigDrawerCloseBtn() {
		return this.page.locator('button[type="button"][data-testid="close-button"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	windowLevelOverlay(windowWidthValue, windowLevelValue) {
		return this.page.locator('[id^="customOverlay"][id*="bottom"][id*="left"]', {
			hasText: `W${windowWidthValue} C${windowLevelValue}`,
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	async deleteWindowPreset(windowPresetName) {
		await this.page
			.getByText(windowPresetName, { timeout: TIMEOUT_IN_MSEC1 })
			.locator('+ div [data-testid="MoreVertIcon"]', { timeout: TIMEOUT_IN_MSEC1 })
			.click();
		const deleteOption = this.page.locator('.MuiPopover-paper:visible li:has-text("Delete")', {
			timeout: TIMEOUT_IN_MSEC2,
		});
		await expect(deleteOption).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });
		await deleteOption.click({ force: true });
	}

	//Default Window Level Preset
	defaultPresetBtn(defaultPresetName) {
		return this.page.locator(`button[data-testid="preset-button"]:has-text("${defaultPresetName}")`, {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	/**
	 * verify image display on viewport
	 * @onViewportNumber {numeric} required. From 1..9
	 */
	async verifyImageDisplay(onViewportNumber) {
		// Check if the parameter is a number and within the valid range (0 to 8)
		if (typeof onViewportNumber !== 'number' || onViewportNumber < 1 || onViewportNumber > 9) {
			throw new Error('Invalid onViewportNumber. It must be a number between 1 and 9.');
		}
		await this.page
			.locator('[data-testid="ImageViewerLayoutItems"]')
			.locator('[data-rendering-engine-uid^="cornerstone3d"]', { timeout: TIMEOUT_IN_MSEC1 })
			.nth(onViewportNumber - 1)
			.isVisible('have.attr', 'ready', 'true');
	}

	gridItem() {
		return this.page.locator('[data-testid^="grid-item"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	//Customize Overlays Page
	customizeOverlaysOption() {
		return this.page
			.locator('li[role="menuitem"].MuiMenuItem-root', { timeout: TIMEOUT_IN_MSEC1 })
			.filter({ hasText: 'Customize Overlays' }, { timeout: TIMEOUT_IN_MSEC1 });
	}

	insertDicomTagField(insertField) {
		return this.page.locator('div.ProseMirror', { timeout: TIMEOUT_IN_MSEC1 }).nth(insertField);
	}

	saveOverlayBtn() {
		return this.page.locator('[data-testid="save-button"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	backBtn() {
		return this.page.locator('[data-testid="go-back-btn"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	async deleteOverlays(overlayName) {
		const overlayLocator = this.page.locator(`text=${overlayName}`);
		await overlayLocator.click();
		await this.page.keyboard.press('End');
		await this.page.keyboard.down('Shift');
		await this.page.keyboard.press('Home');
		await this.page.keyboard.up('Shift');
		await this.page.keyboard.press('Backspace');
	}

	minimalTierIcon() {
		return this.page.locator('button[title="Minimal"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	imageViewerWrapper() {
		return this.page.locator('[data-testid="ImageViewerLayoutWrapper"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	/**
	 * change viewport layout
	 * @layoutSelectingGrid {numeric} required.
	 * exemple: if you want to set layout 1x2, the layoutSelectingGrid should be '1'
	 */

	viewportLayout(layoutSelectingGrid) {
		return this.gridItem().nth(layoutSelectingGrid);
	}

	imageViewport() {
		return this.page.locator('[data-testid="ImageViewerViewport"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	seriesThumbnail() {
		return this.page.locator('[data-testid="series"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	seriesThumbnailByIndex(index = 0) {
		return this.page
			.locator('[data-testid="series"]', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.nth(index);
	}
	signBtnIV() {
		return this.page.locator('[data-testid="doneBtn"]');
	}

	nextStudyBtnIV() {
		return this.page.locator('[data-testid="doneOpenNextBtn"]');
	}

	patientNameInIV() {
		return this.page
			.locator(`.css-1etqdyx-verticaltop .css-6cr7vw-tagsWrapper-horizontalleft [class="css-1nrmhgf-row"]`, {
				timeout: TIMEOUT_IN_MSEC2,
			})
			.first();
	}

	studyIdlineInIV() {
		return this.page
			.locator('.css-6cr7vw-tagsWrapper-horizontalleft .css-1nrmhgf-row span:has-text("SID:")')
			.first();
	}

	async mergeStudy(poManager) {
		await this.studyAccordion().hover();
		await this.studyAccordion().getByRole('checkbox').check();
		await this.studyAccordion('1').hover();
		await this.studyAccordion('1').getByRole('checkbox').check();
		await this.studyMergeButton().click();
		await this.page.locator('.css-f69ll8 [role="menuitem"] ').nth(0).click();
		await this.page.route('**/dicomweb/mergeById/*', async route => route.continue());
		await this.studyMergeModalSubmitButton().click();
		await poManager.apiWaitUtils.waitForAPI('/dicomweb/mergeById/', 'POST');
		await expect(await this.page.locator('[id="notistack-snackbar"]')).toContainText('Merged successfully');
	}

	wheelRotateIcon() {
		return this.page
			.locator('button[aria-label="PlanarRotate"] svg', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	wheelPanIcon() {
		return this.page
			.locator('button[aria-label="Pan"] svg', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	wheelWindowLevelIcon() {
		return this.page
			.locator('button[aria-label="WindowLevel"] svg', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	wheelZoomIcon() {
		return this.page
			.locator('button[aria-label="Zoom"] svg', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	toWindowLevel(low, high) {
		// Allow for swapping high/low
		const windowWidth = Math.abs(high - low) + 1;
		const windowCenter = (low + high + 1) / 2;

		return { windowWidth, windowCenter };
	}

	wheelRectangleROIIcon() {
		return this.page
			.locator('button[aria-label="RectangleROI"] svg', {
				timeout: TIMEOUT_IN_MSEC1,
			})
			.first();
	}

	async getCornerstoneViewports() {
		return await this.page.evaluate(() => {
			const cs = window.cornerstone;
			if (!cs || !cs.getEnabledElements) return [];
			return cs
				.getEnabledElements()
				.filter(element => element.viewportId !== 'SHADOW_ACTIVE_VIEWPORT_ID')
				.map(element => ({
					elementId: element.viewportId,
					rotation: element.viewport?.getRotation?.(),
					camera: element.viewport?.getCamera?.(),
					pan: element.viewport?.getPan?.(),
					zoom: element.viewport?.getZoom?.(),
					properties: element.viewport?.getProperties?.(),
				}));
		});
	}

	async getCornerstoneViewportByIndex(index /** from 0 */) {
		const elements = await this.getCornerstoneViewports();
		return elements?.length >= index + 1 ? elements[index] : null;
	}

	async verifyWLAppliedOnViewport(viewportIndex, expectedWindowWidth, expectedWindowCenter) {
		const viewport = await this.getCornerstoneViewportByIndex(viewportIndex);
		if (!viewport) {
			throw new Error(`Viewport with index ${viewportIndex} not found.`);
		}

		//Expected
		const { lower, upper } = viewport.properties.voiRange;
		const { windowWidth, windowCenter } = this.toWindowLevel(lower, upper);

		console.log(
			`imageViewer.verifyWLAppliedOnViewport - Actual - windowWidth: ${windowWidth}, windowCenter: ${windowCenter}`
		);
		console.log(
			`imageViewer.verifyWLAppliedOnViewport - Expected - windowWidth: ${expectedWindowWidth}, windowCenter: ${expectedWindowCenter}`
		);

		if (windowWidth !== expectedWindowWidth || windowCenter !== expectedWindowCenter) {
			throw new Error(`Window Width or Window Center not match as expectation on viewport ${viewportIndex}`);
		}
	}

	measurementText() {
		return this.page.locator('[data-testid="measurement-non-editable-text"]').first().innerText({
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	//Delete Frames from Series
	deleteFramesBtn() {
		return this.page.locator('[data-testid="DeleteFrameButton"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	deleteFramesDialog() {
		return this.page.locator('[id="customized-dialog-title"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	cancelDialogButton() {
		return this.page.locator('[data-testid="secondary-btn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	deleteCurrentSeriesButton() {
		return this.page.locator('[data-testid="proceed-btn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	deleteCurrentFrameButton() {
		return this.page.locator('[data-testid="middle-btn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	getFrameCountValue() {
		return this.page.locator('[data-testid="tools-wrapper"] p', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	async assertFrameCountIs(expectedCount) {
		await expect(this.getFrameCountValue()).toHaveText(expectedCount);
	}

	MPRbutton() {
		return this.page.getByRole('button', { name: 'MPR', timeout: TIMEOUT_IN_MSEC1 });
	}

	FusionButton() {
		return this.page.getByRole('button', { name: 'Fusion', timeout: TIMEOUT_IN_MSEC1 });
	}
};
