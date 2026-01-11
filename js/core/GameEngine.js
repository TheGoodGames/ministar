// js/core/GameEngine.js
import { StoryLoader } from './StoryLoader.js';
import { StateManager } from './StateManager.js';
import { NodeRenderer } from './NodeRenderer.js';
import { EventBus } from '../utils/eventBus.js';

export class GameEngine {
    constructor() {
        this.loader = new StoryLoader();
        this.state = new StateManager();
        this.renderer = null;
    }

    async init() {
        // Загрузка истории
        await this.loader.load();

        // Инициализация рендерера
        const container = document.getElementById('game-container');
        this.renderer = new NodeRenderer(container);

        // Подписка на события
        this.setupEvents();

        // Загрузка последнего узла или стартового "0"
        let startNode = this.state.getCurrentNode();

        // Если нет сохранённого узла или он "start", используем "0"
        if (!startNode || startNode === 'start') {
            startNode = '0';
        }

        this.goToNode(startNode);

        EventBus.emit('game:initialized');
        console.log('✅ Game engine initialized');
    }

    setupEvents() {
        EventBus.on('choice:selected', (choice) => {
            this.handleChoice(choice);
        });

        EventBus.on('key:collected', (keyData) => {
            console.log('Key collected:', keyData);
        });
    }

    goToNode(nodeId) {
        const node = this.loader.getNode(nodeId);
        if (!node) {
            console.error('Node not found:', nodeId);
            return;
        }

        // Обновление состояния
        this.state.setCurrentNode(nodeId);
        this.state.markVisited(nodeId);

        // Обработка collect (получение ключей)
        if (node.collect) {
            this.handleCollect(node.collect);
        }

        // Обработка requires (проверка ключей)
        if (node.requires && node.requires.length > 0) {
            const hasAllKeys = node.requires.every(keyId => this.state.hasKey(keyId));

            if (!hasAllKeys) {
                const missing = node.requires.find(keyId => !this.state.hasKey(keyId));
                const message = node.missing_messages?.[missing] || 
                               `Дверь закрыта. Нужен ключ: ${missing}`;

                this.state.addNotification(message, '🔒', `locked_${missing}`);

                // Не переходим на узел, показываем уведомление
                EventBus.emit('node:locked', { nodeId, missing });
                return;
            }
        }

        // Обработка получения ключа из node.key (старая система)
        if (node.key) {
            this.state.addKey(node.key);
        }

        // Отрисовка
        this.renderer.render(node);
    }

    handleCollect(collectData) {
        if (!collectData || !collectData.id) return;

        // Добавляем как ключ
        this.state.addKey({
            id: collectData.id,
            label: collectData.label || collectData.id,
            icon: collectData.icon || '🗝️'
        });

        console.log('Collected:', collectData);
    }

    handleChoice(choice) {
        // Обработка collect в выборе
        if (choice.collect) {
            this.handleCollect(choice.collect);
        }

        // Проверка requires в выборе
        if (choice.requires && choice.requires.length > 0) {
            const hasAllKeys = choice.requires.every(keyId => this.state.hasKey(keyId));

            if (!hasAllKeys) {
                const missing = choice.requires.find(keyId => !this.state.hasKey(keyId));
                const message = choice.missing_messages?.[missing] || 
                               `Нужен ключ: ${missing}`;

                this.state.addNotification(message, '🔒', `choice_locked_${missing}`);
                return;
            }
        }

        // Переход на следующий узел
        if (choice.next) {
            this.goToNode(choice.next);
        }

        // Дополнительные действия
        if (choice.action) {
            EventBus.emit('choice:action', choice.action);
        }
    }

    reset() {
        this.state.reset();
        this.goToNode('0'); // Начинаем с узла "0"
    }
}
