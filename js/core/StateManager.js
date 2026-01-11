// js/core/StateManager.js - Управление состоянием игры
import { Storage } from '../utils/storage.js';
import { EventBus } from '../utils/eventBus.js';
import { CONFIG } from '../config.js';

export class StateManager {
    constructor() {
        this.currentNodeId = null;
        this.keys = this.loadKeys();
        this.visitedNodes = this.loadVisited();
        this.notifications = this.loadNotifications();
    }

    // === КЛЮЧИ ===
    loadKeys() {
        return Storage.get(CONFIG.STORAGE_KEYS.KEYS, {});
    }

    saveKeys() {
        Storage.set(CONFIG.STORAGE_KEYS.KEYS, this.keys);
        EventBus.emit('state:keys-updated', this.keys);
    }

    addKey(keyData) {
        if (!keyData || !keyData.id) return false;

        this.keys[keyData.id] = {
            label: keyData.label,
            timestamp: Date.now()
        };

        this.saveKeys();
        EventBus.emit('key:collected', keyData);
        return true;
    }

    hasKey(keyId) {
        return !!this.keys[keyId];
    }

    getAllKeys() {
        return Object.entries(this.keys).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    // === ПОСЕЩЁННЫЕ УЗЛЫ ===
    loadVisited() {
        return Storage.get(CONFIG.STORAGE_KEYS.VISITED, []);
    }

    markVisited(nodeId) {
        if (!this.visitedNodes.includes(nodeId)) {
            this.visitedNodes.push(nodeId);
            Storage.set(CONFIG.STORAGE_KEYS.VISITED, this.visitedNodes);
            EventBus.emit('node:visited', nodeId);
        }
    }

    isVisited(nodeId) {
        return this.visitedNodes.includes(nodeId);
    }

    // === ТЕКУЩИЙ УЗЕЛ ===
    setCurrentNode(nodeId) {
        this.currentNodeId = nodeId;
        Storage.set(CONFIG.STORAGE_KEYS.LAST_NODE, nodeId);
        EventBus.emit('node:changed', nodeId);
    }

    getCurrentNode() {
        return this.currentNodeId || Storage.get(CONFIG.STORAGE_KEYS.LAST_NODE, 'start');
    }

    // === УВЕДОМЛЕНИЯ ===
    loadNotifications() {
        return Storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []);
    }

    saveNotifications() {
        Storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, this.notifications);
        EventBus.emit('notifications:updated', this.notifications);
    }

    addNotification(message, icon, id) {
        const cleanMsg = message.replace(/[^а-яА-Яa-zA-Z0-9]/g, '').substring(0, 30);
        const notifId = id || ('notif_' + cleanMsg);

        // Проверка на дубликаты
        if (this.notifications.some(n => n.id === notifId)) {
            return false;
        }

        this.notifications.push({
            id: notifId,
            message,
            icon: icon || '🔔',
            timestamp: Date.now()
        });

        this.saveNotifications();
        EventBus.emit('notification:added', { message, icon });
        return true;
    }

    clearNotifications() {
        this.notifications = [];
        this.saveNotifications();
    }

    // === СБРОС ===
    reset() {
        this.keys = {};
        this.visitedNodes = [];
        this.notifications = [];
        this.currentNodeId = null;

        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            Storage.remove(key);
        });

        EventBus.emit('state:reset');
    }
}