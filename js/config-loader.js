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
                    console.log('🔔 Конфигурация не найдена, уведомления отключены');
                    NOTIFICATION_CONFIG.isEnabled = false;
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

// Инициализация конфигурации после полной загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚙️ Инициализация конфигурации...');
    await loadNotificationConfig();
    console.log('✅ Конфигурация инициализирована:', NOTIFICATION_CONFIG);
    
    // Регистрируем глобальные функции
    window.NOTIFICATION_CONFIG = NOTIFICATION_CONFIG;
});
