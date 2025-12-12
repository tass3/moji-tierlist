// 固定Tierデータ
const tiers = [
    { id: 'tier-s', title: 'S', color: '#ff4d4f', textColor: '#ffffff', items: [] },
    { id: 'tier-a', title: 'A', color: '#ff9800', textColor: '#ffffff', items: [] },
    { id: 'tier-b', title: 'B', color: '#ffc107', textColor: '#000000', items: [] },
    { id: 'tier-c', title: 'C', color: '#4caf50', textColor: '#ffffff', items: [] },
    { id: 'tier-d', title: 'D', color: '#2196f3', textColor: '#ffffff', items: [] },
];

// 未配置トークンプール
let tokenPool = [];

// ドラッグ中のデータ
let dragItem = null;

function init() {
    document.getElementById('generate-btn').addEventListener('click', generateTokens);
    document.getElementById('clear-pool-btn').addEventListener('click', clearPool);
    renderBoard();
    renderPool();
}

// Tier表を描画
function renderBoard() {
    const container = document.getElementById('tier-board');
    container.innerHTML = '';

    tiers.forEach((tier, tierIndex) => {
        const row = document.createElement('div');
        row.className = 'tier-row';
        row.dataset.tierIndex = tierIndex;
        row.style.borderLeft = `8px solid ${tier.color}`;

        const label = document.createElement('div');
        label.className = 'tier-label';
        label.textContent = tier.title;
        label.style.backgroundColor = tier.color;
        label.style.color = tier.textColor;

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'tier-items';
        itemsContainer.dataset.tierIndex = tierIndex;

        if (tier.items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-tier';
            empty.textContent = '未配置';
            itemsContainer.appendChild(empty);
        } else {
            tier.items.forEach((item, itemIndex) => {
                const itemEl = createDraggableItem(item, 'tier', tierIndex, itemIndex);
                itemsContainer.appendChild(itemEl);
            });
        }

        itemsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            itemsContainer.classList.add('drag-over');
        });
        itemsContainer.addEventListener('dragleave', () => {
            itemsContainer.classList.remove('drag-over');
        });
        itemsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            itemsContainer.classList.remove('drag-over');
            handleDropToTier(tierIndex, null);
        });

        row.appendChild(label);
        row.appendChild(itemsContainer);
        container.appendChild(row);
    });
}

// トークンプールを描画
function renderPool() {
    const pool = document.getElementById('token-pool');
    pool.innerHTML = '';
    pool.classList.toggle('empty', tokenPool.length === 0);

    if (tokenPool.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-tier';
        empty.textContent = '未配置トークンはありません';
        pool.appendChild(empty);
        return;
    }

    tokenPool.forEach((item, index) => {
        const el = createDraggableItem(item, 'pool', null, index);
        pool.appendChild(el);
    });

    pool.addEventListener('dragover', (e) => {
        e.preventDefault();
        pool.classList.add('drag-over');
    });
    pool.addEventListener('dragleave', () => {
        pool.classList.remove('drag-over');
    });
    pool.addEventListener('drop', (e) => {
        e.preventDefault();
        pool.classList.remove('drag-over');
        handleDropToPool();
    });
}

// ドラッグ可能なカードを生成
function createDraggableItem(item, source, tierIndex, itemIndex) {
    const el = document.createElement('div');
    el.className = 'tier-item';
    el.textContent = item.label;
    el.draggable = true;
    el.dataset.id = item.id;
    el.dataset.source = source;
    if (tierIndex !== null) el.dataset.tierIndex = tierIndex;
    if (itemIndex !== null) el.dataset.itemIndex = itemIndex;

    el.addEventListener('dragstart', (e) => {
        dragItem = {
            id: item.id,
            source,
            tierIndex,
            itemIndex,
        };
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
    });

    el.addEventListener('dragend', () => {
        dragItem = null;
        el.classList.remove('dragging');
    });

    // アイテム同士での並び替えに対応（同じTier内）
    el.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    el.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetTierIndex = tierIndex;
        const targetIndex = itemIndex;
        handleDropToTier(targetTierIndex, targetIndex);
    });

    return el;
}

// テキストからトークン生成
function generateTokens() {
    const textarea = document.getElementById('token-textarea');
    const lines = textarea.value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    const newTokens = lines.map((line) => ({
        id: `pool-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        label: line,
    }));

    tokenPool = tokenPool.concat(newTokens);
    textarea.value = '';
    renderPool();
}

// プールを空にする
function clearPool() {
    tokenPool = [];
    renderPool();
}

// プールへドロップ（Tierから戻す）
function handleDropToPool() {
    if (!dragItem) return;
    const item = takeDragItem();
    if (!item) return;
    tokenPool.push(item);
    renderBoard();
    renderPool();
}

// Tierへドロップ
// targetIndex が null のとき末尾に追加、それ以外はその位置に挿入
function handleDropToTier(targetTierIndex, targetIndex) {
    if (!dragItem) return;
    const item = takeDragItem();
    if (!item) return;

    const arr = tiers[targetTierIndex].items;
    const insertAt = targetIndex === null ? arr.length : targetIndex;
    arr.splice(insertAt, 0, item);

    renderBoard();
    renderPool();
}

// ドラッグ元から要素を抜き出す
function takeDragItem() {
    if (!dragItem) return null;
    const { source, tierIndex, itemIndex, id } = dragItem;

    if (source === 'pool') {
        const idx = tokenPool.findIndex((t) => t.id === id);
        if (idx === -1) return null;
        return tokenPool.splice(idx, 1)[0];
    }

    if (source === 'tier') {
        const idx = typeof itemIndex === 'number' ? itemIndex : tiers[tierIndex].items.findIndex((t) => t.id === id);
        if (idx === -1) return null;
        return tiers[tierIndex].items.splice(idx, 1)[0];
    }

    return null;
}

window.addEventListener('DOMContentLoaded', init);

