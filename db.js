// db.js (Conexão com o banco Supabase)
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false } // Necessário para conexões externas
});

pool.connect()
  .then(() => console.log("Conectado ao Supabase PostgreSQL!"))
  .catch(err => console.error("Erro ao conectar ao banco:", err));

module.exports = pool;