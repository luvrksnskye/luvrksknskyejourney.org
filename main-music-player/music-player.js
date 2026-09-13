const musicPlayer = document.querySelector('.music-player');
const slideToggle = document.querySelector('.slide-toggle');
const songTitle = document.querySelector('.song-title');
const playButton = document.getElementById('play');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const progressBar = document.querySelector('.progress');
const progressBarContainer = document.querySelector('.progress-bar');
const currentTimeEl = document.querySelector('.current-time');
const durationEl = document.querySelector('.duration');
const visualizerBars = document.querySelectorAll('.visualizer-bar');
const cornerTag = document.querySelector('.corner-tag');
const content = document.querySelector('.content');

slideToggle.addEventListener('click', () => {
    musicPlayer.classList.toggle('slide-out');
    if (musicPlayer.classList.contains('slide-out')) {
        cornerTag.classList.add('hide');
    } else {
        cornerTag.classList.remove('hide');
    }
});

const basePath = (() => {
    const baseURL = window.location.origin;
    
    return `${baseURL}/intro-music/`;
})();

const playlist = [
    'song-of-the-welkin-moon.mp3',
    'the-big-sleep.mp3',
    'realitaetsprinzip.mp3',
    'dreamwalker.mp3',
    'light-showers.mp3',
    'waltzing-in-the-rain.mp3',
    'the-vault.mp3',
    'attachments.mp3',
    'flight.mp3',
    "dreams-swirling-whispers.mp3",
    "coruscating-street.mp3",
    "fountain-of-belleau.mp3",
    "equation.mp3",
    "ballad-of-many-waters.mp3",
    "dream-express.mp3",
    "pluie-sur-la-ville.mp3",
    "nocturnal-illumination.mp3",
    "quand-la-lumiere-resplendira.mp3",
    "la-nuit-silencieuse-et-paisible.mp3",
    "que-le-vent-soit-doux.mp3",
    "anyone-can-cook.mp3",
    "luminescence-of-eventide.mp3",
    "le-souvenir-avec-le-crepuscule.mp3",
    "french-kiss.mp3",
    "joie-de-vivre.mp3",
    "ratatouille-main-theme.mp3",
    "claire-de-lune.mp3",
    "ballad-du-paris.mp3",
    "julias-theme.mp3",
    "fables-about-the-stars.mp3",
    "comet-observatory.mp3",
    "star-chance.mp3",
    "to-the-gateway.mp3",
    "space-fantasy.mp3",
    "star-festival.mp3",
    "space-junk-galaxy.mp3",
    "dawn-a-new-morning.mp3",
    "suis-moi.mp3",
    "a-sweet-smile.mp3",
    "moonlight-in-mondstadt.mp3",
    "midnight-in-mondstadt.mp3",
    "mondstadt-starlit.mp3",
    "pure-sky.mp3",
    "dawn-winery.mp3",
    "cold-night.mp3",
    'lily-pads.mp3',
    'kelp-caves.mp3',
    'Below-Zero.mp3',
    'twisty-bridges.mp3',
    'arctic-peeper.mp3',
    'arc-lights.mp3',
    'a-thousand-strings.mp3',
    'a-continuous-thrum.mp3',
    'into-the-unknown.mp3',
    'salutations.mp3'
];

let currentTrack = parseInt(localStorage.getItem('currentTrack')) || 0;
let currentTime = parseFloat(localStorage.getItem('currentTime')) || 0;
let isPlaying = JSON.parse(localStorage.getItem('isPlaying')) || false;

function getTrackPath(trackName) {
    return `${basePath}${encodeURIComponent(trackName)}`;
}

const audio = new Audio(getTrackPath(playlist[currentTrack]));
audio.preload = "auto";
audio.autoplay = false;
audio.loop = false;
audio.volume = 0.4;

function updateSongTitle() {
    const currentSong = playlist[currentTrack];
    const formattedTitle = currentSong.replace('.mp3', '').replace(/-/g, ' ');
    songTitle.textContent = formattedTitle;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateProgress() {
    if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
        
        localStorage.setItem('currentTime', audio.currentTime);
    }
}

function updatePlayButton() {
    playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    localStorage.setItem('isPlaying', JSON.stringify(isPlaying));
}

function updateVisualizer() {
    visualizerBars.forEach(bar => {
        bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
    });
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
    } else {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                isPlaying = true;
                updatePlayButton();
                updateVisualizer();
            }).catch(error => {
                console.log("Playback was prevented by the browser:", error);
                isPlaying = false;
                updatePlayButton();
            });
        } else {
            isPlaying = true;
            updatePlayButton();
            updateVisualizer();
        }
    }
}

function loadTrack(trackIndex) {
    if (trackIndex < 0) trackIndex = playlist.length - 1;
    if (trackIndex >= playlist.length) trackIndex = 0;
    
    currentTrack = trackIndex;
    localStorage.setItem('currentTrack', currentTrack);
    
    const wasPlaying = isPlaying;
    
    audio.src = getTrackPath(playlist[currentTrack]);
    audio.currentTime = 0;
    localStorage.setItem('currentTime', 0);
    
    updateSongTitle();
    
    if (wasPlaying) {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                isPlaying = true;
                updatePlayButton();
                updateVisualizer();
            }).catch(error => {
                console.log("Auto-play was prevented by the browser:", error);
                isPlaying = false;
                updatePlayButton();
            });
        } else {
            isPlaying = true;
            updatePlayButton();
            updateVisualizer();
        }
    }
}

function playNext() {
    loadTrack(currentTrack + 1);
}

function playPrev() {
    loadTrack(currentTrack - 1);
}

function seek(e) {
    const seekPosition = (e.offsetX / progressBarContainer.clientWidth);
    audio.currentTime = seekPosition * audio.duration;
    updateProgress();
}

window.addEventListener('DOMContentLoaded', () => {
    audio.currentTime = currentTime;
    
    updateSongTitle();
    
    updatePlayButton();
    
    updateVisualizer();
    
    if (isPlaying) {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Auto-play was prevented by the browser:", error);
                isPlaying = false;
                updatePlayButton();
            });
        }
    }
});

playButton.addEventListener('click', togglePlay);
prevButton.addEventListener('click', playPrev);
nextButton.addEventListener('click', playNext);
progressBarContainer.addEventListener('click', seek);

audio.addEventListener('timeupdate', updateProgress);

audio.addEventListener('ended', () => {
    console.log("Track ended, playing next track");
    playNext();
});

audio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButton();
    updateVisualizer();
});

audio.addEventListener('pause', () => {
    if (audio.currentTime < audio.duration - 0.1) {  
        isPlaying = false;
        updatePlayButton();
        updateVisualizer();
    }
});

audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

function shufflePlaylist() {
    const currentSong = playlist[currentTrack];
    
    for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
    
    currentTrack = playlist.indexOf(currentSong);
    localStorage.setItem('currentTrack', currentTrack);
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isPlaying) {
        updateVisualizer();
    }
});