(function(){
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root=document) => root.querySelector(sel);
  const escapeHtml = (s='') => String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');

  function renderPoster(record, size='md') {
    const title = record.title || '';
    const year = record.year || '';
    const region = record.region || '';
    const genre = record.genre || '';
    const hash = [...(title + region)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const hue = hash % 360;
    const hue2 = (hue + 35) % 360;
    const width = size === 'sm' ? 240 : 320;
    const height = size === 'sm' ? 340 : 450;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="hsl(${hue},72%,48%)" />
            <stop offset="55%" stop-color="hsl(${hue2},62%,24%)" />
            <stop offset="100%" stop-color="#101014" />
          </linearGradient>
          <radialGradient id="r" cx="35%" cy="25%" r="80%">
            <stop offset="0%" stop-color="hsla(${(hue + 180) % 360},85%,70%,0.35)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" rx="24" fill="url(#g)" />
        <rect width="100%" height="100%" rx="24" fill="url(#r)" />
        <circle cx="${width * 0.77}" cy="${height * 0.18}" r="58" fill="rgba(255,255,255,0.11)" />
        <circle cx="${width * 0.18}" cy="${height * 0.78}" r="82" fill="rgba(0,0,0,0.18)" />
        <text x="34" y="84" fill="#fff7ed" font-family="Arial, Microsoft YaHei, sans-serif" font-size="22" font-weight="700">${escapeHtml(title).slice(0,20)}</text>
        <text x="34" y="121" fill="#ffd6c2" font-family="Arial, Microsoft YaHei, sans-serif" font-size="14">${escapeHtml(year)} · ${escapeHtml(region).slice(0,14)}</text>
        <text x="34" y="158" fill="#fef3c7" font-family="Arial, Microsoft YaHei, sans-serif" font-size="13">${escapeHtml(genre).slice(0,22)}</text>
        <text x="34" y="${height - 52}" fill="rgba(255,255,255,0.8)" font-family="Arial, Microsoft YaHei, sans-serif" font-size="12">STATIC CINEMA</text>
        <path d="M34 ${height - 34}h80" stroke="rgba(255,255,255,0.35)" stroke-width="2" />
      </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  function setCardPoster(card, record, size='md') {
    const poster = renderPoster(record, size);
    const el = card.querySelector('.poster, .mini-poster');
    if (el) el.style.backgroundImage = `url('${poster}')`;
  }

  function initSearchPage() {
    if (!window.SITE_DATA) return;
    const input = document.querySelector('[data-search-input]');
    const result = document.querySelector('[data-search-result]');
    const count = document.querySelector('[data-search-count]');
    const year = document.querySelector('[data-filter-year]');
    const region = document.querySelector('[data-filter-region]');
    const type = document.querySelector('[data-filter-type]');
    if (!result || !input) return;

    function apply() {
      const q = (input.value || '').trim().toLowerCase();
      const y = year && year.value ? year.value : '';
      const r = region && region.value ? region.value : '';
      const t = type && type.value ? type.value : '';
      const rows = window.SITE_DATA.filter(item => {
        const text = [item.title, item.region, item.type, item.genre, item.oneLine, item.category].join(' ').toLowerCase();
        const okQ = !q || text.includes(q);
        const okY = !y || String(item.year) === y;
        const okR = !r || item.region === r;
        const okT = !t || item.type === t;
        return okQ && okY && okR && okT;
      });
      if (count) count.textContent = rows.length + ' 条结果';
      result.innerHTML = rows.slice(0, 120).map(item => `
        <a class="list-item" href="${item.slug}">
          <span class="rank">${String(item.id).padStart(4,'0')}</span>
          <div class="list-main">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.year)} · ${escapeHtml(item.region)} · ${escapeHtml(item.genre)}</span>
          </div>
          <em>${escapeHtml(item.category)}</em>
        </a>
      `).join('') || '<div class="small">未找到匹配内容。</div>';
    }

    [input, year, region, type].forEach(el => el && el.addEventListener('input', apply));
    apply();
  }

  function initFilterCards() {
    $$('[data-filter-card]').forEach(root => {
      const input = root.querySelector('[data-filter-input]');
      const cards = $$('[data-filter-item]', root);
      if (!input || !cards.length) return;
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        cards.forEach(card => {
          const txt = (card.getAttribute('data-keywords') || card.textContent || '').toLowerCase();
          card.classList.toggle('hide', q && !txt.includes(q));
        });
      });
    });
  }

  function initPlayer() {
    const video = document.querySelector('[data-player-video]');
    if (!video) return;
    const mp4 = video.getAttribute('data-mp4');
    const hls = video.getAttribute('data-hls');
    const playBtn = document.querySelector('[data-play-button]');
    const srcBtns = $$('[data-source]');

    function load(src, type) {
      video.pause();
      while (video.firstChild) video.removeChild(video.firstChild);
      const source = document.createElement('source');
      source.src = src;
      if (type) source.type = type;
      video.appendChild(source);
      video.load();
    }

    function playUrl(src, label) {
      const ext = src.split('.').pop().toLowerCase();
      if (ext === 'm3u8' && video.canPlayType('application/vnd.apple.mpegurl')) {
        load(src, 'application/vnd.apple.mpegurl');
      } else if (ext === 'm3u8') {
        // Fallback to MP4 for browsers without native HLS support.
        load(mp4, 'video/mp4');
      } else {
        load(src, 'video/mp4');
      }
      video.play().catch(() => {});
      if (playBtn) playBtn.querySelector('span').textContent = label || '正在播放';
    }

    if (mp4) load(mp4, 'video/mp4');
    srcBtns.forEach(btn => btn.addEventListener('click', () => playUrl(btn.dataset.source, btn.textContent.trim())));
    if (playBtn) playBtn.addEventListener('click', () => playUrl(hls || mp4, '继续播放'));
  }

  function initScroller() {
    const rail = document.querySelector('[data-hero-rail]');
    if (!rail) return;
    let idx = 0;
    const cards = rail.children;
    if (!cards.length) return;
    setInterval(() => {
      idx = (idx + 1) % cards.length;
      rail.scrollTo({ left: cards[idx].offsetLeft - 12, behavior: 'smooth' });
    }, 4500);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSearchPage();
    initFilterCards();
    initPlayer();
    initScroller();
  });
})();
