document.addEventListener('DOMContentLoaded', function() {
  const musicPlayer = document.getElementById('music-player');
  const musicToggle = document.getElementById('music-toggle');
  const soundEffects = new Audio();
  
  const basePath = (() => {
    const baseURL = window.location.origin;
    
    return `${baseURL}/personal/special-events/assets/audio/halloween/`;
  })();
  
  const playlist = [
    "geniuses-in-the-universe.mp3",
    "guess-who.mp3",
    "imaginarium.mp3",
    "luigi-mansion.mp3",
    "dual.mp3",
    "spooktune.mp3"
  ];
  
  function getTrackPath(trackName) {
    return `${basePath}${encodeURIComponent(trackName)}`;
  }
  
  let currentTrack = parseInt(localStorage.getItem('halloweenCurrentTrack')) || 0;
  let isPlaying = localStorage.getItem('halloweenIsPlaying') === 'true';
  let currentTime = parseFloat(localStorage.getItem('halloweenCurrentTime')) || 0;

  function loadTrack(trackIndex) {
    if (trackIndex >= playlist.length) {
      trackIndex = 0;
    }
    if (trackIndex < 0) {
      trackIndex = playlist.length - 1;
    }
    
    currentTrack = trackIndex;
    localStorage.setItem('halloweenCurrentTrack', currentTrack.toString());
    
    musicPlayer.src = getTrackPath(playlist[currentTrack]);
    
    if (currentTrack.toString() === localStorage.getItem('halloweenLastTrack')) {
      musicPlayer.currentTime = currentTime;
    } else {
      currentTime = 0;
      localStorage.setItem('halloweenCurrentTime', '0');
    }
    
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

  loadTrack(currentTrack);
  
  musicPlayer.volume = 0.2;
  
  if (isPlaying) {
    musicToggle.classList.add('playing');
  } else {
    musicToggle.classList.remove('playing');
  }
  
  musicPlayer.addEventListener('ended', function() {
    loadTrack(currentTrack + 1);
  });
  
  musicPlayer.addEventListener('timeupdate', function() {
    currentTime = musicPlayer.currentTime;
    localStorage.setItem('halloweenCurrentTime', currentTime.toString());
  });

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
  
  const mirrorElement = document.getElementById('mirror-icon');
  if (mirrorElement) {
    mirrorElement.addEventListener('click', function() {
      soundEffects.src = `${basePath.replace('/halloween/', '/sfx/')}king-boo.mp3`;
      soundEffects.volume = 0.3;
      soundEffects.play().catch(e => {
        console.log('Sound play was prevented:', e);
      });
    });
  }
  
  function updateCountdown() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    let halloween = new Date(currentYear, 9, 31);
    
    if (now > halloween) {
      halloween = new Date(currentYear + 1, 9, 31);
    }
    
    const diff = halloween - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (daysElement && hoursElement && minutesElement && secondsElement) {
      daysElement.textContent = days.toString().padStart(2, '0');
      hoursElement.textContent = hours.toString().padStart(2, '0');
      minutesElement.textContent = minutes.toString().padStart(2, '0');
      secondsElement.textContent = seconds.toString().padStart(2, '0');
      
      const countdownContainer = document.getElementById('halloween-countdown-container');
      if (countdownContainer) {
        if (days === 0 && hours < 24) {
          countdownContainer.classList.add('countdown-urgent');
        } else {
          countdownContainer.classList.remove('countdown-urgent');
        }
      }
      
      if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
        soundEffects.src = `${basePath.replace('/halloween/', '/sfx/')}halloween-bell.mp3`;
        soundEffects.volume = 1.0;
        soundEffects.play().catch(e => {
          console.log('Sound play was prevented:', e);
        });
      }
    }
  }
  
  if (document.getElementById('days')) {
    updateCountdown();
    
    setInterval(updateCountdown, 1000);
  }
  
  window.addEventListener('beforeunload', function() {
    localStorage.setItem('halloweenCurrentTime', musicPlayer.currentTime.toString());
    localStorage.setItem('halloweenIsPlaying', isPlaying.toString());
  });
});