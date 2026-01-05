// === СИСТЕМА КАРТЫ МИРА ===
const mapScreen = document.createElement('div');
mapScreen.id = 'map-screen';
mapScreen.style.display = 'none';
mapScreen.innerHTML = `
    <h2 class="map-title">🗺️ Карта мира</h2>
    <div class="locations-grid" id="locations-container">
        <!-- Локации будут добавлены сюда -->
    </div>
    <button class="inventory-close">← Назад к игре</button>
`;

document.getElementById('module-container').appendChild(mapScreen);
const locationsContainer = document.getElementById('locations-container');
const mapCloseBtn = mapScreen.querySelector('.inventory-close');

let visitedLocations = JSON.parse(localStorage.getItem('lingame_locations') || '[]');

function saveLocations() {
    localStorage.setItem('lingame_locations', JSON.stringify(visitedLocations));
}

function addLocation(nodeId) {
    if (!nodeId || visitedLocations.includes(nodeId)) return;
    
    visitedLocations.push(nodeId);
    saveLocations();
    console.log(`🗺️ Открыта новая локация: ${story[nodeId]?.location_name || nodeId}`);
}

function isLocationVisited(nodeId) {
    return visitedLocations.includes(nodeId);
}

function showMap() {
    diceScreen.style.display = 'none';
    keyAnimScreen.style.display = 'none';
    if (window.showInventory) inventoryScreen.style.display = 'none';
    sceneEl.style.display = 'none';
    mapScreen.style.display = 'block';
    
    updateLocationsDisplay();
}

function closeMap() {
    mapScreen.style.display = 'none';
    sceneEl.style.display = 'block';
}

function updateLocationsDisplay() {
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
            if (nodeId === currentNodeId) {
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
                    showNode(nodeId);
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

// События
mapCloseBtn.addEventListener('click', closeMap);

// Добавляем жест свайпа для открытия карты
let startY = 0;
let isDragging = false;

document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 100 && sceneEl.style.display === 'block' && visitedLocations.length > 0) {
        showMap();
        isDragging = false;
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    isDragging = false;
});

// Добавляем карту в основную игру
document.addEventListener('DOMContentLoaded', () => {
    // Активируем стили для карты
    document.getElementById('map-styles').disabled = false;
    
    // Интеграция с основной игрой
    window.addEventListener('nodeShown', (e) => {
        const node = e.detail.node;
        const nodeId = e.detail.nodeId;
        
        // Отмечаем посещенные локации
        if (node.is_location && !isLocationVisited(nodeId)) {
            addLocation(nodeId);
        }
        
        // Добавляем кнопку карты всегда (ИСПРАВЛЕНО)
        if (true) {
            const mapButton = document.createElement('div');
            mapButton.style.textAlign = 'center';
            mapButton.style.marginTop = '12px';
            mapButton.innerHTML = `
                <button class="choice-btn" style="background:#3a3c6d; font-size:16px;" onclick="showMap()">🗺️ Карта мира</button>
            `;
            e.detail.element.querySelector('.choices')?.parentNode.appendChild(mapButton);
        }
    });
});
