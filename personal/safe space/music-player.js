// Get all necessary DOM elements
const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');
const volumeSlider = document.getElementById('volumeSlider');
const volumeIcon = document.getElementById('volumeIcon');
const toggleBtn = document.getElementById('toggleBtn');
const musicPlayer = document.getElementById('musicPlayer');
const albumCover = document.getElementById('albumCover');
const musicIcon = document.querySelector('.music-icon');

// Initialize variables
let previousVolume = 1;
let isHidden = false;
let isDarkMode = false;

// Music paths
const musicPaths = {
    light: 'music player/home.mp3',
    dark: 'music player/home music box.mp3'
};

// Set audio properties
audio.loop = true;
audio.autoplay = true;

// Create link element for the night theme CSS
const nightThemeLink = document.createElement('link');
nightThemeLink.rel = 'stylesheet';
nightThemeLink.href = 'themes/night mode.css';
nightThemeLink.disabled = true; // Initially disabled

// Add night theme stylesheet to head
document.head.appendChild(nightThemeLink);

// Add theme toggle button
const themeToggleBtn = document.createElement('button');
themeToggleBtn.className = 'theme-toggle-btn';
themeToggleBtn.innerHTML = '<span class="material-icons">dark_mode</span>';
document.body.appendChild(themeToggleBtn);

// Function to toggle theme and update music
function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    // Toggle theme stylesheet
    nightThemeLink.disabled = !isDarkMode;
    
    // Update theme toggle button icon
    themeToggleBtn.querySelector('.material-icons').textContent = 
        isDarkMode ? 'light_mode' : 'dark_mode';
    
    // Update background image
    document.body.classList.toggle('night-mode', isDarkMode);
    
    // Update music
    if (isDarkMode) {
        audio.src = musicPaths.dark;
    } else {
        audio.src = musicPaths.light;
    }
    
    // Ensure loop and autoplay settings are maintained
    audio.loop = true;
    audio.autoplay = true;
    
    // Attempt to autoplay
    const playPromise = audio.play().catch(error => {
        console.log("Autoplay was prevented:", error);
        // Update play button UI if autoplay is blocked
        playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow';
    });
}

// Add event listener for theme toggle
themeToggleBtn.addEventListener('click', toggleTheme);

// Handle image error
albumCover.onerror = function() {
    this.style.display = 'none';
    musicIcon.style.display = 'flex';
};

// Format time in minutes:seconds
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update volume icon based on current volume
function updateVolumeIcon(volume) {
    const icon = volumeIcon.querySelector('.material-icons');
    if (volume === 0) {
        icon.textContent = 'volume_off';
    } else if (volume < 0.5) {
        icon.textContent = 'volume_down';
    } else {
        icon.textContent = 'volume_up';
    }
}

// Play/Pause button click handler
playPauseBtn.addEventListener('click', () => {
    const icon = playPauseBtn.querySelector('.material-icons');
    if (audio.paused) {
        audio.play();
        icon.textContent = 'pause';
    } else {
        audio.pause();
        icon.textContent = 'play_arrow';
    }
});

// Update progress bar and time display
audio.addEventListener('timeupdate', () => {
    const percentage = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percentage + '%';
    currentTimeSpan.textContent = formatTime(audio.currentTime);
});

// Set duration display when metadata is loaded
audio.addEventListener('loadedmetadata', () => {
    durationSpan.textContent = formatTime(audio.duration);
});

// Click on progress bar to seek
progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percentage * audio.duration;
});

// Volume slider handler
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audio.volume = volume;
    updateVolumeIcon(volume);
    if (volume > 0) {
        previousVolume = volume;
    }
});

// Volume icon click to mute/unmute
volumeIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
        audio.volume = 0;
        volumeSlider.value = 0;
        updateVolumeIcon(0);
    } else {
        audio.volume = previousVolume;
        volumeSlider.value = previousVolume * 100;
        updateVolumeIcon(previousVolume);
    }
});

// Previous button handler
document.getElementById('prevBtn').addEventListener('click', () => {
    audio.currentTime = 0;
});

// Next button handler
document.getElementById('nextBtn').addEventListener('click', () => {
    audio.currentTime = 0;
});

// Toggle button handler for showing/hiding music player
toggleBtn.addEventListener('click', () => {
    isHidden = !isHidden;
    musicPlayer.classList.toggle('hidden');
    toggleBtn.querySelector('.material-icons').textContent = 
        isHidden ? 'chevron_left' : 'chevron_right';
    toggleBtn.style.right = isHidden ? '20px' : '340px';
});

// Initialize volume
audio.volume = volumeSlider.value / 50;

// Initialize audio playback when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Set initial source
    audio.src = musicPaths.light;
    
    // Attempt to autoplay
    const playPromise = audio.play().catch(error => {
        console.log("Autoplay was prevented:", error);
        // Update play button UI if autoplay is blocked
        playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow';
    });

    // Update play button UI on successful autoplay
    if (!audio.paused) {
        playPauseBtn.querySelector('.material-icons').textContent = 'pause';
    }
});

// Handle play state changes
audio.addEventListener('play', () => {
    playPauseBtn.querySelector('.material-icons').textContent = 'pause';
});

audio.addEventListener('pause', () => {
    playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow';
});
