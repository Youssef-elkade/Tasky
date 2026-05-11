document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    let currentStatus = 'all';
    let currentPriority = 'all';
    let currentSearch = '';

    const taskSearchInput = document.getElementById('taskSearchInput');
    const statusBtns = document.querySelectorAll('.status-filter-btn');
    const priorityBtns = document.querySelectorAll('.priority-filter-btn');
    const taskCards = document.querySelectorAll('.task-card');
    const emptyState = document.getElementById('emptyTasksState');
    const inlineCreateTask = document.getElementById('inlineCreateTask');
    const tasksGrid = document.getElementById('tasksGrid');

    function updateVisibility() {
        let visibleCount = 0;
        let isCreating = !inlineCreateTask.classList.contains('hidden');

        taskCards.forEach(card => {
            const status = card.getAttribute('data-status');
            const priority = card.getAttribute('data-priority');
            const title = card.getAttribute('data-title') || '';

            const matchStatus = currentStatus === 'all' || status === currentStatus;
            const matchPriority = currentPriority === 'all' || priority === currentPriority;
            const matchSearch = currentSearch === '' || title.includes(currentSearch);

            if (matchStatus && matchPriority && matchSearch) {
                card.classList.remove('hidden');
                card.classList.add('flex');
                visibleCount++;
            } else {
                card.classList.add('hidden');
                card.classList.remove('flex');
            }
        });

        const canDrag = currentStatus === 'all' && currentPriority === 'all' && currentSearch === '';
        taskCards.forEach(card => card.setAttribute('draggable', canDrag ? 'true' : 'false'));

        if (visibleCount === 0 && !isCreating) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        } else {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    }

    taskSearchInput?.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        updateVisibility();
    });

    statusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStatus = btn.getAttribute('data-status');
            statusBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-primary-foreground');
                b.classList.add('bg-muted', 'text-muted-foreground');
            });
            btn.classList.add('bg-primary', 'text-primary-foreground');
            btn.classList.remove('bg-muted', 'text-muted-foreground');
            updateVisibility();
        });
    });

    priorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentPriority = btn.getAttribute('data-priority');
            priorityBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-primary-foreground');
                b.classList.add('bg-muted', 'text-muted-foreground');
            });
            btn.classList.add('bg-primary', 'text-primary-foreground');
            btn.classList.remove('bg-muted', 'text-muted-foreground');
            updateVisibility();
        });
    });

    const showAddingTaskBtn = document.getElementById('showAddingTaskBtn');
    const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
    const inlineTaskInput = document.getElementById('inlineTaskInput');
    const inlineConfirmBtn = document.getElementById('inlineConfirmBtn');
    const inlineCancelBtn = document.getElementById('inlineCancelBtn');

    function openInlineCreate() {
        inlineCreateTask.classList.remove('hidden');
        inlineCreateTask.classList.add('flex');
        inlineTaskInput.focus();
        updateVisibility();
    }

    function closeInlineCreate() {
        inlineCreateTask.classList.add('hidden');
        inlineCreateTask.classList.remove('flex');
        inlineTaskInput.value = '';
        inlineConfirmBtn.disabled = true;
        updateVisibility();
    }

    showAddingTaskBtn?.addEventListener('click', openInlineCreate);
    emptyStateCreateBtn?.addEventListener('click', openInlineCreate);
    inlineCancelBtn?.addEventListener('click', closeInlineCreate);

    inlineTaskInput?.addEventListener('input', (e) => {
        inlineConfirmBtn.disabled = e.target.value.trim() === '';
    });

    async function createTask() {
        const title = inlineTaskInput.value.trim();
        if (!title) return;

        inlineConfirmBtn.disabled = true;
        const res = await fetch('/Tasks/Create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, listId: null })
        });
        if (res.ok) window.location.reload();
        else inlineConfirmBtn.disabled = false;
    }

    inlineConfirmBtn?.addEventListener('click', createTask);
    inlineTaskInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !inlineConfirmBtn.disabled) createTask();
        if (e.key === 'Escape') closeInlineCreate();
    });

    document.querySelectorAll('.status-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const current = btn.getAttribute('data-current-status');
            const statuses = ["todo", "in_progress", "done", "cancelled"];
            const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
            const taskId = btn.closest('.task-card').getAttribute('data-task-id');

            const res = await fetch(`/Tasks/Update/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: next })
            });
            if (res.ok) window.location.reload();
        });
    });

    const deleteModal = document.getElementById('deleteConfirmModal');
    let pendingDeleteId = null;

    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            pendingDeleteId = btn.closest('.task-card').getAttribute('data-task-id');
            deleteModal.classList.remove('hidden');
            deleteModal.classList.add('flex');
        });
    });

    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        pendingDeleteId = null;
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex');
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        const res = await fetch(`/Tasks/Delete/${pendingDeleteId}`, { method: 'DELETE' });
        if (res.ok) window.location.reload();
    });

    let draggedCard = null;

    taskCards.forEach(card => {
        const handle = card.querySelector('.drag-handle');
        if (handle) {
            handle.addEventListener('mousedown', () => {
                if (card.getAttribute('draggable') === 'true') {
                    card.setAttribute('data-dragging', 'true');
                }
            });
        }

        card.addEventListener('dragstart', (e) => {
            if (card.getAttribute('draggable') === 'false' || card.getAttribute('data-dragging') !== 'true') {
                e.preventDefault();
                return;
            }
            draggedCard = card;
            setTimeout(() => card.classList.add('opacity-40'), 0);
        });

        card.addEventListener('dragend', async () => {
            card.classList.remove('opacity-40');
            card.removeAttribute('data-dragging');
            if (draggedCard) {
                const orderedIds = [...tasksGrid.querySelectorAll('.task-card')]
                    .map(c => parseInt(c.getAttribute('data-task-id')));
                await fetch('/Tasks/Reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderedIds)
                });
            }
            draggedCard = null;
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedCard && draggedCard !== card) {
                const box = card.getBoundingClientRect();
                const offset = e.clientY - box.top - box.height / 2;
                if (offset < 0) tasksGrid.insertBefore(draggedCard, card);
                else tasksGrid.insertBefore(draggedCard, card.nextSibling);
            }
        });
    });
});