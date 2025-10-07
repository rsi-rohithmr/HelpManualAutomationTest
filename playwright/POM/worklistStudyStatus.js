import { OrganizationDetailPage } from './organizationDetailPage';
const { ApiWaitUtils } = require('./apiWaitUtils');

export class WorklistStudyStatus {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	UserAndRolesLink() {
		return this.page.getByRole('link', { name: 'Users & Roles' });
	}

	RolesBtn(){
		return this.page.getByTestId('dynamic-btn-Roles');
	}

	SearchFilter(){
		return this.page.getByTestId('Role Name_filter').getByPlaceholder('Search');
	}

	AdministratorRoleCheckbox(){
		return this.page.getByRole('option', { name: 'ADMINISTRATOR', exact: true }).getByRole('checkbox');
	}

	RoleText(){
		return this.page.locator('div').filter({ hasText: /^RolesUsersRoles$/ });
	}

	AdministratorRoleRow(){
		return this.page.getByTestId('study-status-cell-0_name');
	}

	AdministratorRoleEditBtn(){
		return this.page.getByTestId('study-status-cell-0_icons').getByLabel('Edit');
	}

	MainLevelOrganization(){
		return this.page.locator('div').filter({ hasText: /^Organizations$/ });
	}

	SecondaryLevelStudyStatus(){
		return this.page.locator('div').filter({ hasText: /^Study Statuses$/ });
	}

	OverrideStudyStatusTransitionCheckBox(){
		return this.page.getByTestId("switch-button-Override Study Status Transition").getByRole("checkbox");
	}
	ModifyLockedStudyCheckBox(){
		return this.page.getByTestId("switch-button-Modify Locked Study").getByRole("checkbox");
	}

	PrivilegeSaveBtn(){
		return this.page.getByTestId('save-button');
	}

	WorklistMenuLink(){
		return this.page.getByRole('link', { name: 'Worklist Worklist' });
	}

	WorklistSearch(){
		return this.page.getByRole('columnheader', { name: /Study ID/i }).locator('[placeholder="Search"]');
	}
	WorklistStatusSearch(){
		return this.page.getByRole('columnheader', { name: /Study Status/i }).locator('[placeholder="Search"]');
	}

	StudyStatusLink(){
		return this.page.getByTestId('study-status-cell-0_studyStatus').getByTestId('study-status-text');
	}

	RequestedStudyStatus(){
		return this.page.getByRole('option', { name: 'REQUESTED' });
	}

	OrderedStudyStatus(){
		return this.page.getByRole('option', { name: 'ORDERED' });
	}

	ToBeAmendedStudyStatus(){
		return this.page.getByRole('option', { name: 'TO BE AMENDED' });
	}

	SignedStudyStatus(){
		return this.page.getByRole('option', { name: 'SIGNED' });
	}

	ArrivedStudyStatus(){
		return this.page.getByRole('option', { name: 'ARRIVED' });
	}

	ConfirmedStudyStatus(){
		return this.page.getByRole('option', { name: 'CONFIRMED' });
	}

	SuccessfullyUpdatedStudyStatusText(){
		return this.page.getByText('Successfully updated Study');
	}
}