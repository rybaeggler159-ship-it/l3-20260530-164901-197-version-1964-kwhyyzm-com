(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var button = $('[data-menu-button]');
    var nav = $('[data-mobile-nav]');
    if (!button || !nav) return;
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupHero() {
    var hero = $('[data-hero]');
    if (!hero) return;
    var slides = $all('[data-hero-slide]', hero);
    var dots = $all('[data-hero-dot]', hero);
    if (!slides.length) return;
    var current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    window.setInterval(function () {
      show(current + 1);
    }, 5600);
  }

  function setupFilters() {
    $all('[data-filter-scope]').forEach(function (scope) {
      var input = $('[data-filter-input]', scope);
      var select = $('[data-year-select]', scope);
      var list = $('[data-card-list]');
      if (!list) return;
      var cards = $all('[data-card]', list);

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : '';
        var year = select ? select.value : '';
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-tags')
          ].join(' ').toLowerCase();
          var okText = !keyword || haystack.indexOf(keyword) !== -1;
          var okYear = !year || (card.getAttribute('data-year') || '').indexOf(year) !== -1;
          card.classList.toggle('is-hidden', !(okText && okYear));
        });
      }

      if (input) input.addEventListener('input', apply);
      if (select) select.addEventListener('change', apply);
    });
  }

  function setupSearchPage() {
    var input = $('[data-site-search-input]');
    var button = $('[data-site-search-button]');
    var results = $('[data-search-results]');
    if (!input || !results || !window.SEARCH_ITEMS) return;

    function card(item) {
      var tags = (item.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return [
        '<article class="movie-card">',
        '<a class="poster-link" href="' + item.url + '">',
        '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
        '<span class="poster-badge">' + escapeHtml(item.year) + '</span>',
        '</a>',
        '<div class="card-body">',
        '<a class="card-title" href="' + item.url + '">' + escapeHtml(item.title) + '</a>',
        '<div class="card-meta"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>',
        '<p>' + escapeHtml(item.oneLine) + '</p>',
        '<div class="tag-row">' + tags + '</div>',
        '</div>',
        '</article>'
      ].join('');
    }

    function run() {
      var keyword = input.value.trim().toLowerCase();
      var items = window.SEARCH_ITEMS.filter(function (item) {
        var haystack = [item.title, item.year, item.region, item.type, item.genre, (item.tags || []).join(' ')].join(' ').toLowerCase();
        return !keyword || haystack.indexOf(keyword) !== -1;
      }).slice(0, 80);
      results.innerHTML = items.map(card).join('');
    }

    var params = new URLSearchParams(window.location.search);
    if (params.get('q')) input.value = params.get('q');
    input.addEventListener('input', run);
    if (button) button.addEventListener('click', run);
    run();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.initMoviePlayer = function (src) {
    var video = document.getElementById('movie-player');
    var button = $('[data-play]');
    if (!video || !src) return;
    var loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }
    }

    function play() {
      load();
      if (button) button.classList.add('hidden');
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }

    if (button) button.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) play();
    });
    video.addEventListener('play', function () {
      if (button) button.classList.add('hidden');
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupSearchPage();
  });
})();
