document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('taskDetailsOverlay');
    const panel = document.getElementById('taskDetailsPanel');
    const closeBtn = document.getElementById('tpCloseBtn');
    const deleteBtn = document.getElementById('tpDeleteBtn');

    let currentTaskId = null;
    let debounceTimer = null;

    function openPanel(taskId) {
        currentTaskId = taskId;

        fetch(`/Tasks/Details/${taskId}`)
            .then(res => res.json())
            .then(data => populatePanel(data))
            .catch(err => console.error(err));

        overlay.classList.remove('hidden');
        panel.classList.remove('translate-x-full');
    }

    function closePanel() {
        panel.classList.add('translate-x-full');

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);

        currentTaskId = null;
    }

    if (overlay)
        overlay.addEventListener('click', closePanel);

    if (closeBtn)
        closeBtn.addEventListener('click', closePanel);

    document.querySelectorAll('.task-card, .task-row').forEach(task => {

        task.addEventListener('click', (e) => {

            if (
                e.target.closest('.status-toggle-btn') ||
                e.target.closest('.delete-task-btn') ||
                e.target.closest('.drag-handle')
            ) {
                return;
            }

            openPanel(task.getAttribute('data-task-id'));
        });
    });

    const titleInput = document.getElementById('tpTitle');
    const descInput = document.getElementById('tpDescription');
    const dateInput = document.getElementById('tpDueDate');
    const clearDateBtn = document.getElementById('tpClearDateBtn');
    const saveStatus = document.getElementById('tpSaveStatus');

    function showSaving() {
        if (saveStatus)
            saveStatus.textContent = "Saving...";
    }

    function showSaved() {
        if (saveStatus) {
            saveStatus.textContent = "Changes saved";

            setTimeout(() => {
                if (saveStatus.textContent === "Changes saved") {
                    saveStatus.textContent = "Changes saved automatically";
                }
            }, 2000);
        }
    }

    function updateTaskCard(patch) {
        if (!currentTaskId) return;

        const card =
            document.querySelector(`.task-card[data-task-id="${currentTaskId}"]`) ||
            document.querySelector(`.task-row[data-task-id="${currentTaskId}"]`);

        if (!card) return;

        if (patch.title !== undefined) {
            const titleEl =
                card.querySelector('p.text-sm.font-medium') ||
                card.querySelector('span.flex-1.text-sm');

            if (titleEl) {
                titleEl.textContent = patch.title || 'Untitled';
            }

            card.setAttribute(
                'data-title',
                (patch.title || '').toLowerCase()
            );
        }

        if (patch.status !== undefined) {

            card.setAttribute('data-status', patch.status);

            const statusBadge = card.querySelector('span.text-xs.px-2');
            const statusBtn = card.querySelector('.status-toggle-btn');
            const statusIcon = statusBtn?.querySelector('i');
            const titleEl =
                card.querySelector('p.text-sm.font-medium') ||
                card.querySelector('span.flex-1.text-sm');

            if (statusBadge) {

                statusBadge.textContent =
                    patch.status.replace('_', ' ');

                statusBadge.className =
                    `text-xs px-2 py-0.5 rounded-full font-medium capitalize ${patch.status === 'todo'
                        ? 'bg-muted text-muted-foreground'
                        : patch.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : patch.status === 'done'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`;
            }

            if (statusBtn) {
                statusBtn.setAttribute(
                    'data-current-status',
                    patch.status
                );
            }

            if (statusBtn) {

                const iconName =
                    patch.status === 'done'
                        ? 'check-circle-2'
                        : patch.status === 'in_progress'
                            ? 'clock'
                            : patch.status === 'cancelled'
                                ? 'x-circle'
                                : 'circle';

                const iconColor =
                    patch.status === 'done'
                        ? 'text-green-500'
                        : patch.status === 'in_progress'
                            ? 'text-blue-500'
                            : patch.status === 'cancelled'
                                ? 'text-red-400'
                                : 'text-slate-400';

                statusBtn.innerHTML = `
                    <i data-lucide="${iconName}" class="w-4 h-4 ${iconColor}"></i>
                    `;

                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }

            if (titleEl) {

                if (patch.status === 'done') {
                    titleEl.classList.add(
                        'line-through',
                        'text-muted-foreground'
                    );
                }
                else {
                    titleEl.classList.remove(
                        'line-through',
                        'text-muted-foreground'
                    );
                }
            }

            if (window.lucide)
                window.lucide.createIcons();
        }

        if (patch.priority !== undefined) {
            card.setAttribute('data-priority', patch.priority);

            const priorityBadge =
                card.querySelector('span.inline-flex');

            if (priorityBadge) {
                priorityBadge.innerHTML = `
                    ${patch.priority.charAt(0).toUpperCase() +
                    patch.priority.slice(1)
                    }
                `;

                priorityBadge.className =
                    `inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${patch.priority === 'urgent'
                    ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'
                        : patch.priority === 'high'
                        ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800'
                            : patch.priority === 'medium'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                                : patch.priority === 'low'
                                ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                    }`;

                if (window.lucide)
                    window.lucide.createIcons();
            }
        }

        if (patch.description !== undefined) {
            const descEl =
                card.querySelector('p.text-xs.text-muted-foreground');

            if (patch.description) {
                if (descEl) {
                    descEl.textContent = patch.description;
                } else {
                    const wrapper =
                        card.querySelector('.flex-1.min-w-0');

                    const p = document.createElement('p');

                    p.className =
                        'text-xs text-muted-foreground mt-1 line-clamp-2';

                    p.textContent = patch.description;

                    wrapper.appendChild(p);
                }
            } else if (descEl) {
                descEl.remove();
            }
        }

        if (patch.dueDate !== undefined) {
            let dueDateEl =
                card.querySelector('.task-due-date');

            if (patch.dueDate) {
                const date = new Date(patch.dueDate);

                if (!dueDateEl) {
                    dueDateEl = document.createElement('span');

                    dueDateEl.className =
                        'task-due-date text-xs flex items-center gap-0.5 ml-auto text-muted-foreground';

                    card.querySelector(
                        '.flex.items-center.gap-2.flex-wrap.mt-auto'
                    )?.appendChild(dueDateEl);
                }

                dueDateEl.innerHTML = `
                    <i data-lucide="calendar" class="w-3 h-3"></i>
                    ${date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })}
                `;
            } else if (dueDateEl) {
                dueDateEl.remove();
            }

            if (window.lucide)
                window.lucide.createIcons();
        }
    }

    async function savePatch(patch) {
        if (!currentTaskId) return;

        showSaving();

        try {
            await fetch(`/Tasks/Update/${currentTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patch)
            });

            showSaved();

            updateTaskCard(patch);
        }
        catch (e) {
            console.error(e);

            if (saveStatus)
                saveStatus.textContent = "Error saving";
        }
    }

    if (titleInput) {
        titleInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                savePatch({
                    title: titleInput.value
                });
            }, 500);
        });
    }

    if (descInput) {
        descInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                savePatch({
                    description: descInput.value
                });
            }, 500);
        });
    }

    if (dateInput) {
        dateInput.addEventListener('change', () => {
            const val = dateInput.value;

            savePatch({
                dueDate: val || null
            });

            if (val)
                clearDateBtn.classList.remove('hidden');
            else
                clearDateBtn.classList.add('hidden');
        });
    }

    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', () => {
            dateInput.value = '';

            savePatch({
                dueDate: null
            });

            clearDateBtn.classList.add('hidden');
        });
    }

    document.querySelectorAll('.tp-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const status =
                btn.getAttribute('data-status');

            updateButtonsState(
                '.tp-status-btn',
                btn
            );

            savePatch({ status });
        });
    });

    document.querySelectorAll('.tp-priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const priority =
                btn.getAttribute('data-priority');

            updateButtonsState(
                '.tp-priority-btn',
                btn
            );

            savePatch({ priority });
        });
    });

    function updateButtonsState(selector, activeBtn) {
        document.querySelectorAll(selector).forEach(b => {
            b.classList.remove(
                'bg-primary',
                'text-primary-foreground',
                'border-primary'
            );

            b.classList.add(
                'bg-card',
                'text-muted-foreground',
                'border-card-border'
            );
        });

        activeBtn.classList.add(
            'bg-primary',
            'text-primary-foreground',
            'border-primary'
        );

        activeBtn.classList.remove(
            'bg-card',
            'text-muted-foreground',
            'border-card-border'
        );
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const deleteModal =
                document.getElementById('deleteConfirmModal');

            const confirmBtn =
                document.getElementById('confirmDeleteBtn');

            const oldConfirm =
                confirmBtn.cloneNode(true);

            confirmBtn.parentNode.replaceChild(
                oldConfirm,
                confirmBtn
            );

            oldConfirm.addEventListener('click', async () => {
                await fetch(
                    `/Tasks/Delete/${currentTaskId}`,
                    { method: 'DELETE' }
                );

                window.location.reload();
            });

            deleteModal.classList.remove('hidden');
            deleteModal.classList.add('flex');
        });
    }

    function populatePanel(task) {
        document.getElementById('tpTaskId').value = task.id;

        if (titleInput)
            titleInput.value = task.title || '';

        if (descInput)
            descInput.value = task.description || '';

        if (dateInput) {
            if (task.dueDate) {
                dateInput.value =
                    task.dueDate.split('T')[0];

                clearDateBtn.classList.remove('hidden');
            }
            else {
                dateInput.value = '';

                clearDateBtn.classList.add('hidden');
            }
        }

        const activeStatusBtn =
            document.querySelector(
                `.tp-status-btn[data-status="${task.status || 'todo'}"]`
            );

        if (activeStatusBtn) {
            updateButtonsState(
                '.tp-status-btn',
                activeStatusBtn
            );
        }

        const activePriorityBtn =
            document.querySelector(
                `.tp-priority-btn[data-priority="${task.priority || 'medium'}"]`
            );

        if (activePriorityBtn) {
            updateButtonsState(
                '.tp-priority-btn',
                activePriorityBtn
            );
        }
    }
});