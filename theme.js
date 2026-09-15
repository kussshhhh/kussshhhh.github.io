// theme.js - shared light/dark toggle for blog + articles pages
(function () {
    var KEY = 'site-theme';
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    document.documentElement.setAttribute('data-theme', saved || 'light');

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;

        function sync() {
            var theme = document.documentElement.getAttribute('data-theme');
            btn.textContent = theme === 'light' ? '☾' : '☀';
            btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        }

        sync();

        btn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem(KEY, next); } catch (e) {}
            sync();
        });
    });
})();
