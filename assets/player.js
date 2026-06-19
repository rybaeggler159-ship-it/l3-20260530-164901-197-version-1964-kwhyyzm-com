(function () {
  const CDN_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
  let hlsLoadingPromise = null;

  const loadHlsLibrary = function () {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsLoadingPromise) {
      return hlsLoadingPromise;
    }

    hlsLoadingPromise = new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = CDN_URL;
      script.async = true;
      script.onload = function () {
        if (window.Hls) {
          resolve(window.Hls);
        } else {
          reject(new Error('HLS library is not available'));
        }
      };
      script.onerror = function () {
        reject(new Error('HLS library failed to load'));
      };
      document.head.appendChild(script);
    });

    return hlsLoadingPromise;
  };

  const setupPlayer = function (shell) {
    const source = shell.getAttribute('data-src');
    const video = shell.querySelector('.video-player');
    const trigger = shell.querySelector('[data-play-trigger]');
    const status = shell.querySelector('[data-player-status]');
    let hlsInstance = null;
    let initialized = false;

    const setStatus = function (message) {
      if (status) {
        status.textContent = message;
      }
    };

    const startPlayback = function () {
      if (!source || !video) {
        setStatus('当前播放源不可用');
        return;
      }

      const playVideo = function () {
        video.play().then(function () {
          if (trigger) {
            trigger.classList.add('is-hidden');
          }
          setStatus('正在播放');
        }).catch(function () {
          setStatus('浏览器阻止了自动播放，请再次点击播放按钮');
        });
      };

      if (initialized) {
        playVideo();
        return;
      }

      initialized = true;
      setStatus('正在加载播放源');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        video.load();
        return;
      }

      loadHlsLibrary().then(function (Hls) {
        if (Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, playVideo);
          hlsInstance.on(Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus('播放加载异常，请刷新页面后重试');
            }
          });
        } else {
          setStatus('当前浏览器暂不支持此播放方式');
        }
      }).catch(function () {
        setStatus('播放器组件加载失败，请检查网络后重试');
      });
    };

    if (trigger) {
      trigger.addEventListener('click', startPlayback);
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.querySelectorAll('[data-player]').forEach(setupPlayer);
})();
