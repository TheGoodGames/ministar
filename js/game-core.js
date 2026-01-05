// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let story = null;
let currentNodeId = null;
let diceAnimationInterval = null;
let autoAdvanceTimeout = null;

// DOM элементы
const sceneEl = document.getElementById('scene');
const diceScreen = document.getElementById('dice-screen');
const keyAnimScreen = document.getElementById('key-animation');
const audioEl = document.getElementById('ambient-audio');
const audioBtn = document.getElementById('audio-control');
const moduleContainer = document.getElementById('module-container');

let isAudioPlaying = false;

// === СИСТЕМА КЛЮЧЕЙ ===
let collectedKeys = JSON.parse(localStorage.getItem('lingame_keys') || '{}');

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

// === АНИМАЦИЯ ПОЛУЧЕНИЯ КЛЮЧА ===
function showKeyAnimation(keyData, nextNodeId) {
    if (!keyData || !keyData.id || !keyData.label) return;

    collectedKeys[keyData.id] = {
        label: keyData.label,
        type: keyData.type || 'regular'
    };
    saveKeys();

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
        showNode(nextNodeId);
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

// === ОСНОВНАЯ ЛОГИКА ===
async function loadStory() {
    try {
        const res = await fetch('story.json');
        if (!res.ok) throw new Error('Файл story.json не найден');
        story = await res.json();
        initGame();
    } catch (e) {
        sceneEl.innerHTML = `<div class="text">Ошибка загрузки: ${e.message}</div>`;
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
    if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout);

    sceneEl.style.display = 'block';
    diceScreen.style.display = 'none';
    keyAnimScreen.style.display = 'none';

    if (!story[nodeId]) {
        console.error(`Узел "${nodeId}" не найден`);
        showNode(Object.keys(story)[0]);
        return;
    }

    const node = story[nodeId];
    currentNodeId = nodeId;
    localStorage.setItem('lingame_lastNode', nodeId);

    // Проверка на ноду с вводом кода
    if (node.input_type === "code") {
        showCodeScreen(node);
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

        if (isAudioPlaying) {
            audioEl.play().catch(e => console.log("Audio play failed:", e));
        }

        if (isRestartNode && window.Telegram?.WebApp) {
            Telegram.WebApp.showAlert("Конец ветки. Возвращаемся к началу...");
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
    if (choiceIndex !== null && currentNodeId) {
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
    if (choiceIndex !== null && currentNodeId) {
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
        collectedKeys = JSON.parse(localStorage.getItem('lingame_keys') || '{}');
    }

    if (nextId === "node_end") {
        setTimeout(() => showNode("0"), 500);
        return;
    }

    if (story[nextId]) {
        showNode(nextId);
    } else {
        console.warn(`Узел "${nextId}" не найден. Возврат к началу.`);
        showNode("0");
    }
};

function toggleAudio() {
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

// Загрузка игры при запуске
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        Telegram.WebApp.MainButton.setText('Начать заново');
        Telegram.WebApp.MainButton.show();
        Telegram.WebApp.MainButton.onClick(() => {
            localStorage.removeItem('lingame_lastNode');
            collectedKeys = JSON.parse(localStorage.getItem('lingame_keys') || '{}');
            showNode("0");
        });
    }
    
    loadStory();
});