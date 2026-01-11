// js/ui/NotificationsUI.js
import { EventBus } from '../utils/eventBus.js';
import { formatTime } from '../utils/helpers.js';

export class NotificationsUI {
    constructor(state) {
        this.state = state;
        this.button = null;
        this.screen = document.getElementById('notifications-screen');
        this.list = document.getElementById('notifications-list');
        this.init();
    }
    
    init() {
        this.createButton();
        EventBus.on('notifications:updated', () => this.updateButton());
        EventBus.on('notification:added', () => this.shake());
        this.updateButton();
    }
    
    createButton() {
        const inventoryBtn = document.querySelector('button[onclick*="showInventory"]');
        if (!inventoryBtn) return;
        this.button = document.createElement('button');
        this.button.id = 'notifications-button';
        this.button.className = 'choice-btn';
        this.button.style.background = '#ff9800';
        this.button.style.marginTop = '10px';
        this.button.onclick = () => this.show();
        inventoryBtn.parentNode.insertBefore(this.button, inventoryBtn.nextSibling);
    }
    
    updateButton() {
        if (!this.button) return;
        const count = this.state.notifications.length;
        if (count > 0) {
            this.button.innerHTML = `🔔 Уведомления <span class="notification-badge">${count}</span>`;
            this.button.style.display = 'inline-block';
        } else {
            this.button.style.display = 'none';
        }
    }
    
    shake() {
        if (this.button) {
            this.button.classList.add('shake');
            setTimeout(() => this.button.classList.remove('shake'), 500);
        }
    }
    
    show() {
        this.screen.style.display = 'block';
        this.render();
    }
    
    close() {
        this.screen.style.display = 'none';
    }
    
    render() {
        const notifications = this.state.notifications;
        if (notifications.length === 0) {
            this.list.innerHTML = '<div class="keys-empty">Нет уведомлений</div>';
            return;
        }
        this.list.innerHTML = notifications.map(n => `
            <div class="notification-item">
                <div class="notification-icon">${n.icon}</div>
                <div class="notification-content">
                    <div>${n.message}</div>
                    <div class="notification-time">${formatTime(n.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }
}
