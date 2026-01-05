// === СИСТЕМА КАРТЫ МИРА ===
let mapScreen, locationsContainer, mapCloseBtn;
let visitedLocations = JSON.parse(localStorage.getItem('lingame_locations') || '[]');

function initMapModule() {
    console.log('🗺️ Инициализация модуля карты');
    
    // Создаем DOM-элементы только после полной загрузки страницы
    if (!document.getElementById('module-container')) {
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
    
    // Обработчики событий
    mapCloseBtn.addEventListener('click', closeMap);
    
    // Активируем стили
    const mapStyle = document.createElement('link');
    mapStyle.rel = 'stylesheet';
    mapStyle.href = 'css/map.css';
    document.head.appendChild(mapStyle);
    
    console.log('✅ Модуль карты инициализирован');
    
    // Регистрируем глобальные функции
    window.showMap = showMap;
    window.closeMap = closeMap;
    window.addLocation = addLocation;
    window.isLocationVisited = isLocationVisited;
}

function saveLocations() {
    localStorage.setItem('lingame_locations', JSON.stringify(visitedLocations));
}

function addLocation(nodeId) {
    if (!nodeId || visitedLocations.includes(nodeId)) return;
    
    visitedLocations.push(nodeId);
    saveLocations();
    console.log(`🗺️ Открыта новая локация: ${nodeId}`);
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
    document.getElementById('dice-screen').style.display = 'none';
    document.getElementById('key-animation').style.display = 'none';
    document.getElementById('scene').style.display = 'none';
    
    // Показываем карту
    mapScreen.style.display = 'block';
    
    // Обновляем содержимое
    updateLocationsDisplay();
}

function closeMap() {
    if (!mapScreen) return;
    mapScreen.style.display = 'none';
    document.getElementById('scene').style.display = 'block';
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

// Инициализация модуля после загрузки DOM
document.addEventListener('DOMContentLoaded', initMapModule);

// Автоматическое добавление карты и отслеживание локаций
document.addEventListener('nodeShown', (e) => {
    if (!window.showMap) return;
    
    const node = e.detail.node;
    const nodeId = e.detail.nodeId;
    const sceneEl = e.detail.element;
    
    // Отмечаем посещенные локации
    if (node.is_location && !isLocationVisited(nodeId)) {
        addLocation(nodeId);
        
        // Показываем уведомление о новой локации
        if (!localStorage.getItem('hide_map_tutorial')) {
            const newLocationBanner = document.createElement('div');
            newLocationBanner.style.background = 'rgba(76, 175, 80, 0.2)';
            newLocationBanner.style.borderLeft = '3px solid #4CAF50';
            newLocationBanner.style.padding = '12px';
            newLocationBanner.style.borderRadius = '0 8px 8px 0';
            newLocationBanner.style.margin = '15px 0';
            newLocationBanner.style.fontSize = '15px';
            newLocationBanner.style.position = 'relative';
            newLocationBanner.innerHTML = `
                <button style="position: absolute; right: 8px; top: 8px; background: rgba(255,255,255,0.1); border: none; width: 20px; height: 20px; border-radius: 50%; color: white; font-size: 12px; cursor: pointer;" onclick="localStorage.setItem('hide_map_tutorial', 'true'); this.parentElement.style.display='none'">×</button>
                <p>🗺️ <strong>Новая локация открыта!</strong> Нажмите иконку карты ниже, чтобы вернуться сюда позже.</p>
            `;
            
            sceneEl.insertBefore(newLocationBanner, sceneEl.firstChild);
        }
    }
    
    // Добавляем кнопку карты если есть посещенные локации
    if (visitedLocations.length > 0) {
        // Проверяем, что кнопка еще не добавлена
        if (!sceneEl.querySelector('.map-button-container')) {
            const mapButtonContainer = document.createElement('div');
            mapButtonContainer.className = 'map-button-container';
            mapButtonContainer.style.textAlign = 'center';
            mapButtonContainer.style.marginTop = '12px';
            
            mapButtonContainer.innerHTML = `
                <button class="choice-btn" style="background:#3a3c6d; font-size:16px; width: auto; padding: 12px 24px;" onclick="showMap()">
                    🗺️ Карта мира (${visitedLocations.length})
                </button>
            `;
            
            // Находим контейнер для кнопок или добавляем после инвентаря
            const inventoryContainer = sceneEl.querySelector('.inventory-button-container');
            if (inventoryContainer) {
                inventoryContainer.parentNode.insertBefore(mapButtonContainer, inventoryContainer.nextSibling);
            } else {
                const choicesContainer = sceneEl.querySelector('.choices');
                if (choicesContainer) {
                    choicesContainer.parentNode.insertBefore(mapButtonContainer, choicesContainer.nextSibling);
                } else {
                    sceneEl.appendChild(mapButtonContainer);
                }
            }
        }
    }
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
    if (deltaY > 100 && document.getElementById('scene').style.display === 'block') {
        showMap();
        isDragging = false;
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    isDragging = false;
});

console.log('🔧 Модуль карты загружен');
