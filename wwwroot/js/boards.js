document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('createBoardModal');
    const modalContent = document.getElementById('createBoardModalContent');
    const openBtns = [document.getElementById('openCreateBoard'), document.getElementById('emptyCreateBoard')];
    const closeBtns = [document.getElementById('closeCreateBoard'), document.getElementById('cancelCreateBoard')];

    const openModal = () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => document.getElementById('boardTitleInput').focus(), 100);
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    openBtns.forEach(btn => btn?.addEventListener('click', openModal));
    closeBtns.forEach(btn => btn?.addEventListener('click', closeModal));
    modal.addEventListener('click', closeModal);
    modalContent.addEventListener('click', (e) => e.stopPropagation());

    const titleInput = document.getElementById('boardTitleInput');
    const previewTitle = document.getElementById('previewTitle');
    const submitBtn = document.getElementById('submitCreateBoard');

    titleInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        previewTitle.textContent = val || 'Board name';
        submitBtn.disabled = val.length === 0;
    });

    const colorButtons = document.querySelectorAll('.board-color');
    const colorInput = document.getElementById('boardColorInput');
    const boardPreview = document.getElementById('boardPreview');

    const updateColor = (colorEl) => {
        const color = colorEl.getAttribute('data-color');
        colorInput.value = color;
        boardPreview.style.backgroundColor = color;

        colorButtons.forEach(btn => {
            btn.style.borderColor = 'transparent';
            btn.style.outline = 'none';
            btn.innerHTML = '';
        });

        colorEl.style.borderColor = 'white';
        colorEl.style.outline = `2px solid ${color}`;
        colorEl.style.outlineOffset = '2px';
        colorEl.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-white" stroke-width="3"></i>`;
        if (window.lucide) window.lucide.createIcons();
    };

    colorButtons.forEach(btn => btn.addEventListener('click', () => updateColor(btn)));
    const defaultColorBtn = document.querySelector('.board-color[data-color="#6366f1"]');
    if (defaultColorBtn) updateColor(defaultColorBtn);

    const typeButtons = document.querySelectorAll('.board-type');
    const typeInput = document.getElementById('boardTypeInput');

    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const type = btn.getAttribute('data-type');
            typeInput.value = type === 'collective' ? 'true' : 'false';

            typeButtons.forEach(b => {
                b.classList.remove('bg-primary', 'text-primary-foreground', 'border-primary');
                b.classList.add('bg-card', 'text-muted-foreground', 'border-card-border');
            });

            btn.classList.add('bg-primary', 'text-primary-foreground', 'border-primary');
            btn.classList.remove('bg-card', 'text-muted-foreground', 'border-card-border');
        });
    });

    const searchInput = document.getElementById('boardSearch');
    const filterButtons = document.querySelectorAll('.board-filter');
    const boardItems = document.querySelectorAll('.board-item');
    const boardsGrid = document.getElementById('boardsGrid');
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    const emptyStateTitle = document.getElementById('emptyStateTitle');
    const emptyStateDesc = document.getElementById('emptyStateDesc');
    const emptyCreateBoardBtn = document.getElementById('emptyCreateBoard');

    let currentFilter = 'all';
    let currentSearch = '';

    const updateVisibility = () => {
        let visibleCount = 0;
        boardItems.forEach(item => {
            const type = item.getAttribute('data-type');
            const title = item.getAttribute('data-title') || '';
            const desc = item.getAttribute('data-description') || '';

            let matchesFilter = (currentFilter === 'all') || (currentFilter === type);
            let matchesSearch = currentSearch === '' || title.includes(currentSearch) || desc.includes(currentSearch);

            if (matchesFilter && matchesSearch) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            emptyStateContainer.classList.remove('hidden');
            emptyStateContainer.classList.add('flex');
            boardsGrid.classList.add('hidden');

            if (currentSearch !== '') {
                emptyStateTitle.textContent = "No boards match your search";
                emptyStateDesc.textContent = "Try a different search term";
                emptyCreateBoardBtn.classList.add('hidden');
            } else {
                emptyStateTitle.textContent = "No boards yet";
                emptyStateDesc.textContent = "Create your first board to get started";
                emptyCreateBoardBtn.classList.remove('hidden');
                emptyCreateBoardBtn.classList.add('inline-flex');
            }
        } else {
            emptyStateContainer.classList.add('hidden');
            emptyStateContainer.classList.remove('flex');
            boardsGrid.classList.remove('hidden');
        }

        const canDrag = currentFilter === 'all' && currentSearch === '';
        boardItems.forEach(item => item.setAttribute('draggable', canDrag ? 'true' : 'false'));
    };

    searchInput?.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        updateVisibility();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled || btn.classList.contains('cursor-not-allowed')) return;
            currentFilter = btn.getAttribute('data-filter');
            filterButtons.forEach(b => {
                b.classList.remove('bg-primary', 'text-primary-foreground');
                b.classList.add('text-muted-foreground');
            });
            btn.classList.add('bg-primary', 'text-primary-foreground');
            btn.classList.remove('text-muted-foreground');
            updateVisibility();
        });
    });

    let draggedItem = null;

    boardItems.forEach(item => {

        item.setAttribute('draggable', 'true');

        item.addEventListener('dragstart', (e) => {

            if (item.getAttribute('draggable') === 'false') {
                e.preventDefault();
                return;
            }

            draggedItem = item;

            e.dataTransfer.effectAllowed = 'move';

            setTimeout(() => {
                item.classList.add('opacity-40');
            }, 0);
        });

        item.addEventListener('dragend', async () => {

            if (!draggedItem)
                return;

            draggedItem.classList.remove('opacity-40');

            const orderedIds = [
                ...boardsGrid.querySelectorAll('.board-item')
            ].map(x => parseInt(x.getAttribute('data-id')));

            draggedItem = null;

            try {

                await fetch('/Boards/Reorder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        orderedIds
                    })
                });

            } catch (e) {
                console.error(e);
            }
        });

        item.addEventListener('dragover', (e) => {

            e.preventDefault();

            if (!draggedItem || draggedItem === item)
                return;

            const rect = item.getBoundingClientRect();

            const offset =
                e.clientY - rect.top - rect.height / 2;

            if (offset > 0)
                item.after(draggedItem);
            else
                item.before(draggedItem);
        });
    });
});