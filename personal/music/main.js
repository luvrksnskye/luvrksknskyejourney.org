document.addEventListener("DOMContentLoaded", function() {
  // Add the CSS for the spinning element animation with improved pop effect
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

  // Set up background music loop
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
      // Show the click indicator when typing is finished
      clickIndicator.style.display = "flex"; // Changed to flex for vertical layout
      
      // Add click event to redirect if not already added
      introContainer.addEventListener("click", function() {
          window.location.href = "music-journey/index.html";
      });
  }
  
  function skipTypewriter() {
      // Clear any pending typewriter intervals
      clearTimeout(typewriterInterval);
      
      // Display the full text immediately
      typewriterText.innerHTML = text;
      index = text.length;
      
      finishTypewriter();
  }
  
  // Add skip button functionality
  if (skipButton) {
      skipButton.addEventListener("click", function() {
          // Play the select sound effect
          const selectSound = document.getElementById("selectSound") || new Audio("select.mp3");
          selectSound.play();
          
          skipTypewriter();
      });
  }
  
  // Start the typewriter effect
  typeWriter();
  
  // Add spinning elements with delay
  const images = [
      "music-assets/spin-circle.png",
      "music-assets/other-circle.png",
      "music-assets/plane.png",
      "music-assets/circle-lol.png",
      "music-assets/circle.png"
  ];
  
  // ENORMOUS sizes (5x the original)
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
  
  // Custom easing function for a nice pop effect - same as in your OrbitalCircle class
  function easeOutBack(x) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  
  // Create all spinning elements
  const spinningElements = [];
  
  for (let i = 0; i < images.length; i++) {
      const img = document.createElement("img");
      img.src = images[i];
      img.classList.add("spinning-element");
      img.style.width = sizes[i] + "px";
      img.style.height = sizes[i] + "px";
      img.style.top = positions[i].top;
      img.style.left = positions[i].left;
      
      // Animation properties
      const delay = Math.random() * 500; // Random delay between 0-500ms
      let animationStarted = false;
      let animationProgress = 0;
      
      // Store animation data with the element
      spinningElements.push({
          element: img, 
          delay: delay,
          animationStarted: animationStarted,
          animationProgress: animationProgress
      });
      
      document.body.appendChild(img);
      
      // Start continuous rotation once pop-in is complete
      img.addEventListener('animationend', function() {
          img.style.animation = 'spin 60s linear infinite';
      });
  }
  
  // Animation function to handle the pop-in effect
  function animate() {
      let anyAnimationStarted = false;
      
      spinningElements.forEach(item => {
          // Check if animation should start based on delay
          if (!item.animationStarted && Date.now() - startTime > item.delay) {
              item.animationStarted = true;
          }
          
          // Update animation progress
          if (item.animationStarted && item.animationProgress < 1) {
              item.animationProgress += 0.015; // Same speed as your example
              if (item.animationProgress > 1) item.animationProgress = 1;
              
              // Calculate scale and opacity based on progress
              const scale = easeOutBack(item.animationProgress);
              const opacity = Math.min(0.3, item.animationProgress * 0.3);
              
              // Apply transform and opacity
              item.element.style.transform = `scale(${scale}) rotate(0deg)`;
              item.element.style.opacity = opacity;
              
              anyAnimationStarted = true;
          }
      });
      
      // Play sound only once when first animation starts
      if (anyAnimationStarted && !soundPlayed && popSound) {
          popSound.play();
          soundPlayed = true;
      }
      
      // Continue animation until all elements are done
      if (spinningElements.some(item => item.animationProgress < 1)) {
          requestAnimationFrame(animate);
      } else {
          // Start spinning animation for all elements
          spinningElements.forEach(item => {
              item.element.style.animation = 'spin 60s linear infinite';
          });
      }
  }
  
  // Start the animation
  requestAnimationFrame(animate);
});