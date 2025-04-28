document.addEventListener('DOMContentLoaded', function() {
  const musicPlayer = document.getElementById('music-player');
  const musicToggle = document.getElementById('music-toggle');
  const soundEffects = new Audio(); // Create a new audio element for sound effects
  
  // Base path configuration - this makes paths work from any location
  const basePath = (() => {
    const baseURL = window.location.origin;
    
    // Define the music directory path relative to the root
    return `${baseURL}/music-event/`;
  })();
  
  // Define your music playlist
  const playlist = [
    "Geniuses in the Universe.mp3",
    "Guess Who.mp3",
    "Imaginarium.mp3",
    "Luigi_Mansion.mp3",
    "Dual.mp3",
    "Spooktune.mp3"
  ];
  
  // Function to get the full path for a track
  function getTrackPath(trackName) {
    return `${basePath}${encodeURIComponent(trackName)}`;
  }
  
  // Set initial values, attempting to load from localStorage if available
  let currentTrack = parseInt(localStorage.getItem('halloweenCurrentTrack')) || 0;
  let isPlaying = localStorage.getItem('halloweenIsPlaying') === 'true';
  let currentTime = parseFloat(localStorage.getItem('halloweenCurrentTime')) || 0;

  // Function to load and play a track
  function loadTrack(trackIndex) {
    // Make sure the index is within the playlist range
    if (trackIndex >= playlist.length) {
      trackIndex = 0;
    }
    if (trackIndex < 0) {
      trackIndex = playlist.length - 1;
    }
    
    // Save current track to localStorage
    currentTrack = trackIndex;
    localStorage.setItem('halloweenCurrentTrack', currentTrack.toString());
    
    // Load the track with the proper path
    musicPlayer.src = getTrackPath(playlist[currentTrack]);
    
    // If we were in the middle of this track, seek to that position
    if (currentTrack.toString() === localStorage.getItem('halloweenLastTrack')) {
      musicPlayer.currentTime = currentTime;
    } else {
      // Reset time if we're loading a different track
      currentTime = 0;
      localStorage.setItem('halloweenCurrentTime', '0');
    }
    
    // Save this as the last loaded track
    localStorage.setItem('halloweenLastTrack', currentTrack.toString());
    
    if (isPlaying) {
      musicPlayer.play().catch(e => {
        console.log('Play was prevented:', e);
        isPlaying = false;
        localStorage.setItem('halloweenIsPlaying', 'false');
        musicToggle.classList.remove('playing');
      });
    }
  }

  // Load the saved track or default to first
  loadTrack(currentTrack);
  
  // Set volume
  musicPlayer.volume = 0.2;
  
  // Update playing status in UI based on localStorage
  if (isPlaying) {
    musicToggle.classList.add('playing');
  } else {
    musicToggle.classList.remove('playing');
  }
  
  // Play next track when current one ends
  musicPlayer.addEventListener('ended', function() {
    loadTrack(currentTrack + 1);
  });
  
  // Save current time periodically
  musicPlayer.addEventListener('timeupdate', function() {
    currentTime = musicPlayer.currentTime;
    localStorage.setItem('halloweenCurrentTime', currentTime.toString());
  });

  // Try autoplay if it was playing before
  if (isPlaying) {
    musicPlayer.play().then(() => {
      musicToggle.classList.add('playing');
    }).catch(e => {
      console.log('Auto-play was prevented:', e);
      isPlaying = false;
      localStorage.setItem('halloweenIsPlaying', 'false');
      musicToggle.classList.remove('playing');
    });
  }

  // Toggle music play/pause on click
  musicToggle.addEventListener('click', function() {
    if (isPlaying) {
      musicPlayer.pause();
      musicToggle.classList.remove('playing');
    } else {
      musicPlayer.play().catch(e => {
        console.log('Play was prevented:', e);
      });
      musicToggle.classList.add('playing');
    }
    
    isPlaying = !isPlaying;
    localStorage.setItem('halloweenIsPlaying', isPlaying.toString());
    
    // Add jump animation when clicked
    musicToggle.classList.add('jump');
    setTimeout(() => {
      musicToggle.classList.remove('jump');
    }, 500);
  });

  musicToggle.addEventListener('mouseleave', function() {
    if (typeof splashEffect !== 'undefined') {
      splashEffect.classList.remove('active');
    }
  });
  
  // Mirror element functionality
  const mirrorElement = document.getElementById('mirror-icon');
  if (mirrorElement) {
    mirrorElement.addEventListener('click', function() {
      // Use basePath for sound effects
      soundEffects.src = `${basePath.replace('/music-event/', '/sounds/')}king-boo.mp3`;
      soundEffects.volume = 0.3; // Slightly louder for more impact
      soundEffects.play().catch(e => {
        console.log('Sound play was prevented:', e);
      });
    });
  }
  
  // Halloween Countdown
  function updateCountdown() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Create Halloween date for current year
    let halloween = new Date(currentYear, 9, 31); // October is month 9 (0-based)
    
    // If Halloween has passed this year, use next year
    if (now > halloween) {
      halloween = new Date(currentYear + 1, 9, 31);
    }
    
    // Calculate time difference
    const diff = halloween - now;
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update the countdown display
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (daysElement && hoursElement && minutesElement && secondsElement) {
      daysElement.textContent = days.toString().padStart(2, '0');
      hoursElement.textContent = hours.toString().padStart(2, '0');
      minutesElement.textContent = minutes.toString().padStart(2, '0');
      secondsElement.textContent = seconds.toString().padStart(2, '0');
      
      // Add urgent styling if within 24 hours
      const countdownContainer = document.getElementById('halloween-countdown-container');
      if (countdownContainer) {
        if (days === 0 && hours < 24) {
          countdownContainer.classList.add('countdown-urgent');
        } else {
          countdownContainer.classList.remove('countdown-urgent');
        }
      }
      
      // Add spooky sound effect at midnight of Halloween
      if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
        soundEffects.src = `${basePath.replace('/music-event/', '/sounds/')}halloween-bell.mp3`;
        soundEffects.volume = 1.0;
        soundEffects.play().catch(e => {
          console.log('Sound play was prevented:', e);
        });
      }
    }
  }
  
  // Check if countdown elements exist before starting the countdown
  if (document.getElementById('days')) {
    // Update countdown immediately
    updateCountdown();
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
  }
  
  // Handle page unload to save final state
  window.addEventListener('beforeunload', function() {
    localStorage.setItem('halloweenCurrentTime', musicPlayer.currentTime.toString());
    localStorage.setItem('halloweenIsPlaying', isPlaying.toString());
  });
});