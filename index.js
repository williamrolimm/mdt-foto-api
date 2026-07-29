const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

app.get('*', (req, res) => {
    res.json({ status: 'ok', online: true });
});

app.post('/upload', upload.any(), async (req, res) => {
    try {
        const file = (req.files && req.files[0]) ? req.files[0] : req.file;
        if (!file) return res.status(400).send('Nenhum arquivo enviado.');
        
        const form = new FormData();
        form.append('file', file.buffer, file.originalname || 'upload.png');

        const webhookUrl = (process.env.DISCORD_WEBHOOK || '') + '?wait=true';
        if (!process.env.DISCORD_WEBHOOK) {
            return res.status(500).send('Webhook não configurado.');
        }

        const discordRes = await axios.post(webhookUrl, form, {
            headers: { ...form.getHeaders() }
        });

        let imageUrl = '';
        if (discordRes.data && discordRes.data.attachments && discordRes.data.attachments.length > 0) {
            imageUrl = discordRes.data.attachments[0].url;
        } else if (discordRes.data && discordRes.data.url) {
            imageUrl = discordRes.data.url;
        }

        if (!imageUrl) {
            return res.status(500).send('URL do Discord vazia.');
        }

        // DEVOLVE A URL DIRETAMENTE COMO TEXTO PURO QUE O MDT ESPERA
        res.setHeader('Content-Type', 'text/plain');
        return res.send(imageUrl);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
