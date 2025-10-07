const faker = require('community-faker');

/**
 * Generates a random test email using a disposable domain.
 * @param {string} domain - The email domain to use (default: 'yopmail.com')
 * @returns {string} - A random test email address
 */
function generateTestEmail(domain = 'yopmail.com') {
	const randomUser = faker.datatype.uuid();
	return `${randomUser}@${domain}`;
}

module.exports = { generateTestEmail };
