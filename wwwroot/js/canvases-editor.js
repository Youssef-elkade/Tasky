document.addEventListener('DOMContentLoaded', () => {

    const canvasId = document.getElementById('canvasId')?.value;
    const titleInput = document.getElementById('canvasTitleInput');
    const statusIndicator = document.getElementById('saveStatusIndicator');
    const editorContainer = document.getElementById('editor-container');
    const savedContent = document.getElementById('canvasContent')?.value;

    if (!canvasId || !titleInput || !statusIndicator || !editorContainer) {
        return;
    }

    const BlockEmbed = Quill.import('blots/block/embed');

    class DividerBlot extends BlockEmbed { }

    DividerBlot.blotName = 'divider';
    DividerBlot.tagName = 'hr';

    Quill.register(DividerBlot);

    const quill = new Quill('#editor-container', {

        theme: 'snow',

        modules: {
            toolbar: false
        },

        formats: [
            'bold',
            'italic',
            'header',
            'list',
            'code-block',
            'divider',
            'direction',
            'align'
        ],

        placeholder: 'Start typing...'
    });

    if (savedContent) {

        const decodedContent = JSON.parse('"' + savedContent + '"');

        quill.clipboard.dangerouslyPasteHTML(decodedContent);
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    const containsArabic = (text) => {
        return /[\u0600-\u06FF]/.test(text);
    };

    const updateEditorDirection = () => {

        const text = quill.getText().trim();

        if (containsArabic(text)) {

            quill.root.classList.add('auto-rtl');
            quill.root.classList.remove('auto-ltr');
        }
        else {

            quill.root.classList.add('auto-ltr');
            quill.root.classList.remove('auto-rtl');
        }
    };

    const updateTitleDirection = () => {

        const text = titleInput.value.trim();

        if (containsArabic(text)) {

            titleInput.style.direction = 'rtl';
            titleInput.style.textAlign = 'right';
        }
        else {

            titleInput.style.direction = 'ltr';
            titleInput.style.textAlign = 'left';
        }
    };

    const formatQuill = (format, value = true) => {

        quill.focus();

        const range = quill.getSelection(true);
        const currentFormat = quill.getFormat(range);

        if (format === 'list') {

            const newValue =
                currentFormat.list === value
                    ? false
                    : value;

            quill.format('list', newValue);
        }
        else if (format === 'header') {

            const newValue =
                currentFormat.header == value
                    ? false
                    : value;

            quill.format('header', newValue);
        }
        else {

            quill.format(
                format,
                !currentFormat[format]
            );
        }

        updateToolbarButtons();
    };

    const buttons = {

        'btn-bold': () => formatQuill('bold'),

        'btn-italic': () => formatQuill('italic'),

        'btn-h2': () => formatQuill('header', 2),

        'btn-bullet': () => formatQuill('list', 'bullet'),

        'btn-ordered': () => formatQuill('list', 'ordered'),

        'btn-code': () => formatQuill('code-block'),

        'btn-rtl': () => {

            quill.format('direction', 'rtl');
            quill.format('align', 'right');

            updateToolbarButtons();
        },

        'btn-ltr': () => {

            quill.format('direction', false);
            quill.format('align', false);

            updateToolbarButtons();
        }
    };

    for (const [id, handler] of Object.entries(buttons)) {

        const btn = document.getElementById(id);

        if (btn) {

            btn.addEventListener('click', (e) => {

                e.preventDefault();

                handler();
            });
        }
    }

    const dividerBtn = document.getElementById('btn-divider');

    if (dividerBtn) {

        dividerBtn.addEventListener('click', (e) => {

            e.preventDefault();

            quill.focus();

            const range = quill.getSelection(true);

            if (range) {

                quill.insertText(
                    range.index,
                    '\n',
                    Quill.sources.USER
                );

                quill.insertEmbed(
                    range.index + 1,
                    'divider',
                    true,
                    Quill.sources.USER
                );

                quill.setSelection(
                    range.index + 2,
                    Quill.sources.SILENT
                );
            }
        });
    }

    const updateToolbarButtons = () => {

        document.querySelectorAll('[data-format]').forEach(btn => {

            const format = btn.getAttribute('data-format');
            const value = btn.getAttribute('data-value');

            if (!format) return;

            const range = quill.getSelection();

            const formats = range
                ? quill.getFormat(range)
                : {};

            let isActive = false;

            if (format === 'list') {

                isActive =
                    formats.list === value;
            }
            else if (format === 'header') {

                isActive =
                    formats.header == value;
            }
            else {

                isActive =
                    !!formats[format];
            }

            if (isActive) {

                btn.classList.add(
                    'bg-primary',
                    'text-white'
                );

                btn.classList.remove(
                    'text-muted-foreground',
                    'hover:bg-muted'
                );
            }
            else {

                btn.classList.remove(
                    'bg-primary',
                    'text-white'
                );

                btn.classList.add(
                    'text-muted-foreground',
                    'hover:bg-muted'
                );
            }
        });
    };

    quill.on(
        'selection-change',
        updateToolbarButtons
    );

    quill.on(
        'text-change',
        updateToolbarButtons
    );

    quill.on(
        'text-change',
        updateEditorDirection
    );

    let saveTimeout;

    let lastSavedContent =
        quill.root.innerHTML;

    let lastSavedTitle =
        titleInput.value;

    const updateSaveStatus = (
        message,
        success = true
    ) => {

        statusIndicator.textContent =
            message;

        statusIndicator.classList.remove(
            'text-yellow-600',
            'dark:text-yellow-500',
            'text-green-600',
            'dark:text-green-500',
            'text-red-600',
            'dark:text-red-600'
        );

        if (message === 'Saving...') {

            statusIndicator.classList.add(
                'text-yellow-600',
                'dark:text-yellow-500'
            );
        }
        else if (
            success &&
            message === 'Saved'
        ) {

            statusIndicator.classList.add(
                'text-green-600',
                'dark:text-green-500'
            );
        }
        else if (!success) {

            statusIndicator.classList.add(
                'text-red-600',
                'dark:text-red-600'
            );
        }
    };

    const performSave = async () => {

        const title =
            titleInput.value.trim()
            || 'Untitled';

        const content =
            quill.root.innerHTML;

        if (
            title === lastSavedTitle &&
            content === lastSavedContent
        ) {
            return;
        }

        updateSaveStatus(
            'Saving...',
            true
        );

        try {

            const response =
                await fetch(
                    `/Canvases/UpdateAjax/${canvasId}`,
                    {
                        method: 'PUT',

                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },

                        body: JSON.stringify({
                            title: title,
                            content: content
                        })
                    }
                );

            if (response.ok) {

                updateSaveStatus(
                    'Saved',
                    true
                );

                lastSavedContent =
                    content;

                lastSavedTitle =
                    title;

                setTimeout(() => {

                    statusIndicator.textContent =
                        'Saved';

                    statusIndicator.classList.remove(
                        'text-yellow-600',
                        'dark:text-yellow-500',
                        'text-green-600',
                        'dark:text-green-500',
                        'text-red-600',
                        'dark:text-red-600'
                    );

                }, 3000);
            }
            else {

                updateSaveStatus(
                    `Error: ${response.status}`,
                    false
                );
            }

        } catch {

            updateSaveStatus(
                'Error saving',
                false
            );
        }
    };

    const debouncedSave = () => {

        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        saveTimeout = setTimeout(
            performSave,
            1500
        );
    };

    titleInput.addEventListener(
        'input',
        debouncedSave
    );

    titleInput.addEventListener(
        'input',
        updateTitleDirection
    );

    titleInput.addEventListener(
        'change',
        performSave
    );

    quill.on(
        'text-change',
        debouncedSave
    );

    window.addEventListener(
        'beforeunload',
        () => {

            if (saveTimeout) {

                clearTimeout(saveTimeout);

                performSave();
            }
        }
    );

    updateToolbarButtons();

    updateEditorDirection();

    updateTitleDirection();
});