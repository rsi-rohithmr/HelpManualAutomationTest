const { Login } = require('./login');
const { DocumentViewer } = require('./documentViewer');
const { ImageViewer } = require('./imageViewer');
const { Blume } = require('./blumePage/blume');
const { ApiWaitUtils } = require('./apiWaitUtils');
const { WorkflowAutomationPage } = require('./workflowAutomationPage');
const { HomePage } = require('./homePage/homePage');
const { OrganizationDirectoryPage } = require('./organizationDirectoryPage');
const { OrganizationDetailPage } = require('./organizationDetailPage');
const { OrganizationAffiliationPage } = require('./organizationAffiliationPage');
const { OrganizationUserRolePage } = require('./organizationUserRolePage');
const { Sidebar } = require('./sidebar');
const { Scheduler } = require('./homePage/scheduler');
const { Common } = require('./common');
const { ClickWheel } = require('./clickWheel');
const { WorklistSettings } = require('./homePage/worklistSettings');
const { WorklistSpeedDial } = require('./homePage/worklistSpeedDial');
const { APIRequests } = require('../APIutils/APIRequests');
const { WorklistStudyStatus } = require('./worklistStudyStatus');
const { PatientInformationPage } = require('./patientInformation/patientInformationPage');
const { FaxPage } = require('./faxPage');
const { OAISignUpPage } = require('./oaiSignUpPage');
const { OrderDrawer } = require('./order/orderDrawer');
const { AIUtils } = require('./aiUtils');
const { GlobalSearch } = require('./globalSearch');
const { CoverageInformationPage } = require('./patientInformation/coverageInformationPage');
const { CoverageGenerator } = require('../generators/coverageGenerator');
const { TeachingFolderPage } = require('./teachingFolderPage/teachingFolderPage');
class POManager {
	constructor(page, apiContext, testInfo) {
		this.page = page;
		this.apiContext = apiContext;
		this.testInfo = testInfo;
		this.documentViewer = new DocumentViewer(this.page, this.testInfo);
		this.imageViewer = new ImageViewer(this.page);
		this.loginPage = new Login(this.page);
		this.blume = new Blume(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.workflowAutomationPage = new WorkflowAutomationPage(this.page);
		this.organizationDirectoryPage = new OrganizationDirectoryPage(this.page);
		this.organizationDetailPage = new OrganizationDetailPage(this.page);
		this.organizationUserRolePage = new OrganizationUserRolePage(this.page);
		this.organizationAffiliationPage = new OrganizationAffiliationPage(this.page);
		this.sidebar = new Sidebar(this.page);
		this.homePage = new HomePage(this.page);
		this.scheduler = new Scheduler(this.page);
		this.common = new Common(this.page, this.apiContext, this.testInfo);
		this.clickWheel = new ClickWheel(this.page);
		this.worklistSettings = new WorklistSettings(this.page);
		this.worklistSpeedDial = new WorklistSpeedDial(this.page);
		this.apiRequests = new APIRequests(this.apiContext);
		this.worklistStudyStatus = new WorklistStudyStatus(this.page);
		this.patientInformationPage = new PatientInformationPage(this.page);
		this.faxPage = new FaxPage(this.page);
		this.oaiSignUpPage = new OAISignUpPage(this.page);
		this.orderDrawer = new OrderDrawer(this.page);
		this.aiUtils = new AIUtils(this.page, this.apiContext, this.testInfo);
		this.globalSearch = new GlobalSearch(this.page);
		this.coverageInformationPage = new CoverageInformationPage(this.page);
		this.coverageGenerator = new CoverageGenerator();
		this.teachingFolderPage = new TeachingFolderPage(this.page);
	}

	login() {
		return this.login;
	}

	documentViewer() {
		return this.documentViewer;
	}

	blume() {
		return this.blume;
	}

	apiWaitUtils() {
		return this.apiWaitUtils;
	}

	imageViewer() {
		return this.imageViewer;
	}

	workflowAutomationPage() {
		return this.workflowAutomationPage;
	}

	organizationDirectoryPage() {
		return this.organizationDirectoryPage;
	}

	organizationDetailPage() {
		return this.organizationDetailPage;
	}

	organizationUserRolePage() {
		return this.organizationUserRolePage;
	}

	sidebar() {
		return this.sidebar;
	}

	homePage() {
		return this.homePage;
	}

	scheduler() {
		return this.scheduler;
	}

	clickWheel() {
		return this.clickWheel;
	}

	worklistSettings() {
		return this.worklistSettings;
	}

	worklistSpeedDial() {
		return this.worklistSpeedDial;
	}

	apiRequests() {
		return this.apiRequests;
	}

	worklistStudyStatus() {
		return this.WorklistStudyStatus;
	}

	patientInformationPage() {
		return this.patientInformationPage;
	}

	faxPage() {
		return this.faxPage;
	}

	oaiSignUpPage() {
		return this.oaiSignUpPage;
	}

	orderDrawer() {
		return this.orderDrawer;
	}

	aiUtils() {
		return this.aiUtils;
	}

	globalSearch() {
		return this.globalSearch;
	}

	coverageInformationPage() {
		return this.coverageInformationPage;
	}

	coverageGenerator() {
		return this.coverageGenerator;
	}

	teachingFolderPage() {
		return this.teachingFolderPage;
	}
}
module.exports = { POManager };
