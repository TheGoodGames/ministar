// === СИСТЕМА УВЕДОМЛЕНИЙ ===
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 3000;
let NOTIFICATION_CONFIG = {
    BOT_TOKEN: '',
    PUBLIC_CHAT_ID: '',
    isEnabled: false
};

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

// Интеграция с основной игрой
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем обработчик для уведомлений
    window.addEventListener('nodeShown', (e) => {
        const node = e.detail.node;
        const nodeId = e.detail.nodeId;
        
        if (node.notify && NOTIFICATION_CONFIG.isEnabled) {
            sendGlobalNotification(nodeId, node.notify);
        }
    });
    
    // Активируем стили для уведомлений
    document.getElementById('notifications-styles').disabled = false;
});