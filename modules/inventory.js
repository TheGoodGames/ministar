// === СИСТЕМА ИНВЕНТАРЯ ===
const inventoryScreen = document.createElement('div');
inventoryScreen.id = 'inventory-screen';
inventoryScreen.style.display = 'none';
inventoryScreen.innerHTML = `
    <h2>Ваши ключи</h2>
    <div class="keys-grid" id="keys-container">
        <!-- Ключи будут добавлены сюда -->
    </div>
    <button class="inventory-close">← Назад к игре</button>
`;

document.getElementById('module-container').appendChild(inventoryScreen);
const keysContainer = document.getElementById('keys-container');
const inventoryCloseBtn = inventoryScreen.querySelector('.inventory-close');

function showInventory() {
    diceScreen.style.display = 'none';
    keyAnimScreen.style.display = 'none';
    inventoryScreen.style.display = 'block';

    keysContainer.innerHTML = '';
    const keys = Object.entries(collectedKeys);
    if (keys.length === 0) {
        keysContainer.innerHTML = '<p>У вас пока нет ключей.</p>';
    } else {
        const iconMap = {
            'card': '🃏',
            'old': '🔑',
            'digital': '💾',
            'regular': '🗝️'
        };

        for (const [id, data] of keys) {
            const { label, type = 'regular' } = data;
            const icon = iconMap[type] || iconMap.regular;

            const keyEl = document.createElement('div');
            keyEl.className = 'key-item';
            keyEl.innerHTML = `
                <div class="key-icon">${icon}</div>
                <div class="key-label">${label}</div>
            `;
            keysContainer.appendChild(keyEl);
        }
    }
}

function closeInventory() {
    inventoryScreen.style.display = 'none';
}

// События
inventoryCloseBtn.addEventListener('click', closeInventory);

// Добавляем кнопку инвентаря в основную игру
document.addEventListener('DOMContentLoaded', () => {
    // Активируем стили для инвентаря
    document.getElementById('inventory-styles').disabled = false;
    
    // Добавляем кнопку инвентаря в интерфейс игры
    window.addEventListener('nodeShown', (e) => {
        const node = e.detail.node;
        const hasChoices = node.choices && node.choices.length > 0;
        
        if (Object.keys(collectedKeys).length > 0 || hasChoices) {
            const inventoryButton = document.createElement('div');
            inventoryButton.style.textAlign = 'center';
            inventoryButton.style.marginTop = '16px';
            inventoryButton.innerHTML = `
                <button class="choice-btn" style="background:#555; font-size:16px;" onclick="showInventory()">Инвентарь</button>
            `;
            e.detail.element.querySelector('.choices')?.parentNode.appendChild(inventoryButton);
        }
    });
});