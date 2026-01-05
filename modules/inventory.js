// === СИСТЕМА ИНВЕНТАРЯ ===
let inventoryScreen, keysContainer, inventoryCloseBtn;

function initInventoryModule() {
    console.log('📦 Инициализация модуля инвентаря');
    
    // Создаем DOM-элементы только после полной загрузки страницы
    if (!document.getElementById('module-container')) {
        setTimeout(initInventoryModule, 100);
        return;
    }
    
    // Создаем экран инвентаря
    inventoryScreen = document.createElement('div');
    inventoryScreen.id = 'inventory-screen';
    inventoryScreen.style.display = 'none';
    inventoryScreen.innerHTML = `
        <h2>Ваши ключи</h2>
        <div class="keys-grid" id="keys-container">
            <!-- Ключи будут добавлены сюда -->
        </div>
        <button class="inventory-close">← Назад к игре</button>
    `;
    
    // Добавляем в контейнер модулей
    document.getElementById('module-container').appendChild(inventoryScreen);
    
    // Получаем элементы
    keysContainer = document.getElementById('keys-container');
    inventoryCloseBtn = inventoryScreen.querySelector('.inventory-close');
    
    // Обработчики событий
    inventoryCloseBtn.addEventListener('click', closeInventory);
    
    // Активируем стили
    const inventoryStyle = document.createElement('link');
    inventoryStyle.rel = 'stylesheet';
    inventoryStyle.href = 'css/inventory.css';
    document.head.appendChild(inventoryStyle);
    
    console.log('✅ Модуль инвентаря инициализирован');
    
    // Регистрируем глобальные функции
    window.showInventory = showInventory;
    window.closeInventory = closeInventory;
}

function showInventory() {
    if (!inventoryScreen) {
        console.error('❌ Экран инвентаря не инициализирован');
        return;
    }
    
    // Скрываем другие экраны
    document.getElementById('dice-screen').style.display = 'none';
    document.getElementById('key-animation').style.display = 'none';
    document.getElementById('scene').style.display = 'none';
    
    // Показываем инвентарь
    inventoryScreen.style.display = 'block';
    
    // Обновляем содержимое
    updateInventoryDisplay();
}

function closeInventory() {
    if (!inventoryScreen) return;
    inventoryScreen.style.display = 'none';
    document.getElementById('scene').style.display = 'block';
}

function updateInventoryDisplay() {
    if (!keysContainer) return;
    
    keysContainer.innerHTML = '';
    const keys = Object.entries(window.collectedKeys || {});
    
    if (keys.length === 0) {
        keysContainer.innerHTML = '<p>У вас пока нет ключей.</p>';
        return;
    }
    
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

// Инициализация модуля после загрузки DOM
document.addEventListener('DOMContentLoaded', initInventoryModule);

// Автоматическое добавление кнопки инвентаря в игровой интерфейс
document.addEventListener('nodeShown', (e) => {
    if (!window.showInventory) return;
    
    const node = e.detail.node;
    const sceneEl = e.detail.element;
    const hasChoices = node.choices && node.choices.length > 0;
    const collectedKeys = window.collectedKeys || {};
    
    // Добавляем кнопку инвентаря если есть ключи или выборы
    if (Object.keys(collectedKeys).length > 0 || hasChoices) {
        // Проверяем, что кнопка еще не добавлена
        if (!sceneEl.querySelector('.inventory-button-container')) {
            const inventoryButtonContainer = document.createElement('div');
            inventoryButtonContainer.className = 'inventory-button-container';
            inventoryButtonContainer.style.textAlign = 'center';
            inventoryButtonContainer.style.marginTop = '16px';
            
            inventoryButtonContainer.innerHTML = `
                <button class="choice-btn" style="background:#555; font-size:16px; width: auto; padding: 12px 24px;" onclick="showInventory()">
                    🎒 Инвентарь (${Object.keys(collectedKeys).length})
                </button>
            `;
            
            // Находим контейнер для кнопок или добавляем в конец сцены
            const choicesContainer = sceneEl.querySelector('.choices');
            if (choicesContainer) {
                choicesContainer.parentNode.insertBefore(inventoryButtonContainer, choicesContainer.nextSibling);
            } else {
                sceneEl.appendChild(inventoryButtonContainer);
            }
        }
    }
});

console.log('🔧 Модуль инвентаря загружен');
