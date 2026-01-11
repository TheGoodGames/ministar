// js/main.js - Точка входа
import { GameEngine } from './core/GameEngine.js';
import { InventoryUI } from './ui/InventoryUI.js';
import { NotificationsUI } from './ui/NotificationsUI.js';
import { MapUI } from './ui/MapUI.js';

window.game = null;
window.inventoryUI = null;
window.notificationsUI = null;
window.mapUI = null;

async function init() {
    try {
        window.game = new GameEngine();
        await window.game.init();
        window.inventoryUI = new InventoryUI(window.game.state);
        window.notificationsUI = new NotificationsUI(window.game.state);
        window.mapUI = new MapUI(window.game.state, window.game.loader, window.game);
        console.log('✅ Game initialized');
    } catch (e) {
        console.error('❌ Init error:', e);
        document.body.innerHTML = '<h1>Ошибка загрузки</h1>';
    }
}

window.showInventory = () => window.inventoryUI?.show();
window.closeInventory = () => window.inventoryUI?.close();
window.showNotifications = () => window.notificationsUI?.show();
window.closeNotifications = () => window.notificationsUI?.close();
window.showMap = () => window.mapUI?.show();
window.closeMap = () => window.mapUI?.close();
window.resetProgress = () => {
    if (confirm('Сбросить прогресс?')) window.game?.reset();
};

document.addEventListener('DOMContentLoaded', init);
