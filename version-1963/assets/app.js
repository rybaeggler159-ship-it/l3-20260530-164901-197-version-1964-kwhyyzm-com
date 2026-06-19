(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function text(value) {
        return String(value || '').toLowerCase();
    }

    function initMenu() {
        var toggle = qs('[data-menu-toggle]');
        var panel = qs('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function initHero() {
        var hero = qs('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = qsa('[data-hero-slide]', hero);
        var dots = qsa('[data-hero-dot]', hero);
        var prev = qs('[data-hero-prev]', hero);
        var next = qs('[data-hero-next]', hero);
        var current = 0;
        var timer;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                restart();
            });
        }

        if (slides.length > 1) {
            restart();
        }
    }

    function cardHtml(item) {
        var tags = (item.tags || []).slice(0, 3).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');
        return [
            '<article class="movie-card">',
            '<a class="card-poster" href="' + item.url + '">',
            '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
            '<span class="play-chip">▶</span>',
            '<span class="year-chip">' + escapeHtml(item.year) + '</span>',
            '</a>',
            '<div class="card-body">',
            '<div class="card-meta">' + escapeHtml(item.region) + ' · ' + escapeHtml(item.type) + '</div>',
            '<h2><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h2>',
            '<p>' + escapeHtml(item.oneLine) + '</p>',
            '<div class="tag-row">' + tags + '</div>',
            '</div>',
            '</article>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"]/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            }[char];
        });
    }

    function initTopSearch() {
        var forms = qsa('[data-site-search]');
        forms.forEach(function (form) {
            var input = qs('input[name="q"]', form);
            var suggest = qs('[data-search-suggest]', form);
            if (!input || !suggest || !window.SEARCH_INDEX) {
                return;
            }

            function render() {
                var value = text(input.value).trim();
                if (!value) {
                    suggest.classList.remove('is-open');
                    suggest.innerHTML = '';
                    return;
                }
                var items = window.SEARCH_INDEX.filter(function (item) {
                    return text(item.title + ' ' + item.region + ' ' + item.type + ' ' + item.year + ' ' + (item.tags || []).join(' ')).indexOf(value) !== -1;
                }).slice(0, 8);
                suggest.innerHTML = items.map(function (item) {
                    return '<a href="' + item.url + '"><img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '"><span><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.region) + ' · ' + escapeHtml(item.type) + ' · ' + escapeHtml(item.year) + '</span></span></a>';
                }).join('');
                suggest.classList.toggle('is-open', items.length > 0);
            }

            input.addEventListener('input', render);
            input.addEventListener('focus', render);
            input.addEventListener('blur', function () {
                window.setTimeout(function () {
                    suggest.classList.remove('is-open');
                }, 180);
            });
        });
    }

    function initFilters() {
        qsa('[data-filter-scope]').forEach(function (scope) {
            var input = qs('[data-filter-input]', scope);
            var buttons = qsa('[data-filter-value]', scope);
            var cards = qsa('.movie-card', scope);
            var active = 'all';

            function apply() {
                var query = input ? text(input.value).trim() : '';
                cards.forEach(function (card) {
                    var haystack = text([
                        card.getAttribute('data-title'),
                        card.getAttribute('data-region'),
                        card.getAttribute('data-type'),
                        card.getAttribute('data-year'),
                        card.getAttribute('data-tags')
                    ].join(' '));
                    var type = card.getAttribute('data-type') || '';
                    var passType = active === 'all' || type === active;
                    var passText = !query || haystack.indexOf(query) !== -1;
                    card.classList.toggle('is-hidden-card', !(passType && passText));
                });
            }

            if (input) {
                input.addEventListener('input', apply);
            }

            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    active = button.getAttribute('data-filter-value');
                    buttons.forEach(function (btn) {
                        btn.classList.toggle('is-active', btn === button);
                    });
                    apply();
                });
            });
        });
    }

    function initSearchPage() {
        var results = qs('[data-search-results]');
        var title = qs('[data-search-title]');
        if (!results || !window.SEARCH_INDEX) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = text(params.get('q')).trim();
        if (!query) {
            return;
        }
        var items = window.SEARCH_INDEX.filter(function (item) {
            return text(item.title + ' ' + item.region + ' ' + item.type + ' ' + item.year + ' ' + item.category + ' ' + (item.tags || []).join(' ')).indexOf(query) !== -1;
        }).slice(0, 120);
        if (title) {
            title.textContent = '搜索结果：' + params.get('q');
        }
        results.innerHTML = items.map(cardHtml).join('') || '<p class="empty-state">暂无匹配影片</p>';
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initTopSearch();
        initFilters();
        initSearchPage();
    });
}());
