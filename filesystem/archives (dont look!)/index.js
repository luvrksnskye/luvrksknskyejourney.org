// Time Control Panel Functionality
document.addEventListener('DOMContentLoaded', function() {
    const timeControlButton = document.getElementById('timeControlButton');
    const timeControlPanel = document.getElementById('timeControlPanel');
    const timeDisplay = document.getElementById('timeDisplay');
    const hourInput = document.getElementById('hourInput');
    const minuteInput = document.getElementById('minuteInput');
    const cancelTimeBtn = document.getElementById('cancelTimeBtn');
    const setTimeBtn = document.getElementById('setTimeBtn');
    const selectionSound = document.getElementById('selectionSound');
    const clockSound = document.getElementById('clockSound');
    const hourHand = document.getElementById('hourHand');
    const minuteHand = document.getElementById('minuteHand');
    
    // Get time icons
    const noonIcon = document.querySelector('.noon-icon');
    const nightIcon = document.querySelector('.night-icon');
    const morningIcon = document.querySelector('.morning-icon');
    const duskIcon = document.querySelector('.dusk-icon');
    
    // Time state management
    let isCustomTime = false;
    let customTime = { hours: 0, minutes: 0 };
    let customTimeStartTimestamp = 0;
    let isPanelOpen = false;
    let userEditingInputs = false;
    
    // Load saved time state from localStorage
    function loadTimeState() {
        const savedState = localStorage.getItem('clockTimeState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                isCustomTime = state.isCustomTime || false;
                customTime = state.customTime || { hours: 0, minutes: 0 };
                customTimeStartTimestamp = state.customTimeStartTimestamp || Date.now();
            } catch (e) {
                console.error('Error loading time state:', e);
                resetToRealTime();
            }
        }
    }
    
    // Save time state to localStorage
    function saveTimeState() {
        const state = {
            isCustomTime: isCustomTime,
            customTime: customTime,
            customTimeStartTimestamp: customTimeStartTimestamp
        };
        localStorage.setItem('clockTimeState', JSON.stringify(state));
    }
    
    // Reset to real time
    function resetToRealTime() {
        isCustomTime = false;
        customTime = { hours: 0, minutes: 0 };
        customTimeStartTimestamp = 0;
        localStorage.removeItem('clockTimeState');
    }
    
    // Get current display time (either real or custom)
    function getCurrentDisplayTime() {
        if (!isCustomTime) {
            const now = new Date();
            return {
                hours: now.getHours(),
                minutes: now.getMinutes()
            };
        }
        
        // Calculate elapsed time since custom time was set
        const elapsedMs = Date.now() - customTimeStartTimestamp;
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
        
        // Add elapsed time to custom time
        let totalMinutes = customTime.hours * 60 + customTime.minutes + elapsedMinutes;
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        
        return { hours, minutes };
    }
    
    // Format time for display
    function formatTime(hours, minutes) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Update time display in the panel (only when not editing)
    function updateTimeDisplay() {
        if (!userEditingInputs) {
            const currentTime = getCurrentDisplayTime();
            timeDisplay.textContent = formatTime(currentTime.hours, currentTime.minutes);
            hourInput.value = currentTime.hours;
            minuteInput.value = currentTime.minutes;
        }
    }
    
    // Update time icons based on hour
    function updateTimeIcons(hour) {
        // Remove active class from all icons
        noonIcon.classList.remove('active');
        nightIcon.classList.remove('active');
        morningIcon.classList.remove('active');
        duskIcon.classList.remove('active');
        
        // Add active class based on time of day
        if (hour >= 11 && hour <= 13) {
            // Noon (11 AM - 1 PM)
            noonIcon.classList.add('active');
        } else if (hour >= 6 && hour <= 10) {
            // Morning (6 AM - 10 AM)
            morningIcon.classList.add('active');
        } else if (hour >= 17 && hour <= 19) {
            // Dusk (5 PM - 7 PM)
            duskIcon.classList.add('active');
        } else if (hour >= 20 || hour <= 5) {
            // Night (8 PM - 5 AM)
            nightIcon.classList.add('active');
        }
    }
    
    // Update clock hands position
    function updateClockHands(hours, minutes) {
        const hourAngle = (hours % 12) * 30 + minutes * 0.5;
        const minuteAngle = minutes * 6;
        
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }
    
    // Calculate shortest rotation angle (considering 360° wrap)
    function getShortestAngle(from, to) {
        let diff = to - from;
        
        // Normalize to [-180, 180]
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        
        return diff;
    }
    
    // Animate clock hands and icons during time change
    function animateTimeChange(targetHours, targetMinutes, isResetToReal = false) {
        const animationDuration = 3000; // 3 seconds
        const updateInterval = 50; // Update every 50ms for smoother animation
        const totalSteps = animationDuration / updateInterval;
        
        // Get current display time for starting position
        const currentDisplayTime = getCurrentDisplayTime();
        const startHours = currentDisplayTime.hours;
        const startMinutes = currentDisplayTime.minutes;
        
        // Calculate starting and target angles
        const startHourAngle = (startHours % 12) * 30 + startMinutes * 0.5;
        const startMinuteAngle = startMinutes * 6;
        
        const targetHourAngle = (targetHours % 12) * 30 + targetMinutes * 0.5;
        const targetMinuteAngle = targetMinutes * 6;
        
        // Calculate shortest rotation paths
        const hourAngleDiff = getShortestAngle(startHourAngle, targetHourAngle);
        const minuteAngleDiff = getShortestAngle(startMinuteAngle, targetMinuteAngle);
        
        // Calculate increments per step
        const hourAngleIncrement = hourAngleDiff / totalSteps;
        const minuteAngleIncrement = minuteAngleDiff / totalSteps;
        
        let step = 0;
        
        const animationInterval = setInterval(() => {
            step++;
            
            // Calculate current animation angles
            const currentHourAngle = startHourAngle + (hourAngleIncrement * step);
            const currentMinuteAngle = startMinuteAngle + (minuteAngleIncrement * step);
            
            // Apply rotation directly to hands
            hourHand.style.transform = `rotate(${currentHourAngle}deg)`;
            minuteHand.style.transform = `rotate(${currentMinuteAngle}deg)`;
            
            // Calculate approximate time for icon updates during animation
            const progress = step / totalSteps;
            let animationHours;
            
            // Handle hour calculation properly for different scenarios
            if (Math.abs(targetHours - startHours) <= 12) {
                animationHours = startHours + (targetHours - startHours) * progress;
            } else {
                // Handle day boundary crossing
                const hourDiff = targetHours > startHours ? targetHours - startHours - 24 : targetHours - startHours + 24;
                animationHours = (startHours + hourDiff * progress + 24) % 24;
            }
            
            // Update icons during animation
            updateTimeIcons(Math.floor(animationHours));
            
            // Stop animation when complete
            if (step >= totalSteps) {
                clearInterval(animationInterval);
                
                // Ensure final position is exact
                updateClockHands(targetHours, targetMinutes);
                
                // Final icon update
                updateTimeIcons(targetHours);
                
                // Stop animation classes and sound
                hourHand.classList.remove('fast-rotation');
                minuteHand.classList.remove('fast-rotation');
                clockSound.pause();
                clockSound.currentTime = 0;
                
                // Set the final state - different behavior for reset vs custom time
                if (isResetToReal) {
                    // For reset, clear custom time state
                    isCustomTime = false;
                    customTime = { hours: 0, minutes: 0 };
                    customTimeStartTimestamp = 0;
                    localStorage.removeItem('clockTimeState');
                } else {
                    // For custom time, set and save the state
                    isCustomTime = true;
                    customTime = { hours: targetHours, minutes: targetMinutes };
                    customTimeStartTimestamp = Date.now();
                    saveTimeState();
                }
            }
        }, updateInterval);
    }
    
    // Open time control panel
    timeControlButton.addEventListener('click', function() {
        selectionSound.currentTime = 0;
        selectionSound.play();
        
        isPanelOpen = true;
        userEditingInputs = false;
        updateTimeDisplay();
        timeControlPanel.style.display = 'flex';
    });
    
    // Close panel without changes
    cancelTimeBtn.addEventListener('click', function() {
        selectionSound.currentTime = 0;
        selectionSound.play();
        
        isPanelOpen = false;
        userEditingInputs = false;
        timeControlPanel.style.display = 'none';
    });
    
    // Apply time changes
    setTimeBtn.addEventListener('click', function() {
        selectionSound.currentTime = 0;
        selectionSound.play();
        
        isPanelOpen = false;
        userEditingInputs = false;
        timeControlPanel.style.display = 'none';
        
        // Get the new time values
        const newHours = parseInt(hourInput.value, 10);
        const newMinutes = parseInt(minuteInput.value, 10);
        
        // Validate input
        if (isNaN(newHours) || isNaN(newMinutes) || 
            newHours < 0 || newHours > 23 || 
            newMinutes < 0 || newMinutes > 59) {
            return;
        }
        
        // Start the clock animation and sound
        hourHand.classList.add('fast-rotation');
        minuteHand.classList.add('fast-rotation');
        clockSound.play();
        
        // Start the animated time change
        animateTimeChange(newHours, newMinutes, false);
    });
    
    // Add reset to real time button functionality
    function addResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset to Real Time';
        resetBtn.className = 'time-btn';
        resetBtn.id = 'resetTimeBtn';
        
        // Insert the reset button in the time control buttons container
        const timeControlButtons = document.querySelector('.time-control-buttons');
        if (timeControlButtons) {
            timeControlButtons.appendChild(resetBtn);
        }
        
        resetBtn.addEventListener('click', function() {
            selectionSound.currentTime = 0;
            selectionSound.play();
            
            isPanelOpen = false;
            userEditingInputs = false;
            timeControlPanel.style.display = 'none';
            
            // Get current real time for animation target
            const now = new Date();
            const realHours = now.getHours();
            const realMinutes = now.getMinutes();
            
            // Start the clock animation and sound
            hourHand.classList.add('fast-rotation');
            minuteHand.classList.add('fast-rotation');
            clockSound.play();
            
            // Animate to real time with reset flag
            animateTimeChange(realHours, realMinutes, true);
            
            // No need for setTimeout - the animation handles the state reset
        });
    }
    
    // Input event listeners to detect when user is editing
    hourInput.addEventListener('focus', function() {
        userEditingInputs = true;
    });
    
    hourInput.addEventListener('blur', function() {
        userEditingInputs = false;
        // Update display after user finishes editing
        const hours = parseInt(this.value, 10) || 0;
        const minutes = parseInt(minuteInput.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    hourInput.addEventListener('input', function() {
        userEditingInputs = true;
        if (this.value > 23) this.value = 23;
        if (this.value < 0) this.value = 0;
        
        // Update time display as user types
        const hours = parseInt(this.value, 10) || 0;
        const minutes = parseInt(minuteInput.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    minuteInput.addEventListener('focus', function() {
        userEditingInputs = true;
    });
    
    minuteInput.addEventListener('blur', function() {
        userEditingInputs = false;
        // Update display after user finishes editing
        const hours = parseInt(hourInput.value, 10) || 0;
        const minutes = parseInt(this.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    minuteInput.addEventListener('input', function() {
        userEditingInputs = true;
        if (this.value > 59) this.value = 59;
        if (this.value < 0) this.value = 0;
        
        // Update time display as user types
        const hours = parseInt(hourInput.value, 10) || 0;
        const minutes = parseInt(this.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', function(event) {
        if (isPanelOpen && !timeControlPanel.contains(event.target) && !timeControlButton.contains(event.target)) {
            isPanelOpen = false;
            userEditingInputs = false;
            timeControlPanel.style.display = 'none';
        }
    });
    
    // Initialize clock
    function initializeClock() {
        // Load saved state
        loadTimeState();
        
        // Get the current time to display (real or custom)
        const currentTime = getCurrentDisplayTime();
        
        // Set initial clock hand positions
        updateClockHands(currentTime.hours, currentTime.minutes);
        
        // Set initial time icons
        updateTimeIcons(currentTime.hours);
        
        updateTimeDisplay();
    }
    
    // Update clock regularly
    function updateClock() {
        // Only update if not currently animating and panel is not open or user is not editing
        if (!hourHand.classList.contains('fast-rotation')) {
            const currentTime = getCurrentDisplayTime();
            updateClockHands(currentTime.hours, currentTime.minutes);
            updateTimeIcons(currentTime.hours);
            
            // Update the time display in the panel only if panel is open and user is not editing
            if (isPanelOpen && !userEditingInputs) {
                updateTimeDisplay();
            }
        }
    }
    
    // Initialize everything
    initializeClock();
    addResetButton();
    
    // Update clock every second to maintain smooth progression
    setInterval(updateClock, 1000);
});