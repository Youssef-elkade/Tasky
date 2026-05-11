document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    
    const isDark = localStorage.getItem("darkMode") === "true" || document.documentElement.classList.contains("dark");
    const btnLight = document.getElementById('btn-light-mode');
    const btnDark = document.getElementById('btn-dark-mode');

    const updateModeUI = (dark) => {
        if (dark) {
            btnDark.classList.add('border-primary', 'bg-primary/5');
            btnDark.classList.remove('border-border', 'hover:border-primary/40');
            btnDark.querySelector('.mode-check').classList.replace('hidden', 'flex');

            btnLight.classList.remove('border-primary', 'bg-primary/5');
            btnLight.classList.add('border-border', 'hover:border-primary/40');
            btnLight.querySelector('.mode-check').classList.replace('flex', 'hidden');
        } else {
            btnLight.classList.add('border-primary', 'bg-primary/5');
            btnLight.classList.remove('border-border', 'hover:border-primary/40');
            btnLight.querySelector('.mode-check').classList.replace('hidden', 'flex');

            btnDark.classList.remove('border-primary', 'bg-primary/5');
            btnDark.classList.add('border-border', 'hover:border-primary/40');
            btnDark.querySelector('.mode-check').classList.replace('flex', 'hidden');
        }
    };

    updateModeUI(isDark);
    window.addEventListener('themeChanged', (e) => {
        updateModeUI(e.detail.dark);
    });

    btnLight.addEventListener('click', () => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
        updateModeUI(false);

        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { dark: false }
        }));
    });

    btnDark.addEventListener('click', () => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
        updateModeUI(true);

        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { dark: true }
        }));
    });

    
    const currentTheme = localStorage.getItem("theme") || "default";
    const themeBtns = document.querySelectorAll('.theme-btn');

    const updateThemeUI = (themeId) => {
        themeBtns.forEach(btn => {
            const check = btn.querySelector('.theme-check');
            if (btn.dataset.theme === themeId) {
                btn.classList.add('border-primary', 'bg-primary/5');
                btn.classList.remove('border-border', 'hover:border-primary/40', 'hover:bg-muted/50');
                check.classList.replace('hidden', 'flex');
            } else {
                btn.classList.remove('border-primary', 'bg-primary/5');
                btn.classList.add('border-border', 'hover:border-primary/40', 'hover:bg-muted/50');
                check.classList.replace('flex', 'hidden');
            }
        });
    };

    updateThemeUI(currentTheme);

    themeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const themeId = btn.dataset.theme;

            if (themeId === "default") document.documentElement.removeAttribute("data-theme");
            else document.documentElement.setAttribute("data-theme", themeId);

            localStorage.setItem("theme", themeId);
            updateThemeUI(themeId);

            
            try {
                await fetch('/Settings/UpdateThemeAjax', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ThemeId: themeId })
                });
            } catch (e) {
                console.error("Failed to save theme", e);
            }
        });
    });
});