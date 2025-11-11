// addNginxFancyIndexForm.js
// Enhances the Nginx FancyIndex page with search filtering and a theme toggle.
// Optimized for modern browsers: Chrome, Firefox, Safari, Edge

(function () {
        'use strict';

        const THEME_STORAGE_KEY = 'fancyindex-theme';

        const form = document.createElement('form');
        const input = document.createElement('input');
        const heading = document.querySelector('h1');
        const controls = document.createElement('div');
        const toggle = document.createElement('button');
        const body = document.body;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        controls.className = 'directory-controls';

        toggle.type = 'button';
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('aria-label', 'Toggle theme');

        toggle.addEventListener('click', () => {
                const nextTheme = body.classList.contains('theme-dark') ? 'light' : 'dark';
                applyTheme(nextTheme);
                storeTheme(nextTheme);
        });

        controls.appendChild(toggle);

        input.name = 'filter';
        input.id = 'search';
        input.type = 'search';
        input.placeholder = 'Type to search...';
        input.setAttribute('aria-label', 'Search directory');
        form.appendChild(input);
        controls.appendChild(form);

        if (heading?.parentNode) {
                heading.after(controls);
        } else {
                document.body.insertBefore(controls, document.body.firstChild);
        }

        const listItems = Array.from(document.querySelectorAll('#list tbody tr'));

        // Debounce search for better performance
        let searchTimeout;
        input.addEventListener('input', function () {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                        const expression = "(^|.*[^\\pL])" + this.value.trim().split(/\s+/).join("([^\\pL]|[^\\pL].*[^\\pL])") + ".*$";
                        const matcher = RegExp(expression, 'i');

                        listItems.forEach(item => {
                                const text = item.querySelector('td')?.textContent.replace(/\s+/g, ' ') || '';
                                item.hidden = !matcher.test(text);
                        });
                }, 150);
        }, { passive: true });

        function getStoredTheme() {
                try {
                        return localStorage.getItem(THEME_STORAGE_KEY);
                } catch (error) {
                        return null;
                }
        }

        function storeTheme(theme) {
                try {
                        localStorage.setItem(THEME_STORAGE_KEY, theme);
                } catch (error) {
                        // Storage not available
                }
        }

        function applyTheme(theme) {
                const normalized = theme === 'dark' ? 'dark' : 'light';

                body.classList.remove('theme-light', 'theme-dark');
                body.classList.add(`theme-${normalized}`);

                const isDark = normalized === 'dark';
                toggle.setAttribute('aria-pressed', String(isDark));
                toggle.textContent = isDark ? 'Switch to light theme' : 'Switch to dark theme';
        }

        const storedTheme = getStoredTheme();
        const preferredTheme = storedTheme || (mediaQuery.matches ? 'dark' : 'light');
        applyTheme(preferredTheme);

        if (!storedTheme) {
                mediaQuery.addEventListener('change', (event) => {
                        applyTheme(event.matches ? 'dark' : 'light');
                });
        }
}());
