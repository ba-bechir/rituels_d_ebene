// backend/config.js
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

require('dotenv').config({ path: `${__dirname}/${envFile}` });

module.exports = {
  PORT: process.env.PORT || 3001,
  SECRET_JWT: process.env.SECRET_JWT,
  DB_URL: process.env.DB_URL,
};
