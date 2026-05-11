document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    const searchInput = document.getElementById('searchInput');
    const lists = document.querySelectorAll('.standalone-list');
    const container = document.getElementById('listsContainer');
    const emptyState = document.getElementById('emptySearchState');
    const deleteDialog = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const deleteModalTitle = document.getElementById('deleteModalTitle');
    const deleteModalDescription = document.getElementById('deleteModalDescription');

    let deleteAction = null;

    function openDeleteDialog(action, type = 'list') {
        deleteAction = action;

        if (type === 'task') {
            deleteModalTitle.textContent = 'Delete task?';
            deleteModalDescription.textContent =
                'This action cannot be undone. The task will be permanently removed.';

            confirmDeleteBtn.textContent = 'Delete task';
        } else {
            deleteModalTitle.textContent = 'Delete list?';
            deleteModalDescription.textContent =
                'This action cannot be undone. The list will be permanently removed.';

            confirmDeleteBtn.textContent = 'Delete list';
        }

        deleteDialog.classList.remove('hidden');
        deleteDialog.classList.add('flex');
    }

    function closeDeleteDialog() {
        deleteDialog.classList.add('hidden');
        deleteDialog.classList.remove('flex');

        deleteAction = null;
    }

    cancelDeleteBtn?.addEventListener('click', closeDeleteDialog);

    confirmDeleteBtn?.addEventListener('click', async () => {
        if (deleteAction) {
            await deleteAction();
        }

        closeDeleteDialog();
    });

    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        let count = 0;

        lists.forEach(list => {
            const title = list.getAttribute('data-list-title');
            const tasks = list.querySelectorAll('.task-row');
            let hasTaskMatch = false;

            tasks.forEach(t => {
                const taskTitle = t.getAttribute('data-task-title');
                if (taskTitle.includes(term)) {
                    t.style.display = 'flex';
                    hasTaskMatch = true;
                } else {
                    t.style.display = 'none';
                }
            });

            if (title.includes(term) || hasTaskMatch || !term) {
                list.style.display = 'flex';
                count++;
            } else {
                list.style.display = 'none';
            }
        });

        container.classList.toggle('hidden', count === 0);
        emptyState.classList.toggle('hidden', count > 0);
        emptyState.classList.toggle('flex', count === 0);
    });

    const triggerBtn = document.getElementById('triggerAddListCard');
    const createCard = document.getElementById('createListCard');
    const newListInput = document.getElementById('newListInput');

    const toggleCreate = (show) => {
        createCard.classList.toggle('hidden', !show);
        triggerBtn.classList.toggle('hidden', show);
        if (show) newListInput.focus();
    };

    triggerBtn?.addEventListener('click', () => toggleCreate(true));
    document.getElementById('cancelCreateList')?.addEventListener('click', () => toggleCreate(false));
    document.getElementById('showCreateListBtn')?.addEventListener('click', () => toggleCreate(true));

    document.getElementById('confirmCreateList')?.addEventListener('click', async () => {
        const title = newListInput.value.trim();
        if (!title) return;
        const res = await fetch('/Lists/CreateAjax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, boardId: null })
        });
        if (res.ok) window.location.reload();
    });

    newListInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('confirmCreateList')?.click();
        }
    });

    document.querySelectorAll('.standalone-list').forEach(list => {
        const listId = list.getAttribute('data-list-id');
        const titleDisplay = list.querySelector('.list-title-display');
        const titleInput = list.querySelector('.list-title-input');

        if (titleDisplay && titleInput) {
            titleDisplay.addEventListener('dblclick', () => {
                titleDisplay.classList.add('hidden');
                titleInput.classList.remove('hidden');
                titleInput.focus();
            });

            const saveTitle = async () => {
                titleDisplay.classList.remove('hidden');
                titleInput.classList.add('hidden');
                const newTitle = titleInput.value.trim();

                if (newTitle !== '' && newTitle !== titleDisplay.textContent.trim()) {
                    titleDisplay.textContent = newTitle;
                    await fetch(`/Lists/UpdateAjax/${listId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: newTitle })
                    });
                } else {
                    titleInput.value = titleDisplay.textContent.trim();
                }
            };

            titleInput.addEventListener('blur', saveTitle);
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') titleInput.blur();
            });
        }

        list.querySelector('.delete-list-btn')?.addEventListener('click', async () => {
            openDeleteDialog(async () => {
                const res = await fetch(`/Lists/DeleteAjax/${listId}`, {
                    method: 'DELETE'
                });

                if (res.ok)
                    window.location.reload();
            }, 'list');
        });

        const trigger = list.querySelector('.add-task-trigger');
        const inlineInput = list.querySelector('.inline-task-input');
        const inputField = list.querySelector('.new-task-input');

        trigger?.addEventListener('click', () => {
            trigger.classList.add('hidden');
            inlineInput.classList.remove('hidden');
            inlineInput.classList.add('flex');
            inputField.focus();
        });

        list.querySelector('.cancel-task-btn')?.addEventListener('click', () => {
            trigger.classList.remove('hidden');
            inlineInput.classList.add('hidden');
            inlineInput.classList.remove('flex');
            inputField.value = '';
        });

        const saveTask = async () => {
            const title = inputField.value.trim();
            if (!title) return;
            const res = await fetch('/Tasks/Create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, listId: parseInt(listId) })
            });
            if (res.ok) window.location.reload();
        };

        list.querySelector('.confirm-task-btn')?.addEventListener('click', saveTask);
        inputField?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveTask();
        });
    });

    document.querySelectorAll('.task-row').forEach(task => {
        const taskId = task.getAttribute('data-task-id');

        task.querySelector('.delete-task-btn')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            openDeleteDialog(async () => {
                const res = await fetch(`/Tasks/Delete/${taskId}`, {
                    method: 'DELETE'
                });

                if (res.ok)
                    window.location.reload();
            }, 'task');
        });

        task.querySelector('.status-toggle-btn')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            const currentStatus = btn.getAttribute('data-status');
            const statuses = ["todo", "in_progress", "done", "cancelled"];
            const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

            const res = await fetch(`/Tasks/Update/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) window.location.reload();
        });
    });

    let draggedElement = null;

    document.querySelectorAll('.standalone-list').forEach(list => {
        const handle = list.querySelector('.list-drag-handle');
        if (handle) {
            list.setAttribute('draggable', 'true');
            list.addEventListener('dragstart', (e) => {
                if (!e.target.classList.contains('standalone-list')) return;
                draggedElement = list;
                setTimeout(() => list.classList.add('opacity-40'), 0);
            });
            list.addEventListener('dragend', async () => {
                list.classList.remove('opacity-40');
                if (draggedElement) {
                    const orderedIds = [...container.querySelectorAll('.standalone-list')]
                        .map(l => parseInt(l.getAttribute('data-list-id')));
                    await fetch('/Lists/ReorderLists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderedIds)
                    });
                }
                draggedElement = null;
            });
        }

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedElement && draggedElement.classList.contains('standalone-list')) {
                const siblings = [...container.querySelectorAll('.standalone-list:not(.opacity-40)')];
                const nextSibling = siblings.find(sibling => {
                    const box = sibling.getBoundingClientRect();
                    const offset = e.clientX - box.left - box.width / 2;
                    return offset < 0;
                });
                if (nextSibling) container.insertBefore(draggedElement, nextSibling);
                else container.insertBefore(draggedElement, document.getElementById('createListCard'));
            }
        });
    });

    document.querySelectorAll('.task-row').forEach(task => {
        task.setAttribute('draggable', 'true');
        task.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            draggedElement = task;
            setTimeout(() => task.classList.add('opacity-40'), 0);
        });
        task.addEventListener('dragend', async (e) => {
            e.stopPropagation();
            task.classList.remove('opacity-40');

            if (draggedElement) {
                const currentContainer = draggedElement.closest('.tasks-area');
                const listId = currentContainer.closest('.standalone-list').getAttribute('data-list-id');
                const orderedIds = [...currentContainer.querySelectorAll('.task-row')]
                    .map(t => parseInt(t.getAttribute('data-task-id')));
                const taskId = draggedElement.getAttribute('data-task-id');

                await fetch('/Tasks/Move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: parseInt(taskId), data: { listId: parseInt(listId), position: orderedIds.indexOf(parseInt(taskId)) } })
                });
            }
            draggedElement = null;
        });
    });

    document.querySelectorAll('.tasks-area').forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedElement && draggedElement.classList.contains('task-row')) {
                const innerContainer = area.querySelector('.divide-y');
                const siblings = [...innerContainer.querySelectorAll('.task-row:not(.opacity-40)')];
                const nextSibling = siblings.find(sibling => {
                    const box = sibling.getBoundingClientRect();
                    const offset = e.clientY - box.top - box.height / 2;
                    return offset < 0;
                });
                if (nextSibling) innerContainer.insertBefore(draggedElement, nextSibling);
                else innerContainer.appendChild(draggedElement);
            }
        });
    });
});