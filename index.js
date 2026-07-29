const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());

// Usa memoryStorage para segurar a foto temporariamente na memória
const upload = multer({ storage: multer.memoryStorage() });

// Responde ao "Ping" do MDT
app.get('*', (req, res) => {
    res.json({ status: 'ok', online: true, message: 'API Online!' });
});

// Aceita QUALQUER nome de campo que o painel envie ('image', 'file', 'photo', etc.)
app.post('/upload', upload.any(), async (req, res) => {
    try {
        // Pega o arquivo independentemente de como o painel o nomeou
        const file = (req.files && req.files[0]) ? req.files[0] : req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo de imagem foi encontrado na requisição.' });
        }
        
        const form = new FormData();
        form.append('file', file.buffer, file.originalname || 'upload.png');

        const webhookUrl = (process.env.DISCORD_WEBHOOK || '') + '?wait=true';
        if (!process.env.DISCORD_WEBHOOK) {
            return res.status(500).json({ error: 'Variável DISCORD_WEBHOOK não configurada no Render.' });
        }

        const discordRes = await axios.post(webhookUrl, form, {
            headers: { ...form.getHeaders() }
        });

        // Extrai com segurança o link da imagem retornado pelo Discord
        if (discordRes.data && discordRes.data.attachments && discordRes.data.attachments.length > 0) {
            return res.json({ url: discordRes.data.attachments[0].url });
        } else if (discordRes.data && discordRes.data.url) {
            return res.json({ url: discordRes.data.url });
        } else {
            return res.status(500).json({ error: 'O Discord não retornou o link do anexo.' });
        }
    } catch (error) {
        console.error('Erro no upload:', error.message);
        return res.status(500).json({ error: 'Erro interno ao processar upload.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Rodando na porta ${PORT}!`));
