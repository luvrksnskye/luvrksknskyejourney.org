document.addEventListener('DOMContentLoaded', function() {
  const hasSeenNotification = localStorage.getItem('hasSeenNotification');
  
  if (!hasSeenNotification) {
    const notificationPanel = document.querySelector('.notification-panel');
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.classList.add('notification-stars');
      
      const xPos = Math.floor(Math.random() * 100);
      const yPos = Math.floor(Math.random() * 100);
      
      star.style.left = `${xPos}%`;
      star.style.top = `${yPos}%`;
      
      const size = Math.random() * 3 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      const animDuration = Math.random() * 3 + 2;
      star.style.animation = `glow ${animDuration}s ease-in-out infinite alternate`;
      
      notificationPanel.appendChild(star);
    }
    
    setTimeout(function() {
      const notificationContainer = document.getElementById('notificationContainer');
      const notificationOverlay = document.getElementById('notificationOverlay');
      
      const appearSound = new Audio('/assets/sound-effects/woah.mp3');
      appearSound.play();
      
      notificationContainer.style.opacity = '0';
      notificationContainer.style.transform = 'translateY(-20px) scale(0.95)';
      notificationContainer.style.transition = 'opacity 1.2s ease-out, transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1.0)';
      
      notificationOverlay.classList.add('show');
      notificationContainer.classList.add('show');
      
      setTimeout(() => {
        notificationContainer.style.opacity = '1';
        notificationContainer.style.transform = 'translateY(0) scale(1)';
      }, 300);
    }, 1500);
  }
  
  const runConfetti = () => {
    const count = 200,
      defaults = {
        origin: { y: 0.3 },
        zIndex: 1002
      };
    
    function fire(particleRatio, opts) {
      confetti(
        Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        })
      );
    }
    
    fire(0.25, {
      spread: 26,
      startVelocity: 55
    });
    
    fire(0.2, {
      spread: 60
    });
    
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });
  };
  
  function closeNotification() {
    const notificationContainer = document.getElementById('notificationContainer');
    const notificationOverlay = document.getElementById('notificationOverlay');
    
    notificationContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease-in-out';
    notificationContainer.style.opacity = '0';
    notificationContainer.style.transform = 'translateY(-100px)';
    
    notificationOverlay.style.opacity = '0';
    
    setTimeout(function() {
      notificationContainer.classList.remove('show');
      notificationOverlay.classList.remove('show');
      
      notificationContainer.style.transform = '';
      notificationContainer.style.opacity = '';
      notificationOverlay.style.opacity = '';
    }, 500);
    
    localStorage.setItem('hasSeenNotification', 'true');
  }
  
  function handleOkieButton() {
    const soundEffect = new Audio('/assets/sound-effects/mystical-chime.mp3');
    soundEffect.play();
    
    runConfetti();
    
    setTimeout(() => {
      closeNotification();
    }, 1500);
  }
  
  document.getElementById('closeNotification').addEventListener('click', closeNotification);
  document.getElementById('dismissButton').addEventListener('click', closeNotification);
  document.getElementById('readMoreButton').addEventListener('click', handleOkieButton);
  
  // Add event listener for the notification icon
  const notificationopenBtn = document.getElementById('notificationopenBtn');
  if (notificationopenBtn) {
    notificationopenBtn.addEventListener('click', function() {
      const gearSound = new Audio('/assets/sound-effects/gear.mp3');
      gearSound.play();
      
      showNotificationPanel();
    });
  }
  
  function showNotificationPanel() {
    const notificationContainer = document.getElementById('notificationContainer');
    const notificationOverlay = document.getElementById('notificationOverlay');
    
    if (!notificationContainer || !notificationOverlay) return;
    
    localStorage.removeItem('hasSeenNotification');
    
    notificationContainer.style.opacity = '0';
    notificationContainer.style.transform = 'translateY(-20px) scale(0.95)';
    notificationContainer.style.transition = 'opacity 1.2s ease-out, transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1.0)';
    
    notificationOverlay.classList.add('show');
    notificationContainer.classList.add('show');
    
    setTimeout(() => {
      notificationContainer.style.opacity = '1';
      notificationContainer.style.transform = 'translateY(0) scale(1)';
    }, 300);
    
    recreateStars();
  }
  
  function recreateStars() {
    const notificationPanel = document.querySelector('.notification-panel');
    
    const existingStars = notificationPanel.querySelectorAll('.notification-stars');
    existingStars.forEach(star => star.remove());
    
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.classList.add('notification-stars');
      
      const xPos = Math.floor(Math.random() * 100);
      const yPos = Math.floor(Math.random() * 100);
      
      star.style.left = `${xPos}%`;
      star.style.top = `${yPos}%`;
      
      const size = Math.random() * 3 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      const animDuration = Math.random() * 3 + 2;
      star.style.animation = `glow ${animDuration}s ease-in-out infinite alternate`;
      
      notificationPanel.appendChild(star);
    }
  }
});

// Note: This code requires the confetti.js library to be included in your project
// Make sure to add this script tag before your notifications.js:
// <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js"></script>