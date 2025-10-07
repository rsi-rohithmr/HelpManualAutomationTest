const { expect } = require('@playwright/test');

class ShareDrawer {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Drawer
    this.drawer = page.locator('[data-testid="ShareDrawer"]');

    // Email input
    this.emailInput = page.getByPlaceholder('johndoe@gmail.com');

    // Share button (next to email input)
    this.sendButton = page.getByRole('button', { name: 'Send' });

    // Link section
    this.copyLinkButton = page.getByRole('button', { name: 'Copy link' });
    this.linkCopiedButton = page.getByRole('button', { name: 'Link Copied!' });

    this.drawerCloseButton = page.locator('[data-testid="CloseIcon"]').nth(0); // first CloseIcon
    this.sectionCloseButton = page.locator('[data-testid="CloseIcon"]').nth(1); // second CloseIcon
  }

  async shareWithEmail(email) {
    await this.emailInput.fill(email);
    await this.sendButton.click();
  }

  async copyLink() {
    await this.copyLinkButton.click();
    await expect(this.linkCopiedButton).toBeVisible();
  }

  async closeDrawer() {
    await this.drawerCloseButton.click();
  }
  
  async closeEmailSection() {
    await this.emailCloseButton.click();
  }
}

module.exports = { ShareDrawer };