document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const searchInput = document.getElementById('canvasSearchInput');
    const emptyState = document.getElementById('emptyCanvasesState');
    const grid = document.getElementById('canvasesGrid');

    const getCards = () => [...document.querySelectorAll('.canvas-card')];

    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();

        let visibleCount = 0;

        getCards().forEach(card => {
            const title = card.dataset.title || '';
            const content = card.dataset.content || '';

            const visible =
                title.includes(term) ||
                content.includes(term);

            card.style.display = visible ? 'block' : 'none';

            if (visible) {
                visibleCount++;
            }
        });

        if (visibleCount === 0) {
            grid.classList.add('hidden');

            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        } else {
            grid.classList.remove('hidden');

            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    });

    const createBtn = document.getElementById('createCanvasBtn');
    const createBtnEmpty = document.getElementById('emptyStateCreateBtn');

    const handleCreate = async () => {
        try {
            const res = await fetch('/Canvases/CreateAjax', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: ''
                })
            });

            if (res.ok) {
                const newCanvas = await res.json();

                window.location.href = `/Canvases/Details/${newCanvas.id}`;
            }
        } catch (err) {
            console.error(err);
        }
    };

    createBtn?.addEventListener('click', handleCreate);
    createBtnEmpty?.addEventListener('click', handleCreate);

    const deleteModal = document.getElementById('deleteCanvasConfirmModal');

    let pendingDeleteId = null;

    document.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-canvas-btn');

        if (!deleteBtn) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        pendingDeleteId = deleteBtn
            .closest('.canvas-card')
            .dataset.canvasId;

        deleteModal.classList.remove('hidden');
        deleteModal.classList.add('flex');
    });

    document.getElementById('cancelDeleteCanvasBtn')
        ?.addEventListener('click', () => {

            pendingDeleteId = null;

            deleteModal.classList.add('hidden');
            deleteModal.classList.remove('flex');
        });

    document.getElementById('confirmDeleteCanvasBtn')
        ?.addEventListener('click', async () => {

            if (!pendingDeleteId) {
                return;
            }

            const res = await fetch(
                `/Canvases/DeleteAjax/${pendingDeleteId}`,
                {
                    method: 'DELETE'
                }
            );

            if (res.ok) {
                window.location.reload();
            }
        });

    let draggedCard = null;

    document.querySelectorAll('.drag-handle').forEach(handle => {

        handle.addEventListener('mousedown', () => {

            const card = handle.closest('.canvas-card');

            if (!card) {
                return;
            }

            card.draggable = true;
        });
    });

    document.querySelectorAll('.canvas-card').forEach(card => {

        card.addEventListener('dragstart', (e) => {

            draggedCard = card;

            card.classList.add('opacity-40');

            e.dataTransfer.effectAllowed = 'move';

            e.dataTransfer.setData('text/plain', card.dataset.canvasId);
        });

        card.addEventListener('dragend', async () => {

            card.classList.remove('opacity-40');

            card.draggable = false;

            const orderedIds = getCards().map(c =>
                parseInt(c.dataset.canvasId)
            );

            try {
                await fetch('/Canvases/ReorderAjax', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderedIds)
                });
            } catch (err) {
                console.error(err);
            }

            draggedCard = null;
        });

        card.addEventListener('dragover', (e) => {

            e.preventDefault();

            if (!draggedCard || draggedCard === card) {
                return;
            }

            const rect = card.getBoundingClientRect();

            const offset = e.clientY - rect.top;

            if (offset < rect.height / 2) {
                grid.insertBefore(draggedCard, card);
            } else {
                grid.insertBefore(draggedCard, card.nextSibling);
            }
        });
    });
});