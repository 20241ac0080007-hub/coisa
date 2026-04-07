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
        // Pega a pergunta que veio do corpo da requisição (JSON)
        const { pergunta } = req.body;

        if (!pergunta) {
            return res.status(400).json({ erro: "Você precisa enviar uma 'pergunta' no formato JSON." });
        }

        console.log(`📩 Nova pergunta recebida: "${pergunta}"`);

        // Chama a IA do Google
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const promptFinal = `Você é um robô sarcástico. Responda a seguinte pergunta: ${pergunta}`;
        
        const result = await model.generateContent(promptFinal);
        const respostaDaIA = result.response.text();

        return res.status(200).json({ 
            sucesso: true,
            resposta: respostaDaIA 
        });

    } catch (erro) {
        console.error("❌ Erro no servidor:", erro);
        return res.status(500).json({ erro: "Erro interno no servidor de IA." });
    }
});

// 6. Ligar o Servidor
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}`);
    console.log(`📱 Acesse: http://localhost:${PORTA}`);
});
