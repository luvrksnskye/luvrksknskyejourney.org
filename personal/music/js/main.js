document.addEventListener("DOMContentLoaded", function() {
  const style = document.createElement('style');
  style.textContent = `
  .spinning-element {
    position: fixed;
    z-index: 1;
    opacity: 0;
    transform: scale(0) rotate(0deg);
    transform-origin: center;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg) scale(1); }
    100% { transform: rotate(360deg) scale(1); }
  }`;
  document.head.appendChild(style);

  const textElement = document.getElementById("typewriter");
  const text = textElement.innerHTML;
  textElement.innerHTML = '<span id="typewriter-text"></span><span class="caret">|</span>';
  const typewriterText = document.getElementById("typewriter-text");
  const caret = document.querySelector(".caret");
  const clickIndicator = document.getElementById("clickIndicator");
  const introContainer = document.getElementById("introContainer");
  const skipButton = document.getElementById("skipButton");

  const backgroundMusic = document.getElementById("spaceloop");
  if (backgroundMusic) {
      backgroundMusic.volume = 0.4; 
      backgroundMusic.loop = true;  
      backgroundMusic.play();       
  }

  let index = 0;
  let typewriterInterval;

  function typeWriter() {
      if (index < text.length) {
          let currentChar = text.charAt(index);

          if (currentChar === "<") {
              const brTag = text.slice(index, index + 4);
              if (brTag === "<br>") {
                  typewriterText.innerHTML += brTag;
                  index += 4;
                  typewriterInterval = setTimeout(typeWriter, 1000);
                  return;
              }
          }

          typewriterText.innerHTML += currentChar;
          index++;

          if (currentChar === "." || currentChar === ",") {
              typewriterInterval = setTimeout(typeWriter, 1000);
          } else {
              typewriterInterval = setTimeout(typeWriter, 50);
          }
      } else {
          finishTypewriter();
      }
  }

  function finishTypewriter() {
      caret.style.display = "none";
      clickIndicator.style.display = "flex";
      
      introContainer.addEventListener("click", function() {
          window.location.href = "music-journey/index.html";
      });
  }
  
  function skipTypewriter() {
      clearTimeout(typewriterInterval);
      
      typewriterText.innerHTML = text;
      index = text.length;
      
      finishTypewriter();
  }
  
  if (skipButton) {
      skipButton.addEventListener("click", function() {
          const selectSound = document.getElementById("selectSound") || new Audio("/assets/audio/sfx/select.mp3");
          selectSound.play();
          
          skipTypewriter();
      });
  }
  
  typeWriter();
  
  const images = [
      "/assets/images/icons/ui/center.png",
      "/assets/images/icons/ui/other-circle.png",
      "/assets/images/icons/ui/map-plane.png",
      "/assets/images/icons/ui/circle-lol.png",
      "/assets/images/icons/ui/circle.png"
  ];
  
  const sizes = [400, 600, 750, 500, 350];
  
  const positions = [
      {top: "15%", left: "10%"},
      {top: "70%", left: "85%"},
      {top: "30%", left: "75%"},
      {top: "85%", left: "20%"},
      {top: "40%", left: "40%"}
  ];
  
  const popSound = document.getElementById("popSound");
  let soundPlayed = false;
  const startTime = Date.now();
  
  function easeOutBack(x) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  
  const spinningElements = [];
  
  for (let i = 0; i < images.length; i++) {
      const img = document.createElement("img");
      img.src = images[i];
      img.classList.add("spinning-element");
      img.style.width = sizes[i] + "px";
      img.style.height = sizes[i] + "px";
      img.style.top = positions[i].top;
      img.style.left = positions[i].left;
      
      const delay = Math.random() * 500;
      let animationStarted = false;
      let animationProgress = 0;
      
      spinningElements.push({
          element: img, 
          delay: delay,
          animationStarted: animationStarted,
          animationProgress: animationProgress
      });
      
      document.body.appendChild(img);
      
      img.addEventListener('animationend', function() {
          img.style.animation = 'spin 60s linear infinite';
      });
  }
  
  function animate() {
      let anyAnimationStarted = false;
      
      spinningElements.forEach(item => {
          if (!item.animationStarted && Date.now() - startTime > item.delay) {
              item.animationStarted = true;
          }
          
          if (item.animationStarted && item.animationProgress < 1) {
              item.animationProgress += 0.015;
              if (item.animationProgress > 1) item.animationProgress = 1;
              
              const scale = easeOutBack(item.animationProgress);
              const opacity = Math.min(0.3, item.animationProgress * 0.3);
              
              item.element.style.transform = `scale(${scale}) rotate(0deg)`;
              item.element.style.opacity = opacity;
              
              anyAnimationStarted = true;
          }
      });
      
      if (anyAnimationStarted && !soundPlayed && popSound) {
          popSound.play();
          soundPlayed = true;
      }
      
      if (spinningElements.some(item => item.animationProgress < 1)) {
          requestAnimationFrame(animate);
      } else {
          spinningElements.forEach(item => {
              item.element.style.animation = 'spin 60s linear infinite';
          });
      }
  }
  
  requestAnimationFrame(animate);
});