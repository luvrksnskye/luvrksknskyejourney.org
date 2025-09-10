const mainBackground = document.getElementById('mainBackground');
const transitionVideo = document.getElementById('transitionVideo');
const secondBackground = document.getElementById('secondBackground');
const transition = document.getElementById('transition');
const messageOverlay = document.getElementById('messageOverlay');
const transitionMessage = document.getElementById('transitionMessage');

// transition classes
mainBackground.classList.add('background-element');
secondBackground.classList.add('background-element');
transitionVideo.classList.add('transition-video');

// Initialize state
secondBackground.style.opacity = 0;
let isFirstBackground = true;
let lastTransitionHour = null;
let isTransitioning = false;

transition.load();

function showMessage(isNight) {
    const message = isNight ? "It's night time!" : "Good morning!";
    transitionMessage.textContent = message;
    
    messageOverlay.style.opacity = 0;
    messageOverlay.style.display = 'block';
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
        messageOverlay.classList.add('visible');
    });

    // Hide message after 3 seconds with fade
    setTimeout(() => {
        messageOverlay.classList.remove('visible');
        setTimeout(() => {
            messageOverlay.style.display = 'none';
        }, 500); // Match the CSS transition duration
    }, 3000);
}

function triggerTransition() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    if (isFirstBackground) { // Switching to night
        showMessage(true);
        
        // Fade in transition video
        requestAnimationFrame(() => {
            transitionVideo.style.opacity = 1;
        });
        
        // Start fading out main background
        setTimeout(() => {
            mainBackground.style.opacity = 0;
        }, 500);
        
        transition.currentTime = 0;
        transition.play().catch(function(error) {
            console.log("Error playing transition: ", error);
        });
        
        transition.onended = () => {
            // Fade out transition video
            transitionVideo.style.opacity = 0;
            
            // Fade in night background
            setTimeout(() => {
                secondBackground.style.opacity = 1;
                isFirstBackground = false;
                isTransitioning = false;
                updateTheme(false);
            }, 500);
        };
    } else { // Switching to day
        showMessage(false);
        
        // Fade in transition video
        requestAnimationFrame(() => {
            transitionVideo.style.opacity = 1;
        });
        
        // Start fading out night background
        setTimeout(() => {
            secondBackground.style.opacity = 0;
        }, 500);
        
        transition.currentTime = 0;
        transition.play().catch(function(error) {
            console.log("Error playing transition: ", error);
        });
        
        transition.onended = () => {
            // Fade out transition video
            transitionVideo.style.opacity = 0;
            
            // Fade in day background
            setTimeout(() => {
                mainBackground.style.opacity = 1;
                isFirstBackground = true;
                isTransitioning = false;
                updateTheme(false);
            }, 500);
        };
    }
}

function updateTheme(playTransition = true) {
    if (playTransition) {
        triggerTransition();
    } else {
        if (!isFirstBackground) {
            mainBackground.style.opacity = 0;
            secondBackground.style.opacity = 1;
        } else {
            mainBackground.style.opacity = 1;
            secondBackground.style.opacity = 0;
        }
    }
}

function checkTime() {
    if (isTransitioning) return;
    
    const now = new Date();
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hours = estTime.getHours();
    const minutes = estTime.getMinutes();
    
    // Check if we've already transitioned this hour to prevent multiple transitions
    if (hours === lastTransitionHour) {
        return;
    }
    
    // Check for exact transition times (7 AM and 7 PM)
    if (hours === 7 && minutes === 0) { // 7:00 AM
        if (!isFirstBackground) { // If currently showing night background
            lastTransitionHour = hours;
            triggerTransition(); // Switch to day
        }
    } else if (hours === 19 && minutes === 0) { // 7:00 PM
        if (isFirstBackground) { // If currently showing day background
            lastTransitionHour = hours;
            triggerTransition(); // Switch to night
        }
    }
    
    // Handle initial state when page loads
    if (lastTransitionHour === null) {
        if ((hours >= 19 || hours < 7) && isFirstBackground) { // Should be night
            updateTheme(true);
        } else if ((hours >= 7 && hours < 19) && !isFirstBackground) { // Should be day
            updateTheme(true);
        }
    }
}

// Check time every 5 seconds
setInterval(checkTime, 5000);

// Initial check on page load
checkTime();