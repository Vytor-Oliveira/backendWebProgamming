const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

// Middleware de verificação de token e admin
function verificarTokenAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido" });
    if (!decoded.is_admin) return res.status(403).json({ message: "Acesso negado. Apenas administradores." });

    req.user = decoded;
    next();
  });
}

// Rota principal
app.get("/", (req, res) => {
  res.send("API rodando no Vercel!");
});

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

// Cadastro de usuário
app.post("/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const { data: existingUser, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "E-mail já cadastrado!" });
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const { data, error } = await supabase.from("usuarios").insert([
      { nome_completo: nome, email, senha: senhaHash, is_admin: false },
    ]);

    if (error) throw error;

    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login com JWT
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !usuario) return res.status(400).json({ message: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ message: "Senha incorreta" });

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        is_admin: usuario.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token, is_admin: usuario.is_admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota protegida (exemplo)
app.get("/admin/protegida", verificarTokenAdmin, (req, res) => {
  res.json({ message: "Bem-vindo, administrador!", user: req.user });
});

// CRUD de produtos
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

app.delete('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, estoque, tamanhos, imagem } = req.body;

    const { data, error } = await supabase
      .from('produtos')
      .update({ nome, descricao, preco, estoque, tamanhos, imagem })
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Produto atualizado com sucesso', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exporta o app para o Vercel
module.exports = app;
