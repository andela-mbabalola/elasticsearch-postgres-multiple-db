
// const connectionString = process.env.DATABASE_URL || "postgres://yhemmy@localhost/test_elastic_search";

const { Client } = require('pg')
module.exports = async function(connectionString) {
	const client = new Client({
  	connectionString: connectionString,
	});
 await client.connect()
 return client; 
}
