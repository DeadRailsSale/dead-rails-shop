const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const formidable = require('formidable');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/send-review', async (req, res) => {
    const { review, nickname } = req.body;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!review || !nickname) {
        return res.status(400).json({ error: 'Отзыв и ник обязательны' });
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: `Отзыв от ${nickname}: ${review}`
            })
        });
        const data = await response.json();

        if (response.ok && data.ok) {
            res.status(200).json({ message: 'Отзыв отправлен', messageId: data.result.message_id });
        } else {
            res.status(500).json({ error: 'Ошибка отправки в Telegram' });
        }
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/send-review-photo', async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Ошибка обработки формы:', err);
            return res.status(500).json({ error: 'Ошибка обработки формы' });
        }

        const review = fields.review || '';
        const nickname = fields.nickname;
        const photo = files.photo;

        if (!nickname) {
            return res.status(400).json({ error: 'Ник обязателен' });
        }

        if (!photo && !review) {
            return res.status(400).json({ error: 'Фото или текст отзыва обязательны' });
        }

        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        try {
            if (photo) {
                const formData = new FormData();
                formData.append('chat_id', telegramChatId);
                formData.append('caption', `Отзыв от ${nickname}: ${review}`);
                formData.append('photo', fs.createReadStream(photo.path));

                const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendPhoto`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (response.ok && data.ok) {
                    res.status(200).json({ message: 'Отзыв с фото отправлен', messageId: data.result.message_id });
                } else {
                    res.status(500).json({ error: 'Ошибка отправки в Telegram' });
                }
            }
        } catch (error) {
            console.error('Ошибка:', error);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});