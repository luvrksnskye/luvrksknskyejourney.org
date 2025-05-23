// Controls
const playButton = document.getElementById('play');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const progressBar = document.querySelector('.progress');
const progressBarContainer = document.querySelector('.progress-bar');
const currentTimeEl = document.querySelector('.current-time');
const durationEl = document.querySelector('.duration');
const visualizerBars = document.querySelectorAll('.visualizer-bar');

// Playlist configuration
const playlist = [
    'music/love-story.mp3'
];

// Initialize audio state from localStorage or default values
let currentTrack = parseInt(localStorage.getItem('currentTrack')) || 0;
let currentTime = parseFloat(localStorage.getItem('currentTime')) || 0;
let isPlaying = JSON.parse(localStorage.getItem('isPlaying')) || false;

const audio = new Audio(playlist[currentTrack]);
audio.preload = "auto"; // Preload audio for smoother transitions
audio.autoplay = true; // Autoplay enabled
audio.loop = false; // Individual tracks don't loop, but playlist will
audio.volume = 0.2;

// "tag" inside player
const cornerTag = document.getElementById('cornerTag');

// Initialize player state
function initializePlayer() {
    // Set initial time if resuming and also low volume lol
    audio.volume = 0.2;
    audio.currentTime = currentTime;
    
    // Autoplay if it was playing before
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
    
    // Save state periodically
    setInterval(savePlayerState, 1000);
}

// Save player state to localStorage
function savePlayerState() {
    localStorage.setItem('currentTrack', currentTrack);
    localStorage.setItem('currentTime', audio.currentTime);
    localStorage.setItem('isPlaying', isPlaying);
}

// Toggle play/pause
function togglePlay() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
}

// Update the play button icon
function updatePlayButton() {
    playButton.innerHTML = isPlaying ? 
        '<i class="fas fa-pause"></i>' : 
        '<i class="fas fa-play"></i>';
}

// Visualizer animation
function toggleVisualizer(playing) {
    visualizerBars.forEach((bar) => {
        bar.style.animationPlayState = playing ? 'running' : 'paused';
    });
}

// Play next track
function playNext() {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadAndPlayTrack();
}

// Play previous track
function playPrev() {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadAndPlayTrack();
}

// Load and play track
function loadAndPlayTrack() {
    const wasPlaying = true; // Always autoplay on track change
    audio.src = playlist[currentTrack];
    audio.currentTime = 0; // Reset time for the new track
    if (wasPlaying) {
        audio.play().catch(error => console.log("Error playing track:", error));
    }
    savePlayerState();
}

// Event Listeners
playButton.addEventListener('click', togglePlay);
nextButton.addEventListener('click', playNext);
prevButton.addEventListener('click', playPrev);

// Audio event listeners
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
    playNext(); // Automatically play next track when current one ends
});

// Seek on progress bar click
progressBarContainer.addEventListener('click', (e) => {
    const width = progressBarContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
});

// Time display functions
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

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        savePlayerState();
    }
});

// Initialize the player when the page loads
initializePlayer();
