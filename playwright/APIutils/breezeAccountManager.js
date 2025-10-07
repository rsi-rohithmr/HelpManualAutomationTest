const breezeOrgJsonTemplate = require('../studyInfo/postBreezeOrg.json');
const { Login } = require('../POM/login');
const playwrightConfig = require('../../playwright.config');
export class BreezeAPI {
	constructor(apiContext, accessToken) {
		this.apiContext = apiContext;
		this.accessToken = accessToken;
	}

	// POST a Breeze account
	async postBreezeAccount(managingOrgName, managingClientId, primaryEntityName) {
		const breezeOrgJson = JSON.parse(JSON.stringify(breezeOrgJsonTemplate));
		breezeOrgJson.AccountName = managingOrgName;
		breezeOrgJson.ClientId = managingClientId;
		breezeOrgJson.TargetEntity = primaryEntityName;

		const accountResponse = await this.apiContext.post(`${playwrightConfig.baseURL}/api/breeze-api/Account`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			data: breezeOrgJson,
		});

		const responseText = await accountResponse.text();
		try {
			const accountJson = JSON.parse(responseText);
			const accountId = accountJson.id;
			console.log('Account ID created:', accountId);
			return accountId;
		} catch (error) {
			console.error('Failed to parse account response as JSON:', responseText);
			throw error;
		}
	}

	// Update asset settings on an account
	async updateBreezeAccountAssets(accountId, managingOrgId, enableAssetName) {
		// enableAssetName = 'Blume Automated Front Desk' || 'Blume Patient Portal';
		const postUrl = `${playwrightConfig.baseURL}/api/breeze-api/OrganizationOmegaAI/${accountId}/${managingOrgId}/Asset`;

		const assets = [
			{
				Asset: 'Blume Automated Front Desk',
				Active: enableAssetName === 'Blume Automated Front Desk' ? 'true' : 'false',
			},
			{
				Asset: 'Blume Patient Portal',
				Active: enableAssetName === 'Blume Patient Portal' ? 'true' : 'false',
			},
		];

		const postResponse = await this.apiContext.post(postUrl, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			data: assets,
		});

		console.log('Assets updated for account:', accountId);
		const responseBody = await postResponse.json();
		console.log('Updated assets response:', responseBody);

		return responseBody;
	}

	async deleteBreezeAccount(accountId) {
		const deleteUrl = `${playwrightConfig.baseURL}/api/breeze-api/Account/${accountId}`;
		const deleteResponse = await this.apiContext.delete(deleteUrl, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		console.log(`Deleted Breeze account ${accountId} - status: ${deleteResponse.status()}`);
		return deleteResponse.ok();
	}
}
