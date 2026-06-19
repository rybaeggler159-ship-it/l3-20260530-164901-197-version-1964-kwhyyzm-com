import { H as Hls } from './hls.js';

const playerBoxes = document.querySelectorAll('[data-player-box]');

playerBoxes.forEach((box) => {
  const video = box.querySelector('video');
  const button = box.querySelector('[data-play-button]');
  let attached = false;
  let hls = null;

  const attach = () => {
    if (!video || attached) return;
    const source = video.getAttribute('data-video');
    if (!source) return;
    attached = true;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (eventName, data) => {
        if (!data || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    }
  };

  const play = () => {
    attach();
    button?.classList.add('hidden');
    video?.play().catch(() => {
      button?.classList.remove('hidden');
    });
  };

  button?.addEventListener('click', play);

  video?.addEventListener('play', () => {
    button?.classList.add('hidden');
  });

  video?.addEventListener('pause', () => {
    if (!video.ended) {
      button?.classList.remove('hidden');
    }
  });

  video?.addEventListener('click', () => {
    if (video.paused) {
      play();
    }
  });

  window.addEventListener('pagehide', () => {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
});
