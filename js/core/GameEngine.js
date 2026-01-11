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
        await this.loader.load();

        const container = document.getElementById('game-container');
        this.renderer = new NodeRenderer(container);
        this.renderer.setState(this.state); // Передаём state в renderer

        this.setupEvents();

        let startNode = this.state.getCurrentNode();
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

        // Перерисовка при изменении ключей
        EventBus.on('state:keys-updated', () => {
            const currentNode = this.loader.getNode(this.state.getCurrentNode());
            if (currentNode) {
                this.renderer.render(currentNode);
            }
        });
    }

    goToNode(nodeId) {
        const node = this.loader.getNode(nodeId);
        if (!node) {
            console.error('Node not found:', nodeId);
            return;
        }

        this.state.setCurrentNode(nodeId);
        this.state.markVisited(nodeId);

        if (node.collect) {
            this.handleCollect(node.collect);
        }

        if (node.requires && node.requires.length > 0) {
            const hasAllKeys = node.requires.every(keyId => this.state.hasKey(keyId));

            if (!hasAllKeys) {
                const missing = node.requires.find(keyId => !this.state.hasKey(keyId));
                const message = node.missing_messages?.[missing] || 
                               `Дверь закрыта. Нужен ключ: ${missing}`;

                this.state.addNotification(message, '🔒', `locked_${missing}`);
                EventBus.emit('node:locked', { nodeId, missing });
                return;
            }
        }

        if (node.key) {
            this.state.addKey(node.key);
        }

        this.renderer.render(node);
    }

    handleCollect(collectData) {
        if (!collectData || !collectData.id) return;

        this.state.addKey({
            id: collectData.id,
            label: collectData.label || collectData.id,
            icon: collectData.icon || '🗝️'
        });

        console.log('Collected:', collectData);
    }

    handleChoice(choice) {
        if (choice.collect) {
            this.handleCollect(choice.collect);
        }

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

        if (choice.next) {
            this.goToNode(choice.next);
        }

        if (choice.action) {
            EventBus.emit('choice:action', choice.action);
        }
    }

    reset() {
        this.state.reset();
        this.goToNode('0');
    }
}
