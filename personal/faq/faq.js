const timelineData = {
  1: {
    imageType: "faq-title",
    sections: [
      {
        content: "I've been noticing I'm getting a lot of private messages with similar questions from my best friends and other close people, so I decided to create this page so I could redirect people here instead of typing the same text over and over again! It's also one of my ways, or at least I think so, to help those who have questions about programming or web development. I'm sorry if not all your questions are answered here! I'm trying to compile a list of everything you need, and in any case, remember that you can read my blogs and also check out my resources page."
      },
      {
        content: "If you're new to web development, the best place to start is by learning the three core technologies: HTML for structure, CSS for styling, and JavaScript for interactivity. These three languages form the foundation of virtually all web development.\n\nMany beginners find it helpful to start with HTML and CSS before moving on to JavaScript, as this allows you to build static pages first before adding dynamic functionality. There are numerous free resources available online to help you learn these technologies."
      },
      {
        content: "A typical learning path for web development might look like this:\n\n1. Learn HTML to understand document structure and semantic markup\n\n2. Learn CSS to style your HTML and create responsive layouts\n\n3. Learn JavaScript basics to add interactivity to your pages\n\n4. Explore JavaScript frameworks like React, Vue, or Angular\n\n5. Learn backend technologies if you want to become a full-stack developer\n\nRemember that web development is a vast field, and it's perfectly fine to specialize in areas that interest you the most."
      }
    ]
  },
  2: {
    imageType: "question-1",
    sections: [
      {
        content: "For frontend web development, there are three essential languages:\n\n• HTML (HyperText Markup Language): Creates the structure and content of web pages\n\n• CSS (Cascading Style Sheets): Handles styling, layout, and visual presentation\n\n• JavaScript: Adds interactivity, animations, and dynamic functionality\n\nModern frontend development often involves frameworks and libraries built on JavaScript, such as React, Angular, Vue.js, and Svelte, which simplify building complex user interfaces."
      },
      {
        content: "I basically got the hang of HTML and CSS as I was actively working on my site. When I started my site, I had no clue how HTML or CSS worked but that was the most exciting part tbh. I used free templates and googled every little thing that I didn't know about! Using templates and messing around with them made it way easier to eventually understand what each little thing does. I def recommend using free HTML templates if you have 0 clue of what you're doing!"
      },
      {
        content: "Nothing you do has to be perfect. That's the point of learning! You just have to have fun with what you do and practice, and although it can be difficult and overwhelming, it's better to take it slow. I also recommend looking into different code editors and seeing which ones you like the best! that way you can mess around and build your code offline before putting it live on your site."
      },
      {
        content: "While googling things will usually get you what you want, I also spent a lot of time on sites that have a lot of documentation when it comes to building websites and their languages ​​such as w3schools.com. If you need more help, I have a links page where I link a ton of resources that I use. It might be overwhelming at first but once you get the hang of it, it won't be that hard. Remember to have fun along the way! it will make the learning experience way more rewarding and less of a struggle."
      },
      {
        content: "Once you're VERY comfortable with HTML and CSS, I recommend looking for JS tutorials. But for now, you can ignore this one! The important thing is to master HTML and CSS, which are the main languages ​​that will help you develop and design a website, you know? You can also use tools that help you create layouts, like Figma. You can also simply draw the website on a piece of paper. This way, you can get a rough idea of ​​its structure and implement it later."
      }
    ]
  },
  3: {
    imageType: "question-2",
    sections: [
      {
        content: "Sure thing! I have no problem helping anyone with their projects, however, the only person who should have a say in what's published on your personal website is you! That's the magic of having a whole world of programming to yourself. So, I can't answer this question for you. Sorry. Ask yourself what you want from your site."
      },
      {
        content: "If you're feeling overwhelmed by the endless options: make a list! Write down all your ideas for your site and choose one you want to focus on right now. That said, if you're just looking for inspiration, I recommend exploring other sites first. And you're welcome to visit my website and grab some code if necessary; I'm happy to help! In any case, if you need support with anything and you speak Spanish, I can also invite you to my Discord server. Currently, it's only for Spanish speakers and is very, very small, just among my friends. But anyone is welcome if you need help or just want to get in touch with me!"
      },
      {
        content: "I don't consider myself a good developer, or even the best, but I'm willing to help anyone get their website built. That's why I blog, and why I made this page! Keep in mind that the questions and answers will be updated over time. So I'll try to keep everything up to date."
      },
      {
        content: "Anyway, above all, remember that I'm just a student! Programming is more about the process, your growth, and how you enjoy it. I don't consider there to be any rules written in stone for it, so unleash all your ideas and let them flow. Don't let anyone tell you that you can't achieve something, because I'm sure you can!"
      }
    ]
  },
  4: {
    imageType: "question-3",
    sections: [
      {
        content: "Well, I'll write a blog about this in more depth in the future, but for now, I'll briefly explain a bit about it here. 3D effects in CSS allow you to transform elements in three-dimensional space using CSS transformations, such as rotateX(), rotateY(), translateZ(), among others. For them to look correct, it's also important to use perspective, which provides visual depth."
      },
      {
        content: "To understand this, I think you should read my CSS Grid blog, but in short, for a true 3D effect, the parent container must define the perspective. This tells the browser from what distance the content is being viewed. And within the container, the children can move in 3D! To achieve more sophisticated effects, you can combine transform, filter, box-shadow, and transition to make the 3D effects look stylish and smooth. I'll leave some code here with a visual example that you can see."
      },
      {
        content: `<div class="code-block">
  <code>
    .pushable {
      position: relative;
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
      outline-offset: 4px;
      transition: filter 250ms;
    }
    
    .shadow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      background: hsl(210deg 30% 60% / 0.25);
      will-change: transform;
      transform: translateY(2px);
      transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1);
    }
    
    .edge {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      background: linear-gradient(
        to left,
        hsl(210deg 50% 60%) 0%,
        hsl(210deg 50% 70%) 8%,
        hsl(210deg 50% 70%) 92%,
        hsl(210deg 50% 60%) 100%
      );
    }
    
    .front {
      display: block;
      position: relative;
      padding: 12px 42px;
      border-radius: 12px;
      font-size: 1.25rem;
      color: white;
      background: hsl(210deg 70% 80%);
      will-change: transform;
      transform: translateY(-4px);
      transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1);
    }
    
    .pushable:hover {
      filter: brightness(110%);
    }
    
    .pushable:hover .front {
      transform: translateY(-6px);
      transition: transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
    }
    
    .pushable:active .front {
      transform: translateY(-2px);
      transition: transform 34ms;
    }
    
    .pushable:hover .shadow {
      transform: translateY(4px);
      transition: transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
    }
    
    .pushable:active .shadow {
      transform: translateY(1px);
      transition: transform 34ms;
    }
    
    .pushable:focus:not(:focus-visible) {
      outline: none;
    }
  </code>
</div>`
      },
      {
        content: "Now let's talk about filters!! CSS filters let you apply graphic effects like blur, grayscale, brightness, and more directly to images or any other element. In CSS, there are several visual filters you can use to change the appearance of images, text, or any element. For example, blur creates a soft, blurry effect; grayscale turns things black and white; brightness adjusts the lightness; contrast changes the contrast level; sepia gives it an old photo look; saturate boosts or reduces color intensity; hue-rotate shifts colors like a rainbow; invert flips the colors like a photo negative; and drop-shadow adds a shadow effect. All of these filters can be combined in a single line to create unique and eye-catching styles."
      }
    ]
  },
  5: {
    imageType: "comments-data",
    sections: [
      {
        content: `<div class="comments">
			<!-- begin wwww.htmlcommentbox.com -->
 <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">HTML Comment Box</a> is loading comments...</div>
 <script type="text/javascript" id="hcb"> /*<!--*/ if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/'/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%2476gBfZFjo3Ne22wg7kCrl1"+"&opts=16798&num=10&ts=1742835754100");if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); /*-->*/ </script>
<!-- end www.htmlcommentbox.com -->
</center>
			</div>`
      }
    ]
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // First, let's make sure we have required HTML elements
  // If these elements don't exist in HTML, we'll create them
  let mainContainer = document.querySelector('.main-container');
  if (!mainContainer) {
    const body = document.body;
    mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    body.appendChild(mainContainer);
  }
  
  // Add video background if it doesn't exist
  if (!document.querySelector('.video-background')) {
    const videoBackground = document.createElement('div');
    videoBackground.className = 'video-background';
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.innerHTML = '<source src="assets/videos/background.mp4" type="video/mp4">';
    videoBackground.appendChild(video);
    document.body.insertBefore(videoBackground, document.body.firstChild);
  }
  
  // Create stars container if it doesn't exist
  if (!document.querySelector('.stars')) {
    const stars = document.createElement('div');
    stars.className = 'stars';
    stars.style.position = 'fixed';
    stars.style.top = '0';
    stars.style.left = '0';
    stars.style.width = '100%';
    stars.style.height = '100%';
    stars.style.pointerEvents = 'none';
    stars.style.zIndex = '-1';
    document.body.appendChild(stars);
  }

  // Create audio element for selection sound
  if (!document.getElementById('selection-sound')) {
    const selectionSound = document.createElement('audio');
    selectionSound.id = 'selection-sound';
    selectionSound.src = 'visuals/selection.mp3';
    selectionSound.preload = 'auto';
    document.body.appendChild(selectionSound);
  }
  
  if (!document.querySelector('.center-panel')) {
    const centerPanel = document.createElement('div');
    centerPanel.className = 'center-panel';
    mainContainer.appendChild(centerPanel);
  }
  
  if (!document.querySelector('.right-panel')) {
    const rightPanel = document.createElement('div');
    rightPanel.className = 'right-panel';
    
    // Create timeline container structure
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container';
    
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    timelineContainer.appendChild(timelineLine);
    
    const timelineItemsWrapper = document.createElement('div');
    timelineItemsWrapper.className = 'timeline-items-wrapper';
    
    const timelineItems = document.createElement('div');
    timelineItems.className = 'timeline-items';
    
    // Create timeline items
    for (let i = 1; i <= Object.keys(timelineData).length; i++) {
      const data = timelineData[i];
      const item = document.createElement('div');
      item.className = i === 1 ? 'timeline-item active highlighted' : 'timeline-item';
      item.setAttribute('data-item', i);
      
      const dotContainer = document.createElement('div');
      dotContainer.className = 'timeline-dot-container';
      const dot = document.createElement('div');
      dot.className = 'timeline-dot';
      dotContainer.appendChild(dot);
      
      const text = document.createElement('div');
      text.className = 'timeline-text';
      text.textContent = data.title || `Question ${i}`;
      
      const date = document.createElement('div');
      date.className = 'timeline-date';
      
      item.appendChild(dotContainer);
      item.appendChild(text);
      item.appendChild(date);
      
      timelineItems.appendChild(item);
    }
    
    timelineItemsWrapper.appendChild(timelineItems);
    timelineContainer.appendChild(timelineItemsWrapper);
    
    // Add arrow navigation
    const arrowUp = document.createElement('div');
    arrowUp.className = 'arrow arrow-up';
    arrowUp.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5l7 7-1.4 1.4L12 7.8l-5.6 5.6L5 12l7-7z"></path></svg>';
    
    const arrowDown = document.createElement('div');
    arrowDown.className = 'arrow arrow-down';
    arrowDown.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 19l-7-7 1.4-1.4L12 16.2l5.6-5.6L19 12l-7 7z"></path></svg>';
    
    timelineContainer.appendChild(arrowUp);
    timelineContainer.appendChild(arrowDown);
    
    rightPanel.appendChild(timelineContainer);
    mainContainer.appendChild(rightPanel);
  }
  
  // Now all required HTML elements should exist
  
  // Create starry background
  createStars();
  
  // Elements
  const timelineItems = document.querySelectorAll('.timeline-item');
  const timelineItemsWrapper = document.querySelector('.timeline-items-wrapper');
  const centerPanel = document.querySelector('.center-panel');
  const arrowUp = document.querySelector('.arrow-up');
  const arrowDown = document.querySelector('.arrow-down');
  const selectionSound = document.getElementById('selection-sound');
  
  // Initialize content with the active item
  updateContent();
  
  // Function to play selection sound
  function playSelectionSound() {
    if (selectionSound) {
      selectionSound.currentTime = 0;
      selectionSound.play().catch(error => {
        console.log("Audio playback error:", error);
      });
    }
  }
  
  // Handle timeline item clicks
  timelineItems.forEach(item => {
    item.addEventListener('click', () => {
      // Play selection sound
      playSelectionSound();
      
      // Remove active class from all items
      timelineItems.forEach(i => {
        i.classList.remove('active');
        i.classList.remove('highlighted');
      });
      
      // Add active class to clicked item
      item.classList.add('active');
      item.classList.add('highlighted');
      
      // Update content
      updateContent();
      
      // Scroll the item into view
      scrollToActiveItem(true);
    });
  });
  
  // Handle arrow navigation
  arrowUp.addEventListener('click', () => {
    navigateTimeline('up');
  });
  
  arrowDown.addEventListener('click', () => {
    navigateTimeline('down');
  });
  
  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      navigateTimeline('up');
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      navigateTimeline('down');
      e.preventDefault();
    }
  });
  
  // Handle scroll events to update active item
  timelineItemsWrapper.addEventListener('scroll', debounce(function() {
    const centerY = timelineItemsWrapper.offsetHeight / 2;
    let closestItem = null;
    let minDistance = Infinity;
    
    timelineItems.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const wrapperRect = timelineItemsWrapper.getBoundingClientRect();
      const distance = Math.abs(wrapperRect.top + centerY - itemCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
      }
    });
    
    if (closestItem && !closestItem.classList.contains('active')) {
      // Play selection sound
      playSelectionSound();
      
      timelineItems.forEach(i => {
        i.classList.remove('active');
        i.classList.remove('highlighted');
      });
      
      closestItem.classList.add('active');
      closestItem.classList.add('highlighted');
      
      updateContent();
    }
  }, 100));
  
  // Add smooth scroll wheel behavior
  timelineItemsWrapper.addEventListener('wheel', function(e) {
    if (e.deltaY > 0) {
      // Scroll down
      if (isLastItemVisible()) {
        return;
      }
      navigateTimeline('down');
    } else {
      // Scroll up
      if (isFirstItemVisible()) {
        return;
      }
      navigateTimeline('up');
    }
    e.preventDefault();
  }, { passive: false });
  
  function updateContent() {
    const activeItem = document.querySelector('.timeline-item.active');
    if (!activeItem) return;
    
    const itemIndex = parseInt(activeItem.getAttribute('data-item'));
    const data = timelineData[itemIndex];
    if (!data) return;
    
    // Clear center panel and add title container
    centerPanel.innerHTML = `
      <div class="content-title-container">
        <div class="content-title-background ${data.imageType}"></div>
      </div>
    `;
    
    // Flag to track if comments section has been added
    let commentsAdded = false;
    
    // Add content sections
    data.sections.forEach(section => {
      let sectionHTML = `
        <div class="content-section">
      `;
      
      // Skip empty sections
      if (!section.content.trim()) {
        sectionHTML += `</div>`;
        centerPanel.innerHTML += sectionHTML;
        return;
      }
      
      // Check if content contains HTML for comments or code block
      if (section.content.includes('<div class="comments">') && !commentsAdded) {
        // For comments section, create a clean container - only once
        sectionHTML += `<div class="comments-container">
          <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">HTML Comment Box</a> is loading comments...</div>
        </div>`;
        
        // Set a flag to initialize comments after content is added to DOM
        window.initializeComments = true;
        commentsAdded = true;
      } else if (section.content.includes('<div class="code-block">')) {
        sectionHTML += section.content;
      } else {
        // Split content at \n\n and create paragraphs
        const paragraphs = section.content.split('\n\n');
        paragraphs.forEach(p => {
          sectionHTML += `<p>${p}</p>`;
        });
      }
      
      sectionHTML += `</div>`;
      centerPanel.innerHTML += sectionHTML;
    });
    
    // Add Discord icon specifically for question 2 (inside center panel)
    if (itemIndex === 3) { // question-2
      const discordHTML = `
        <div class="discord-icon-container">
          <div class="discord-icon">
            <a href="https://discord.gg/nMNdFehp25" target="_blank">
              <img src="visuals/discord.png" alt="Join Discord">
            </a>
          </div>
        </div>
      `;
      centerPanel.innerHTML += discordHTML;
      
      // Add CSS for Discord icon directly
      if (!document.querySelector('style[data-discord-styles]')) {
        const discordStyles = document.createElement('style');
        discordStyles.setAttribute('data-discord-styles', 'true');
        discordStyles.textContent = `
          .discord-icon-container {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
          }
          
          .discord-icon {
            display: inline-block;
            animation: float 3s ease-in-out infinite;
          }
    
          
          .discord-icon img {
            width: 60px;
            height: 60px;
            margin-bottom: 10px;
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
        `;
        document.head.appendChild(discordStyles);
      }
    }
    
    // Initialize comments if needed
    if (window.initializeComments) {
      // Re-initialize the HTML Comment Box
      if (window.HCB_comment_box_init) {
        window.HCB_comment_box_init();
      } else {
        // If the function doesn't exist yet, try again after a short delay
        setTimeout(() => {
          if (window.HCB_comment_box_init) {
            window.HCB_comment_box_init();
          } else {
            // Last resort: reinject the script
            const hcbScript = document.createElement('script');
            hcbScript.type = 'text/javascript';
            hcbScript.innerHTML = `/*<!--*/ if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/'/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%2476gBfZFjo3Ne22wg7kCrl1"+"&opts=16798&num=10&ts="+new Date().getTime());if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); /*-->*/`;
            document.body.appendChild(hcbScript);
          }
        }, 1000);
      }
      window.initializeComments = false;
    }
    
    // Scroll center panel to top
    centerPanel.scrollTop = 0;
  }
  // Helper functions
  function navigateTimeline(direction) {
    const activeItem = document.querySelector('.timeline-item.active');
    if (!activeItem) return;
    
    const activeIndex = parseInt(activeItem.getAttribute('data-item'));
    let newIndex;
    
    if (direction === 'up' && activeIndex > 1) {
      newIndex = activeIndex - 1;
    } else if (direction === 'down' && activeIndex < timelineItems.length) {
      newIndex = activeIndex + 1;
    } else {
      return;
    }
    
    // Play selection sound
    playSelectionSound();
    
    const newActiveItem = document.querySelector(`.timeline-item[data-item="${newIndex}"]`);
    if (newActiveItem) {
      timelineItems.forEach(i => {
        i.classList.remove('active');
        i.classList.remove('highlighted');
      });
      
      newActiveItem.classList.add('active');
      newActiveItem.classList.add('highlighted');
      
      updateContent();
      scrollToActiveItem();
    }
  }
  
  function scrollToActiveItem(instant = false) {
    const activeItem = document.querySelector('.timeline-item.active');
    if (!activeItem) return;
    
    const timelineHeight = timelineItemsWrapper.offsetHeight;
    const itemTop = activeItem.offsetTop;
    const itemHeight = activeItem.offsetHeight;
    const scrollTo = itemTop - (timelineHeight / 2) + (itemHeight / 2);
    
    timelineItemsWrapper.scrollTo({
      top: scrollTo,
      behavior: instant ? 'auto' : 'smooth'
    });
  }
  
  function isFirstItemVisible() {
    const firstItem = document.querySelector('.timeline-item[data-item="1"]');
    if (!firstItem) return true;
    
    return firstItem.getBoundingClientRect().top >= timelineItemsWrapper.getBoundingClientRect().top;
  }
  
  function isLastItemVisible() {
    const lastItem = document.querySelector(`.timeline-item[data-item="${timelineItems.length}"]`);
    if (!lastItem) return true;
    
    return lastItem.getBoundingClientRect().bottom <= timelineItemsWrapper.getBoundingClientRect().bottom;
  }
  
  // Function to create starry background
  function createStars() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    
    // Clear existing stars
    starsContainer.innerHTML = '';
    
    const starCount = 150; // More stars for enhanced effect
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      
      // Add star styles directly
      star.style.position = 'absolute';
      star.style.backgroundColor = 'white';
      star.style.borderRadius = '50%';
      
      // Random size between 1 and 3px
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      // Random position
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      
      // Random opacity
      star.style.opacity = Math.random() * 0.7 + 0.1;
      
      // Subtle twinkling effect for some stars
      if (Math.random() > 0.7) {
        const duration = Math.random() * 4 + 2;
        star.style.animation = `glow ${duration}s infinite ease-in-out`;
      }
      
      starsContainer.appendChild(star);
    }
    
    // Add star animation if it doesn't exist
    if (!document.querySelector('style[data-star-animation]')) {
      const style = document.createElement('style');
      style.setAttribute('data-star-animation', 'true');
      style.textContent = `
        @keyframes glow {
          0% { opacity: 0.1; }
          50% { opacity: 0.7; }
          100% { opacity: 0.1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Debounce function to limit execution frequency
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Initial scroll to active item
  setTimeout(() => {
    scrollToActiveItem(true);
  }, 100);
});