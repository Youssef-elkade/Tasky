document.addEventListener('DOMContentLoaded', () => {

    if (window.lucide)
        window.lucide.createIcons();


    document.querySelectorAll('.status-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {

            e.stopPropagation();

            const next =
                btn.getAttribute('data-next-status');

            const taskElement =
                btn.closest('.task-card') ||
                btn.closest('.task-row');

            if (!taskElement) return;

            const taskId =
                taskElement.getAttribute('data-task-id');

            const res = await fetch(
                `/Tasks/Update/${taskId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        status: next
                    })
                }
            );

            if (res.ok)
                window.location.reload();
        });
    });

    const token =
        document.querySelector(
            'input[name="__RequestVerificationToken"]'
        )?.value;

    const boardId =
        document.getElementById('listsContainer')
            ?.getAttribute('data-board-id');

    const listsContainer =
        document.getElementById('listsContainer');

    const addListBtn =
        document.getElementById('addListBtn');

    const triggerAddListBtn =
        document.getElementById('triggerAddListBtn');

    const newListContainer =
        document.getElementById('newListContainer');

    const addListTriggerContainer =
        document.getElementById('addListTriggerContainer');

    const cancelAddListBtn =
        document.getElementById('cancelAddListBtn');

    const confirmAddListBtn =
        document.getElementById('confirmAddListBtn');

    const newListTitleInput =
        document.getElementById('newListTitleInput');

    const inviteMemberBtn =
        document.getElementById('inviteMemberBtn');

    const inviteMemberInput =
        document.getElementById('inviteMemberInput');

    const toggleMembersBtn =
        document.getElementById('toggleMembersBtn');

    const membersPanel =
        document.getElementById('membersPanel');

    const closeMembersBtn =
        document.getElementById('closeMembersBtn');

    if (confirmAddListBtn)
        confirmAddListBtn.type = 'button';

    if (cancelAddListBtn)
        cancelAddListBtn.type = 'button';

    if (inviteMemberBtn)
        inviteMemberBtn.type = 'button';

    if (toggleMembersBtn && membersPanel) {

        const togglePanel = () => {

            const isHidden =
                membersPanel.classList.contains('hidden');

            if (isHidden) {

                membersPanel.classList.remove('hidden');
                membersPanel.classList.add('flex');

            } else {

                membersPanel.classList.add('hidden');
                membersPanel.classList.remove('flex');
            }
        };

        toggleMembersBtn.addEventListener(
            'click',
            togglePanel
        );

        if (closeMembersBtn)
            closeMembersBtn.addEventListener(
                'click',
                togglePanel
            );
    }

    const showAddList = () => {

        if (!newListContainer) return;

        newListContainer.classList.remove('hidden');

        if (addListTriggerContainer)
            addListTriggerContainer.classList.add('hidden');

        newListTitleInput.focus();
    };

    const hideAddList = () => {

        if (!newListContainer) return;

        newListContainer.classList.add('hidden');

        if (addListTriggerContainer)
            addListTriggerContainer.classList.remove('hidden');

        newListTitleInput.value = '';
    };

    if (addListBtn)
        addListBtn.addEventListener(
            'click',
            showAddList
        );

    if (triggerAddListBtn)
        triggerAddListBtn.addEventListener(
            'click',
            showAddList
        );

    if (cancelAddListBtn)
        cancelAddListBtn.addEventListener(
            'click',
            hideAddList
        );

    if (confirmAddListBtn) {

        confirmAddListBtn.type = 'button';

        const createList = async () => {

            const title =
                newListTitleInput.value.trim();

            if (!title) return;

            confirmAddListBtn.disabled = true;

            try {

                const res = await fetch(
                    '/Lists/CreateAjax',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body: JSON.stringify({
                            title: title,
                            boardId: Number(boardId)
                        })
                    }
                );

                if (!res.ok) {

                    console.error(
                        await res.text()
                    );

                    confirmAddListBtn.disabled = false;

                    return;
                }

                window.location.reload();

            } catch (e) {

                console.error(e);

                confirmAddListBtn.disabled = false;
            }
        };

        confirmAddListBtn.addEventListener(
            'click',
            (e) => {

                e.preventDefault();
                e.stopImmediatePropagation();

                createList();
            }
        );

        newListTitleInput.addEventListener(
            'keydown',
            (e) => {

                if (e.key === 'Enter') {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    createList();
                }

                if (e.key === 'Escape')
                    hideAddList();
            }
        );
    }

    if (newListTitleInput) {

        newListTitleInput.addEventListener(
            'keydown',
            (e) => {

                if (e.key === 'Enter') {

                    e.preventDefault();

                    confirmAddListBtn.click();
                }

                if (e.key === 'Escape')
                    hideAddList();
            }
        );
    }

    if (inviteMemberInput && inviteMemberBtn) {

        inviteMemberInput.addEventListener(
            'input',
            (e) => {

                inviteMemberBtn.disabled =
                    e.target.value.trim() === '';
            }
        );

        const inviteAction = async () => {

            const identifier =
                inviteMemberInput.value.trim();

            if (!identifier) return;

            try {

                const formData =
                    new FormData();

                formData.append(
                    'boardId',
                    boardId
                );

                formData.append(
                    'identifier',
                    identifier
                );

                const res = await fetch(
                    '/BoardMembers/Add',
                    {
                        method: 'POST',
                        headers: {
                            'RequestVerificationToken':
                                token
                        },
                        body: formData
                    }
                );

                if (res.ok)
                    window.location.reload();

            } catch (e) {
                console.error(e);
            }
        };

        inviteMemberBtn.addEventListener(
            'click',
            inviteAction
        );

        inviteMemberInput.addEventListener(
            'keydown',
            (e) => {

                if (e.key === 'Enter') {

                    e.preventDefault();

                    inviteAction();
                }
            }
        );
    }

    document.querySelectorAll(
        '.remove-member-btn'
    ).forEach(btn => {

        btn.addEventListener(
            'click',
            async (e) => {

                const userId =
                    e.target
                        .closest('.member-item')
                        .getAttribute('data-user-id');

                const params =
                    new URLSearchParams();

                params.append(
                    'boardId',
                    boardId
                );

                params.append(
                    'userId',
                    userId
                );

                await fetch(
                    '/BoardMembers/Remove',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/x-www-form-urlencoded',
                            'RequestVerificationToken':
                                token
                        },
                        body: params
                    }
                );

                window.location.reload();
            }
        );
    });

    document.querySelectorAll(
        '.update-role-btn'
    ).forEach(btn => {

        btn.addEventListener(
            'click',
            async (e) => {

                const userId =
                    e.target
                        .closest('.member-item')
                        .getAttribute('data-user-id');

                const role =
                    btn.getAttribute('data-role');

                const params =
                    new URLSearchParams();

                params.append(
                    'boardId',
                    boardId
                );

                params.append(
                    'userId',
                    userId
                );

                params.append(
                    'role',
                    role
                );

                await fetch(
                    '/BoardMembers/ChangeRole',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/x-www-form-urlencoded',
                            'RequestVerificationToken':
                                token
                        },
                        body: params
                    }
                );

                window.location.reload();
            }
        );
    });

    if (listsContainer) {

        let draggedList = null;

        document.querySelectorAll('.kanban-column')
            .forEach(column => {

                const listId =
                    column.getAttribute('data-list-id');

                const handle =
                    column.querySelector(
                        '.list-drag-handle'
                    );

                if (handle) {

                    column.setAttribute(
                        'draggable',
                        'true'
                    );

                    column.addEventListener(
                        'dragstart',
                        (e) => {

                            if (
                                !e.target.classList.contains(
                                    'kanban-column'
                                )
                            ) return;

                            draggedList = column;

                            setTimeout(() => {
                                column.classList.add(
                                    'opacity-50'
                                );
                            }, 0);
                        }
                    );

                    column.addEventListener(
                        'dragend',
                        async () => {

                            if (!draggedList) return;

                            draggedList.classList.remove(
                                'opacity-50'
                            );

                            const orderedIds =
                                [
                                    ...listsContainer.querySelectorAll(
                                        '.kanban-column'
                                    )
                                ].map(col =>
                                    parseInt(
                                        col.getAttribute(
                                            'data-list-id'
                                        )
                                    )
                                );

                            draggedList = null;

                            await fetch(
                                '/Lists/Reorder',
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type':
                                            'application/json',
                                        'RequestVerificationToken':
                                            token
                                    },
                                    body: JSON.stringify({
                                        boardId:
                                            parseInt(boardId),
                                        orderedIds
                                    })
                                }
                            );
                        }
                    );
                }

                column.addEventListener(
                    'dragover',
                    (e) => {

                        e.preventDefault();

                        if (draggedList) {

                            const siblings =
                                [
                                    ...listsContainer.querySelectorAll(
                                        '.kanban-column:not(.opacity-50)'
                                    )
                                ];

                            const nextSibling =
                                siblings.find(
                                    sibling => {

                                        const box =
                                            sibling.getBoundingClientRect();

                                        const offset =
                                            e.clientX -
                                            box.left -
                                            box.width / 2;

                                        return offset < 0;
                                    }
                                );

                            if (nextSibling)
                                listsContainer.insertBefore(
                                    draggedList,
                                    nextSibling
                                );
                            else
                                listsContainer.appendChild(
                                    draggedList
                                );
                        }
                    }
                );

                const triggerAddTaskBtn =
                    column.querySelector(
                        '.trigger-add-task-btn'
                    );

                const inlineTaskInput =
                    column.querySelector(
                        '.inline-task-input'
                    );

                const cancelAddTaskBtn =
                    column.querySelector(
                        '.cancel-add-task-btn'
                    );

                const confirmAddTaskBtn =
                    column.querySelector(
                        '.confirm-add-task-btn'
                    );

                const newTaskInput =
                    column.querySelector(
                        '.new-task-input'
                    );

                if (
                    triggerAddTaskBtn &&
                    inlineTaskInput
                ) {

                    triggerAddTaskBtn.addEventListener(
                        'click',
                        () => {

                            triggerAddTaskBtn.classList.add(
                                'hidden'
                            );

                            inlineTaskInput.classList.remove(
                                'hidden'
                            );

                            newTaskInput.focus();
                        }
                    );

                    const hideAddTask = () => {

                        inlineTaskInput.classList.add(
                            'hidden'
                        );

                        triggerAddTaskBtn.classList.remove(
                            'hidden'
                        );

                        newTaskInput.value = '';
                    };

                    cancelAddTaskBtn.addEventListener(
                        'click',
                        hideAddTask
                    );

                    const saveTask = async () => {

                        const title =
                            newTaskInput.value.trim();

                        if (!title) return;

                        try {

                            const res =
                                await fetch(
                                    '/Tasks/Create',
                                    {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type':
                                                'application/json',
                                            'RequestVerificationToken':
                                                token
                                        },
                                        body: JSON.stringify({
                                            title,
                                            listId:
                                                parseInt(listId)
                                        })
                                    }
                                );

                            if (res.ok)
                                window.location.reload();

                        } catch (e) {
                            console.error(e);
                        }
                    };

                    confirmAddTaskBtn.addEventListener(
                        'click',
                        saveTask
                    );

                    newTaskInput.addEventListener(
                        'keydown',
                        (e) => {

                            if (e.key === 'Enter')
                                saveTask();

                            if (e.key === 'Escape')
                                hideAddTask();
                        }
                    );
                }
            });

        let draggedTask = null;

        document.querySelectorAll('.task-card')
            .forEach(task => {

                task.addEventListener(
                    'dragstart',
                    () => {

                        draggedTask = task;

                        setTimeout(() => {

                            task.classList.add(
                                'opacity-50'
                            );

                        }, 0);
                    }
                );

                task.addEventListener(
                    'dragend',
                    async () => {

                        if (!draggedTask)
                            return;

                        draggedTask.classList.remove(
                            'opacity-50'
                        );

                        const targetList =
                            draggedTask.closest(
                                '.kanban-column'
                            );

                        if (!targetList) {

                            draggedTask = null;

                            return;
                        }

                        const listId =
                            parseInt(
                                targetList.getAttribute(
                                    'data-list-id'
                                )
                            );

                        const orderedTaskIds =
                            [
                                ...targetList.querySelectorAll(
                                    '.task-card'
                                )
                            ].map(task =>
                                parseInt(
                                    task.getAttribute(
                                        'data-task-id'
                                    )
                                )
                            );

                        try {

                            await fetch(
                                '/Tasks/Reorder',
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type':
                                            'application/json',
                                        'RequestVerificationToken':
                                            token
                                    },
                                    body: JSON.stringify({
                                        listId,
                                        orderedTaskIds
                                    })
                                }
                            );

                        } catch (e) {

                            console.error(e);
                        }

                        draggedTask = null;
                    }
                );
            });

        document.querySelectorAll(
            '.tasks-container'
        ).forEach(container => {

            container.addEventListener(
                'dragover',
                e => {

                    e.preventDefault();

                    if (!draggedTask)
                        return;

                    const afterElement =
                        [
                            ...container.querySelectorAll(
                                '.task-card:not(.opacity-50)'
                            )
                        ].find(el => {

                            const rect =
                                el.getBoundingClientRect();

                            return (
                                e.clientY <
                                rect.top +
                                rect.height / 2
                            );
                        });

                    if (afterElement)
                        container.insertBefore(
                            draggedTask,
                            afterElement
                        );
                    else
                        container.appendChild(
                            draggedTask
                        );
                }
            );
        });
    }

    let deleteListId = null;

    const deleteModal =
        document.getElementById(
            'deleteConfirmModal'
        );

    const deleteModalTitle =
        document.getElementById(
            'deleteModalTitle'
        );

    const deleteModalDesc =
        document.getElementById(
            'deleteModalDesc'
        );

    const cancelDeleteBtn =
        document.getElementById(
            'cancelDeleteBtn'
        );

    const confirmDeleteBtn =
        document.getElementById(
            'confirmDeleteBtn'
        );

    let deleteBoardMode = false;

    document.addEventListener(
        'click',
        async (e) => {

            const deleteListBtn =
                e.target.closest('.delete-list-btn');

            if (deleteListBtn) {

                deleteBoardMode = false;

                deleteListId =
                    deleteListBtn.getAttribute(
                        'data-list-id'
                    );

                const listTitle =
                    deleteListBtn.getAttribute(
                        'data-list-title'
                    );

                deleteModalTitle.textContent =
                    'Delete list?';

                deleteModalDesc.textContent =
                    `Are you sure you want to delete "${listTitle}" ?`;

                deleteModal.classList.remove(
                    'hidden'
                );

                deleteModal.classList.add(
                    'flex'
                );

                return;
            }

            const deleteBoardBtn =
                e.target.closest('#deleteBoardBtn');

            if (deleteBoardBtn) {

                deleteBoardMode = true;

                deleteModalTitle.textContent =
                    'Delete board?';

                deleteModalDesc.textContent =
                    'This action cannot be undone.';

                deleteModal.classList.remove(
                    'hidden'
                );

                deleteModal.classList.add(
                    'flex'
                );
            }
        }
    );

    if (confirmDeleteBtn) {

        confirmDeleteBtn.addEventListener(
            'click',
            async () => {

                confirmDeleteBtn.disabled = true;

                try {

                    if (deleteBoardMode) {

                        const formData =
                            new FormData();

                        formData.append(
                            'id',
                            boardId
                        );

                        const res = await fetch(
                            '/Boards/DeleteConfirmed',
                            {
                                method: 'POST',
                                headers: {
                                    'RequestVerificationToken':
                                        token
                                },
                                body: formData
                            }
                        );

                        if (!res.ok) {

                            console.error(
                                await res.text()
                            );

                            confirmDeleteBtn.disabled = false;

                            return;
                        }

                        window.location.href =
                            '/Boards';

                        return;
                    }

                    if (!deleteListId) {

                        confirmDeleteBtn.disabled = false;

                        return;
                    }

                    const res = await fetch(
                        `/Lists/DeleteAjax/${deleteListId}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'RequestVerificationToken':
                                    token
                            }
                        }
                    );

                    if (!res.ok) {

                        console.error(
                            await res.text()
                        );

                        confirmDeleteBtn.disabled = false;

                        return;
                    }

                    const listElement =
                        document.querySelector(
                            `.kanban-column[data-list-id="${deleteListId}"]`
                        );

                    if (listElement)
                        listElement.remove();

                    deleteModal.classList.add(
                        'hidden'
                    );

                    deleteModal.classList.remove(
                        'flex'
                    );

                    confirmDeleteBtn.disabled = false;

                    deleteListId = null;

                } catch (e) {

                    console.error(e);

                    confirmDeleteBtn.disabled = false;
                }
            }
        );

    }
    if (cancelDeleteBtn) {

        cancelDeleteBtn.addEventListener(
            'click',
            () => {

                deleteModal.classList.add(
                    'hidden'
                );

                deleteModal.classList.remove(
                    'flex'
                );

                confirmDeleteBtn.disabled = false;

                deleteBoardMode = false;

                deleteListId = null;
            }
        );
    }
});