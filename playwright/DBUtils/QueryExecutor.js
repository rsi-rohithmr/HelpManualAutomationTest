const msrestAzure = require('ms-rest-azure');
const { Connection, Request } = require('tedious');
const configs = require('../../playwright.config');
const util = require('util');

// Helper to get Azure AD access token
async function getDbAccessToken() {
	const databaseCredentials = await msrestAzure.loginWithServicePrincipalSecret(
		configs.db.clientId,
		configs.db.clientSecret,
		configs.db.tenantId,
		{
			tokenAudience: 'https://database.windows.net/',
		}
	);

	const getTokenAsync = util.promisify(databaseCredentials.getToken.bind(databaseCredentials));
	const results = await getTokenAsync();
	return results.accessToken;
}

// Define database config template
function getDbConfig(token) {
	return {
		server: configs.db.dbServer,
		authentication: {
			type: 'azure-active-directory-access-token',
			options: { token },
		},
		options: {
			trustServerCertificate: false,
			debug: {
				packet: true,
				data: true,
				payload: true,
				token: false,
				log: true,
			},
			database: configs.db.dbName,
			encrypt: true,
			packetSize: 16368,
			rowCollectionOnRequestCompletion: true,
		},
	};
}

class QueryExecutor {
	static async executeQuery(sql) {
		const token = await getDbAccessToken();
		const dbConfig = getDbConfig(token);

		return new Promise((resolve, reject) => {
			const connection = new Connection(dbConfig);

			connection.on('error', err => {
				connection.close();
				reject(err);
			});

			connection.connect(err => {
				if (err) {
					connection.close();
					return reject(err);
				}
				const request = new Request(sql, (err, rowCount, rows) => {
					connection.close();
					if (err) return reject(err);

					const result = rows.map(row => {
						const obj = {};
						row.forEach(col => {
							obj[col.metadata.colName] = col.value;
						});
						return obj;
					});
					resolve(result);
				});
				connection.execSql(request);
			});
		});
	}
}

module.exports = QueryExecutor;
