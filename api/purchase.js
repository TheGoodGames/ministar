// API endpoint для покупки через Telegram Stars
// ВАЖНО: Этот файл должен быть в папке /api/ для работы на Vercel

module.exports = async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId, userId, initData } = req.body;

    // Проверяем наличие обязательных полей
    if (!itemId || !userId || !initData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ВАЖНО: Проверяем подпись initData от Telegram
    // Это необходимо для безопасности
    const isValid = validateTelegramWebAppData(initData);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Определяем цену товара
    const prices = {
      insurance: 50 // 50 звёзд за страховку
    };

    const price = prices[itemId];
    if (!price) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Создаём invoice через Telegram Bot API
    // ВАЖНО: Нужен BOT_TOKEN из переменных окружения Vercel
    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // Создаём invoice через Telegram Bot API
    const invoiceResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: getItemTitle(itemId),
        description: getItemDescription(itemId),
        payload: JSON.stringify({ itemId, userId }),
        provider_token: '', // Для Stars не нужен
        currency: 'XTR', // Telegram Stars
        prices: [{
          label: getItemTitle(itemId),
          amount: price * 100 // В центах (100 = 1 звезда)
        }]
      })
    });

    if (!invoiceResponse.ok) {
      const errorData = await invoiceResponse.json();
      console.error('Telegram API error:', errorData);
      return res.status(500).json({ error: 'Failed to create invoice' });
    }

    const invoiceData = await invoiceResponse.json();
    
    // Возвращаем ссылку на invoice
    return res.status(200).json({
      success: true,
      invoiceUrl: invoiceData.result || invoiceData.invoice_url
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция для проверки подписи Telegram Web App Data
function validateTelegramWebAppData(initData) {
  // ВАЖНО: Реализуйте проверку подписи согласно документации Telegram
  // https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
  // Для упрощения здесь базовая проверка, но в продакшене нужна полная валидация
  
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    // Здесь должна быть проверка подписи с использованием BOT_TOKEN
    // Пока что возвращаем true для тестирования
    // В продакшене обязательно реализуйте полную проверку!
    return true; // TODO: Реализовать полную проверку подписи
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// Вспомогательные функции
function getItemTitle(itemId) {
  const titles = {
    insurance: '🛡️ Страховая защита'
  };
  return titles[itemId] || 'Товар';
}

function getItemDescription(itemId) {
  const descriptions = {
    insurance: 'Восстановите весь инвентарь после посещения госпиталя. Страховка действует один раз.'
  };
  return descriptions[itemId] || 'Описание товара';
}
