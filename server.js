const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Rota de teste
app.get("/usuarios", async (req, res) => {
  try {
    const { data, error } = await supabase.from("usuarios").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota principal
app.get("/", (req, res) => {
  res.send("API rodando no Vercel!");
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

app.post("/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se o e-mail já está cadastrado
    const { data: existingUser, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "E-mail já cadastrado!" });
    }

    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // Inserir usuário no Supabase
    const { data, error } = await supabase.from("usuarios").insert([
      { nome_completo: nome, email, senha: senhaHash, is_admin: false },
    ]);

    if (error) throw error;

    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/produtos', async (req, res) => {
  try {
      const { nome, descricao, preco, estoque, tamanhos, imagem } = req.body;
      
      const { data, error } = await supabase
          .from('produtos')
          .insert([{ nome, descricao, preco, estoque, tamanhos, imagem }]);
      
      if (error) throw error;
      res.status(201).json({ message: 'Produto cadastrado com sucesso', data });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get('/produtos', async (req, res) => {
  try {
      const { data, error } = await supabase.from('produtos').select('*');
      if (error) throw error;
      res.status(200).json(data);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Exporta o app para o Vercel
module.exports = app;