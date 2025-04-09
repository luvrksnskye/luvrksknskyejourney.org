function showContent(tab) {
    // Play tab flip sound
    playTabFlipSound();
    
    const tabContents = document.querySelectorAll('.tab-content');
    const tabs = document.querySelectorAll('.tab');
    
    // Hide all content
    tabContents.forEach((content) => {
        content.style.display = 'none';
    });
    
    // Show the selected tab on the left page
    const leftContent = document.getElementById(`${tab}-content`);
    if (leftContent) {
        leftContent.style.display = 'block';
    }
    
    // Show the first right page content for the selected tab
    const rightContent = document.getElementById(`${tab}-right-content-1`);
    if (rightContent) {
        rightContent.style.display = 'block';
    } else {
        // Fall back to non-numbered version for anniversary tab
        const defaultRightContent = document.getElementById(`${tab}-right-content`);
        if (defaultRightContent) {
            defaultRightContent.style.display = 'block';
        }
    }
    
    // Update active tab
    tabs.forEach((t) => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // Update the page numbers
    updatePageNumbers();
    
    // Save selected tab to localStorage
    localStorage.setItem('selectedTab', tab);
}

// Function to update the page numbers in the .page-header
function updatePageNumbers() {
    const leftPageHeaders = document.querySelectorAll('.left-page .page-header');
    const rightPageHeaders = document.querySelectorAll('.right-page .page-header');
  
    // Set the page numbers for the first two pages
    leftPageHeaders[0].setAttribute('data-page-number', 1);
    rightPageHeaders[0].setAttribute('data-page-number', 2);
  
    // Calculate the left and right page numbers based on the current page
    let leftPageNumber = 3;
    let rightPageNumber = 4;
  
    // Update the page numbers in the headers starting from the second page
    for (let i = 1; i < leftPageHeaders.length; i++) {
        leftPageHeaders[i].setAttribute('data-page-number', leftPageNumber);
        leftPageNumber += 2;
    }
  
    for (let i = 1; i < rightPageHeaders.length; i++) {
        rightPageHeaders[i].setAttribute('data-page-number', rightPageNumber);
        rightPageNumber += 2;
    }
}

// Function to play the tab flip sound
function playTabFlipSound() {
    const audio = new Audio('../assets/sound-effects/fliptab.mp3');
    audio.play().catch(error => {
        console.log('Error playing sound:', error);
    });
}

// Function to play the page turn sound
function playPageTurnSound() {
    const audio = new Audio('../assets/sound-effects/page-flip.mp3');
    audio.play().catch(error => {
        console.log('Error playing sound:', error);
    });
}

function nextPage(section) {
    const currentPages = document.querySelectorAll(`[id^="${section}-right-content-"]`);
    const currentLeftPages = document.querySelectorAll(`[id^="${section}-content-"]`);
    let activePageIndex = -1;
    
    // Find the currently displayed page
    currentPages.forEach((page, index) => {
        if (page.style.display === 'block') {
            activePageIndex = index;
        }
    });

    if (activePageIndex >= 0 && activePageIndex < currentPages.length - 1) {
        // Play sound effect
        playPageTurnSound();
        
        // Hide current page
        currentPages[activePageIndex].style.display = 'none';
        if (currentLeftPages[activePageIndex]) {
            currentLeftPages[activePageIndex].style.display = 'none';
        }
        
        // Show next page
        currentPages[activePageIndex + 1].style.display = 'block';
        if (currentLeftPages[activePageIndex + 1]) {
            currentLeftPages[activePageIndex + 1].style.display = 'block';
        }
        
        updatePageNumbers();
    }
}

function prevPage(section) {
    const currentPages = document.querySelectorAll(`[id^="${section}-right-content-"]`);
    const currentLeftPages = document.querySelectorAll(`[id^="${section}-content-"]`);
    let activePageIndex = -1;
    
    // Find the currently displayed page
    currentPages.forEach((page, index) => {
        if (page.style.display === 'block') {
            activePageIndex = index;
        }
    });

    if (activePageIndex > 0) {
        // Play sound effect
        playPageTurnSound();
        
        // Hide current page
        currentPages[activePageIndex].style.display = 'none';
        if (currentLeftPages[activePageIndex]) {
            currentLeftPages[activePageIndex].style.display = 'none';
        }
        
        // Show previous page
        currentPages[activePageIndex - 1].style.display = 'block';
        if (currentLeftPages[activePageIndex - 1]) {
            currentLeftPages[activePageIndex - 1].style.display = 'block';
        }
        
        updatePageNumbers();
    }
}

// Countdown function
function updateCountdown() {
    const startDate = new Date('2025-02-05');
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const countdownElement = document.getElementById('daysTogether');
    if (countdownElement) {
        countdownElement.textContent = diffDays;
    }
}

// Function to initialize the page
function initializePage() {
    // Get the last selected tab from localStorage and set it as active
    const lastTab = localStorage.getItem('selectedTab');
    if (lastTab) {
        showContent(lastTab); // Set the last selected tab as active
    } else {
        // If no tab is saved, default to 'anniversary'
        showContent('anniversary');
    }

    // Initially update page numbers
    updatePageNumbers();

    // Initialize countdown
    updateCountdown();

    // Set up countdown update interval
    setInterval(updateCountdown, 1000 * 60 * 60 * 24); // Update daily
}

// Add event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializePage);

// Add keyboard navigation
document.addEventListener('keydown', (event) => {
    const activeTab = localStorage.getItem('selectedTab');
    
    if (activeTab === 'our-diary' || activeTab === 'memo') {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextPage(activeTab);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            prevPage(activeTab);
        }
    }
});

// Add touch event handling for mobile devices
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
});

document.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;
    handleSwipe();
});

function handleSwipe() {
    const activeTab = localStorage.getItem('selectedTab');
    const swipeThreshold = 50; // minimum distance for swipe
    
    if (activeTab === 'our-diary' || activeTab === 'memo') {
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right
                prevPage(activeTab);
            } else {
                // Swipe left
                nextPage(activeTab);
            }
        }
    }
}