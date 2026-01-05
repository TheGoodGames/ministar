// === СИСТЕМА КАРТЫ МИРА ===
let mapScreen, locationsContainer, mapCloseBtn;
let visitedLocations = JSON.parse(localStorage.getItem('lingame_locations') || '[]');

function loadVisitedLocations() {
    try {
        const saved = localStorage.getItem('lingame_locations');
        visitedLocations = saved ? JSON.parse(saved) : [];
        console.log('✅ Загружены посещенные локации:', visitedLocations);
        return visitedLocations;
    } catch (e) {
        console.error('❌ Ошибка загрузки локаций:', e);
        return [];
    }
}

function saveLocations() {
    try {
        localStorage.setItem('lingame_locations', JSON.stringify(visitedLocations));
        console.log('✅ Локации сохранены:', visitedLocations);
    } catch (e) {
        console.error('❌ Ошибка сохранения локаций:', e);
    }
}

function initMapModule() {
    console.log('🗺️ Инициализация модуля карты');
    
    // Загружаем локации при инициализации
    loadVisitedLocations();
    
    // Создаем DOM-элементы
    createMapDOM();
    
    // Загружаем стили
    loadMapStyles();
    
    console.log('✅ Модуль карты инициализирован');
    
    // Регистрируем глобальные функции
    window.showMap = showMap;
    window.closeMap = closeMap;
    window.addLocation = addLocation;
    window.isLocationVisited = isLocationVisited;
    window.updateMapButton = updateMapButton;
    window.loadVisitedLocations = loadVisitedLocations;
    window.updateLocationsDisplay = updateLocationsDisplay;
    
    // Принудительно обновляем кнопку каждые 5 секунд
    setInterval(updateMapButton, 5000);
}

function createMapDOM() {
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
    const moduleContainer = document.getElementById('module-container');
    if (moduleContainer) {
        moduleContainer.appendChild(mapScreen);
    } else {
        setTimeout(createMapDOM, 100);
        return;
    }
    
    // Получаем элементы
    locationsContainer = document.getElementById('locations-container');
    mapCloseBtn = mapScreen.querySelector('.inventory-close');
    
    if (!locationsContainer || !mapCloseBtn) {
        console.error('❌ Не удалось найти элементы карты');
        return;
    }
    
    // Обработчики событий
    mapCloseBtn.addEventListener('click', closeMap);
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

function addLocation(nodeId) {
    if (!nodeId || visitedLocations.includes(nodeId)) return;
    
    visitedLocations.push(nodeId);
    saveLocations();
    console.log(`🗺️ Открыта новая локация: ${nodeId}`);
}

function isLocationVisited(nodeId) {
    loadVisitedLocations(); // Всегда загружаем свежие данные
    return visitedLocations.includes(nodeId);
}

function showMap() {
    if (!mapScreen) {
        console.error('❌ Экран карты не инициализирован');
        return;
    }
    
    // Скрываем другие экраны
    const screens = ['dice-screen', 'key-animation', 'scene'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Показываем карту
    mapScreen.style.display = 'block';
    
    // Обновляем содержимое
    updateLocationsDisplay();
}

function closeMap() {
    if (!mapScreen) return;
    mapScreen.style.display = 'none';
    
    const scene = document.getElementById('scene');
    if (scene) scene.style.display = 'block';
}

function updateLocationsDisplay() {
    if (!locationsContainer) {
        console.error('❌ locationsContainer не инициализирован');
        return;
    }
    
    locationsContainer.innerHTML = '';
    
    // Загружаем свежие данные
    loadVisitedLocations();
    
    if (visitedLocations.length === 0) {
        locationsContainer.innerHTML = `
            <p style="color: #777; margin: 40px 0; font-size: 18px;">Вы еще не открыли ни одной локации</p>
            <p class="map-info">Путешествуйте по миру, чтобы открывать новые места на карте</p>
        `;
        return;
    }
    
    // Проверяем наличие story
    const story = window.story;
    if (!story) {
        locationsContainer.innerHTML = `
            <p style="color: #ff9800; margin: 40px 0; font-size: 18px;">
                ⚠️ История не загружена. Закройте карту и перезагрузите игру.
            </p>
        `;
        return;
    }
    
    // Отображаем все посещенные локации
    locationsContainer.innerHTML = `<h3 class="category-title">📍 Открытые локации</h3>`;
    
    let locationFound = false;
    
    for (const nodeId of visitedLocations) {
        const node = story[nodeId];
        if (!node) continue;
        
        locationFound = true;
        
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
                if (window.showNode && story[nodeId]) {
                    window.showNode(nodeId);
                } else {
                    console.error(`❌ Локация "${nodeId}" не найдена в story`);
                }
            }, 100);
        };
        
        locationsContainer.appendChild(locationEl);
    }
    
    if (!locationFound) {
        locationsContainer.innerHTML = `
            <p style="color: #ff9800; margin: 40px 0; font-size: 18px;">
                🔍 Не найдено локаций в истории
            </p>
        `;
    }
}

function updateMapButton() {
    const sceneEl = document.getElementById('scene');
    if (!sceneEl) return;
    
    // Удаляем старую кнопку если она есть
    const existingButton = document.getElementById('map-button-container');
    if (existingButton) existingButton.remove();
    
    // Добавляем кнопку только если есть посещенные локации
    if (visitedLocations.length > 0) {
        const mapButtonContainer = document.createElement('div');
        mapButtonContainer.id = 'map-button-container';
        mapButtonContainer.style.textAlign = 'center';
        mapButtonContainer.style.marginTop = '12px';
        
        mapButtonContainer.innerHTML = `
            <button class="choice-btn" style="background:#3a3c6d; font-size:16px;" onclick="showMap()">
                🗺️ Карта мира (${visitedLocations.length})
            </button>
        `;
        
        // Находим место для вставки
        const choicesContainer = sceneEl.querySelector('.choices');
        if (choicesContainer) {
            choicesContainer.parentNode.insertBefore(mapButtonContainer, choicesContainer.nextSibling);
        } else {
            const textElements = sceneEl.querySelectorAll('.text');
            if (textElements.length > 0) {
                const lastText = textElements[textElements.length - 1];
                lastText.parentNode.insertBefore(mapButtonContainer, lastText.nextSibling);
            } else {
                sceneEl.appendChild(mapButtonContainer);
            }
        }
    }
}

// Инициализация модуля
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 DOM загружен, инициализация карты');
    initMapModule();
    
    // Обработка события nodeShown
    document.addEventListener('nodeShown', (e) => {
        console.log('📍 Событие nodeShown в карте');
        
        const node = e.detail.node;
        const nodeId = e.detail.nodeId;
        
        if (node.is_location && window.isLocationVisited && window.addLocation) {
            if (!window.isLocationVisited(nodeId)) {
                window.addLocation(nodeId);
            }
        }
        
        // Принудительно обновляем кнопку
        if (window.updateMapButton) {
            window.updateMapButton();
        }
    });
});

console.log('🔧 Модуль карты загружен');
