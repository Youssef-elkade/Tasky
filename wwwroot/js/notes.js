document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    const searchInput = document.getElementById('noteSearchInput');
    const emptyState = document.getElementById('emptyNotesState');
    const notesContainer = document.getElementById('notesContainer');
    const groups = document.querySelectorAll('.note-group');

    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        let globalVisibleCount = 0;

        groups.forEach(group => {
            let groupVisibleCount = 0;
            const cardsInGroup = group.querySelectorAll('.note-card-container');

            cardsInGroup.forEach(card => {
                const title = card.getAttribute('data-title') || '';
                const content = card.getAttribute('data-content') || '';

                if (title.includes(term) || content.includes(term)) {
                    card.style.display = 'block';
                    groupVisibleCount++;
                    globalVisibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            group.style.display = groupVisibleCount === 0 ? 'none' : 'block';
        });

        if (globalVisibleCount === 0) {
            notesContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        } else {
            notesContainer.classList.remove('hidden');
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    });

    const createNote = async (e) => {
        const btn = e.currentTarget;
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-50');
        }

        try {
            const res = await fetch('/Notes/CreateAjax', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: '', content: '', color: '#ffffff', isPinned: false })
            });

            if (res.ok) {
                window.location.reload();
            } else {
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50');
                }
            }
        } catch (error) {
            console.error(error);
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-50');
            }
        }
    };

    document.getElementById('createNoteBtn')?.addEventListener('click', createNote);
    document.getElementById('emptyStateCreateBtn')?.addEventListener('click', createNote);

    document.querySelectorAll('.note-card-container').forEach(container => {
        const card = container.querySelector('.note-card');
        const viewMode = card.querySelector('.note-view-mode');
        const editMode = card.querySelector('.note-edit-mode');
        const titleInput = card.querySelector('.note-title-input');
        const contentInput = card.querySelector('.note-content-input');
        const noteId = container.getAttribute('data-note-id');

        let originalTitle = titleInput.value;
        let originalContent = contentInput.value;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.note-actions')) return;
            if (!editMode.classList.contains('hidden')) return;

            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
            editMode.classList.add('flex');
            titleInput.focus();
        });

        const saveChanges = async () => {
            const newTitle = titleInput.value.trim();
            const newContent = contentInput.value.trim();

            if (newTitle !== originalTitle || newContent !== originalContent) {
                await fetch(`/Notes/UpdateAjax/${noteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle, content: newContent })
                });
                window.location.reload();
            } else {
                editMode.classList.add('hidden');
                editMode.classList.remove('flex');
                viewMode.classList.remove('hidden');
            }
        };

        card.addEventListener('focusout', (e) => {
            if (!card.contains(e.relatedTarget)) {
                saveChanges();
            }
        });

        card.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const color = btn.getAttribute('data-color');
                await fetch(`/Notes/UpdateAjax/${noteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ color: color })
                });
                window.location.reload();
            });
        });

        card.querySelector('.pin-btn')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isPinned = e.currentTarget.getAttribute('data-pinned') === 'true';
            await fetch(`/Notes/UpdateAjax/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !isPinned })
            });
            window.location.reload();
        });

        card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            pendingDeleteId = noteId;
            deleteModal.classList.remove('hidden');
            deleteModal.classList.add('flex');
        });
    });

    const deleteModal = document.getElementById('deleteConfirmModal');
    let pendingDeleteId = null;

    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        pendingDeleteId = null;
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex');
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        const res = await fetch(`/Notes/DeleteAjax/${pendingDeleteId}`, { method: 'DELETE' });
        if (res.ok) window.location.reload();
    });

    let draggedNote = null;

    document.querySelectorAll('.note-card-container').forEach(card => {
        const handle = card.querySelector('.drag-handle');

        handle?.addEventListener('mousedown', () => {
            card.setAttribute('data-dragging', 'true');
        });

        card.addEventListener('dragstart', (e) => {
            if (card.getAttribute('data-dragging') !== 'true') {
                e.preventDefault();
                return;
            }
            draggedNote = card;
            setTimeout(() => card.classList.add('opacity-40'), 0);
        });

        card.addEventListener('dragend', async () => {
            card.classList.remove('opacity-40');
            card.removeAttribute('data-dragging');
            if (draggedNote) {
                const currentGroup = draggedNote.closest('.drop-zone');
                const orderedIds = [...currentGroup.querySelectorAll('.note-card-container')]
                    .map(c => parseInt(c.getAttribute('data-note-id')));
                await fetch('/Notes/ReorderAjax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderedIds)
                });
            }
            draggedNote = null;
        });
    });

    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedNote && draggedNote.closest('.drop-zone') === zone) {
                const siblings = [...zone.querySelectorAll('.note-card-container:not(.opacity-40)')];
                const nextSibling = siblings.find(sibling => {
                    const box = sibling.getBoundingClientRect();
                    const offset = e.clientX - box.left - box.width / 2;
                    return offset < 0;
                });
                if (nextSibling) zone.insertBefore(draggedNote, nextSibling);
                else zone.appendChild(draggedNote);
            }
        });
    });
});