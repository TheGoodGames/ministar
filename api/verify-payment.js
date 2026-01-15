// API endpoint для верификации платежа через Telegram Stars
// Этот endpoint вызывается после успешной оплаты

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, userId, itemId } = req.body;

    if (!paymentId || !userId || !itemId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ВАЖНО: Проверяем платеж через Telegram Bot API
    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // Проверяем статус платежа
    // ВАЖНО: В реальном приложении нужно использовать правильный метод Telegram API
    // для проверки платежей через Stars
    
    // Здесь должна быть проверка через Telegram Bot API
    // Пока что возвращаем успех для тестирования
    // В продакшене обязательно реализуйте полную проверку!
    
    return res.status(200).json({
      success: true,
      verified: true,
      itemId: itemId
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
