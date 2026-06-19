
(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  const parseUrlParams = () => new URLSearchParams(window.location.search);

  const getData = () => Array.isArray(window.SEARCH_MOVIES) ? window.SEARCH_MOVIES : [];

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const createCard = (item, prefix = "") => {
    const tags = (item.tags || []).slice(0, 3).map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join("");
    return `
      <article class="movie-card">
        <a class="movie-card-link" href="${prefix}movie/${String(item.slug).padStart(4, "0")}.html">
          <div class="poster poster-sm" style="${item.poster}">
            <span class="poster-year">${item.year}</span>
            <span class="poster-type">${escapeHtml(item.type.split("/")[0].trim())}</span>
            <span class="poster-title">${escapeHtml(item.marks || item.title.slice(0, 2))}</span>
            <span class="poster-category">${escapeHtml(item.category)}</span>
          </div>
          <div class="movie-meta">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="movie-meta-line">${item.year} · ${escapeHtml(item.region)} · ${escapeHtml(item.type)}</p>
            <p class="movie-desc">${escapeHtml(item.one_line || item.summary || "")}</p>
            <div class="tag-row">${tags}</div>
          </div>
        </a>
      </article>
    `;
  };

  const initHeroCarousel = () => {
    const hero = document.querySelector("[data-hero-carousel]");
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");
    if (slides.length <= 1) return;

    let current = slides.findIndex(slide => slide.classList.contains("is-active"));
    if (current < 0) current = 0;

    const setActive = (idx) => {
      current = (idx + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
    };

    let timer = setInterval(() => setActive(current + 1), 5200);

    const resetTimer = () => {
      clearInterval(timer);
      timer = setInterval(() => setActive(current + 1), 5200);
    };

    prev && prev.addEventListener("click", () => {
      setActive(current - 1);
      resetTimer();
    });
    next && next.addEventListener("click", () => {
      setActive(current + 1);
      resetTimer();
    });
    dots.forEach((dot, i) => dot.addEventListener("click", () => {
      setActive(i);
      resetTimer();
    }));
  };

  const initSortControls = () => {
    const select = document.querySelector("[data-sort-control]");
    const grids = Array.from(document.querySelectorAll("[data-sort-grid]"));
    if (!select || grids.length === 0) return;

    const originalMap = new Map(grids.map(grid => [grid, Array.from(grid.children)]));

    const applySort = () => {
      const mode = select.value;
      grids.forEach((grid) => {
        const items = (originalMap.get(grid) || []).slice();

        items.sort((a, b) => {
        const ay = Number(a.dataset.year || 0);
        const by = Number(b.dataset.year || 0);
        const at = (a.dataset.title || "").toLowerCase();
        const bt = (b.dataset.title || "").toLowerCase();

        if (mode === "year-asc") return ay - by;
        if (mode === "title") return at.localeCompare(bt, "zh-Hans-CN");
        return by - ay;
      });

        grid.innerHTML = "";
        items.forEach((node) => grid.appendChild(node));
      });
    };

    select.addEventListener("change", applySort);
  };

  const renderSearchPage = () => {
    const wrap = document.querySelector("[data-search-page]");
    if (!wrap) return;

    const data = getData();
    const input = wrap.querySelector("[data-search-input]");
    const results = wrap.querySelector("[data-search-results]");
    const count = wrap.querySelector("[data-result-count]");
    const pager = wrap.querySelector("[data-pager]");
    const genreSelect = wrap.querySelector("[data-genre-filter]");
    const yearSelect = wrap.querySelector("[data-year-filter]");

    if (!input || !results || !pager || !count) return;

    const params = parseUrlParams();
    if (params.get("q")) input.value = params.get("q");

    const pageSize = 36;
    const state = {
      page: 1,
      filtered: data.slice(),
    };

    const activeFilters = () => ({
      q: input.value.trim().toLowerCase(),
      genre: genreSelect ? genreSelect.value : "",
      year: yearSelect ? yearSelect.value : "",
    });

    const filteredData = () => {
      const { q, genre, year } = activeFilters();
      return data.filter(item => {
        const haystack = [
          item.title,
          item.region,
          item.type,
          item.genre,
          ...(item.tags || []),
          item.one_line,
          item.summary,
        ].join(" ").toLowerCase();

        if (q && !haystack.includes(q)) return false;
        if (genre && item.category !== genre) return false;
        if (year) {
          if (year === "new" && item.year < 2020) return false;
          if (year === "classic" && item.year >= 2020) return false;
          if (year === "2024" && item.year !== 2024) return false;
        }
        return true;
      }).sort((a, b) => {
        const byYear = b.year - a.year;
        return byYear !== 0 ? byYear : a.title.localeCompare(b.title, "zh-Hans-CN");
      });
    };

    const renderPager = () => {
      const totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
      state.page = Math.min(state.page, totalPages);

      const windowSize = 7;
      const half = Math.floor(windowSize / 2);
      let start = Math.max(1, state.page - half);
      let end = Math.min(totalPages, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);

      const buttons = [];

      const makeBtn = (label, page, cls = "") =>
        `<button class="${cls}" data-page="${page}">${label}</button>`;

      buttons.push(makeBtn("‹", Math.max(1, state.page - 1)));

      for (let p = start; p <= end; p += 1) {
        buttons.push(makeBtn(String(p), p, p === state.page ? "is-active" : ""));
      }

      buttons.push(makeBtn("›", Math.min(totalPages, state.page + 1)));
      pager.innerHTML = buttons.join("");

      pager.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
          state.page = Number(btn.dataset.page);
          render();
          window.scrollTo({ top: results.offsetTop - 90, behavior: "smooth" });
        });
      });
    };

    const render = () => {
      state.filtered = filteredData();
      const totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * pageSize;
      const chunk = state.filtered.slice(start, start + pageSize);
      results.innerHTML = chunk.map(item => createCard(item, "../")).join("");
      count.textContent = `共 ${state.filtered.length.toLocaleString("zh-CN")} 部影片 · 第 ${state.page} / ${totalPages} 页`;
      renderPager();
    };

    input.addEventListener("input", () => {
      state.page = 1;
      render();
    });

    genreSelect && genreSelect.addEventListener("change", () => {
      state.page = 1;
      render();
    });

    yearSelect && yearSelect.addEventListener("change", () => {
      state.page = 1;
      render();
    });

    wrap.querySelectorAll("[data-hot-query]").forEach(btn => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.hotQuery || "";
        state.page = 1;
        render();
      });
    });

    render();
  };

  const initPlayer = () => {
    const video = document.querySelector("[data-hls-player]");
    if (!video) return;

    const playBadge = document.querySelector("[data-play-button]");
    const input = document.querySelector("[data-stream-input]");
    const sourceBtns = Array.from(document.querySelectorAll("[data-source-btn]"));

    const sources = Array.from(new Set([
      video.dataset.defaultSrc,
      ...(video.dataset.fallbackSrcs || "").split("|").map(s => s.trim()).filter(Boolean)
    ])).filter(Boolean);

    const load = (src) => {
      if (!src) return;
      if (window.__currentHlsInstance) {
        try { window.__currentHlsInstance.destroy(); } catch (err) {}
        window.__currentHlsInstance = null;
      }

      const canNativeHls = video.canPlayType("application/vnd.apple.mpegurl");
      if (window.Hls && window.Hls.isSupported() && !canNativeHls) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, (_event, data) => {
          console.warn("HLS error:", data);
        });
        window.__currentHlsInstance = hls;
      } else {
        video.src = src;
      }
      if (input) input.value = src;
      video.play().catch(() => {});
    };

    const activate = (src) => {
      load(src);
    };

    if (playBadge) {
      playBadge.addEventListener("click", () => activate(sources[0]));
    }

    sourceBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const src = btn.dataset.sourceBtn;
        activate(src);
      });
    });

    const form = document.querySelector("[data-player-form]");
    form && form.addEventListener("submit", (e) => {
      e.preventDefault();
      const src = input.value.trim();
      if (src) activate(src);
    });

    if (sources[0]) {
      input && (input.value = sources[0]);
    }
  };

  const initCopyButtons = () => {
    document.querySelectorAll("[data-copy-text]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const text = btn.dataset.copyText || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "已复制";
          setTimeout(() => (btn.textContent = "复制链接"), 1500);
        } catch (err) {
          console.warn(err);
        }
      });
    });
  };

  ready(() => {
    initHeroCarousel();
    initSortControls();
    renderSearchPage();
    initPlayer();
    initCopyButtons();
  });
})();
