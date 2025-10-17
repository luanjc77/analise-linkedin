
const express = require('express');
const cors = require('cors');

const app = express();

const PORT = 3001; 


app.use(cors()); 
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('API do Analisador de Perfis está no ar!');
});


app.post('/analisar', (req, res) => {
  console.log('Dados recebidos do front-end:');
  console.log(req.body); 


  res.json({
    message: 'Dados recebidos com sucesso! A análise começará em breve.',
    data: req.body
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});