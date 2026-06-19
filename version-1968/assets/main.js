(function () {
  var MovieSite = {};

  function queryAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  MovieSite.initNavigation = function () {
    var button = document.querySelector('[data-menu-toggle]');
    if (!button) {
      return;
    }
    var target = document.getElementById(button.getAttribute('data-menu-toggle'));
    if (!target) {
      return;
    }
    button.addEventListener('click', function () {
      target.classList.toggle('is-open');
    });
  };

  MovieSite.initHero = function () {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = queryAll('.hero-slide', slider);
    var dots = queryAll('.hero-dot', slider);
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        if (timer) {
          window.clearInterval(timer);
        }
        show(dotIndex);
        start();
      });
    });

    start();
  };

  MovieSite.initFilters = function () {
    var input = document.querySelector('[data-filter-input]');
    var cards = queryAll('[data-title]');
    if (!input || cards.length === 0) {
      return;
    }
    var buttons = queryAll('[data-filter-value]');
    var current = '全部';

    function valueOf(card) {
      return [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-year'),
        card.getAttribute('data-tags')
      ].join(' ').toLowerCase();
    }

    function apply() {
      var term = input.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var text = valueOf(card);
        var typeMatch = current === '全部' || text.indexOf(current.toLowerCase()) !== -1;
        var keywordMatch = term === '' || text.indexOf(term) !== -1;
        var keep = typeMatch && keywordMatch;
        card.style.display = keep ? '' : 'none';
        if (keep) {
          visible += 1;
        }
      });
      queryAll('[data-empty-state]').forEach(function (empty) {
        empty.style.display = visible === 0 ? 'block' : 'none';
      });
    }

    input.addEventListener('input', apply);
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        current = button.getAttribute('data-filter-value') || '全部';
        buttons.forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
        apply();
      });
    });
  };

  MovieSite.initPlayer = function (options) {
    var video = document.getElementById(options.videoId);
    var button = document.getElementById(options.buttonId);
    if (!video || !options.url) {
      return;
    }
    var loaded = false;
    var hlsInstance = null;

    function hideButton() {
      if (button) {
        button.classList.add('hidden');
      }
    }

    function playVideo() {
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {});
      }
    }

    function load() {
      hideButton();
      if (loaded) {
        playVideo();
        return;
      }
      loaded = true;
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(options.url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          playVideo();
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          }
        });
      } else {
        video.src = options.url;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        video.load();
      }
    }

    if (button) {
      button.addEventListener('click', load);
    }
    video.addEventListener('click', function () {
      if (!loaded) {
        load();
      }
    });
    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    MovieSite.initNavigation();
    MovieSite.initHero();
    MovieSite.initFilters();
  });

  window.MovieSite = MovieSite;
})();
