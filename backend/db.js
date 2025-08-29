const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

require('dotenv').config({ path: __dirname + `/../../${envFile}` });

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

module.exports = { getConnection };
