(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    var toggle = $('[data-menu-toggle]');
    var panel = $('[data-mobile-panel]');

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initHero() {
    var root = $('[data-hero]');

    if (!root) {
      return;
    }

    var slides = $all('[data-hero-slide]', root);
    var dots = $all('[data-hero-dot]', root);
    var prev = $('[data-hero-prev]', root);
    var next = $('[data-hero-next]', root);
    var index = 0;
    var timer = null;

    function setSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        setSlide(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        setSlide(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setSlide(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        setSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    setSlide(0);
    start();
  }

  function initFilters() {
    var input = $('[data-site-search]');
    var region = $('[data-filter-region]');
    var type = $('[data-filter-type]');
    var cards = $all('[data-card]');

    if (!input || !cards.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    if (query) {
      input.value = query;
    }

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function apply() {
      var text = normalize(input.value);
      var regionValue = normalize(region && region.value);
      var typeValue = normalize(type && type.value);

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-year'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.textContent
        ].join(' '));
        var cardRegion = normalize(card.getAttribute('data-region'));
        var cardType = normalize(card.getAttribute('data-type'));
        var matched = true;

        if (text && haystack.indexOf(text) === -1) {
          matched = false;
        }

        if (regionValue && cardRegion !== regionValue) {
          matched = false;
        }

        if (typeValue && cardType !== typeValue) {
          matched = false;
        }

        card.classList.toggle('is-hidden', !matched);
      });
    }

    input.addEventListener('input', apply);

    if (region) {
      region.addEventListener('change', apply);
    }

    if (type) {
      type.addEventListener('change', apply);
    }

    apply();
  }

  function initVideoPlayer(streamUrl) {
    var holder = $('[data-player]');
    var video = $('[data-player-video]');
    var cover = $('[data-player-cover]');
    var errorBox = $('[data-player-error]');
    var hls = null;
    var ready = false;

    if (!holder || !video || !streamUrl) {
      return;
    }

    function showError() {
      if (errorBox) {
        errorBox.textContent = '播放暂不可用，请稍后再试';
      }
    }

    function prepare() {
      if (ready) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        ready = true;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showError();
          }
        });
        ready = true;
        return;
      }

      video.src = streamUrl;
      ready = true;
    }

    function play() {
      prepare();

      if (cover) {
        cover.classList.add('is-hidden');
      }

      video.controls = true;
      var request = video.play();

      if (request && typeof request.catch === 'function') {
        request.catch(function () {
          if (cover) {
            cover.classList.remove('is-hidden');
          }
        });
      }
    }

    holder.addEventListener('click', play);

    if (cover) {
      cover.addEventListener('click', function (event) {
        event.preventDefault();
        play();
      });
    }

    video.addEventListener('play', function () {
      if (cover) {
        cover.classList.add('is-hidden');
      }
    });

    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  initMenu();
  initHero();
  initFilters();

  window.initVideoPlayer = initVideoPlayer;
})();
