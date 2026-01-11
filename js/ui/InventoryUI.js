// js/ui/InventoryUI.js
import { EventBus } from '../utils/eventBus.js';

export class InventoryUI {
    constructor(state) {
        this.state = state;
        this.screen = document.getElementById('inventory-screen');
        this.list = document.getElementById('keys-list');
        EventBus.on('state:keys-updated', () => {
            if (this.screen.style.display === 'block') this.render();
        });
    }
    
    show() {
        this.screen.style.display = 'block';
        this.render();
    }
    
    close() {
        this.screen.style.display = 'none';
    }
    
    render() {
        const keys = this.state.getAllKeys();
        if (keys.length === 0) {
            this.list.innerHTML = '<div class="keys-empty">Нет собранных ключей</div>';
            return;
        }
        this.list.innerHTML = keys.map(k => `
            <div class="key-item">
                <div class="key-icon">🗝️</div>
                <div class="key-label">${k.label}</div>
            </div>
        `).join('');
    }
}
