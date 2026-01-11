// js/utils/eventBus.js - Система событий
class EventBusClass {
    constructor() {
        this.events = {};
    }

    /**
     * Подписаться на событие
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        // Возвращаем функцию отписки
        return () => this.off(event, callback);
    }

    /**
     * Отписаться от события
     */
    off(event, callback) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Вызвать событие
     */
    emit(event, data) {
        if (!this.events[event]) return;

        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`EventBus error in ${event}:`, e);
            }
        });
    }

    /**
     * Подписаться на событие один раз
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };

        this.on(event, wrapper);
    }
}

export const EventBus = new EventBusClass();