// 固定Tierデータ
const tiers = [
    { id: 'tier-s', title: 'S', color: '#ff7875', textColor: '#000000', items: [] }, // 赤（少し濃いめ）
    { id: 'tier-a', title: 'A', color: '#ffc069', textColor: '#000000', items: [] }, // オレンジ（少し濃いめ）
    { id: 'tier-b', title: 'B', color: '#fff566', textColor: '#000000', items: [] }, // 黄（少し濃いめ）
    { id: 'tier-c', title: 'C', color: '#95de64', textColor: '#000000', items: [] }, // 緑（少し濃いめ）
    { id: 'tier-d', title: 'D', color: '#69c0ff', textColor: '#000000', items: [] }, // 青（少し濃いめ）
];

// 未配置トークンプール
let tokenPool = [];

// ドラッグ中のデータ
let dragItem = null;
let dragGhost = null; // タッチ操作用のゴースト要素

// モーダル関連の変数
const modal = document.getElementById('settings-modal');
const colorPicker = document.getElementById('tier-color-picker');
let currentSettingTierIndex = null;

function init() {
    document.getElementById('generate-btn').addEventListener('click', generateTokens);
    document.getElementById('clear-pool-btn').addEventListener('click', clearPool);

    // モーダル関連イベント
    document.getElementById('close-modal').addEventListener('click', closeSettings);
    colorPicker.addEventListener('input', changeTierColor);
    document.getElementById('add-tier-above-btn').addEventListener('click', () => addTier('above'));
    document.getElementById('add-tier-btn').addEventListener('click', () => addTier('below'));
    document.getElementById('delete-tier-btn').addEventListener('click', deleteTier);

    renderBoard();
    renderPool();
}

// 設定モーダルを開く
function openSettings(index) {
    currentSettingTierIndex = index;
    const tier = tiers[index];
    colorPicker.value = tier.color;
    modal.classList.remove('hidden');
}

// 設定モーダルを閉じる
function closeSettings() {
    modal.classList.add('hidden');
    currentSettingTierIndex = null;
}

// 色変更処理
function changeTierColor(e) {
    if (currentSettingTierIndex === null) return;
    const newColor = e.target.value;
    tiers[currentSettingTierIndex].color = newColor;
    renderBoard();
}

// Tierの追加
function addTier(position) {
    if (currentSettingTierIndex === null) return;

    const newTier = {
        id: `tier-${Date.now()}`,
        title: 'New',
        color: '#ffffff', // 白
        textColor: '#000000', // 黒
        items: []
    };

    // 挿入位置の決定
    const insertIndex = position === 'above' ? currentSettingTierIndex : currentSettingTierIndex + 1;

    // 指定位置に挿入
    tiers.splice(insertIndex, 0, newTier);
    closeSettings();
    renderBoard();
}

// Tierの削除
function deleteTier() {
    if (currentSettingTierIndex === null) return;

    // 削除するTierのアイテムをプールに戻す
    const deletedItems = tiers[currentSettingTierIndex].items;
    tokenPool = tokenPool.concat(deletedItems);

    tiers.splice(currentSettingTierIndex, 1);
    closeSettings();
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


        const label = document.createElement('div');
        label.className = 'tier-label';
        label.textContent = tier.title;
        label.style.backgroundColor = tier.color;
        label.style.color = tier.textColor;
        label.contentEditable = 'true';

        label.addEventListener('blur', () => {
            tier.title = label.textContent;
        });

        label.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                label.blur();
            }
        });

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

        // 設定ボタン（歯車）の追加
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'tier-settings-btn';
        settingsBtn.innerHTML = `
            <svg>
                <use href="#icon-settings"></use>
            </svg>
        `;
        settingsBtn.addEventListener('click', () => openSettings(tierIndex));

        row.appendChild(label);
        row.appendChild(itemsContainer);
        row.appendChild(settingsBtn);
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
        empty.textContent = '未配置カードはありません';
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



    // タッチデバイス対応
    setupTouchEvents(el, item, source, tierIndex, itemIndex);

    return el;
}

// タッチイベントの設定
function setupTouchEvents(el, item, source, tierIndex, itemIndex) {
    el.addEventListener('touchstart', (e) => {
        // マルチタッチ回避
        if (e.touches.length > 1) return;

        const touch = e.touches[0];

        // ドラッグ情報のセット
        dragItem = {
            id: item.id,
            source,
            tierIndex,
            itemIndex,
        };

        // ゴースト要素の作成
        dragGhost = el.cloneNode(true);
        dragGhost.style.position = 'fixed';
        dragGhost.style.pointerEvents = 'none'; // 下にある要素を判定できるように
        dragGhost.style.zIndex = '1000';
        dragGhost.style.opacity = '0.8';
        dragGhost.style.width = `${el.offsetWidth}px`;
        dragGhost.style.left = `${touch.clientX - el.offsetWidth / 2}px`;
        dragGhost.style.top = `${touch.clientY - el.offsetHeight / 2}px`;
        dragGhost.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';

        document.body.appendChild(dragGhost);
        el.classList.add('dragging');
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
        if (!dragGhost) return;
        e.preventDefault(); // スクロール防止

        const touch = e.touches[0];
        dragGhost.style.left = `${touch.clientX - dragGhost.offsetWidth / 2}px`;
        dragGhost.style.top = `${touch.clientY - dragGhost.offsetHeight / 2}px`;
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
        if (!dragGhost) return;

        const touch = e.changedTouches[0];
        // ドロップ位置にある要素を取得
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);

        handleTouchDrop(targetEl);

        // クリーンアップ
        document.body.removeChild(dragGhost);
        dragGhost = null;
        el.classList.remove('dragging');
        dragItem = null;
    });
}

// タッチ操作でのドロップ処理
function handleTouchDrop(targetEl) {
    if (!targetEl) return;

    // トークンプールへのドロップ判定
    if (targetEl.closest('.token-pool')) {
        handleDropToPool();
        return;
    }

    // Tier内のアイテムへのドロップ（並び替え）判定
    const targetItem = targetEl.closest('.tier-item');
    if (targetItem) {
        // 自分自身へのドロップは無視
        if (targetItem.dataset.id === dragItem.id) return;

        const targetTierIndex = parseInt(targetItem.dataset.tierIndex);
        const targetIndex = parseInt(targetItem.dataset.itemIndex);
        handleDropToTier(targetTierIndex, targetIndex);
        return;
    }

    // Tier行（空きスペース）へのドロップ判定
    const targetRow = targetEl.closest('.tier-items') || targetEl.closest('.tier-row');
    if (targetRow) {
        // .tier-itemsを探す
        const itemsContainer = targetRow.classList.contains('tier-items') ? targetRow : targetRow.querySelector('.tier-items');
        if (itemsContainer) {
            const tierIndex = parseInt(itemsContainer.dataset.tierIndex);
            handleDropToTier(tierIndex, null); // 末尾に追加
        }
    }
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

