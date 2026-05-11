const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {

    sidebar.classList.remove('-translate-x-full');

    sidebarOverlay.classList.remove('hidden');

}

function closeSidebar() {

    sidebar.classList.add('-translate-x-full');

    sidebarOverlay.classList.add('hidden');

}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', openSidebar);
}

if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
}