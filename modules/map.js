// === СИСТЕМА КАРТЫ МИРА ===
let mapScreen, locationsContainer, mapCloseBtn;
let visitedLocations = JSON.parse(localStorage.getItem('lingame_locations') || '[]');

function initMapModule() {
    console.log('🗺️ Инициализация модуля карты');
    
    // Проверяем, что DOM загружен
    if (!document.getElementById('module-container')) {
        console.log('⏳ DOM еще не загружен, откладываем инициализацию карты');
        setTimeout(initMapModule, 100);
        return;
    }
    
    // Создаем экран карты
    mapScreen = document.createElement('div');
    mapScreen.id = 'map-screen';
    mapScreen.style.display = 'none';
    mapScreen.innerHTML = `
        <h2 class="map-title">🗺️ Карта мира</h2>
        <div class="locations-grid" id="locations-container">
            <!-- Локации будут добавлены сюда -->
        </div>
        <button class="inventory-close">← Назад к игре</button>
    `;
    
    // Добавляем в контейнер модулей
    document.getElementById('module-container').appendChild(mapScreen);
    
    // Получаем элементы
    locationsContainer = document.getElementById('locations-container');
    mapCloseBtn = mapScreen.querySelector('.inventory-close');
    
    if (!locationsContainer || !mapCloseBtn) {
        console.error('❌ Не удалось найти элементы карты');
        return;
    }
    
    // Обработчики событий
    mapCloseBtn.addEventListener('click', closeMap);
    
    // Загружаем стили
    loadMapStyles();
    
    console.log('✅ Модуль карты инициализирован');
    
    // Регистрируем глобальные функции
    window.showMap = showMap;
    window.closeMap = closeMap;
    window.addLocation = addLocation;
    window.isLocationVisited = isLocationVisited;
    window.updateMapButton = updateMapButton; // Добавляем новую функцию
    
    // Принудительно проверяем наличие локаций и добавляем кнопку
    setTimeout(checkAndAddMapButton, 500);
}

function loadMapStyles() {
    const mapStyle = document.createElement('link');
    mapStyle.rel = 'stylesheet';
    mapStyle.href = 'css/map.css';
    mapStyle.onload = () => {
        console.log('✅ Стили карты загружены');
    };
    document.head.appendChild(mapStyle);
}

function saveLocations() {
    localStorage.setItem('lingame_locations', JSON.stringify(visitedLocations));
}

function addLocation(nodeId) {
    if (!nodeId || visitedLocations.includes(nodeId)) return;
    
    visitedLocations.push(nodeId);
    saveLocations();
    console.log(`🗺️ Открыта новая локация: ${nodeId}`);
    
    // Обновляем кнопку карты после добавления локации
    updateMapButton();
}

function isLocationVisited(nodeId) {
    return visitedLocations.includes(nodeId);
}

function showMap() {
    if (!mapScreen) {
        console.error('❌ Экран карты не инициализирован');
        return;
    }
    
    // Скрываем другие экраны
    hideAllScreens();
    
    // Показываем карту
    mapScreen.style.display = 'block';
    
    // Обновляем содержимое
    updateLocationsDisplay();
}

function closeMap() {
    if (!mapScreen) return;
    mapScreen.style.display = 'none';
    showMainScene();
}

function hideAllScreens() {
    const screens = ['dice-screen', 'key-animation', 'scene', 'inventory-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showMainScene() {
    const scene = document.getElementById('scene');
    if (scene) scene.style.display = 'block';
}

function updateLocationsDisplay() {
    if (!locationsContainer) return;
    
    locationsContainer.innerHTML = '';
    
    if (visitedLocations.length === 0) {
        locationsContainer.innerHTML = `
            <p style="color: #777; margin: 40px 0; font-size: 18px;">Вы еще не открыли ни одной локации</p>
            <p class="map-info">Путешествуйте по миру, чтобы открывать новые места на карте</p>
        `;
        return;
    }
    
    // Группируем локации по категориям
    const locationsByCategory = {};
    const story = window.story || {};
    
    for (const nodeId of visitedLocations) {
        const node = story[nodeId];
        if (!node || !node.is_location) continue;
        
        const category = node.location_category || 'other';
        if (!locationsByCategory[category]) {
            locationsByCategory[category] = [];
        }
        locationsByCategory[category].push(nodeId);
    }
    
    // Отображаем локации по категориям
    for (const [category, locationIds] of Object.entries(locationsByCategory)) {
        if (locationIds.length === 0) continue;
        
        let categoryTitle = 'Другие места';
        if (story[locationIds[0]]?.category_name) {
            categoryTitle = story[locationIds[0]].category_name;
        } else {
            const defaultTitles = {
                'town': '🏰 Города и поселения',
                'wilderness': '🌲 Дикие земли',
                'dungeon': '⚔️ Подземелья',
                'ship': '⚓ Корабли',
                'space': '🚀 Космос'
            };
            categoryTitle = defaultTitles[category] || categoryTitle;
        }
        
        locationsContainer.innerHTML += `<h3 class="category-title">${categoryTitle}</h3>`;
        
        for (const nodeId of locationIds) {
            const node = story[nodeId];
            if (!node) continue;
            
            const locationEl = document.createElement('div');
            locationEl.className = 'location-item';
            if (nodeId === window.currentNodeId) {
                locationEl.classList.add('current-location');
            }
            
            const icon = node.location_icon || '📍';
            const name = node.location_name || nodeId.replace(/_/g, ' ');
            const description = node.location_description || '';
            
            locationEl.innerHTML = `
                <div class="location-icon">${icon}</div>
                <div class="location-name">${name}</div>
                ${description ? `<div class="location-description">${description}</div>` : ''}
            `;
            
            locationEl.onclick = function() {
                closeMap();
                setTimeout(() => {
                    if (window.showNode) {
                        window.showNode(nodeId);
                    } else {
                        console.error('❌ Функция showNode не доступна');
                    }
                }, 100);
            };
            
            locationsContainer.appendChild(locationEl);
        }
    }
    
    if (visitedLocations.length > 0) {
        locationsContainer.innerHTML += `
            <div class="map-info" style="margin-top: 30px; grid-column: 1 / -1;">
                <p>Выберите локацию, чтобы телепортироваться к ней</p>
                <p style="font-style: italic; margin-top: 8px;">Текущее местоположение выделено зеленой рамкой</p>
            </div>
        `;
    }
}

// === КРИТИЧЕСКАЯ ФУНКЦИЯ: Принудительное добавление кнопки карты ===
function updateMapButton() {
    // Ждем, пока основной контейнер будет доступен
    const sceneEl = document.getElementById('scene');
    if (!sceneEl || sceneEl.innerHTML.includes('map-button-container')) {
        return;
    }
    
    // Создаем контейнер для кнопки карты
    const mapButtonContainer = document.createElement('div');
    mapButtonContainer.id = 'map-button-container';
    mapButtonContainer.style.textAlign = 'center';
    mapButtonContainer.style.marginTop = '12px';
    mapButtonContainer.style.zIndex = '100';
    mapButtonContainer.style.position = 'relative';
    
    mapButtonContainer.innerHTML = `
        <button class="choice-btn map-btn" style="background:#3a3c6d; font-size:16px; width: auto; padding: 12px 24px;" onclick="showMap()">
            🗺️ Карта мира (${visitedLocations.length})
        </button>
    `;
    
    // Добавляем кнопку в конец сцены
    sceneEl.appendChild(mapButtonContainer);
    console.log('✅ Кнопка карты добавлена принудительно');
}

function checkAndAddMapButton() {
    const sceneEl = document.getElementById('scene');
    if (!sceneEl) {
        setTimeout(checkAndAddMapButton, 200);
        return;
    }
    
    // Добавляем кнопку если есть посещенные локации
    if (visitedLocations.length > 0 && !sceneEl.querySelector('#map-button-container')) {
        updateMapButton();
    }
    
    // Проверяем каждые 2 секунды на случай динамического обновления сцены
    setTimeout(checkAndAddMapButton, 2000);
}
// END КРИТИЧЕСКАЯ ФУНКЦИЯ

// Инициализация модуля после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🗺️ DOM загружен, начинаем инициализацию карты');
    
    // Инициализируем модуль карты
    initMapModule();
    
    // Также пытаемся добавить кнопку каждые 2 секунды
    setInterval(checkAndAddMapButton, 2000);
});

// Обработка события nodeShown
document.addEventListener('nodeShown', (e) => {
    console.log('🗺️ Событие nodeShown получено');
    
    if (!window.showMap || !window.story || !window.currentNodeId) {
        console.log('❌ Модуль карты не готов к работе');
        return;
    }
    
    const node = e.detail.node;
    const nodeId = e.detail.nodeId;
    
    // Отмечаем посещенные локации
    if (node.is_location && !isLocationVisited(nodeId)) {
        addLocation(nodeId);
    }
    
    // Принудительно обновляем кнопку карты
    updateMapButton();
});

// Жест свайпа для открытия карты
let startY = 0;
let isDragging = false;

document.addEventListener('touchstart', (e) => {
    if (!window.showMap || visitedLocations.length === 0) return;
    
    startY = e.touches[0].clientY;
    isDragging = true;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!isDragging || !window.showMap || visitedLocations.length === 0) return;
    
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 100 && document.getElementById('scene')?.style.display === 'block') {
        showMap();
        isDragging = false;
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    isDragging = false;
});

console.log('🔧 Модуль карты загружен');

// === ФУНКЦИЯ ОТЛАДКИ ===
function debugMapModule() {
    console.log('🔍 Отладка модуля карты:');
    console.log('  Посещенные локации:', visitedLocations);
    console.log('  sceneEl.innerHTML:', document.getElementById('scene')?.innerHTML.substring(0, 200) + '...');
    console.log('  Кнопка карты существует:', !!document.querySelector('#map-button-container'));
    
    // Пытаемся принудительно добавить кнопку
    if (visitedLocations.length > 0) {
        updateMapButton();
    }
}
// END ФУНКЦИИ ОТЛАДКИ

// Регистрируем функцию отладки в глобальной области видимости
window.debugMapModule = debugMapModule;
console.log('🔧 Функция отладки debugMapModule зарегистрирована');
