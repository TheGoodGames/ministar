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
        this.setupEvents();
        this.goToNode(this.state.getCurrentNode());
        EventBus.emit('game:initialized');
    }
    
    setupEvents() {
        EventBus.on('choice:selected', (choice) => this.handleChoice(choice));
    }
    
    goToNode(nodeId) {
        const node = this.loader.getNode(nodeId);
        if (!node) return;
        
        this.state.setCurrentNode(nodeId);
        this.state.markVisited(nodeId);
        
        if (node.requiresKey && !this.state.hasKey(node.requiresKey)) {
            const msg = `Дверь закрыта. Нужен ключ: ${node.requiresKey}`;
            this.state.addNotification(msg, '🔒', `locked_${node.requiresKey}`);
            return;
        }
        
        if (node.key) this.state.addKey(node.key);
        this.renderer.render(node);
    }
    
    handleChoice(choice) {
        if (choice.next) this.goToNode(choice.next);
    }
    
    reset() {
        this.state.reset();
        this.goToNode('start');
    }
}
