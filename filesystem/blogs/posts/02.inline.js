

  document.querySelectorAll('.blog-sidebar a').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
          e.preventDefault();
          
          const soundEffect = new Audio('selection.mp3');
          soundEffect.play();
          
          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          
          window.scrollTo({
              top: targetElement.offsetTop - 20,
              behavior: 'smooth'
          });
      });
  });

document.addEventListener('DOMContentLoaded', function() {
      function setupToggle(toggleId, targetSelector) {
          const toggleWrapper = document.getElementById(toggleId);
          if (!toggleWrapper) {
              console.warn(`Toggle button with ID '${toggleId}' not found.`);
              return;
          }

          const toggleButton = toggleWrapper.querySelector('.toggle-button');
          const target = document.querySelector(targetSelector);
          const gridLines = document.querySelector('.draw');

          if (!target) {
              console.warn(`Target element '${targetSelector}' not found.`);
              return;
          }

          toggleWrapper.addEventListener('click', function() {
              toggleButton.classList.toggle('active');
              toggleWrapper.classList.toggle('active');
              target.classList.toggle('perspective-view');

              const audio = new Audio('selection.mp3'); 
              audio.play().catch(e => console.log('Audio play failed:', e));

              if (gridLines) {
                  gridLines.style.animation = 'none';
                  void gridLines.offsetWidth;
                  gridLines.style.animation = 'draw 1.5s ease-out forwards';
              }
          });
      }

      setupToggle('toggle1', '.cuadro'); 
      setupToggle('toggle2', '#exercise1'); 
      setupToggle('toggle3', '#exercise2'); 
      setupToggle('toggle4', '#exercise3'); 
      setupToggle('toggle5', '#exercise4'); 
      setupToggle('toggle6', '#exercise5'); 
  });

const initialCode = {
    1: `/* Modify the grid properties below */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
}

/* These styles control the individual grid items */
.grid-item {
  padding: 20px;
  font-size: 1.5em;
}`,
    2: `/* Modify the grid layout using grid-template-areas */
.grid-layout {
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "header header"
    "nav main"
    "footer footer";
  gap: 10px;
  height: 100%;
}

.header {
  grid-area: header;
  background-color: rgba(108, 142, 235, 0.6);
  border-color: #8baaf3;
  height: 50px;
}

.nav {
  grid-area: nav;
  background-color: rgba(138, 150, 230, 0.6);
  border-color: #9aa5f2;
  
}

.main {
  grid-area: main;
  background-color: rgba(153, 140, 227, 0.6);
  border-color: #a59be3;
}

.footer {
  grid-area: footer;
  background-color: rgba(170, 128, 222, 0.6);
  border-color: #b18dde;
  height: 50px;
}`,
    3: `/* Modify the flexbox properties below */
.flex-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.flex-item {
  flex: 1;
  padding: 20px;
  min-width: 100px;
  height: 80px;
}`,
    4: `/* Create an advanced grid layout */
.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 100px);
  gap: 10px;
}

.grid-item:nth-child(1) {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  background-color: rgba(108, 142, 235, 0.6);
  border-color: #8baaf3;
}

.grid-item:nth-child(2) {
  grid-column: 3 / 5;
  grid-row: 1 / 2;
  background-color: rgba(125, 146, 232, 0.6);
  border-color: #94a2f0;
}

.grid-item:nth-child(3) {
  grid-column: 1 / 2;
  grid-row: 2 / 4;
  background-color: rgba(138, 150, 230, 0.6);
  border-color: #9aa5f2;
}

.grid-item:nth-child(4) {
  grid-column: 2 / 5;
  grid-row: 2 / 3;
  background-color: rgba(153, 140, 227, 0.6);
  border-color: #a59be3;
}

.grid-item:nth-child(5) {
  grid-column: 2 / 4;
  grid-row: 3 / 4;
  background-color: rgba(170, 128, 222, 0.6);
  border-color: #b18dde;
}

.grid-item:nth-child(6) {
  grid-column: 4 / 5;
  grid-row: 3 / 4;
  background-color: rgba(185, 120, 215, 0.6);
  border-color: #c27fd7;
}`,
    5: `/* Create a responsive layout using both Grid and Flexbox */
.page-layout {
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "header header"
    "sidebar content"
    "footer footer";
  gap: 10px;
  height: 100%;
}

.header {
  grid-area: header;
  background-color: rgba(108, 142, 235, 0.6);
  border-color: #8baaf3;
  height: 50px;
  
  /* Flexbox for header items */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.sidebar {
  grid-area: sidebar;
  background-color: rgba(125, 146, 232, 0.6);
  border-color: #94a2f0;
  
  /* Flexbox for sidebar items */
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.content-area {
  grid-area: content;
  background-color: rgba(153, 140, 227, 0.6);
  border-color: #a59be3;
  
  /* Flexbox for content items */
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px;
  align-content: flex-start;
}

.footer {
  grid-area: footer;
  background-color: rgba(170, 128, 222, 0.6);
  border-color: #b18dde;
  height: 50px;
  
  /* Flexbox for footer items */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Responsive layout for smaller screens */
@media (max-width: 768px) {
  .page-layout {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "header"
      "sidebar"
      "content"
      "footer";
  }
}`
};

const completedExercises = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
};

document.addEventListener("DOMContentLoaded", function() {
    const confettiScript = document.createElement('script');
    confettiScript.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js";
    document.head.appendChild(confettiScript);
    
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`code${i}`).value = initialCode[i];
    }
    
    const soundEffect = document.createElement('audio');
    soundEffect.id = 'completion-sound';
    soundEffect.src = 'mystical-chime.mp3';
    soundEffect.preload = 'auto';
    document.body.appendChild(soundEffect);
});

function applyCode(exerciseNum) {
    const code = document.getElementById(`code${exerciseNum}`).value;
    const style = document.createElement('style');
    style.textContent = code;
    
    const oldStyle = document.getElementById(`style${exerciseNum}`);
    if (oldStyle) {
        oldStyle.remove();
    }
    
    style.id = `style${exerciseNum}`;
    document.head.appendChild(style);
}

function ReiniciarCode(exerciseNum) {
    document.getElementById(`code${exerciseNum}`).value = initialCode[exerciseNum];
    applyCode(exerciseNum);
}

function completeExercise(exerciseNum) {
    if (completedExercises[exerciseNum]) return;
    
    completedExercises[exerciseNum] = true;
    
    const sound = document.getElementById('completion-sound');
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound play failed:", e));
    }
    
    if (window.confetti) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        console.log("Confetti not loaded yet");
    }
    
    const exerciseContainer = document.querySelector(`.exercise:nth-child(${exerciseNum})`);
    if (exerciseContainer) {
        exerciseContainer.classList.add('completed');
    }
}

function setupCompleteButtons() {
    for (let i = 1; i <= 5; i++) {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.textContent = 'Completo';
        completeBtn.onclick = function() { completeExercise(i); };
        
        const exerciseContainer = document.querySelector(`.exercise:nth-child(${i}) .controls`) || 
                                  document.querySelector(`.exercise:nth-child(${i})`);
        
        if (exerciseContainer) {
            exerciseContainer.appendChild(completeBtn);
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    setupCompleteButtons();
});

document.addEventListener('DOMContentLoaded', function() {
    const gridDemo = document.getElementById('css_fr_grid_demo_7361');
    const gridContainer = document.getElementById('css_fr_grid_container_5738');
    const gridOverlay = document.getElementById('css_fr_grid_overlay_4682');
    const toggleVisual = document.getElementById('css_fr_toggle_visual_6284');
    const ratioSlider = document.getElementById('css_fr_ratio_slider_7195');
    const ratioDisplay = document.getElementById('css_fr_ratio_display_9083');
    const fractionLabel1 = document.getElementById('css_fr_fraction_label_1_2641');
    const fractionLabel2 = document.getElementById('css_fr_fraction_label_2_3859');
    const percentageIndicator1 = document.getElementById('css_fr_percentage_indicator_1_8492');
    const percentageIndicator2 = document.getElementById('css_fr_percentage_indicator_2_9127');
    const gridLineVertical = document.getElementById('css_fr_grid_line_vertical_1973');
    
    ratioSlider.addEventListener('input', function() {
      const firstFr = parseFloat(this.value);
      const secondFr = 6 - firstFr;
      
      gridContainer.style.gridTemplateColumns = `${firstFr}fr ${secondFr}fr`;
      
      fractionLabel1.textContent = `${firstFr}fr`;
      fractionLabel2.textContent = `${secondFr}fr`;
      
      ratioDisplay.textContent = `${firstFr}fr : ${secondFr}fr`;
      
      const totalFr = firstFr + secondFr;
      const percent1 = Math.round((firstFr / totalFr) * 100);
      const percent2 = 100 - percent1;
      
      percentageIndicator1.textContent = `${percent1}%`;
      percentageIndicator1.style.width = `${percent1}%`;
      
      percentageIndicator2.textContent = `${percent2}%`;
      percentageIndicator2.style.width = `${percent2}%`;
      percentageIndicator2.style.left = `${percent1}%`;
      
      gridLineVertical.style.left = `${percent1}%`;
    });
  });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button[data-apply]').forEach((b) =>
    b.addEventListener('click', () => applyCode(Number(b.dataset.apply))));
  document.querySelectorAll('button[data-reset]').forEach((b) =>
    b.addEventListener('click', () => ReiniciarCode(Number(b.dataset.reset))));
  document.querySelectorAll('button[data-complete]').forEach((b) =>
    b.addEventListener('click', () => completeExercise(Number(b.dataset.complete))));
});
