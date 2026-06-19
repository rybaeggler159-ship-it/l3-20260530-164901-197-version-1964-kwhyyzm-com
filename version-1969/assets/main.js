const menuButton = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');

if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
}

const slider = document.querySelector('[data-hero-slider]');

if (slider) {
  const slides = Array.from(slider.querySelectorAll('.hero-slide'));
  const dots = Array.from(slider.querySelectorAll('[data-hero-dot]'));
  const prev = slider.querySelector('[data-hero-prev]');
  const next = slider.querySelector('[data-hero-next]');
  let index = 0;
  let timer = null;

  const show = (nextIndex) => {
    if (!slides.length) return;
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === index);
    });
  };

  const start = () => {
    timer = window.setInterval(() => show(index + 1), 5600);
  };

  const reset = () => {
    window.clearInterval(timer);
    start();
  };

  prev?.addEventListener('click', () => {
    show(index - 1);
    reset();
  });

  next?.addEventListener('click', () => {
    show(index + 1);
    reset();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      show(Number(dot.dataset.heroDot || 0));
      reset();
    });
  });

  show(0);
  start();
}

const normalize = (value) => String(value || '').trim().toLowerCase();

const applyInitialQuery = (scope) => {
  const input = scope.querySelector('[data-search-input]');
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  if (input && query) {
    input.value = query;
  }
};

document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
  applyInitialQuery(scope);

  const input = scope.querySelector('[data-search-input]');
  const region = scope.querySelector('[data-region-filter]');
  const year = scope.querySelector('[data-year-filter]');
  const genre = scope.querySelector('[data-genre-filter]');
  const cards = Array.from(scope.querySelectorAll('.movie-card, .rank-item'));

  const filter = () => {
    const keyword = normalize(input?.value);
    const regionValue = normalize(region?.value);
    const yearValue = normalize(year?.value);
    const genreValue = normalize(genre?.value);

    cards.forEach((card) => {
      const searchText = normalize(card.dataset.search || card.textContent);
      const cardRegion = normalize(card.dataset.region || searchText);
      const cardYear = normalize(card.dataset.year || searchText);
      const cardGenre = normalize(card.dataset.genre || searchText);
      const matchedKeyword = !keyword || searchText.includes(keyword);
      const matchedRegion = !regionValue || cardRegion.includes(regionValue) || searchText.includes(regionValue);
      const matchedYear = !yearValue || cardYear.includes(yearValue) || searchText.includes(yearValue);
      const matchedGenre = !genreValue || cardGenre.includes(genreValue) || searchText.includes(genreValue);
      card.hidden = !(matchedKeyword && matchedRegion && matchedYear && matchedGenre);
    });
  };

  input?.addEventListener('input', filter);
  region?.addEventListener('change', filter);
  year?.addEventListener('change', filter);
  genre?.addEventListener('change', filter);
  filter();
});
