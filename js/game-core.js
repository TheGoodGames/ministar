// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let story = null;
let currentNodeId = null;
let diceAnimationInterval = null;
let autoAdvanceTimeout = null;
let isAudioPlaying = false;

// Инициализируем DOM-элементы как null
let sceneEl = null;
let diceScreen = null;
let keyAnimScreen = null;
let audioEl = null;
let audioBtn = null;
let moduleContainer = null;

// === СИСТЕМА КЛЮЧЕЙ ===
// Инициализируем collectedKeys в самом начале
const collectedKeys = JSON.parse(localStorage.getItem('lingame_keys') || '{}');

function saveKeys() {
    localStorage.setItem('lingame_keys', JSON.stringify(collectedKeys));
}

function collectKey(keyData) {
    if (keyData && keyData.id) {
        collectedKeys[keyData.id] = {
            label: keyData.label || keyData.id,
            type: keyData.type || 'regular'
        };
        saveKeys();
        console.log('🔑 Собран ключ:', keyData.id, keyData.label, '(' + (keyData.type || 'regular') + ')');
    }
}

function hasAllKeys(requiredKeys) {
    if (!requiredKeys) return true;
    if (typeof requiredKeys === 'string') {
        requiredKeys = [requiredKeys];
    }
    if (!Array.isArray(requiredKeys)) {
        return false;
    }
    return requiredKeys.every(keyId => !!collectedKeys[keyId]);
}

function getMissingKeyMessages(requiredKeys, missingMessages = {}) {
    if (!requiredKeys) return [];
    const keys = Array.isArray(requiredKeys) ? requiredKeys : [requiredKeys];
    return keys
        .filter(keyId => !collectedKeys[keyId])
        .map(keyId => missingMessages[keyId] || `Требуется предмет: ${keyId}`);
}

// === ИНИЦИАЛИЗАЦИЯ DOM-ЭЛЕМЕНТОВ ===
function initDOMElements() {
    sceneEl = document.getElementById('scene');
    diceScreen = document.getElementById('dice-screen');
    keyAnimScreen = document.getElementById('key-animation');
    audioEl = document.getElementById('ambient-audio');
    audioBtn = document.getElementById('audio-control');
    moduleContainer = document.getElementById('module-container');
    
    // Проверка всех необходимых элементов
    const missingElements = [];
    if (!sceneEl) missingElements.push('#scene');
    if (!diceScreen) missingElements.push('#dice-screen');
    if (!keyAnimScreen) missingElements.push('#key-animation');
    if (!audioEl) missingElements.push('#ambient-audio');
    if (!audioBtn) missingElements.push('#audio-control');
    if (!moduleContainer) missingElements.push('#module-container');
    
    if (missingElements.length > 0) {
        console.error('❌ Не найдены DOM-элементы:', missingElements);
        return false;
    }
    
    return true;
}

// === АНИМАЦИЯ ПОЛУЧЕНИЯ КЛЮЧА ===
function showKeyAnimation(keyData, nextNodeId) {
    if (!keyData || !keyData.id || !keyData.label) return;

    collectKey(keyData);

    const iconMap = {
        'card': '🃏',
        'old': '🔑',
        'digital': '💾',
        'regular': '🗝️'
    };
    const icon = iconMap[keyData.type || 'regular'] || iconMap.regular;

    if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout);

    sceneEl.style.display = 'none';
    diceScreen.style.display = 'none';
    keyAnimScreen.style.display = 'block';

    document.getElementById('anim-key-icon').textContent = icon;
    document.getElementById('anim-key-label').textContent = keyData.label;

    autoAdvanceTimeout = setTimeout(() => {
        keyAnimScreen.style.display = 'none';
        if (nextNodeId) {
            showNode(nextNodeId);
        } else {
            sceneEl.style.display = 'block';
        }
    }, 2200);
}

// === БРОСОК КУБИКОВ ===
function rollDice(successTarget, partialTarget, failTarget) {
    if (diceAnimationInterval) {
        clearInterval(diceAnimationInterval);
        diceAnimationInterval = null;
    }

    sceneEl.style.display = 'none';
    diceScreen.style.display = 'block';
    diceScreen.innerHTML = `
        <div class="dice">🎲 🎲</div>
        <div class="result">Испытать удачу и сделать верный выбор.</div>
        <button class="choice-btn" id="roll-button">Положиться на судьбу</button>
    `;

    const newRollButton = document.getElementById('roll-button');
    if (newRollButton) {
        newRollButton.onclick = () => {
            let animCount = 0;
            diceAnimationInterval = setInterval(() => {
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;
                diceScreen.innerHTML = `
                    <div class="dice">${getDiceEmoji(d1)} ${getDiceEmoji(d2)}</div>
                    <div class="result">Бросок...</div>
                    <button class="choice-btn" disabled>Хоть-бы... хоть-бы...</button>
                `;
                animCount++;
                if (animCount > 12) {
                    clearInterval(diceAnimationInterval);
                    diceAnimationInterval = null;
                    const total = d1 + d2;
                    diceScreen.innerHTML = `
                        <div class="dice">${getDiceEmoji(d1)} ${getDiceEmoji(d2)}</div>
                        <div class="result">Выпало: <strong>${total}</strong></div>
                        <button class="choice-btn" onclick="proceedAfterDice(${total})">Продолжить</button>
                    `;

                    window.proceedAfterDice = function (total) {
                        diceScreen.style.display = 'none';
                        sceneEl.style.display = 'block';

                        let target;
                        if (total >= 8) {
                            target = successTarget;
                        } else if (total === 7) {
                            target = partialTarget;
                        } else {
                            target = failTarget;
                        }

                        if (target && story[target]) {
                            showNode(target);
                        } else {
                            showNode('0');
                        }
                    };
                }
            }, 100);
        };
    }
}

// === ОСНОВНАЯ ЛОГИКА ===
async function loadStory() {
    try {
        const res = await fetch('story.json');
        if (!res.ok) throw new Error('Файл story.json не найден');
        story = await res.json();
        initGame();
    } catch (e) {
        if (sceneEl) {
            sceneEl.innerHTML = `<div class="text">Ошибка загрузки: ${e.message}</div>`;
        } else {
            console.error('❌ Сцена не инициализирована:', e);
        }
        console.error(e);
    }
}

function initGame() {
    const saved = localStorage.getItem('lingame_lastNode');
    if (saved && story[saved]) {
        showNode(saved);
    } else {
        showNode('0');
    }
}

function showNode(nodeId) {
    if (!sceneEl || !diceScreen || !keyAnimScreen) {
        console.error('❌ DOM-элементы не инициализированы');
        return;
    }

    if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout);

    sceneEl.style.display = 'block';
    diceScreen.style.display = 'none';
    keyAnimScreen.style.display = 'none';

    // Скрываем модули если они существуют
    if (window.closeInventory && typeof window.closeInventory === 'function') {
        try {
            const inventoryScreen = document.getElementById('inventory-screen');
            if (inventoryScreen) inventoryScreen.style.display = 'none';
        } catch (e) {
            console.log('Инвентарь не инициализирован');
        }
    }
    
    if (window.closeMap && typeof window.closeMap === 'function') {
        try {
            const mapScreen = document.getElementById('map-screen');
            if (mapScreen) mapScreen.style.display = 'none';
        } catch (e) {
            console.log('Карта не инициализирована');
        }
    }

    if (!story || !story[nodeId]) {
        console.error(`Узел "${nodeId}" не найден`);
        if (story && Object.keys(story).length > 0) {
            showNode(Object.keys(story)[0]);
        } else {
            sceneEl.innerHTML = '<div class="text">Ошибка: история не загружена</div>';
        }
        return;
    }
    const node = story[nodeId];
    currentNodeId = nodeId;
    localStorage.setItem('lingame_lastNode', nodeId);
    
    // === СИСТЕМА КАРТЫ: ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ ===
    window.currentNodeId = nodeId;
    window.story = story;
    
    // Отмечаем посещенные локации
    if (node.is_location) {
        // Загружаем актуальные данные
        if (window.loadVisitedLocations) {
            window.loadVisitedLocations();
        }
        
        // Добавляем локацию через глобальную функцию
        if (window.addLocation && !window.isLocationVisited?.(nodeId)) {
            window.addLocation(nodeId);
            console.log(`🌍 Локация "${nodeId}" добавлена в карту`);
            
            // Показываем уведомление
            setTimeout(() => {
                sceneEl.innerHTML += `
                    <div style="background: rgba(76, 175, 80, 0.3); border-left: 3px solid #4CAF50; 
                        padding: 12px; border-radius: 0 8px 8px 0; margin: 15px 0; font-size: 15px;">
                        <p>📍 "${node.location_name || nodeId}" добавлена на карту мира!</p>
                    </div>
                `;
            }, 300);
        }
    }

    const node = story[nodeId];
    currentNodeId = nodeId;
    localStorage.setItem('lingame_lastNode', nodeId);

    // Проверка на ноду с вводом кода
    if (node.input_type === "code") {
        // Временно отключаем, так как эта функция не реализована
        console.warn('❌ Функция showCodeScreen не реализована');
        showNode('0');
        return;
    }

    // Проверка доступа
    if (node.requires && !hasAllKeys(node.requires)) {
        const fallbackChoice = node.choices?.[0] || { text: "Вернуться", next: "0" };
        sceneEl.classList.remove('active');
        setTimeout(() => {
            sceneEl.className = 'scene deadend';
            sceneEl.innerHTML = `
                <div class="text"><p>Дверь заперта. Похоже, вам нужен особый ключ...</p></div>
                <div class="choices">
                    <button class="choice-btn" onclick="handleChoice('${fallbackChoice.next}')">${fallbackChoice.text}</button>
                </div>
            `;
            sceneEl.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 320);
        return;
    }

    const isRestartNode = nodeId === "node_end";
    const hasRestartOption = node.choices?.some(c => c.next === "main_story");
    const illustration = getIllustrationHtml(nodeId);
    const formattedText = formatText(node.text);
    const hasChoices = node.choices && node.choices.length > 0;
    let showAnimation = false;
    let nextAfterCollect = null;

    // Проверка: один выбор + есть collect → анимация!
    if (node.collect && node.choices && node.choices.length === 1) {
        showAnimation = true;
        nextAfterCollect = node.choices[0].next;
    }

    if (showAnimation) {
        sceneEl.classList.remove('active');
        setTimeout(() => {
            sceneEl.className = 'scene';
            sceneEl.innerHTML = `${illustration}<div class="text">${formattedText}</div>`;
            sceneEl.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(() => {
                showKeyAnimation(node.collect, nextAfterCollect);
            }, 600);
        }, 320);
        return;
    }

    // Обычное отображение
    let choicesHtml = '';
    if (hasChoices && !isRestartNode) {
        let choices = [...node.choices];
        if (!hasRestartOption) {
            choices = shuffleArray(choices);
        }
        choicesHtml = choices.map((c, index) => {
            const isRestart = c.next === "main_story" || c.next === "node_end";
            const btnClass = isRestart ? 'choice-btn restart-btn' : 'choice-btn';
            return `<button class="${btnClass}" onclick="handleChoice('${c.next}', ${index})">${c.text}</button>`;
        }).join('');
    }

    let endMarkerHtml = '';
    if (!hasChoices || isRestartNode) {
        endMarkerHtml = `
        <div style="
            text-align: center;
            margin: 40px 0 20px;
            font-size: 80px;
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            opacity: 0;
        ">❌</div>
        <style>
            @keyframes popIn {
                0% { transform: scale(0.3); opacity: 0; }
                70% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
        </style>
    `;
    }

    sceneEl.classList.remove('active');
    setTimeout(() => {
        sceneEl.className = 'scene';
        if (!hasChoices || isRestartNode) {
            sceneEl.className += ' deadend';
        }
        sceneEl.innerHTML = `${illustration}<div class="text">${formattedText}</div>${endMarkerHtml}${choicesHtml ? `<div class="choices">${choicesHtml}</div>` : ''}`;
        sceneEl.classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (isAudioPlaying && audioEl) {
            audioEl.play().catch(e => console.log("Audio play failed:", e));
        }

        if (isRestartNode && window.Telegram?.WebApp) {
            Telegram.WebApp.showAlert("Конец ветки. Возвращаемся к началу...");
        }

        // Генерируем событие для модулей
        if (typeof CustomEvent === 'function') {
            const event = new CustomEvent('nodeShown', {
                detail: {
                    nodeId: nodeId,
                    node: node,
                    element: sceneEl
                }
            });
            document.dispatchEvent(event);
        }
    }, 320);
}

// Обработчики событий
window.handleChoice = function (nextId, choiceIndex = null) {
    // Обработка DICE
    if (nextId.startsWith("DICE:")) {
        const parts = nextId.slice(5).split(',');
        const success = parts[0] || null;
        const partial = parts[1] || null;
        const fail = parts[2] || null;
        rollDice(success, partial, fail);
        return;
    }

    // Обработка сбора предмета из ВЫБОРА
    if (choiceIndex !== null && currentNodeId && story[currentNodeId]) {
        const choice = story[currentNodeId].choices[choiceIndex];
        if (choice && choice.collect) {
            if (collectedKeys[choice.collect.id]) {
                alert("Здесь ничего нет. Вы уже осматривали это место.");
                return;
            }
            showKeyAnimation(choice.collect, currentNodeId);
            return;
        }
    }

    // Проверка требований на уровне ВЫБОРА
    if (choiceIndex !== null && currentNodeId && story[currentNodeId]) {
        const choice = story[currentNodeId].choices[choiceIndex];
        if (choice && choice.requires) {
            const missingMsgs = getMissingKeyMessages(choice.requires, choice.missingMessages || {});
            if (missingMsgs.length > 0) {
                alert("Недоступно:\n" + missingMsgs.join("\n"));
                return;
            }
        }
    }

    // Обработка перехода
    if (nextId === "main_story") {
        localStorage.removeItem('lingame_lastNode');
        // Не очищаем ключи, как указано в комментарии
        // localStorage.removeItem('lingame_keys');
    }

    if (nextId === "node_end") {
        setTimeout(() => showNode("0"), 500);
        return;
    }

    if (story && story[nextId]) {
        showNode(nextId);
    } else {
        console.warn(`Узел "${nextId}" не найден. Возврат к началу.`);
        showNode("0");
    }
};

function toggleAudio() {
    if (!audioEl || !audioBtn) return;
    
    if (isAudioPlaying) {
        audioEl.pause();
        audioBtn.textContent = '🔇';
        isAudioPlaying = false;
    } else {
        audioEl.play().then(() => {
            audioBtn.textContent = '🔊';
            isAudioPlaying = true;
        }).catch(e => {
            alert('Сначала взаимодействуйте со страницей для воспроизведения звука.');
        });
    }
}

// Загрузка игры при полной загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM полностью загружен');
    
    // Инициализация DOM-элементов
    if (!initDOMElements()) {
        console.error('❌ Критическая ошибка инициализации DOM');
        return;
    }
    
    // Инициализация Telegram WebApp
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        // Настройка кнопки перезапуска
        Telegram.WebApp.MainButton.setText('Начать заново');
        Telegram.WebApp.MainButton.show();
        Telegram.WebApp.MainButton.onClick(() => {
            localStorage.removeItem('lingame_lastNode');
            // Не очищаем ключи
            showNode("0");
        });
    }
    
    // Загрузка истории
    loadStory();
    
    console.log('🎮 Игра инициализирована');
    
    // Регистрируем глобальные переменные для модулей
    window.collectedKeys = collectedKeys;
    window.story = story;
    window.currentNodeId = currentNodeId;
    window.showNode = showNode;
    window.getIllustrationHtml = getIllustrationHtml;
    window.formatText = formatText;
});
