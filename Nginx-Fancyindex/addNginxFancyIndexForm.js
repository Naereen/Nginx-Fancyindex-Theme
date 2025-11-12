// addNginxFancyIndexForm.js
// Enhances the Nginx FancyIndex page with search, theme, sorting, pagination, and more.
// Optimized for modern browsers: Chrome, Firefox, Safari, Edge
// © 2017, Lilian Besson (Naereen) and contributors,
// open-sourced under the MIT License, https://lbesson.mit-license.org/
// hosted on GitHub, https://GitHub.com/Naereen/Nginx-Fancyindex-Theme

(function () {
        'use strict';

        const THEME_STORAGE_KEY = 'fancyindex-theme';
        const ITEMS_PER_PAGE = 100;

        // Register Service Worker for offline support
        if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/Nginx-Fancyindex/sw.js').catch(() => {
                        // Silently fail if service worker registration fails
                });
        }

        const form = document.createElement('form');
        const input = document.createElement('input');
        const heading = document.querySelector('h1');
        const controls = document.createElement('div');
        const themeToggle = document.createElement('button');
        const body = document.body;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const table = document.querySelector('#list');
        const tbody = table?.querySelector('tbody');

        // Create breadcrumb navigation from h1
        function createBreadcrumbs() {
                if (!heading) return;

                const pathText = heading.textContent.replace('Directory:', '').trim();
                if (!pathText || pathText === '/') return;

                const breadcrumbNav = document.createElement('nav');
                breadcrumbNav.className = 'breadcrumb-nav';
                breadcrumbNav.setAttribute('aria-label', 'Breadcrumb');

                const parts = pathText.split('/').filter(p => p);
                let currentPath = '';

                const breadcrumbList = document.createElement('ol');
                breadcrumbList.className = 'breadcrumb';

                // Add root
                const rootLi = document.createElement('li');
                const rootLink = document.createElement('a');
                rootLink.href = '/';
                rootLink.textContent = '🏠 Root';
                rootLi.appendChild(rootLink);
                breadcrumbList.appendChild(rootLi);

                // Add each path segment
                parts.forEach((part, index) => {
                        currentPath += '/' + part;
                        const li = document.createElement('li');

                        if (index === parts.length - 1) {
                                // Last item - current directory
                                li.textContent = part;
                                li.setAttribute('aria-current', 'page');
                                li.className = 'breadcrumb-current';
                        } else {
                                const link = document.createElement('a');
                                link.href = currentPath + '/';
                                link.textContent = part;
                                li.appendChild(link);
                        }

                        breadcrumbList.appendChild(li);
                });

                breadcrumbNav.appendChild(breadcrumbList);
                heading.textContent = 'Directory';
                heading.after(breadcrumbNav);
        }

        createBreadcrumbs();

        controls.className = 'directory-controls';

        // Theme toggle with Auto/Light/Dark modes
        themeToggle.type = 'button';
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Change theme');

        const themeOptions = ['auto', 'light', 'dark'];
        let currentThemeIndex = 0;

        function updateThemeButton() {
                const theme = themeOptions[currentThemeIndex];
                const icons = { auto: '🌓', light: '☀️', dark: '🌙' };
                const labels = { auto: 'Auto', light: 'Light', dark: 'Dark' };
                themeToggle.textContent = `${icons[theme]} ${labels[theme]}`;
                themeToggle.setAttribute('data-theme', theme);
        }

        themeToggle.addEventListener('click', () => {
                currentThemeIndex = (currentThemeIndex + 1) % 3;
                const theme = themeOptions[currentThemeIndex];
                storeTheme(theme);
                applyTheme(theme);
                updateThemeButton();
        });

        controls.appendChild(themeToggle);

        // Search input
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

        const listItems = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
        let filteredItems = [...listItems];
        let currentPage = 1;
        let currentSort = { column: 1, direction: 'desc' }; // Default: Date descending

        // Add copy buttons to each file row
        function addCopyButtons() {
                listItems.forEach(item => {
                        const firstTd = item.querySelector('td');
                        if (!firstTd) return;

                        const link = firstTd.querySelector('a');
                        if (!link) return;

                        const copyBtn = document.createElement('button');
                        copyBtn.className = 'copy-url-btn';
                        copyBtn.textContent = '📋';
                        copyBtn.title = 'Copy URL';
                        copyBtn.setAttribute('aria-label', 'Copy URL');
                        copyBtn.type = 'button';

                        copyBtn.addEventListener('click', async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const url = new URL(link.href, window.location.origin).href;

                                try {
                                        await navigator.clipboard.writeText(url);
                                        copyBtn.textContent = '✅';
                                        setTimeout(() => {
                                                copyBtn.textContent = '📋';
                                        }, 2000);
                                } catch (err) {
                                        copyBtn.textContent = '❌';
                                        setTimeout(() => {
                                                copyBtn.textContent = '📋';
                                        }, 2000);
                                }
                        });

                        firstTd.appendChild(copyBtn);
                });
        }

        if (listItems.length > 0) {
                addCopyButtons();
        }

        // Table sorting
        function sortTable(columnIndex, direction) {
                const sortedItems = [...filteredItems].sort((a, b) => {
                        const aCell = a.children[columnIndex]?.textContent.trim() || '';
                        const bCell = b.children[columnIndex]?.textContent.trim() || '';

                        // Handle different column types
                        if (columnIndex === 1) {
                                // Date column - parse dates
                                const aDate = new Date(aCell);
                                const bDate = new Date(bCell);
                                return direction === 'asc' ? aDate - bDate : bDate - aDate;
                        } else if (columnIndex === 2) {
                                // Size column - parse size strings
                                const parseSize = (str) => {
                                        if (str === '-') return 0;
                                        const match = str.match(/^([\d.]+)\s*([KMGT]?)B?$/i);
                                        if (!match) return 0;
                                        const num = parseFloat(match[1]);
                                        const unit = match[2].toUpperCase();
                                        const multipliers = { '': 1, 'K': 1024, 'M': 1024 ** 2, 'G': 1024 ** 3, 'T': 1024 ** 4 };
                                        return num * (multipliers[unit] || 1);
                                };
                                const aSize = parseSize(aCell);
                                const bSize = parseSize(bCell);
                                return direction === 'asc' ? aSize - bSize : bSize - aSize;
                        } else {
                                // Text columns - natural sort
                                return direction === 'asc'
                                        ? aCell.localeCompare(bCell, undefined, { numeric: true, sensitivity: 'base' })
                                        : bCell.localeCompare(aCell, undefined, { numeric: true, sensitivity: 'base' });
                        }
                });

                filteredItems = sortedItems;
                currentPage = 1;
                renderPage();
        }

        // Make table headers sortable
        if (table) {
                const headers = table.querySelectorAll('thead th');
                headers.forEach((header, index) => {
                        if (index === 3) return; // Skip description column

                        header.style.cursor = 'pointer';
                        header.style.userSelect = 'none';
                        header.setAttribute('role', 'button');
                        header.setAttribute('tabindex', '0');

                        const sortIndicator = document.createElement('span');
                        sortIndicator.className = 'sort-indicator';
                        sortIndicator.setAttribute('aria-hidden', 'true');
                        header.appendChild(sortIndicator);

                        const handleSort = () => {
                                if (currentSort.column === index) {
                                        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                                } else {
                                        currentSort.column = index;
                                        currentSort.direction = 'asc';
                                }

                                // Update all indicators
                                headers.forEach((h, i) => {
                                        const indicator = h.querySelector('.sort-indicator');
                                        if (indicator) {
                                                if (i === index) {
                                                        indicator.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
                                                } else {
                                                        indicator.textContent = '';
                                                }
                                        }
                                });

                                sortTable(index, currentSort.direction);
                        };

                        header.addEventListener('click', handleSort);
                        header.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSort();
                                }
                        });
                });

                // Set initial sort indicator
                const dateHeader = headers[1];
                if (dateHeader) {
                        const indicator = dateHeader.querySelector('.sort-indicator');
                        if (indicator) {
                                indicator.textContent = ' ▼';
                        }
                }
        }

        // Pagination
        function createPagination() {
                const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
                if (totalPages <= 1) return null;

                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'pagination';
                paginationDiv.setAttribute('role', 'navigation');
                paginationDiv.setAttribute('aria-label', 'Pagination');

                const info = document.createElement('span');
                info.className = 'pagination-info';
                const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
                const end = Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length);
                info.textContent = `Showing ${start}-${end} of ${filteredItems.length}`;
                paginationDiv.appendChild(info);

                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'pagination-buttons';

                // Previous button
                const prevBtn = document.createElement('button');
                prevBtn.textContent = '← Previous';
                prevBtn.className = 'pagination-btn';
                prevBtn.disabled = currentPage === 1;
                prevBtn.addEventListener('click', () => {
                        if (currentPage > 1) {
                                currentPage--;
                                renderPage();
                        }
                });
                buttonsDiv.appendChild(prevBtn);

                // Page numbers (show current and nearby pages)
                const maxButtons = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                let endPage = Math.min(totalPages, startPage + maxButtons - 1);

                if (endPage - startPage < maxButtons - 1) {
                        startPage = Math.max(1, endPage - maxButtons + 1);
                }

                if (startPage > 1) {
                        const firstBtn = createPageButton(1);
                        buttonsDiv.appendChild(firstBtn);
                        if (startPage > 2) {
                                const ellipsis = document.createElement('span');
                                ellipsis.textContent = '...';
                                ellipsis.className = 'pagination-ellipsis';
                                buttonsDiv.appendChild(ellipsis);
                        }
                }

                for (let i = startPage; i <= endPage; i++) {
                        buttonsDiv.appendChild(createPageButton(i));
                }

                if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                                const ellipsis = document.createElement('span');
                                ellipsis.textContent = '...';
                                ellipsis.className = 'pagination-ellipsis';
                                buttonsDiv.appendChild(ellipsis);
                        }
                        const lastBtn = createPageButton(totalPages);
                        buttonsDiv.appendChild(lastBtn);
                }

                // Next button
                const nextBtn = document.createElement('button');
                nextBtn.textContent = 'Next →';
                nextBtn.className = 'pagination-btn';
                nextBtn.disabled = currentPage === totalPages;
                nextBtn.addEventListener('click', () => {
                        if (currentPage < totalPages) {
                                currentPage++;
                                renderPage();
                        }
                });
                buttonsDiv.appendChild(nextBtn);

                paginationDiv.appendChild(buttonsDiv);
                return paginationDiv;
        }

        function createPageButton(pageNum) {
                const btn = document.createElement('button');
                btn.textContent = pageNum;
                btn.className = 'pagination-btn';
                if (pageNum === currentPage) {
                        btn.classList.add('active');
                        btn.setAttribute('aria-current', 'page');
                }
                btn.addEventListener('click', () => {
                        currentPage = pageNum;
                        renderPage();
                });
                return btn;
        }

        function renderPage() {
                if (!tbody) return;

                // Hide all items
                listItems.forEach(item => item.style.display = 'none');

                // Show current page items
                const start = (currentPage - 1) * ITEMS_PER_PAGE;
                const end = start + ITEMS_PER_PAGE;
                const pageItems = filteredItems.slice(start, end);

                pageItems.forEach(item => {
                        if (!item.hidden) {
                                item.style.display = '';
                        }
                });

                // Update pagination
                const existingPagination = table?.parentNode.querySelector('.pagination');
                if (existingPagination) {
                        existingPagination.remove();
                }

                if (filteredItems.length > ITEMS_PER_PAGE) {
                        const pagination = createPagination();
                        if (pagination && table) {
                                table.after(pagination);
                        }
                }

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Search with debouncing
        let searchTimeout;
        input.addEventListener('input', function () {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                        const searchValue = this.value.trim();

                        if (!searchValue) {
                                filteredItems = [...listItems];
                                listItems.forEach(item => item.hidden = false);
                                currentPage = 1;
                                renderPage();
                                return;
                        }

                        const expression = "(^|.*[^\\p{L}])" +
                                searchValue.split(/\s+/).join("([^\\p{L}]|[^\\p{L}].*[^\\p{L}])") +
                                ".*$";
                        const matcher = new RegExp(expression, 'iu');

                        filteredItems = listItems.filter(item => {
                                const text = item.querySelector('td')?.textContent.replace(/\s+/g, ' ') || '';
                                const matches = matcher.test(text);
                                item.hidden = !matches;
                                return matches;
                        });

                        currentPage = 1;
                        renderPage();
                }, 150);
        }, { passive: true });

        // Theme management
        function getStoredTheme() {
                try {
                        return localStorage.getItem(THEME_STORAGE_KEY) || 'auto';
                } catch (error) {
                        return 'auto';
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
                let actualTheme;

                if (theme === 'auto') {
                        actualTheme = mediaQuery.matches ? 'dark' : 'light';
                        // Listen for system theme changes
                        mediaQuery.addEventListener('change', handleSystemThemeChange);
                } else {
                        actualTheme = theme;
                        // Remove listener if manually set
                        mediaQuery.removeEventListener('change', handleSystemThemeChange);
                }

                body.classList.remove('theme-light', 'theme-dark');
                body.classList.add(`theme-${actualTheme}`);
        }

        function handleSystemThemeChange(event) {
                const storedTheme = getStoredTheme();
                if (storedTheme === 'auto') {
                        applyTheme('auto');
                }
        }

        // Initialize theme
        const storedTheme = getStoredTheme();
        currentThemeIndex = themeOptions.indexOf(storedTheme);
        if (currentThemeIndex === -1) currentThemeIndex = 0;
        applyTheme(storedTheme);
        updateThemeButton();

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
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
                        themeToggle.click();
                        return;
                }
        });

        // Initial sort by date descending
        sortTable(1, 'desc');
        renderPage();
}());
