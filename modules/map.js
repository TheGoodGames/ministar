// === СИСТЕМА КАРТЫ МИРА ===
let mapScreen, locationsContainer, mapCloseBtn;
let visitedLocations = [];

// Функция безопасного получения посещенных локаций
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

// Функция сохранения с проверкой
function saveLocations() {
    try {
        localStorage.setItem('lingame_locations', JSON.stringify(visitedLocations));
        console.log('✅ Локации сохранены:', visitedLocations);
    } catch (e) {
        console.error('❌ Ошибка сохранения локаций:', e);
    }
}

// Универсальная функция добавления локации
function addLocation(nodeId) {
    if (!nodeId) {
        console.error('❌ Попытка добавить локацию без ID');
        return false;
    }
    
    // Загружаем актуальные данные из localStorage
    loadVisitedLocations();
    
    if (visitedLocations.includes(nodeId)) {
        console.log(`ℹ️ Локация "${nodeId}" уже посещена`);
        return false;
    }
    
    visitedLocations.push(nodeId);
    saveLocations();
    
    // Принудительно обновляем кнопку карты
    if (window.updateMapButton) {
        window.updateMapButton();
    }
    
    console.log(`✅ Локация добавлена: "${nodeId}"`);
    return true;
}

// Проверка посещения локации
function isLocationVisited(nodeId) {
    loadVisitedLocations(); // Всегда загружаем свежие данные
    return visitedLocations.includes(nodeId);
}

function initMapModule() {
    console.log('🗺️ Инициализация модуля карты');
    
    // Загружаем локации при инициализации
    loadVisitedLocations();
    
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
        <div class="map-debug-info" style="color: #777; font-size: 14px; margin: 20px 0; padding: 10px; background: rgba(100, 100, 100, 0.1); border-radius: 5px;">
            <p>Загружено локаций: <span id="locations-count">0</span></p>
            <p>Проверяется история: <span id="story-status">ожидание</span></p>
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
    const mapStyle = document.createElement('link');
    mapStyle.rel = 'stylesheet';
    mapStyle.href = 'css/map.css';
    mapStyle.onload = () => {
        console.log('✅ Стили карты загружены');
    };
    document.head.appendChild(mapStyle);
    
    console.log('✅ Модуль карты инициализирован');
    
    // Регистрируем глобальные функции
    window.showMap = showMap;
    window.closeMap = closeMap;
    window.addLocation = addLocation;
    window.isLocationVisited = isLocationVisited;
    window.updateMapDisplay = updateLocationsDisplay; // Для ручного обновления
    
    // Принудительно обновляем отображение каждые 5 секунд
    setInterval(updateLocationsDisplay, 5000);
}

function showMap() {
    if (!mapScreen) {
        console.error('❌ Экран карты не инициализирован');
        return;
    }
    
    // Скрываем другие экраны
    const screens = ['dice-screen', 'key-animation', 'scene', 'inventory-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Показываем карту
    mapScreen.style.display = 'block';
    
    // Обновляем содержимое с задержкой для анимации
    setTimeout(updateLocationsDisplay, 100);
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
    
    // Обновляем отладочную информацию
    const locationsCountEl = document.getElementById('locations-count');
    const storyStatusEl = document.getElementById('story-status');
    
    if (locationsCountEl) locationsCountEl.textContent = visitedLocations.length;
    if (storyStatusEl) storyStatusEl.textContent = window.story ? 'загружена' : 'не загружена';
    
    // Загружаем свежие данные
    loadVisitedLocations();
    
    locationsContainer.innerHTML = '';
    
    // Проверяем наличие story
    const story = window.story;
    if (!story) {
        console.warn('⚠️ Story не загружена, невозможно отобразить локации');
        locationsContainer.innerHTML = `
            <p style="color: #ff9800; margin: 40px 0; font-size: 18px;">
                ⚠️ История не загружена. Закройте карту и перезагрузите игру.
            </p>
        `;
        return;
    }
    
    if (visitedLocations.length === 0) {
        locationsContainer.innerHTML = `
            <p style="color: #777; margin: 40px 0; font-size: 18px;">Вы еще не открыли ни одной локации</p>
            <p class="map-info">Путешествуйте по миру, чтобы открывать новые места на карте</p>
            <button class="choice-btn" style="margin-top: 20px; background: #3a3c6d;" onclick="closeMap()">
                Вернуться к игре
            </button>
        `;
        return;
    }
    
    // Отображаем все посещенные локации без группировки
    locationsContainer.innerHTML = `<h3 class="category-title">📍 Открытые локации</h3>`;
    
    let locationFound = false;
    
    for (const nodeId of visitedLocations) {
        const node = story[nodeId];
        
        // Пропускаем если локация не найдена в story
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
            <div style="font-size: 11px; color: #777; margin-top: 4px;">ID: ${nodeId}</div>
        `;
        
        locationEl.dataset.nodeId = nodeId;
        
        locationEl.onclick = function() {
            const targetNodeId = this.dataset.nodeId;
            closeMap();
            setTimeout(() => {
                console.log(`🗺️ Переход к локации: ${targetNodeId}`);
                if (window.showNode && story[targetNodeId]) {
                    window.showNode(targetNodeId);
                } else {
                    console.error(`❌ Локация "${targetNodeId}" не найдена в story`);
                    if (window.sceneEl) {
                        window.sceneEl.innerHTML += `
                            <div style="background: rgba(244, 67, 54, 0.2); border-left: 3px solid #f44336; 
                                padding: 12px; border-radius: 0 8px 8px 0; margin: 15px 0; font-size: 15px;">
                                <p>❌ Ошибка: локация не найдена</p>
                            </div>
                        `;
                    }
                }
            }, 150);
        };
        
        locationsContainer.appendChild(locationEl);
    }
    
    if (!locationFound) {
        locationsContainer.innerHTML = `
            <p style="color: #ff9800; margin: 40px 0; font-size: 18px;">
                🔍 Не найдено локаций в истории. Проверьте формат данных.
            </p>
            <div class="debug-data" style="color: #777; font-size: 14px; margin-top: 20px;">
                <p>Посещенные ID: ${visitedLocations.join(', ')}</p>
                <p>Доступные узлы в story: ${story ? Object.keys(story).join(', ') : 'не загружено'}</p>
            </div>
        `;
    }
}

// Инициализация модуля после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 DOM загружен, инициализация карты через 300мс');
    setTimeout(initMapModule, 300);
    
    // Регистрируем глобальную функцию отладки
    window.debugMap = function() {
        console.log('🔍 Отладка карты:');
        console.log('  Посещенные локации:', visitedLocations);
        console.log('  Story загружена:', !!window.story);
        console.log('  Текущий узел:', window.currentNodeId);
        
        if (window.story) {
            const missingNodes = visitedLocations.filter(id => !window.story[id]);
            if (missingNodes.length > 0) {
                console.warn('⚠️ Не найдены узлы для следующих ID:', missingNodes);
            }
        }
        
        // Принудительно обновляем отображение
        if (typeof updateLocationsDisplay === 'function') {
            updateLocationsDisplay();
            console.log('✅ Отображение карты обновлено');
        }
    };
    
    console.log('🔧 Функция отладки window.debugMap() зарегистрирована');
});

// Автоматическое добавление кнопки карты
document.addEventListener('nodeShown', (e) => {
    console.log('📍 Событие nodeShown в карте');
    
    const node = e.detail.node;
    const nodeId = e.detail.nodeId;
    
    // Загружаем свежие данные
    loadVisitedLocations();
    
    // Проверяем, нужно ли добавить локацию
    if (node.is_location) {
        console.log(`📍 Обнаружена локация: "${nodeId}"`);
        
        // Добавляем локацию если еще не посещена
        if (!isLocationVisited(nodeId)) {
            console.log(`➕ Добавляем новую локацию: "${nodeId}"`);
            addLocation(nodeId);
        } else {
            console.log(`ℹ️ Локация "${nodeId}" уже в карте`);
        }
        
        // Принудительно обновляем кнопку
        if (window.updateMapButton) {
            window.updateMapButton();
        }
    }
    
    // Обновляем отображение карты если она открыта
    if (mapScreen?.style.display === 'block') {
        setTimeout(updateLocationsDisplay, 100);
    }
});
// END СИСТЕМА КАРТЫ МИРА
