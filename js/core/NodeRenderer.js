// js/core/NodeRenderer.js
import { EventBus } from '../utils/eventBus.js';

export class NodeRenderer {
    constructor(container) {
        this.container = container;
        this.textElement = null;
        this.choicesElement = null;
        this.state = null; // Будет установлен из GameEngine
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

    setState(state) {
        this.state = state;
    }

    render(node) {
        this.textElement.textContent = node.text || '';
        this.renderChoices(node.choices || []);
        EventBus.emit('node:rendered', node);
    }

    renderChoices(choices) {
        this.choicesElement.innerHTML = '';

        choices.forEach((choice, index) => {
            // Проверка hide_until_unlocked
            if (choice.hide_until_unlocked && choice.requires && this.state) {
                const hasAllKeys = choice.requires.every(keyId => this.state.hasKey(keyId));
                if (!hasAllKeys) {
                    // Не показываем кнопку
                    return;
                }
            }

            const btn = document.createElement('button');
            btn.className = 'choice-btn fade-in';
            btn.textContent = choice.text;
            btn.style.animationDelay = `${index * 0.1}s`;

            // Проверка requires для отключения кнопки
            if (choice.requires && this.state) {
                const hasAllKeys = choice.requires.every(keyId => this.state.hasKey(keyId));
                if (!hasAllKeys && !choice.hide_until_unlocked) {
                    btn.disabled = true;
                    btn.title = 'Недостаточно ключей';
                }
            }

            if (choice.disabled) {
                btn.disabled = true;
            }

            btn.onclick = () => {
                EventBus.emit('choice:selected', choice);
            };

            this.choicesElement.appendChild(btn);
        });
    }

    clear() {
        this.textElement.textContent = '';
        this.choicesElement.innerHTML = '';
    }
}
