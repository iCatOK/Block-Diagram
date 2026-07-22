document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('docs-sidebar')  as HTMLElement;
    const toggleBtn = document.getElementById('docs-toggle') as HTMLButtonElement;
    const iframe = document.getElementById('docs-iframe') as HTMLIFrameElement;

    // Функция синхронизации темы
    const syncTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        iframe.contentWindow!.postMessage({ theme: currentTheme }, '*');
    };

    toggleBtn.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        toggleBtn.querySelector('span')!.textContent = isOpen ? 'CLOSE' : 'DOCS';
        if (isOpen) syncTheme();
    });

    // Следим за изменением темы на основной странице
    const observer = new MutationObserver(() => syncTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // При загрузке самого iframe тоже шлем тему
    iframe.onload = syncTheme;
});