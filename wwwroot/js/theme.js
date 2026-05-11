const root = document.documentElement;

const themeToggle = document.getElementById('themeToggle');

const savedDark = localStorage.getItem('darkMode');

if (savedDark === 'true') {
    root.classList.add('dark');
}
else {
    root.classList.remove('dark');
}

const savedTheme = localStorage.getItem('theme');

if (savedTheme && savedTheme !== 'default') {
    root.setAttribute('data-theme', savedTheme);
}

if (themeToggle) {

    themeToggle.addEventListener('click', () => {

        root.classList.toggle('dark');

        const isDark = root.classList.contains('dark');

        localStorage.setItem('darkMode', isDark);

        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { dark: isDark }
        }));

        lucide.createIcons();

    });

}