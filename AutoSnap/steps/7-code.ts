const pages = page.context().pages();
page = pages[pages.length - 1];
await page.screenshot({ path: './img/popuppatientinfo.png' });