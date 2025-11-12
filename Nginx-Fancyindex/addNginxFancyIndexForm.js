// addNginxFancyIndexForm.js
// Enhances the Nginx FancyIndex page with search filtering and a theme toggle.
// Optimized for modern browsers: Chrome, Firefox, Safari, Edge
// © 2017, Lilian Besson (Naereen) and contributors,
// open-sourced under the MIT License, https://lbesson.mit-license.org/
// hosted on GitHub, https://GitHub.com/Naereen/Nginx-Fancyindex-Theme

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
                        const searchValue = this.value.trim();

                        if (!searchValue) {
                                // Show all items when search is empty
                                listItems.forEach(item => item.hidden = false);
                                return;
                        }

                        // Use native Unicode regex with modern JavaScript (no XRegExp needed)
                        // Matches word boundaries with Unicode letter support
                        const expression = "(^|.*[^\\p{L}])" +
                                searchValue.split(/\s+/).join("([^\\p{L}]|[^\\p{L}].*[^\\p{L}])") +
                                ".*$";
                        const matcher = new RegExp(expression, 'iu'); // 'u' flag for Unicode support

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

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
                // Skip if user is typing in an input field (except our search)
                const activeElement = document.activeElement;
                const isTyping = activeElement &&
                        (activeElement.tagName === 'INPUT' ||
                         activeElement.tagName === 'TEXTAREA' ||
                         activeElement.isContentEditable) &&
                        activeElement !== input;

                // '/' or 'Ctrl+F' - Focus search
                if ((event.key === '/' || (event.ctrlKey && event.key === 'f')) && !isTyping) {
                        event.preventDefault();
                        input.focus();
                        input.select();
                        return;
                }

                // 'Escape' - Clear search (when search is focused)
                if (event.key === 'Escape' && activeElement === input) {
                        event.preventDefault();
                        input.value = '';
                        input.dispatchEvent(new Event('input'));
                        input.blur();
                        return;
                }

                // 't' - Toggle theme (not when typing)
                if (event.key === 't' && !isTyping) {
                        event.preventDefault();
                        toggle.click();
                        return;
                }
        });
}());
