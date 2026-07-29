const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
        
        const form = new FormData();
        form.append('file', req.file.buffer, req.file.originalname || 'upload.png');

        // Adiciona ?wait=true para o Discord confirmar o recebimento e devolver o link
        const webhookUrl = process.env.DISCORD_WEBHOOK + '?wait=true';

        const discordRes = await axios.post(webhookUrl, form, {
            headers: { ...form.getHeaders() }
        });

        if (discordRes.data && discordRes.data.attachments && discordRes.data.attachments.length > 0) {
            // Devolve exatamente no formato que o painel do seu MDT exige
            res.json({ url: discordRes.data.attachments[0].url });
        } else {
            res.status(500).json({ error: 'Erro ao pegar URL do Discord' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro interno da API' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Rodando na porta ${PORT}!`));
