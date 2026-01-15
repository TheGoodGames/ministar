// API endpoint для отправки уведомлений в Telegram
// Использует переменные окружения Vercel: BOT_TOKEN и PUBLIC_CHAT_ID

module.exports = async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, nodeId, playerName } = req.body;

    // Проверяем наличие обязательных полей
    if (!message || !nodeId) {
      return res.status(400).json({ error: 'Missing required fields: message, nodeId' });
    }

    // Получаем токен бота и ID чата из переменных окружения Vercel
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const PUBLIC_CHAT_ID = process.env.PUBLIC_CHAT_ID;

    if (!BOT_TOKEN || !PUBLIC_CHAT_ID) {
      console.error('BOT_TOKEN or PUBLIC_CHAT_ID not configured in Vercel');
      return res.status(500).json({ error: 'Bot configuration not found' });
    }

    // Формируем сообщение для Telegram
    const telegramMessage = `
🔔 Новое достижение в игре!
👤 ${playerName || 'Игрок'} дошёл до: ${message}
🎮 Прогресс: ${nodeId}
`.trim();

    // Отправляем сообщение в Telegram через Bot API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: PUBLIC_CHAT_ID,
        text: telegramMessage,
        disable_web_page_preview: true,
        disable_notification: false
      })
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Telegram API error:', errorData);
      return res.status(500).json({ error: 'Failed to send notification to Telegram' });
    }

    const telegramData = await telegramResponse.json();
    
    // Возвращаем успешный ответ
    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      telegramResponse: telegramData
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
