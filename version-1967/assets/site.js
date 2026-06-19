(() => {
    const qs = (selector, root = document) => root.querySelector(selector);
    const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const toggle = qs('[data-mobile-toggle]');
    const mobileNav = qs('[data-mobile-nav]');
    if (toggle && mobileNav) {
        toggle.addEventListener('click', () => {
            mobileNav.classList.toggle('is-open');
        });
    }

    const slider = qs('[data-hero-slider]');
    if (slider) {
        const slides = qsa('.hero-slide', slider);
        const dots = qsa('.hero-dot', slider);
        let current = 0;
        const show = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
            dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
        };
        dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
        if (slides.length > 1) {
            setInterval(() => show(current + 1), 5200);
        }
    }

    qsa('[data-card-filter]').forEach((panel) => {
        const scope = document.getElementById(panel.getAttribute('data-card-filter'));
        if (!scope) {
            return;
        }
        const input = qs('[data-filter-text]', panel);
        const year = qs('[data-filter-year]', panel);
        const type = qs('[data-filter-type]', panel);
        const cards = qsa('[data-card]', scope);
        const empty = qs('[data-empty]', scope.parentElement || document);
        const apply = () => {
            const keyword = (input?.value || '').trim().toLowerCase();
            const yearValue = year?.value || '';
            const typeValue = type?.value || '';
            let visible = 0;
            cards.forEach((card) => {
                const haystack = (card.getAttribute('data-title') + ' ' + card.getAttribute('data-tags') + ' ' + card.getAttribute('data-region')).toLowerCase();
                const okKeyword = !keyword || haystack.includes(keyword);
                const okYear = !yearValue || card.getAttribute('data-year') === yearValue;
                const okType = !typeValue || card.getAttribute('data-type') === typeValue;
                const ok = okKeyword && okYear && okType;
                card.style.display = ok ? '' : 'none';
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        };
        [input, year, type].filter(Boolean).forEach((control) => {
            control.addEventListener('input', apply);
            control.addEventListener('change', apply);
        });
    });

    const searchResults = qs('[data-search-results]');
    if (searchResults && window.MOVIE_SEARCH_INDEX) {
        const params = new URLSearchParams(window.location.search);
        const queryInput = qs('[data-search-input]');
        const initialQuery = params.get('q') || '';
        if (queryInput && initialQuery) {
            queryInput.value = initialQuery;
        }
        const render = () => {
            const keyword = (queryInput?.value || '').trim().toLowerCase();
            const results = keyword
                ? window.MOVIE_SEARCH_INDEX.filter((item) => {
                    const text = [item.title, item.region, item.type, item.year, item.genre, item.tags, item.oneLine].join(' ').toLowerCase();
                    return text.includes(keyword);
                }).slice(0, 80)
                : window.MOVIE_SEARCH_INDEX.slice(0, 24);
            searchResults.innerHTML = results.map((item) => `
                <a class="movie-card" href="${item.file}" data-card>
                    <div class="poster">
                        <img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">
                        <span class="poster-badge">${escapeHtml(item.type)}</span>
                    </div>
                    <div class="card-body">
                        <h2 class="card-title">${escapeHtml(item.title)}</h2>
                        <div class="card-meta">
                            <span>${escapeHtml(item.region)}</span>
                            <span>${escapeHtml(item.year)}</span>
                        </div>
                        <p class="card-text">${escapeHtml(item.oneLine)}</p>
                        <div class="card-tags">${item.tags.slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
                    </div>
                </a>
            `).join('');
        };
        const form = qs('[data-search-form]');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const url = new URL(window.location.href);
                url.searchParams.set('q', queryInput?.value || '');
                window.history.replaceState({}, '', url.toString());
                render();
            });
        }
        queryInput?.addEventListener('input', render);
        render();
    }

    qsa('.js-player').forEach((box) => {
        const video = qs('video', box);
        const button = qs('.player-overlay', box);
        const stream = box.getAttribute('data-stream');
        let started = false;
        let hls = null;
        const begin = () => {
            if (!video || !stream) {
                return;
            }
            if (!started) {
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({ enableWorker: true });
                    hls.loadSource(stream);
                    hls.attachMedia(video);
                } else {
                    video.src = stream;
                }
                started = true;
            }
            button?.classList.add('is-hidden');
            video.play().catch(() => {});
        };
        button?.addEventListener('click', begin);
        video?.addEventListener('click', () => {
            if (!started || video.paused) {
                begin();
            }
        });
        window.addEventListener('pagehide', () => {
            if (hls) {
                hls.destroy();
            }
        });
    });

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
