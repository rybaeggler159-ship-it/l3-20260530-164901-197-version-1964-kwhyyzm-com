(function () {
    function initPlayer(root) {
        var video = root.querySelector('video');
        var overlay = root.querySelector('.player-overlay');
        if (!video || !overlay) {
            return;
        }
        var playUrl = video.getAttribute('data-play');
        var ready = false;
        var hlsInstance = null;

        function attach() {
            if (ready) {
                return;
            }
            ready = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = playUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(playUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = playUrl;
            }
        }

        function play() {
            attach();
            overlay.classList.add('is-hidden');
            video.controls = true;
            var result = video.play();
            if (result && result.catch) {
                result.catch(function () {});
            }
        }

        overlay.addEventListener('click', play);
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener('ended', function () {
            if (hlsInstance) {
                hlsInstance.stopLoad();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(initPlayer);
    });
}());
