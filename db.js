require("dotenv").config();  // load .env

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // required for Neon
  },
});

module.exports = pool;
