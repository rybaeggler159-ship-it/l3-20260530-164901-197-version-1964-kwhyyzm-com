(function () {
  function queryAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function bindMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      toggle.textContent = panel.hidden ? "☰" : "×";
    });
  }

  function bindHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = queryAll("[data-hero-slide]", hero);
    var dots = queryAll("[data-hero-dot]", hero);
    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, position) {
        slide.classList.toggle("active", position === current);
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle("active", position === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        restart();
      });
    });

    if (slides.length > 1) {
      restart();
    }
  }

  function createSearchItem(movie) {
    var item = document.createElement("a");
    item.className = "search-result-item";
    item.href = movie.url;

    var image = document.createElement("img");
    image.src = movie.cover;
    image.alt = movie.title;
    image.loading = "lazy";

    var body = document.createElement("div");
    var title = document.createElement("strong");
    title.textContent = movie.title;
    var meta = document.createElement("span");
    meta.textContent = [movie.region, movie.year, movie.type].filter(Boolean).join(" · ");

    body.appendChild(title);
    body.appendChild(meta);
    item.appendChild(image);
    item.appendChild(body);
    return item;
  }

  function bindSearch() {
    if (!window.movieSearchIndex) {
      return;
    }
    queryAll("[data-search-box]").forEach(function (box) {
      var input = box.querySelector(".site-search-input");
      var results = box.querySelector("[data-search-results]");
      if (!input || !results) {
        return;
      }

      input.addEventListener("input", function () {
        var query = input.value.trim().toLowerCase();
        results.innerHTML = "";
        if (!query) {
          results.hidden = true;
          return;
        }

        var matches = window.movieSearchIndex.filter(function (movie) {
          return movie.searchText.indexOf(query) !== -1;
        }).slice(0, 10);

        if (!matches.length) {
          var empty = document.createElement("div");
          empty.className = "search-result-empty";
          empty.textContent = "未找到相关影片";
          results.appendChild(empty);
        } else {
          matches.forEach(function (movie) {
            results.appendChild(createSearchItem(movie));
          });
        }
        results.hidden = false;
      });

      document.addEventListener("click", function (event) {
        if (!box.contains(event.target)) {
          results.hidden = true;
        }
      });
    });
  }

  function bindLocalFilter() {
    queryAll("[data-filter-panel]").forEach(function (panel) {
      var input = panel.querySelector(".local-filter-input");
      var buttons = queryAll("[data-filter-value]", panel);
      var cards = queryAll("[data-card]", panel);
      var selected = "all";

      function applyFilter() {
        var query = input ? input.value.trim().toLowerCase() : "";
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-text") || "").toLowerCase();
          var kind = (card.getAttribute("data-kind") || "").toLowerCase();
          var selectedText = selected.toLowerCase();
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesButton = selected === "all" || kind === selectedText || text.indexOf(selectedText) !== -1;
          card.hidden = !(matchesQuery && matchesButton);
        });
      }

      if (input) {
        input.addEventListener("input", applyFilter);
      }

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          selected = button.getAttribute("data-filter-value") || "all";
          buttons.forEach(function (item) {
            item.classList.toggle("active", item === button);
          });
          applyFilter();
        });
      });
    });
  }

  window.initMoviePlayer = function (mediaSource) {
    var video = document.querySelector("[data-video-player]");
    var cover = document.querySelector("[data-player-poster]");
    var button = document.querySelector("[data-play-button]");
    var status = document.querySelector("[data-player-status]");
    var started = false;
    var hlsInstance = null;

    if (!video || !cover) {
      return;
    }

    function showStatus(message) {
      if (!status) {
        return;
      }
      status.textContent = message;
      status.hidden = false;
    }

    function attachSource() {
      if (started) {
        return true;
      }
      started = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = mediaSource;
        return true;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(mediaSource);
        hlsInstance.attachMedia(video);
        return true;
      }
      showStatus("播放暂时不可用");
      return false;
    }

    function start() {
      if (!attachSource()) {
        return;
      }
      cover.classList.add("is-hidden");
      video.setAttribute("controls", "controls");
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          showStatus("请再次点击播放");
          cover.classList.remove("is-hidden");
        });
      }
    }

    cover.addEventListener("click", start);
    if (button) {
      button.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
      if (!started) {
        start();
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    bindMenu();
    bindHero();
    bindSearch();
    bindLocalFilter();
  });
})();
