(function () {
    const progressBarStyles = `
      .myApp-toggle-button {
        position: fixed;
        top: 20px;
        left: 20px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        z-index: 1000;
        width: 70px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      }
  
      .myApp-toggle-button:hover {
        transform: scale(1.1);
      }
  
      .myApp-toggle-button img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
  
      .myApp-progress-container {
        position: fixed;
        top: 20px;
        left: -290px;
        background: rgba(255, 255, 255, 0.15);
        padding: 15px;
        border-radius: 10px;
        width: 250px;
        z-index: 1001;
        color: white;
        backdrop-filter: blur(5px);
        transition: left 0.3s ease-in-out;
      }
  
      .myApp-progress-container.visible {
        left: 100px;
      }
  
      .myApp-blur-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(10px);
        background: rgba(0, 0, 0, 0.21);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease-in-out;
        z-index: 999;
      }
  
      .myApp-blur-overlay.visible {
        opacity: 1;
        visibility: visible;
      }
  
      .myApp-progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
  
      .myApp-progress-title {
        font-size: 14px;
        font-family: 'ZHFont', sans-serif;
        margin: 0;
      }
  
      .myApp-progress-stats {
        font-size: 12px;
        font-family: 'ZHFont', sans-serif;
      }
  
      .myApp-progress-bar-outer {
        width: 100%;
        height: 10px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        overflow: hidden;
      }
  
      .myApp-progress-bar-inner {
        height: 100%;
        background: linear-gradient(90deg,rgb(177, 233, 255),rgb(255, 241, 165));
        transition: width 0.3s ease-in-out;
        border-radius: 5px;
      }
  
      .myApp-progress-details {
        margin-top: 8px;
        font-size: 12px;
        font-family: 'ZHFont', sans-serif;
        display: flex;
        justify-content: space-between;
      }
  
      .myApp-star-category {
        display: flex;
        align-items: center;
        gap: 5px;
      }
  
      .myApp-star-icon {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
  
      .myApp-star-icon.zodiac { background:rgb(255, 245, 187); }
      .myApp-star-icon.named { background: #FFFFFF; }
      .myApp-star-icon.pet { background:rgb(185, 235, 255); }
    `;
  
    // Add styles to the document
    const progressStyleSheet = document.createElement('style');
    progressStyleSheet.type = 'text/css';
    progressStyleSheet.innerText = progressBarStyles;
    document.head.appendChild(progressStyleSheet);
  
    let data = null;
    let isProgressBarVisible = false;
  
    function createToggleButton() {
      const button = document.createElement('button');
      button.className = 'myApp-toggle-button';
      button.innerHTML = `<img src="../../assets/buttons-icons/Phone App_Missions.png" alt="Progress">`;
      button.addEventListener('click', toggleProgressBar);
      document.body.appendChild(button);
    }
  
    function createBlurOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'myApp-blur-overlay';
      overlay.addEventListener('click', toggleProgressBar);
      document.body.appendChild(overlay);
    }
  
    function toggleProgressBar() {
      const container = document.querySelector('.myApp-progress-container');
      const overlay = document.querySelector('.myApp-blur-overlay');
      isProgressBarVisible = !isProgressBarVisible;
  
      if (container && overlay) {
        container.classList.toggle('visible', isProgressBarVisible);
        overlay.classList.toggle('visible', isProgressBarVisible);
      }
    }
  
    function createProgressBar() {
      const container = document.createElement('div');
      container.className = 'myApp-progress-container';
      container.innerHTML = `
        <div class="myApp-progress-header">
          <p class="myApp-progress-title">Star Collection Progress</p>
          <span class="myApp-progress-stats">0/0</span>
        </div>
        <div class="myApp-progress-bar-outer">
          <div class="myApp-progress-bar-inner" style="width: 0%"></div>
        </div>
        <div class="myApp-progress-details">
          <div class="myApp-star-category">
            <div class="myApp-star-icon zodiac"></div>
            <span class="zodiac-count">0/12</span>
          </div>
          <div class="myApp-star-category">
            <div class="myApp-star-icon named"></div>
            <span class="named-count">0/10</span>
          </div>
          <div class="myApp-star-category">
            <div class="myApp-star-icon pet"></div>
            <span class="pet-count">0/8</span>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      updateProgress();
    }
  
    function updateProgress() {
      if (!data) return;
  
      const unlockedStars = JSON.parse(localStorage.getItem('unlockedStars') || '[]');
      const zodiacStars = data.stars.filter(star => star.type === 'zodiac');
      const namedStars = data.stars.filter(star => star.type === 'special');
      const petStars = data.stars.filter(star => star.type === 'pet');
  
      const unlockedZodiac = unlockedStars.filter(id => zodiacStars.some(star => star.id === id)).length;
      const unlockedNamed = unlockedStars.filter(id => namedStars.some(star => star.id === id)).length;
      const unlockedPet = unlockedStars.filter(id => petStars.some(star => star.id === id)).length;
  
      const totalStars = zodiacStars.length + namedStars.length + petStars.length;
      const totalUnlocked = unlockedZodiac + unlockedNamed + unlockedPet;
      const percentage = (totalUnlocked / totalStars) * 100;
  
      const container = document.querySelector('.myApp-progress-container');
      if (container) {
        container.querySelector('.myApp-progress-stats').textContent = `${totalUnlocked}/${totalStars}`;
        container.querySelector('.myApp-progress-bar-inner').style.width = `${percentage}%`;
        container.querySelector('.zodiac-count').textContent = `${unlockedZodiac}/${zodiacStars.length}`;
        container.querySelector('.named-count').textContent = `${unlockedNamed}/${namedStars.length}`;
        container.querySelector('.pet-count').textContent = `${unlockedPet}/${petStars.length}`;
      }
    }
  
    // Initialize
    createToggleButton();
    createBlurOverlay();
    
    fetch('../filesystem/credits/stars.json')
      .then(response => response.json())
      .then(jsonData => {
        data = jsonData;
        createProgressBar();
        window.addEventListener('storage', updateProgress);
      })
      .catch(error => console.error('Error fetching stars.json:', error));
  
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === 'unlockedStars') {
        updateProgress();
      }
    };
  })();