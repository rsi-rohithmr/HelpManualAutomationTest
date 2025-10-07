const QueryExecutor = require('./QueryExecutor');

/**
 * Set active = 0, IsActive = 0, and (optionally) prepare for ExtJson update for the given InternalOrganizationID and RoleName.
 * @param {number} InternalOrganizationID
 * @param {string} RoleName
 * @returns {Promise<void>}
 */
async function DeleteRole(InternalOrganizationID, RoleName) {
	const query = `
        DECLARE @InternalRoleID BIGINT;
        SELECT @InternalRoleID = InternalRoleID FROM dbo.Role WHERE InternalOrganizationID = ${InternalOrganizationID} AND [Name] = '${RoleName}' AND IsActive = 1

        IF (@InternalRoleID IS NOT NULL AND @InternalRoleID > 0)
        BEGIN
            UPDATE dbo.Role	
                SET IsActive = 0
                WHERE (InternalRoleID = @InternalRoleID)

            UPDATE dbo.PractitionerRole SET IsActive = 0 WHERE InternalRoleID = @InternalRoleID;
        END
    `;
	await QueryExecutor.executeQuery(query);
}

module.exports = {
	DeleteRole,
};
