// addNginxFancyIndexForm.js
// Enhances the Nginx FancyIndex page with search filtering and a theme toggle.

var THEME_STORAGE_KEY = 'fancyindex-theme';

var form = document.createElement('form');
var input = document.createElement('input');
var heading = document.querySelector('h1');
var controls = document.createElement('div');
var toggle = document.createElement('button');
var body = document.body;
var mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

controls.className = 'directory-controls';

toggle.type = 'button';
toggle.className = 'theme-toggle';
toggle.setAttribute('aria-pressed', 'false');

toggle.addEventListener('click', function () {
    var nextTheme = body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
    storeTheme(nextTheme);
});

controls.appendChild(toggle);

input.name = 'filter';
input.id = 'search';
input.placeholder = 'Type to search...';
form.appendChild(input);
controls.appendChild(form);

if (heading && heading.parentNode) {
    heading.after(controls);
} else {
    document.body.insertBefore(controls, document.body.firstChild);
}

var listItems = [].slice.call(document.querySelectorAll('#list tbody tr'));

input.addEventListener('keyup', function () {
    var i,
        expression = "(^|.*[^\\pL])" + this.value.trim().split(/\s+/).join("([^\\pL]|[^\\pL].*[^\\pL])") + ".*$",
        matcher = RegExp(expression, 'i');

    listItems.forEach(function (item) {
        item.removeAttribute('hidden');
    });

    listItems.filter(function (item) {
        i = item.querySelector('td').textContent.replace(/\s+/g, ' ');
        return !matcher.test(i);
    }).forEach(function (item) {
        item.hidden = true;
    });
});

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
        /* noop */
    }
}

function applyTheme(theme) {
    var normalized = theme === 'dark' ? 'dark' : 'light';

    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add('theme-' + normalized);

    var isDark = normalized === 'dark';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.textContent = isDark ? 'Switch to light theme' : 'Switch to dark theme';
}

var storedTheme = getStoredTheme();
var preferredTheme = storedTheme || (mediaQuery && mediaQuery.matches ? 'dark' : 'light');
applyTheme(preferredTheme);

if (!storedTheme && mediaQuery) {
    var onSchemeChange = function (event) {
        applyTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', onSchemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(onSchemeChange);
    }
}
