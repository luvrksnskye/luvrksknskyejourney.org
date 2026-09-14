const playButton = document.getElementById('play');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const progressBar = document.querySelector('.progress');
const progressBarContainer = document.querySelector('.progress-bar');
const currentTimeEl = document.querySelector('.current-time');
const durationEl = document.querySelector('.duration');
const visualizerBars = document.querySelectorAll('.visualizer-bar');

const playlist = [
    'assets/audio/music/love-story.mp3'
];

let currentTrack = parseInt(localStorage.getItem('currentTrack')) || 0;
let currentTime = parseFloat(localStorage.getItem('currentTime')) || 0;
let isPlaying = JSON.parse(localStorage.getItem('isPlaying')) || false;

const audio = new Audio(playlist[currentTrack]);
audio.preload = "auto";
audio.autoplay = true;
audio.loop = false;
audio.volume = 0.2;

const cornerTag = document.getElementById('cornerTag');

function initializePlayer() {
    // Set initial time if resuming and also low volume lol
    audio.volume = 0.2;
    audio.currentTime = currentTime;
    
    if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay prevented:", error);
                isPlaying = false;
                updatePlayButton();
            });
        }
    }
    
    setInterval(savePlayerState, 1000);
}

function savePlayerState() {
    localStorage.setItem('currentTrack', currentTrack);
    localStorage.setItem('currentTime', audio.currentTime);
    localStorage.setItem('isPlaying', isPlaying);
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
}

function updatePlayButton() {
    playButton.innerHTML = isPlaying ? 
        '<i class="fas fa-pause"></i>' : 
        '<i class="fas fa-play"></i>';
}

function toggleVisualizer(playing) {
    visualizerBars.forEach((bar) => {
        bar.style.animationPlayState = playing ? 'running' : 'paused';
    });
}

function playNext() {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadAndPlayTrack();
}

function playPrev() {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadAndPlayTrack();
}

function loadAndPlayTrack() {
    const wasPlaying = true;
    audio.src = playlist[currentTrack];
    audio.currentTime = 0;
    if (wasPlaying) {
        audio.play().catch(error => console.log("Error playing track:", error));
    }
    savePlayerState();
}

playButton.addEventListener('click', togglePlay);
nextButton.addEventListener('click', playNext);
prevButton.addEventListener('click', playPrev);

audio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButton();
    toggleVisualizer(true);
    if (cornerTag) {
        cornerTag.classList.add('hide');
    }
    savePlayerState();
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayButton();
    toggleVisualizer(false);
    savePlayerState();
});

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }
    updateCurrentTime();
    updateDuration();
});

audio.addEventListener('ended', () => {
    playNext();
});

progressBarContainer.addEventListener('click', (e) => {
    const width = progressBarContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
});

function updateCurrentTime() {
    const minutes = Math.floor(audio.currentTime / 60);
    const seconds = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
    currentTimeEl.textContent = `${minutes}:${seconds}`;
}

function updateDuration() {
    if (audio.duration) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
        durationEl.textContent = `${minutes}:${seconds}`;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        savePlayerState();
    }
});

initializePlayer();
