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

// Toggle slide functionality
slideToggle.addEventListener('click', () => {
    musicPlayer.classList.toggle('slide-out');
    if (musicPlayer.classList.contains('slide-out')) {
        cornerTag.classList.add('hide');
    } else {
        cornerTag.classList.remove('hide');
    }
});

// Base path configuration - this makes paths work from any location
const basePath = (() => {
    const baseURL = window.location.origin;
    
    // Define the music directory path relative to the root
    return `${baseURL}/intro-music/`;
})();

const playlist = [
    'Song of the Welkin Moon.mp3',
    'The Big Sleep.mp3',
    'Realitätsprinzip.mp3',
    'Dreamwalker.mp3',
    'Light Showers.mp3',
    'Waltzing in the Rain.mp3',
    'The Vault.mp3',
    'Attachments.mp3',
    'Flight.mp3',
    "Dreams' Swirling Whispers.mp3",
    "Coruscating Street.mp3",
    "Fountain of Belleau.mp3",
    "Equation.mp3",
    "Ballad of Many Waters.mp3",
    "Dream Express.mp3",
    "Pluie sur la ville.mp3",
    "Nocturnal Illumination.mp3",
    "Quand la lumiere resplendira.mp3",
    "La nuit silencieuse et paisible.mp3",
    "Que le vent soit doux.mp3",
    "Anyone Can Cook.mp3",
    "Luminescence of Eventide.mp3",
    "Le Souvenir avec le crepuscule.mp3",
    "French Kiss.mp3",
    "Joie De Vivre.mp3",
    "Ratatouille Main Theme.mp3",
    "Claire de Lune.mp3",
    "Ballad Du Paris.mp3",
    "Julia's Theme.mp3",
    "Fables About the Stars.mp3",
    "Comet Observatory.mp3",
    "Star Chance.mp3",
    "To the Gateway.mp3",
    "Space Fantasy.mp3",
    "Star Festival.mp3",
    "Space Junk Galaxy.mp3",
    "Dawn  (A New Morning).mp3",
    "Suis-moi.mp3",
    "A Sweet Smile.mp3",
    "Moonlight in Mondstadt.mp3",
    "Midnight in Mondstadt.mp3",
    "Mondstadt Starlit.mp3",
    "Pure Sky.mp3",
    "Dawn Winery.mp3",
    "Cold Night.mp3",
    'Lily-Pads.mp3',
    'Kelp-Caves.mp3',
    'Below-Zero.mp3',
    'Twisty-Bridges.mp3',
    'Arctic-Peeper.mp3',
    'Arc-Lights.mp3',
    'A-Thousand-Strings.mp3',
    'A-Continuous-Thrum.mp3',
    'Into-the-Unknown.mp3',
    'Salutations.mp3'
];

// Initialize audio state from localStorage or default values
let currentTrack = parseInt(localStorage.getItem('currentTrack')) || 0;
let currentTime = parseFloat(localStorage.getItem('currentTime')) || 0;
let isPlaying = JSON.parse(localStorage.getItem('isPlaying')) || false;

// Function to get full path for a track
function getTrackPath(trackName) {
    return `${basePath}${encodeURIComponent(trackName)}`;
}

// Initialize with the correct path
const audio = new Audio(getTrackPath(playlist[currentTrack]));
audio.preload = "auto"; // Preload audio for smoother transitions
audio.autoplay = false; // Don't autoplay until user interacts
audio.loop = false; // Individual tracks don't loop, but playlist will
audio.volume = 0.4;

// Update song title
function updateSongTitle() {
    const currentSong = playlist[currentTrack];
    // Remove file extension and replace dashes with spaces
    const formattedTitle = currentSong.replace('.mp3', '').replace(/-/g, ' ');
    songTitle.textContent = formattedTitle;
}

// Function to format time in MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Function to update progress bar and time display
function updateProgress() {
    if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
        
        // Save current state to localStorage
        localStorage.setItem('currentTime', audio.currentTime);
    }
}

// Function to update play/pause button state
function updatePlayButton() {
    playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    localStorage.setItem('isPlaying', JSON.stringify(isPlaying));
}

// Function to update visualizer - using CSS animations instead of JS height changes
function updateVisualizer() {
    visualizerBars.forEach(bar => {
        bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
    });
}

// Function to handle play/pause
function togglePlay() {
    if (isPlaying) {
        audio.pause();
    } else {
        // Try to play and handle potential browser restrictions
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Playback started successfully
                isPlaying = true;
                updatePlayButton();
                updateVisualizer();
            }).catch(error => {
                // Auto-play was prevented
                console.log("Playback was prevented by the browser:", error);
                isPlaying = false;
                updatePlayButton();
            });
        } else {
            // Older browsers may not return a promise
            isPlaying = true;
            updatePlayButton();
            updateVisualizer();
        }
    }
}

// Function to load and play a track
function loadTrack(trackIndex) {
    if (trackIndex < 0) trackIndex = playlist.length - 1;
    if (trackIndex >= playlist.length) trackIndex = 0;
    
    currentTrack = trackIndex;
    localStorage.setItem('currentTrack', currentTrack);
    
    // Store the previous isPlaying state
    const wasPlaying = isPlaying;
    
    // Reset the audio element with new source
    audio.src = getTrackPath(playlist[currentTrack]);
    audio.currentTime = 0;
    localStorage.setItem('currentTime', 0);
    
    // Update song title
    updateSongTitle();
    
    // If it was playing before or this is called from 'ended' event, play the new track
    if (wasPlaying) {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Playback started successfully
                isPlaying = true;
                updatePlayButton();
                updateVisualizer();
            }).catch(error => {
                // Auto-play was prevented
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

// Function to play next track
function playNext() {
    loadTrack(currentTrack + 1);
}

// Function to play previous track
function playPrev() {
    loadTrack(currentTrack - 1);
}

// Function to seek within a track
function seek(e) {
    const seekPosition = (e.offsetX / progressBarContainer.clientWidth);
    audio.currentTime = seekPosition * audio.duration;
    updateProgress();
}

// Initialize player state
window.addEventListener('DOMContentLoaded', () => {
    // Set initial audio time
    audio.currentTime = currentTime;
    
    // Update song title
    updateSongTitle();
    
    // Update controls based on initial state
    updatePlayButton();
    
    // Initialize visualizer state
    updateVisualizer();
    
    // Try to play if it was playing before
    if (isPlaying) {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented
                console.log("Auto-play was prevented by the browser:", error);
                isPlaying = false;
                updatePlayButton();
            });
        }
    }
});

// Event listeners
playButton.addEventListener('click', togglePlay);
prevButton.addEventListener('click', playPrev);
nextButton.addEventListener('click', playNext);
progressBarContainer.addEventListener('click', seek);

// Update progress as audio plays
audio.addEventListener('timeupdate', updateProgress);

// When track ends, play next track - THIS IS CRITICAL FOR AUTO PLAY NEXT
audio.addEventListener('ended', () => {
    console.log("Track ended, playing next track");
    playNext();
});

// Handle play state changes
audio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButton();
    updateVisualizer();
});

audio.addEventListener('pause', () => {
    // Only mark as not playing if it's a real pause, not just an ended track
    if (audio.currentTime < audio.duration - 0.1) {  
        isPlaying = false;
        updatePlayButton();
        updateVisualizer();
    }
});

// Handle track loading
audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

// Create a shuffle function
function shufflePlaylist() {
    const currentSong = playlist[currentTrack];
    
    // Shuffle algorithm (Fisher-Yates)
    for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
    
    // Find the current song in the shuffled playlist
    currentTrack = playlist.indexOf(currentSong);
    localStorage.setItem('currentTrack', currentTrack);
}

// Handle page visibility changes to conserve resources
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isPlaying) {
        updateVisualizer();
    }
});