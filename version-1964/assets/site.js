(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let activeIndex = 0;

    const showSlide = function (index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        const index = Number(dot.getAttribute('data-hero-dot')) || 0;
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 5600);
    }
  }

  const scopes = document.querySelectorAll('[data-filter-scope]');

  scopes.forEach(function (scope) {
    const input = scope.querySelector('[data-filter-input]');
    const yearSelect = scope.querySelector('[data-filter-year]');
    const typeSelect = scope.querySelector('[data-filter-type]');
    const section = scope.closest('.content-section') || document;
    const cards = Array.from(section.querySelectorAll('[data-search-card]'));
    const counter = section.querySelector('[data-result-count]');

    const params = new URLSearchParams(window.location.search);
    const presetQuery = params.get('q');

    if (presetQuery && input) {
      input.value = presetQuery;
    }

    const applyFilter = function () {
      const query = input ? input.value.trim().toLowerCase() : '';
      const year = yearSelect ? yearSelect.value : '';
      const type = typeSelect ? typeSelect.value : '';
      let visibleCount = 0;

      cards.forEach(function (card) {
        const searchText = (card.getAttribute('data-search') || '').toLowerCase();
        const cardYear = card.getAttribute('data-year') || '';
        const cardType = card.getAttribute('data-type') || '';
        const matchesQuery = !query || searchText.includes(query);
        const matchesYear = !year || cardYear === year;
        const matchesType = !type || cardType === type;
        const visible = matchesQuery && matchesYear && matchesType;

        card.classList.toggle('is-hidden', !visible);
        if (visible) {
          visibleCount += 1;
        }
      });

      if (counter) {
        counter.textContent = '共 ' + visibleCount + ' 部影片';
      }
    };

    [input, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  });
})();
