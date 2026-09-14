function showContent(tab) {
    playTabFlipSound();
    
    const tabContents = document.querySelectorAll('.tab-content');
    const tabs = document.querySelectorAll('.tab');
    
    tabContents.forEach((content) => {
        content.style.display = 'none';
    });
    
    const leftContent = document.getElementById(`${tab}-content`);
    if (leftContent) {
        leftContent.style.display = 'block';
    }
    
    const rightContent = document.getElementById(`${tab}-right-content-1`);
    if (rightContent) {
        rightContent.style.display = 'block';
    } else {
        const defaultRightContent = document.getElementById(`${tab}-right-content`);
        if (defaultRightContent) {
            defaultRightContent.style.display = 'block';
        }
    }
    
    tabs.forEach((t) => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    updatePageNumbers();
    
    localStorage.setItem('selectedTab', tab);
}

function updatePageNumbers() {
    const leftPageHeaders = document.querySelectorAll('.left-page .page-header');
    const rightPageHeaders = document.querySelectorAll('.right-page .page-header');
  
    leftPageHeaders[0].setAttribute('data-page-number', 1);
    rightPageHeaders[0].setAttribute('data-page-number', 2);
  
    let leftPageNumber = 3;
    let rightPageNumber = 4;
  
    for (let i = 1; i < leftPageHeaders.length; i++) {
        leftPageHeaders[i].setAttribute('data-page-number', leftPageNumber);
        leftPageNumber += 2;
    }
  
    for (let i = 1; i < rightPageHeaders.length; i++) {
        rightPageHeaders[i].setAttribute('data-page-number', rightPageNumber);
        rightPageNumber += 2;
    }
}

function playTabFlipSound() {
    const audio = new Audio('/assets/audio/sfx/fliptab.mp3');
    audio.play().catch(error => {
        console.log('Error playing sound:', error);
    });
}

function playPageTurnSound() {
    const audio = new Audio('/assets/audio/sfx/page-flip.mp3');
    audio.play().catch(error => {
        console.log('Error playing sound:', error);
    });
}

function nextPage(section) {
    const currentPages = document.querySelectorAll(`[id^="${section}-right-content-"]`);
    const currentLeftPages = document.querySelectorAll(`[id^="${section}-content-"]`);
    let activePageIndex = -1;
    
    currentPages.forEach((page, index) => {
        if (page.style.display === 'block') {
            activePageIndex = index;
        }
    });

    if (activePageIndex >= 0 && activePageIndex < currentPages.length - 1) {
        playPageTurnSound();
        
        currentPages[activePageIndex].style.display = 'none';
        if (currentLeftPages[activePageIndex]) {
            currentLeftPages[activePageIndex].style.display = 'none';
        }
        
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
    
    currentPages.forEach((page, index) => {
        if (page.style.display === 'block') {
            activePageIndex = index;
        }
    });

    if (activePageIndex > 0) {
        playPageTurnSound();
        
        currentPages[activePageIndex].style.display = 'none';
        if (currentLeftPages[activePageIndex]) {
            currentLeftPages[activePageIndex].style.display = 'none';
        }
        
        currentPages[activePageIndex - 1].style.display = 'block';
        if (currentLeftPages[activePageIndex - 1]) {
            currentLeftPages[activePageIndex - 1].style.display = 'block';
        }
        
        updatePageNumbers();
    }
}

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

function initializePage() {
    const lastTab = localStorage.getItem('selectedTab');
    if (lastTab) {
        showContent(lastTab);
    } else {
        showContent('anniversary');
    }

    updatePageNumbers();

    updateCountdown();

    setInterval(updateCountdown, 1000 * 60 * 60 * 24);
}

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    document.querySelectorAll('.tab[data-tab]').forEach((el) => {
        el.addEventListener('click', () => showContent(el.dataset.tab));
    });
    document.querySelectorAll('button[data-nav]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            btn.dataset.nav === 'prev' ? prevPage(section) : nextPage(section);
        });
    });
});

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
    const swipeThreshold = 50;
    
    if (activeTab === 'our-diary' || activeTab === 'memo') {
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                prevPage(activeTab);
            } else {
                nextPage(activeTab);
            }
        }
    }
}