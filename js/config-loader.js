// === ЗАГРУЗКА КОНФИГУРАЦИИ ===
let NOTIFICATION_CONFIG = {
    BOT_TOKEN: '',
    PUBLIC_CHAT_ID: '',
    isEnabled: false
};
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 3000;

async function loadNotificationConfig() {
    try {
        console.log('🔍 Загрузка конфигурации уведомлений...');
        
        // Проверяем, что DOM уже загружен
        if (!document.getElementById('scene')) {
            console.log('⏳ DOM еще не загружен, откладываем загрузку конфигурации');
            return new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', async () => {
                    await loadNotificationConfig();
                    resolve();
                });
            });
        }

        // Сначала пытаемся загрузить config.js
        const configScript = document.createElement('script');
        configScript.src = 'config.js?v=' + Date.now();
        configScript.async = false;
        
        return new Promise((resolve) => {
            configScript.onload = () => {
                console.log('✅ config.js успешно загружен');
                
                // Проверяем глобальные переменные
                if (window.GAME_CONFIG?.BOT_TOKEN && window.GAME_CONFIG?.PUBLIC_CHAT_ID) {
                    NOTIFICATION_CONFIG = {
                        BOT_TOKEN: window.GAME_CONFIG.BOT_TOKEN,
                        PUBLIC_CHAT_ID: window.GAME_CONFIG.PUBLIC_CHAT_ID,
                        isEnabled: true
                    };
                    console.log('🔔 Конфигурация загружена из config.js');
                } else {
                    // Пытаемся получить из URL параметров (для тестирования)
                    const urlParams = new URLSearchParams(window.location.search);
                    const botToken = urlParams.get('bot_token');
                    const chatId = urlParams.get('chat_id');
                    
                    if (botToken && chatId) {
                        NOTIFICATION_CONFIG = {
                            BOT_TOKEN: botToken,
                            PUBLIC_CHAT_ID: chatId,
                            isEnabled: true
                        };
                        console.log('🔔 Конфигурация загружена из URL параметров');
                    } else {
                        console.log('🔔 Конфигурация не найдена, уведомления отключены');
                        NOTIFICATION_CONFIG.isEnabled = false;
                    }
                }
                resolve();
            };
            
            configScript.onerror = () => {
                console.log('🔔 config.js не найден, используем настройки по умолчанию');
                NOTIFICATION_CONFIG.isEnabled = false;
                resolve();
            };
            
            document.head.appendChild(configScript);
        });
    } catch (e) {
        console.error('🔔 Ошибка загрузки конфигурации:', e);
        NOTIFICATION_CONFIG.isEnabled = false;
    }
}

async function sendGlobalNotification(nodeId, notifyData) {
    if (!NOTIFICATION_CONFIG.isEnabled || 
        !NOTIFICATION_CONFIG.BOT_TOKEN || 
        !NOTIFICATION_CONFIG.PUBLIC_CHAT_ID) {
        console.log('🔔 Уведомления отключены или конфигурация не загружена');
        return;
    }
    
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) {
        console.log('🔔 Невалидные данные Telegram');
        return;
    }
    
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        console.log('🔔 Уведомление отклонено: кулдаун');
        return;
    }
    
    const notifiedKey = `notified_${nodeId}_${tg.initDataUnsafe?.user?.id}`;
    if (localStorage.getItem(notifiedKey)) {
        console.log('🔔 Уведомление отклонено: дубликат');
        return;
    }
    
    lastNotificationTime = now;
    
    try {
        const user = tg.initDataUnsafe?.user || {};
        const playerName = user.username 
            ? `@${user.username}` 
            : user.first_name || 'Игрок';
        
        const message = `
🔔 Новое достижение в игре!
👤 ${playerName} дошёл до: ${notifyData.message}
🎮 Прогресс: ${nodeId}
        `.trim();
        
        console.log('📤 Отправка уведомления:', message);
        
        const response = await fetch(`https://api.telegram.org/bot${NOTIFICATION_CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: NOTIFICATION_CONFIG.PUBLIC_CHAT_ID,
                text: message,
                disable_web_page_preview: true
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Уведомление успешно отправлено');
            localStorage.setItem(notifiedKey, 'true');
        } else {
            console.error('❌ Ошибка Telegram API:', result);
            lastNotificationTime = 0;
        }
    } catch (e) {
        console.error('❌ Ошибка отправки уведомления:', e);
        lastNotificationTime = 0;
    }
}

function validateInitData(initData) {
    if (!initData) return false;
    
    // Проверяем наличие обязательных параметров
    const params = new URLSearchParams(initData);
    const hasUser = params.has('user');
    const hasAuthDate = params.has('auth_date');
    
    if (!hasUser || !hasAuthDate) return false;
    
    // Проверяем актуальность данных (24 часа)
    const authDate = parseInt(params.get('auth_date')) * 1000;
    const now = Date.now();
    return (now - authDate) < 86400000; // 24 часа в миллисекундах
}

// Инициализация конфигурации после полной загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚙️ Инициализация конфигурации...');
    await loadNotificationConfig();
    console.log('✅ Конфигурация инициализирована:', NOTIFICATION_CONFIG);
    
    // Регистрируем глобальные функции
    window.sendGlobalNotification = sendGlobalNotification;
    window.NOTIFICATION_CONFIG = NOTIFICATION_CONFIG;
    
    // Добавляем обработчик для уведомлений
    document.addEventListener('nodeShown', (e) => {
        const node = e.detail.node;
        const nodeId = e.detail.nodeId;
        
        if (node.notify && NOTIFICATION_CONFIG.isEnabled) {
            sendGlobalNotification(nodeId, node.notify);
        }
    });
});
