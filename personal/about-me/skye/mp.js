const playlist = [
    'music/6 AM.mp3',
    'music/7 AM.mp3',
    'music/12 AM.mp3',
    'music/2 AM.mp3'
];

let currentTrackIndex = 0;
let isPlaying = false;
let userHasInteracted = false;

const musicPlayer = document.getElementById('musicPlayer');
const audioPlayer = document.getElementById('audioPlayer');

function loadTrack(index) {
    audioPlayer.src = playlist[index];
    console.log(`Cargando: ${playlist[index]}`);
}

function playMusic() {
    audioPlayer.play().then(() => {
        isPlaying = true;
        musicPlayer.classList.remove('inactive');
        console.log(`Reproduciendo: ${playlist[currentTrackIndex]}`);
    }).catch(error => {
        console.log('Reproducción automática bloqueada:', error);

        if (!userHasInteracted) {
            console.log('Esperando interacción del usuario para reproducir');
        }
    });
}

function pauseMusic() {
    audioPlayer.pause();
    isPlaying = false;
    musicPlayer.classList.add('inactive');
    console.log('Música pausada');
}

function toggleMusic() {
    userHasInteracted = true;
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function nextTrack() {
    console.log(`Finalizó: ${playlist[currentTrackIndex]}`);
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);

    if (isPlaying) {

        setTimeout(() => {
            playMusic();
        }, 100);
    }

    console.log(`Siguiente pista (${currentTrackIndex + 1}/${playlist.length}): ${playlist[currentTrackIndex]}`);
}

function previousTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);

    if (isPlaying) {
        setTimeout(() => {
            playMusic();
        }, 100);
    }

    console.log(`Pista anterior (${currentTrackIndex + 1}/${playlist.length}): ${playlist[currentTrackIndex]}`);
}

function playAllFromStart() {
    currentTrackIndex = 0;
    loadTrack(currentTrackIndex);
    playMusic();
    console.log('Iniciando reproducción completa de la playlist');
}

loadTrack(currentTrackIndex);

audioPlayer.volume = 0.2;
console.log('Volumen inicial establecido a: 0.2');

musicPlayer.addEventListener('click', toggleMusic);

audioPlayer.addEventListener('ended', () => {
    console.log('Pista terminada, cambiando a la siguiente...');
    nextTrack();
});

audioPlayer.addEventListener('error', (e) => {
    console.error(`Error cargando ${playlist[currentTrackIndex]}:`, e);

    nextTrack();
});

audioPlayer.addEventListener('canplaythrough', () => {
    console.log(`Pista lista para reproducir: ${playlist[currentTrackIndex]}`);
});

window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('Intentando reproducción automática...');
        playMusic();
    }, 500);
});

document.addEventListener('click', function(e) {
    if (!userHasInteracted) {
        userHasInteracted = true;
        console.log('Primera interacción del usuario detectada');
        if (!isPlaying && audioPlayer.paused) {
            playMusic();
        }
    }
}, { once: true });

function getCurrentTrackInfo() {
    return {
        index: currentTrackIndex,
        track: playlist[currentTrackIndex],
        isPlaying: isPlaying,
        progress: `${currentTrackIndex + 1}/${playlist.length}`
    };
}

function setVolume(volume) {
    audioPlayer.volume = Math.max(0, Math.min(1, volume));
    console.log(`Volumen ajustado a: ${audioPlayer.volume}`);
}

window.musicPlayerControls = {
    play: playMusic,
    pause: pauseMusic,
    toggle: toggleMusic,
    next: nextTrack,
    previous: previousTrack,
    playAll: playAllFromStart,
    getCurrentInfo: getCurrentTrackInfo,
    setVolume: setVolume
};