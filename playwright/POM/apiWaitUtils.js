exports.ApiWaitUtils = class ApiWaitUtils {
	constructor(page) {
		this.page = page;
	}

	async waitForAPI(requestURL, method, timeout = 60000) {
		return new Promise((resolve, reject) => {
			let isListenerRemoved = false;

			const apiCallToBeSuccessfulAndGetResponse = async response => {
				if (response.url().includes(requestURL) && response.request().method() === method) {
					console.log(`Received response for ${response.url()}`);
					if (response.ok()) {
						console.log(`Response successful for ${response.url()}`);
						const contentType = response.headers()['content-type'];
						let responseBody;
						if (
							contentType &&
							(contentType.includes('application/json') || contentType.includes('application/fhir+json'))
						) {
							responseBody = await response.json(); // Parse response body as JSON
							console.log('Response body:', JSON.stringify(responseBody, null, 2));
						} else {
							// Handle non-JSON response (e.g., PDF)
							responseBody = await response.body();
							console.log('Response body is not JSON. It might be binary data.');
						}

						if (!isListenerRemoved) {
							this.page.off('response', apiCallToBeSuccessfulAndGetResponse);
							isListenerRemoved = true;
						}

						resolve(responseBody);
					} else {
						console.error(`Response failed for ${response.url()}`);
						reject(`Response failed for ${response.url()}`);
					}
				}
			};

			this.page.on('response', apiCallToBeSuccessfulAndGetResponse);

			this.page
				.waitForResponse(
					response => response.url().includes(requestURL) && response.request().method() === method,
					{ timeout }
				)
				.catch(error => {
					console.error(`Timeout waiting for response to ${requestURL}`);
					if (!isListenerRemoved) {
						this.page.off('response', apiCallToBeSuccessfulAndGetResponse);
					}
					reject(error);
				});

			if (!this.page.isClosed()) {
				try {
					this.page.unroute(url => url.includes(requestURL));
				} catch (error) {
					console.error('Error during unroute:', error);
				}
			}
		});
	}
};
