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
    
    const noonIcon = document.querySelector('.noon-icon');
    const nightIcon = document.querySelector('.night-icon');
    const morningIcon = document.querySelector('.morning-icon');
    const duskIcon = document.querySelector('.dusk-icon');
    
    let isCustomTime = false;
    let customTime = { hours: 0, minutes: 0 };
    let customTimeStartTimestamp = 0;
    let isPanelOpen = false;
    let userEditingInputs = false;
    
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
    
    function saveTimeState() {
        const state = {
            isCustomTime: isCustomTime,
            customTime: customTime,
            customTimeStartTimestamp: customTimeStartTimestamp
        };
        localStorage.setItem('clockTimeState', JSON.stringify(state));
    }
    
    function resetToRealTime() {
        isCustomTime = false;
        customTime = { hours: 0, minutes: 0 };
        customTimeStartTimestamp = 0;
        localStorage.removeItem('clockTimeState');
    }
    
    function getCurrentDisplayTime() {
        if (!isCustomTime) {
            const now = new Date();
            return {
                hours: now.getHours(),
                minutes: now.getMinutes()
            };
        }
        
        const elapsedMs = Date.now() - customTimeStartTimestamp;
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
        
        let totalMinutes = customTime.hours * 60 + customTime.minutes + elapsedMinutes;
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        
        return { hours, minutes };
    }
    
    function formatTime(hours, minutes) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    function updateTimeDisplay() {
        if (!userEditingInputs) {
            const currentTime = getCurrentDisplayTime();
            timeDisplay.textContent = formatTime(currentTime.hours, currentTime.minutes);
            hourInput.value = currentTime.hours;
            minuteInput.value = currentTime.minutes;
        }
    }
    
    function updateTimeIcons(hour) {
        noonIcon.classList.remove('active');
        nightIcon.classList.remove('active');
        morningIcon.classList.remove('active');
        duskIcon.classList.remove('active');
        
        if (hour >= 11 && hour <= 13) {
            noonIcon.classList.add('active');
        } else if (hour >= 6 && hour <= 10) {
            morningIcon.classList.add('active');
        } else if (hour >= 17 && hour <= 19) {
            duskIcon.classList.add('active');
        } else if (hour >= 20 || hour <= 5) {
            nightIcon.classList.add('active');
        }
    }
    
    function updateClockHands(hours, minutes) {
        const hourAngle = (hours % 12) * 30 + minutes * 0.5;
        const minuteAngle = minutes * 6;
        
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }
    
    function getShortestAngle(from, to) {
        let diff = to - from;
        
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        
        return diff;
    }
    
    function animateTimeChange(targetHours, targetMinutes, isResetToReal = false) {
        const animationDuration = 3000;
        const updateInterval = 50;
        const totalSteps = animationDuration / updateInterval;
        
        const currentDisplayTime = getCurrentDisplayTime();
        const startHours = currentDisplayTime.hours;
        const startMinutes = currentDisplayTime.minutes;
        
        const startHourAngle = (startHours % 12) * 30 + startMinutes * 0.5;
        const startMinuteAngle = startMinutes * 6;
        
        const targetHourAngle = (targetHours % 12) * 30 + targetMinutes * 0.5;
        const targetMinuteAngle = targetMinutes * 6;
        
        const hourAngleDiff = getShortestAngle(startHourAngle, targetHourAngle);
        const minuteAngleDiff = getShortestAngle(startMinuteAngle, targetMinuteAngle);
        
        const hourAngleIncrement = hourAngleDiff / totalSteps;
        const minuteAngleIncrement = minuteAngleDiff / totalSteps;
        
        let step = 0;
        
        const animationInterval = setInterval(() => {
            step++;
            
            const currentHourAngle = startHourAngle + (hourAngleIncrement * step);
            const currentMinuteAngle = startMinuteAngle + (minuteAngleIncrement * step);
            
            hourHand.style.transform = `rotate(${currentHourAngle}deg)`;
            minuteHand.style.transform = `rotate(${currentMinuteAngle}deg)`;
            
            const progress = step / totalSteps;
            let animationHours;
            
            if (Math.abs(targetHours - startHours) <= 12) {
                animationHours = startHours + (targetHours - startHours) * progress;
            } else {
                const hourDiff = targetHours > startHours ? targetHours - startHours - 24 : targetHours - startHours + 24;
                animationHours = (startHours + hourDiff * progress + 24) % 24;
            }
            
            updateTimeIcons(Math.floor(animationHours));
            
            if (step >= totalSteps) {
                clearInterval(animationInterval);
                
                updateClockHands(targetHours, targetMinutes);
                
                updateTimeIcons(targetHours);
                
                hourHand.classList.remove('fast-rotation');
                minuteHand.classList.remove('fast-rotation');
                clockSound.pause();
                clockSound.currentTime = 0;
                
                if (isResetToReal) {
                    isCustomTime = false;
                    customTime = { hours: 0, minutes: 0 };
                    customTimeStartTimestamp = 0;
                    localStorage.removeItem('clockTimeState');
                } else {
                    isCustomTime = true;
                    customTime = { hours: targetHours, minutes: targetMinutes };
                    customTimeStartTimestamp = Date.now();
                    saveTimeState();
                }
            }
        }, updateInterval);
    }
    
    timeControlButton.addEventListener('click', function() {
        selectionSound.currentTime = 0;
        selectionSound.play();
        
        isPanelOpen = true;
        userEditingInputs = false;
        updateTimeDisplay();
        timeControlPanel.style.display = 'flex';
    });
    
    cancelTimeBtn.addEventListener('click', function() {
        selectionSound.currentTime = 0;
        selectionSound.play();
        
        isPanelOpen = false;
        userEditingInputs = false;
        timeControlPanel.style.display = 'none';
    });
    
    setTimeBtn.addEventListener('click', function() {
        selectionSound.currentTime = 0;
        selectionSound.play();
        
        isPanelOpen = false;
        userEditingInputs = false;
        timeControlPanel.style.display = 'none';
        
        const newHours = parseInt(hourInput.value, 10);
        const newMinutes = parseInt(minuteInput.value, 10);
        
        if (isNaN(newHours) || isNaN(newMinutes) || 
            newHours < 0 || newHours > 23 || 
            newMinutes < 0 || newMinutes > 59) {
            return;
        }
        
        hourHand.classList.add('fast-rotation');
        minuteHand.classList.add('fast-rotation');
        clockSound.play();
        
        animateTimeChange(newHours, newMinutes, false);
    });
    
    function addResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset to Real Time';
        resetBtn.className = 'time-btn';
        resetBtn.id = 'resetTimeBtn';
        
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
            
            const now = new Date();
            const realHours = now.getHours();
            const realMinutes = now.getMinutes();
            
            hourHand.classList.add('fast-rotation');
            minuteHand.classList.add('fast-rotation');
            clockSound.play();
            
            animateTimeChange(realHours, realMinutes, true);
            
        });
    }
    
    hourInput.addEventListener('focus', function() {
        userEditingInputs = true;
    });
    
    hourInput.addEventListener('blur', function() {
        userEditingInputs = false;
        const hours = parseInt(this.value, 10) || 0;
        const minutes = parseInt(minuteInput.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    hourInput.addEventListener('input', function() {
        userEditingInputs = true;
        if (this.value > 23) this.value = 23;
        if (this.value < 0) this.value = 0;
        
        const hours = parseInt(this.value, 10) || 0;
        const minutes = parseInt(minuteInput.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    minuteInput.addEventListener('focus', function() {
        userEditingInputs = true;
    });
    
    minuteInput.addEventListener('blur', function() {
        userEditingInputs = false;
        const hours = parseInt(hourInput.value, 10) || 0;
        const minutes = parseInt(this.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    minuteInput.addEventListener('input', function() {
        userEditingInputs = true;
        if (this.value > 59) this.value = 59;
        if (this.value < 0) this.value = 0;
        
        const hours = parseInt(hourInput.value, 10) || 0;
        const minutes = parseInt(this.value, 10) || 0;
        timeDisplay.textContent = formatTime(hours, minutes);
    });
    
    document.addEventListener('click', function(event) {
        if (isPanelOpen && !timeControlPanel.contains(event.target) && !timeControlButton.contains(event.target)) {
            isPanelOpen = false;
            userEditingInputs = false;
            timeControlPanel.style.display = 'none';
        }
    });
    
    function initializeClock() {
        loadTimeState();
        
        const currentTime = getCurrentDisplayTime();
        
        updateClockHands(currentTime.hours, currentTime.minutes);
        
        updateTimeIcons(currentTime.hours);
        
        updateTimeDisplay();
    }
    
    function updateClock() {
        if (!hourHand.classList.contains('fast-rotation')) {
            const currentTime = getCurrentDisplayTime();
            updateClockHands(currentTime.hours, currentTime.minutes);
            updateTimeIcons(currentTime.hours);
            
            if (isPanelOpen && !userEditingInputs) {
                updateTimeDisplay();
            }
        }
    }
    
    initializeClock();
    addResetButton();
    
    setInterval(updateClock, 1000);
});