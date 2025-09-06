require("dotenv").config();
const pool = require("./db");

(async () => {
  try {
    const res = await pool.query('SELECT * FROM public.admin;');
    console.log(res.rows);
  } catch (err) {
    console.error("DB Error:", err);
  }
})();
