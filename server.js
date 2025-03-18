const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas de exemplo
app.get("/", (req, res) => {
  res.send("API rodando no Vercel!");
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Exporta o app para o Vercel
module.exports = app;
