const QueryExecutor = require('./QueryExecutor');

/**
 * Get organization by InternalOrganizationID (and optionally OrganizationName).
 * @param {number} InternalOrganizationID
 * @param {string|null} OrganizationName
 * @returns {Promise<object|null>}
 */
async function GetOrganization(InternalOrganizationID, OrganizationName = null) {
	let query = `
        SELECT *
        FROM [dbo].[Organization]
        WHERE [InternalOrganizationID] = ${InternalOrganizationID}
    `;
	if (OrganizationName !== null) {
		// Escape single quotes in OrganizationName
		const safeOrgName = OrganizationName.replace(/'/g, "''");
		query += ` AND [OrganizationName] = N'${safeOrgName}'`;
	}
	const result = await QueryExecutor.executeQuery(query);
	return result && result.length > 0 ? result[0] : null;
}

/**
 * Set active = 0, IsActive = 0, and (optionally) prepare for ExtJson update for the given InternalOrganizationID.
 * @param {number} InternalOrganizationID
 * @returns {Promise<void>}
 */
async function DeleteOrganization(InternalOrganizationID) {
	const query = `
        IF EXISTS (SELECT 1 FROM dbo.Organization WHERE InternalOrganizationID = ${InternalOrganizationID})
        BEGIN
            DECLARE @newExtension nvarchar(max), @extJson nvarchar(max);
            SET @newExtension = '{"url":"http://www.ramsoft.com/fhir/extension/needCleanup","valueBoolean":true}';
            SET @extJson = (SELECT ExtJson FROM dbo.Organization WHERE InternalOrganizationID = ${InternalOrganizationID});
            UPDATE dbo.Organization 
            SET active = 0, 
                IsActive = 0, 
                ExtJson = (SELECT JSON_MODIFY(@extJson, 'append $.extension', JSON_QUERY(@newExtension)))
            WHERE InternalOrganizationID = ${InternalOrganizationID};
        END
    `;
	await QueryExecutor.executeQuery(query);
}

module.exports = {
	GetOrganization,
	DeleteOrganization,
};
