const QueryExecutor = require('./QueryExecutor');

/**
 * Utility class for querying user-related data from the database.
 */
class UserQuery {
	/**
	 * Retrieves organizations and roles for a user by internal user ID.
	 * @param {number|string} internalUserID - The internal user ID.
	 * @returns {Promise<Array>} Array of objects with OrganizationName and Role Name.
	 */
	async getUserOrganizationsAndRoles(internalUserID) {
		const sql = `SELECT [dbo].[Organization].OrganizationName, [dbo].[Role].Name
			FROM [dbo].[Organization], [dbo].[Role], [dbo].[PractitionerRole]
			WHERE [dbo].[Role].InternalRoleID = [dbo].[PractitionerRole].InternalRoleID
			AND [dbo].[PractitionerRole].PractitionerID = ${internalUserID}
			AND [dbo].[Organization].InternalOrganizationID = [dbo].[PractitionerRole].OrganizationID
			AND [dbo].[Organization].IsActive = 1`;
		return QueryExecutor.executeQuery(sql);
	}

	/**
	 * Retrieves user(s) from the database by criteria.
	 * @param {object} argObj - An object containing column-value pairs (e.g., { UserName: 'user@example.com' })
	 * @returns {Promise<Array>} Array of user rows matching the criteria.
	 */
	async getInternalUserID(argObj) {
		const searchString = this._generateSqlSearchCriteria(argObj);
		const sql = `SELECT * FROM [dbo].[User] WHERE isActive = 1 ${searchString}`;
		return QueryExecutor.executeQuery(sql);
	}

	/**
	 * Helper to generate SQL search criteria from an object.
	 * @param {object} argObj
	 * @returns {string} SQL search string (e.g., AND [UserName]='foo')
	 */
	_generateSqlSearchCriteria(argObj) {
		if (!argObj || typeof argObj !== 'object') return '';
		return Object.entries(argObj)
			.map(([key, value]) => `AND [${key}] = '${value}'`)
			.join(' ');
	}
}

module.exports = new UserQuery();
