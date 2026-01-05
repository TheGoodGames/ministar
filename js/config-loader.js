// === ЗАГРУЗКА КОНФИГУРАЦИИ ===
async function loadNotificationConfig() {
    try {
        const configScript = document.createElement('script');
        configScript.src = 'config.js?v=' + Date.now();
        configScript.async = false;
        document.head.appendChild(configScript);
        
        await new Promise((resolve) => {
            configScript.onload = resolve;
            configScript.onerror = () => {
                console.log('🔔 config.js не найден, используем настройки по умолчанию');
                resolve();
            };
        });
        
        if (window.GAME_CONFIG?.BOT_TOKEN && window.GAME_CONFIG?.PUBLIC_CHAT_ID) {
            NOTIFICATION_CONFIG = {
                BOT_TOKEN: window.GAME_CONFIG.BOT_TOKEN,
                PUBLIC_CHAT_ID: window.GAME_CONFIG.PUBLIC_CHAT_ID,
                isEnabled: true
            };
            console.log('🔔 Конфигурация загружена из config.js');
        } else {
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
    } catch (e) {
        console.error('🔔 Ошибка загрузки конфигурации:', e);
        NOTIFICATION_CONFIG.isEnabled = false;
    }
}

// Событие для интеграции модулей
document.addEventListener('nodeShown', (e) => {
    const node = e.detail.node;
    const nodeId = e.detail.nodeId;
    const element = e.detail.element;
    
    // Для уведомлений
    if (node.notify) {
        const notificationBanner = document.createElement('div');
        notificationBanner.className = 'notification-banner';
        notificationBanner.innerHTML = `
            <button class="close-btn" onclick="this.parentElement.style.display='none'; localStorage.setItem('banner_hidden', 'true')">×</button>
            <p>🔔 Следите за прогрессом всех игроков в нашем канале: 
            <a href="https://t.me/game_notifications" target="_blank">@game_notifications</a></p>
        `;
        
        if (!localStorage.getItem('banner_hidden')) {
            element.insertBefore(notificationBanner, element.firstChild);
        }
    }
    
    // Для карты (новые локации)
    if (node.is_location && !isLocationVisited(nodeId)) {
        const newLocationBanner = document.createElement('div');
        newLocationBanner.style.background = 'rgba(76, 175, 80, 0.2)';
        newLocationBanner.style.borderLeft = '3px solid var(--success)';
        newLocationBanner.style.padding = '12px';
        newLocationBanner.style.borderRadius = '0 8px 8px 0';
        newLocationBanner.style.margin = '15px 0';
        newLocationBanner.style.fontSize = '15px';
        newLocationBanner.style.position = 'relative';
        newLocationBanner.innerHTML = `
            <button style="position: absolute; right: 8px; top: 8px; background: rgba(255,255,255,0.1); border: none; width: 20px; height: 20px; border-radius: 50%; color: white; font-size: 12px; cursor: pointer;" onclick="localStorage.setItem('hide_map_tutorial', 'true'); this.parentElement.style.display='none'">×</button>
            <p>🗺️ <strong>Новая локация открыта!</strong> Нажмите иконку карты 🗺️, чтобы вернуться сюда позже.</p>
        `;
        
        if (!localStorage.getItem('hide_map_tutorial')) {
            element.appendChild(newLocationBanner);
        }
    }
});

// Запускаем загрузку конфигурации
document.addEventListener('DOMContentLoaded', () => {
    loadNotificationConfig();
});