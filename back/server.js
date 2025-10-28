// Importa o framework Express
const express = require('express');

// Cria uma instância do aplicativo Express
const app = express();

// Define a porta em que o servidor irá rodar
// (Usamos 3001 para não conflitar com o front-end, que geralmente usa 3000)
const port = 3001;

// Cria uma rota principal (ex: http://localhost:3001/)
app.get('/', (req, res) => {
  res.send('Olá, mundo! Este é o meu backend.');
});

// Inicia o servidor e fica "escutando" por requisições na porta definida
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});