// Adicione junto com suas outras importações
const mongoose = require('mongoose');

// Conectando ao Banco de Dados Nuvem
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Conectado ao MongoDB Atlas!'))
  .catch((err) => console.error('❌ Erro no banco:', err));

// Definindo como a mensagem será salva no banco
const MensagemSchema = new mongoose.Schema({
    role: String, // 'user' (usuário) ou 'model' (IA)
    parts: [{ text: String }], // O conteúdo da mensagem
    dataHora: { type: Date, default: Date.now } // Hora exata
});

// Criando a "Tabela" (Collection) baseada no Schema
const Mensagem = mongoose.model('Mensagem', MensagemSchema);
// 1. Importações (Bibliotecas)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Configurações Iniciais do Servidor
const app = express();
const path = require('path');

app.use(express.json()); // Permite que o servidor entenda JSON
app.use(cors()); // Permite que front-ends se conectem sem bloqueio
app.use(express.static(path.join(__dirname, 'frontend'))); // Serve arquivos estáticos

// 3. Configuração da IA
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ ERRO: Variável de ambiente GEMINI_API_KEY não encontrada!');
    console.error('📋 Crie um arquivo .env na raiz do projeto com: GEMINI_API_KEY=sua_chave_aqui');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// 4. Rota para servir o arquivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 5. CRIANDO A ROTA (Endpoint) DA API
// Vamos usar o método POST, pois estamos ENVIANDO uma pergunta para o servidor
app.post('/api/chat', async (req, res) => {
    try {
        const { pergunta } = req.body;
        if (!pergunta) return res.status(400).json({ erro: "Envie uma pergunta." });

        // 1. Salva a pergunta do usuário no Banco de Dados
        await Mensagem.create({ role: "user", parts: [{ text: pergunta }] });

        // 2. Busca o histórico de conversas no Banco (limitado às últimas 20 mensagens)
        // Ocultamos o ID e a data, pois o Gemini só quer saber de 'role' e 'parts'
        const historico = await Mensagem.find()
                                        .select('role parts -_id') 
                                        .sort({ dataHora: 1 })
                                        .limit(20);

        // 3. Inicia o chat do Gemini, ENVIANDO O HISTÓRICO JUNTO!
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: historico // O Gemini lê isso e "lembra" do que conversaram
        });

        // 4. Manda a nova pergunta para a IA
        const result = await chat.sendMessage(pergunta);
        const respostaDaIA = result.response.text();

        // 5. Salva a resposta da IA no Banco de Dados para uso futuro
        await Mensagem.create({ role: "model", parts: [{ text: respostaDaIA }] });

        // 6. Devolve a resposta para o Front-end
        return res.status(200).json({ sucesso: true, resposta: respostaDaIA });

    } catch (erro) {
        console.error("❌ Erro:", erro);
        return res.status(500).json({ erro: "Amnésia do servidor. Erro interno." });
    }
});


// 6. Ligar o Servidor
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}`);
    console.log(`📱 Acesse: http://localhost:${PORTA}`);
});
