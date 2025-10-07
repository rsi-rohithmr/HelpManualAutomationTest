const { expect, request } = require('@playwright/test');
const menuItems = {
    import: 'Add New',
    home: 'Home',
    organization: 'Organization',
    code: 'Code',
    log: 'Logs',
    help: 'Help',
    // marketplace: 'My App', //marketplace visibility is controlled by a flag -> remove it from this test
  };
  
  export class Sidebar {
    constructor(page) {
		this.page = page;
	}

    drawer() {
      return this.page.locator('[data-cy="sidebar-drawer"]');
    }
  
    hamburger() {
      return this.page.locator('[data-cy="sidebar-hamburger"]');
    }
  
    menuIcon (menu) {
      return this.page.locator(`[data-cy="sidebar-${menu}"]`);
    }
  
    menuName(menu) {
      return this.page.locator(`[data-cy="sidebar-${menu}"]`).locator('label');
    }
  
    userSettingBtn() {
      return this.page.locator('button:has-text("User Settings")');
    }
  
    switchPortalBtn() {
      return this.page.locator('button:has-text("Switch to Patient Portal")');
    }
  
    lightDarkBtn() {
      return this.page.locator('button:has-text("Light Dark")');
    }
  
    logoutBtn() {
      return this.page.locator('button:has-text("LOGOUT")');
    }
  
    userProfile() {
      return this.page.locator('[data-cy="sidebar-profile"]');
    }
  
    myApps() {
      return this.page.locator('[data-cy="myApps"]');
    }
  
    getGearRootIcon() {
      return this.page.locator('[data-cy="myApps"] [data-testId="SettingsOutlinedIcon"]').nth(0);
    }
  
    getGearBlumeIcon() {
      return this.page.locator('[data-cy="myApps"] [data-testId="SettingsOutlinedIcon"]').nth(1);
    }
  }
  
//   export const sidebar = new Sidebar();
  