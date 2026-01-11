// js/core/NodeRenderer.js
import { EventBus } from '../utils/eventBus.js';

export class NodeRenderer {
    constructor(container) {
        this.container = container;
        this.textElement = null;
        this.choicesElement = null;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div id="scene">
                <div id="text"></div>
                <div id="choices"></div>
            </div>
        `;
        this.textElement = this.container.querySelector('#text');
        this.choicesElement = this.container.querySelector('#choices');
    }
    
    render(node) {
        this.textElement.textContent = node.text || '';
        this.renderChoices(node.choices || []);
        EventBus.emit('node:rendered', node);
    }
    
    renderChoices(choices) {
        this.choicesElement.innerHTML = '';
        choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn fade-in';
            btn.textContent = choice.text;
            btn.style.animationDelay = `${index * 0.1}s`;
            if (choice.disabled) btn.disabled = true;
            btn.onclick = () => EventBus.emit('choice:selected', choice);
            this.choicesElement.appendChild(btn);
        });
    }
}
