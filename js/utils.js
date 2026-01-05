// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function getDiceEmoji(n) {
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return dice[n - 1] || '🎲';
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getSafeImageName(nodeId) {
    return nodeId
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .replace(/_{2,}/g, '_');
}

function formatText(text) {
    let normalized = text.replace(/\\n/g, '\n');
    return normalized
        .replace(/`([^`]*)`/g, '<em>$1</em>')
        .replace(/\*\*([^*]*)\*\*/g, '<strong>$1</strong>')
        .split('\n\n')
        .map(p => `<p>${p.trim()}</p>`)
        .filter(p => p !== '<p></p>')
        .join('');
}

function getIllustrationHtml(nodeId) {
    const safeName = getSafeImageName(nodeId);
    const imgSrc = nodeId === "node_end"
        ? "img/end_scene.jpg"
        : `img/${safeName}.jpg`;
    return `
    <div class="illustration">
      <img src="${imgSrc}?v=${Date.now()}"
           alt="Сцена ${nodeId}"
           onerror="this.parentElement.innerHTML='<div class=\\'fallback\\'>🌌 Иллюстрация недоступна для ${nodeId}</div>'">
    </div>
  `;
}
