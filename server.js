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

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Token não enviado." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido." });
  }
}

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
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        { nome_completo: nome, email, senha: senhaHash, is_admin: false },
      ]);

    if (error) throw error;

    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
////login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  const { data: user, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    return res.status(404).json({ message: "Usuário não encontrado." });
  }

  const senhaValida = await bcrypt.compare(senha, user.senha);
  if (!senhaValida) {
    return res.status(401).json({ message: "Senha incorreta." });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      is_admin: user.is_admin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ token });
});

//ROTA CADASTRO DE PRODUTOS ADMIN
app.post("/produtos", verificarToken, async (req, res) => {
  if (!req.usuario.is_admin)
    return res
      .status(403)
      .json({ message: "Apenas admins podem cadastrar produtos." });

  try {
    const { nome, descricao, preco, estoque, tamanhos, imagem } = req.body;

    const { data, error } = await supabase
      .from("produtos")
      .insert([{ nome, descricao, preco, estoque, tamanhos, imagem }]);

    if (error) throw error;
    res.status(201).json({ message: "Produto cadastrado com sucesso", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/produtos", async (req, res) => {
  try {
    const { data, error } = await supabase.from("produtos").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("produtos").delete().eq("id", id);

    if (error) throw error;

    res.status(200).json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, estoque, tamanhos, imagem } = req.body;

    const { data, error } = await supabase
      .from("produtos")
      .update({ nome, descricao, preco, estoque, tamanhos, imagem })
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ message: "Produto atualizado com sucesso", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exporta o app para o Vercel
module.exports = app;
