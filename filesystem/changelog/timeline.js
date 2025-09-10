document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // TIMELINE DATA
    // ========================================
    const timelineData = [
        {
            id: 1,
            date: "August 10, 2025",
            title: "Commission Update",
            text: `<p>Hewo!! I've had a whole year to reflect on this topic and decided to close my commissions for good, as I want to focus on my studies and personal projects! For now, I'll dedicate myself to publishing on my blogs some things that will be useful to people on their web development journey and a few other topics.</p>
            
            <p>Please note that I only handle web development, web design and game development. I've always loved creating things. Making hand-coded websites with HTML/CSS/JS is my latest obsession and I love it very much. Currently available for any internships or work! Anything related to web development is preferable, which involves website responsiveness, animation complexity, and more.</p>
            
            <p>I will be updating this page with new information about my work and projects. If you have any questions or want to contact me, please feel free to reach out through my social media or email. Besides that, If someone needs help with their website, I will be happy to help!</p>
            
            <p>At the time of writing this, I don't know when <b>Skye Journey update 2.3</b> will be released, but I'm guessing it'll be released sometime in late fall, and if you're reading this, it's likely that's already happened, or maybe I'm getting ahead of myself!</p>`
        },
        {
            id: 2,
            date: "August 12, 2025",
            title: "Skye Journey 2.3 Planning",
            text: `<p>I'm currently planning Skye Journey update 2.3 which will bring several new features including improved animations, more responsive designs, and better accessibility options.</p>
            
            <p>This update will focus on enhancing the user experience with smoother transitions, better mobile support, and more interactive elements. I'm aiming to release it in late fall. Stay tuned for more updates!</p>`
        },
        {
            id: 3,
            date: "August 15, 2025",
            title: "Moving out of the country",
            text: `<p>Today I'm moving out of the United States. I'm feeling a little nervous about this; after all, I've spent seven years of my life in this country, and even more. Moving to a new environment will be a drastic change for me. I've been busy with this move for a month now, and I'm afraid it's affected my time working on this website. I know no one will probably read this until the fall, and by then it will have been months since I moved, but I feel like writing about this will help me cope better. I have so many things to do that I don't even know where to start.</p>
            <p>I'm afraid I'll even have to start studying at a new college after I get my grades revalidated. It's a tough process for me, so I apologize if I'm away for too long and late with all these updates.</p>
            <p>I hope this whole change in my life is for something good.</p>`
        },
        {
            id: 4,
            date: "April 28, 2025",
            title: "Game Development Project",
            text: `<p>Started working on a small game development project using Godot as game engine. It's a simple game with pixel art aesthetics based on Omori and Yume Nikki. It's a gift for my boyfriend.</p>
            
            <p>I'll be documenting the process on my blog for anyone interested in game development. The project focuses on smooth gameplay mechanics, engaging visuals, and other stuff.</p>
            
            <p>I'm currently handling all the art myself, both the cinematics and the pixel art. It's a truly enjoyable experience; I have a lot of fun doing it, and I feel like I can finally draw again after so many years.</p>`
        },
        {
            id: 5,
            date: "September 6, 2025",
            title: "Healthy Habits",
            text: `<p>I've been trying to adopt healthier habits lately. This includes eating better, exercising more, and taking care of my mental health. I mean, I decided to stop smoking, now that I'm clean, I'm trying to follow a routine on my daily basis you know? So yeah, it's been a challenging journey, but I'm committed to making positive changes in my life. I already feel better physically and mentally since that, and even if I still have a long way to go, I'm proud of the progress I've made.</p>

            <p>Also, I've been trying to read more books and learn new skills. I believe that continuous learning is essential for personal growth and development. So, I'm dedicating some time each day to read articles, watch tutorials, and practice new skills. My dad decided to inscribe me in two language classes here in college the next months, and I'm really excited about it! My nana who speaks Italian is also helping me with my studies. I'll keep you updated on my progress and probably will write about this on my devlogs, so check out my tumblr whenever you have time!</p>`
        }
    ];

    // ========================================
    // SOUND MANAGEMENT
    // ========================================
    let currentActiveIndex = 0;

    function playSound(soundId) {
        try {
            const sound = document.getElementById(soundId);
            if (sound) {
                sound.currentTime = 0; // Reset to beginning
                sound.play().catch(e => console.log('Sound play failed:', e));
            }
        } catch (error) {
            console.log('Sound error:', error);
        }
    }

    // ========================================
    // TIMELINE AND CONTENT INITIALIZATION
    // ========================================
    const timelineItemsContainer = document.querySelector('.timeline-items');
    const contentWrapper = document.querySelector('.content-wrapper');
    
    // Initialize timeline items and content containers
    function initializeTimeline() {
        // Clear existing content
        timelineItemsContainer.innerHTML = '';
        contentWrapper.innerHTML = '';
        
        // Add timeline items and content containers
        timelineData.forEach((item, index) => {
            // Create timeline item
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.dataset.id = item.id;
            timelineItem.dataset.index = index;
            timelineItem.innerHTML = `
                <div class="timeline-dot-container">
                    <div class="timeline-dot"></div>
                </div>
                <div class="timeline-date">${item.date}</div>
                <div class="timeline-text">${item.title}</div>
            `;
            timelineItemsContainer.appendChild(timelineItem);
            
            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'content-container';
            contentContainer.dataset.id = item.id;
            contentContainer.innerHTML = `
                <h2 class="content-heading">${item.title}</h2>
                <div class="content-date">${item.date}</div>
                <div class="content-text">${item.text}</div>
            `;
            contentWrapper.appendChild(contentContainer);
            
            // Make the first item active by default
            if (index === 0) {
                timelineItem.classList.add('active');
                contentContainer.classList.add('active');
                currentActiveIndex = 0;
            }
        });
        
        // Add event listeners to timeline items
        addTimelineEventListeners();
    }
    
    // ========================================
    // KEYBOARD NAVIGATION
    // ========================================
    function navigateTimeline(direction) {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const timelineWrapper = document.querySelector('.timeline-items-wrapper');
        
        if (direction === 'up' && currentActiveIndex > 0) {
            currentActiveIndex--;
            playSound('selectionSound');
        } else if (direction === 'down' && currentActiveIndex < timelineItems.length - 1) {
            currentActiveIndex++;
            playSound('selectionSound');
        } else {
            return;
        }
        
        // Update active states
        timelineItems.forEach((item, index) => {
            item.classList.toggle('active', index === currentActiveIndex);
        });
        
        // Update content display
        const activeItem = timelineItems[currentActiveIndex];
        const itemId = activeItem.dataset.id;
        updateContent(itemId);
        
        // Scroll the timeline to keep active item visible
        const activeItemRect = activeItem.getBoundingClientRect();
        const wrapperRect = timelineWrapper.getBoundingClientRect();
        
        if (activeItemRect.top < wrapperRect.top + 50) {
            timelineWrapper.scrollBy({
                top: activeItemRect.top - wrapperRect.top - 100,
                behavior: 'smooth'
            });
        } else if (activeItemRect.bottom > wrapperRect.bottom - 50) {
            timelineWrapper.scrollBy({
                top: activeItemRect.bottom - wrapperRect.bottom + 100,
                behavior: 'smooth'
            });
        }
        
        // Play selection sound after navigation
        setTimeout(() => {
            playSound('selectSound');
        }, 100);
    }
    
    // Add keyboard event listeners
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case 'ArrowUp':
                event.preventDefault();
                navigateTimeline('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                navigateTimeline('down');
                break;
        }
    });
    
    // ========================================
    // EVENT LISTENERS
    // ========================================
    function addTimelineEventListeners() {
        // Timeline item click event
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.addEventListener('click', function() {
                const itemId = this.dataset.id;
                currentActiveIndex = index;
                
                // Play selection sound
                playSound('selectSound');
                
                // Remove active class from all items
                timelineItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Update content display
                updateContent(itemId);
            });
            
        });
        
        // Arrow navigation
        const arrowUp = document.querySelector('.arrow-up');
        const arrowDown = document.querySelector('.arrow-down');
        const timelineItemsWrapper = document.querySelector('.timeline-items-wrapper');
        
        if (arrowUp) {
            arrowUp.addEventListener('click', function() {
                playSound('selectionSound');
                timelineItemsWrapper.scrollBy({
                    top: -100,
                    behavior: 'smooth'
                });
            });
        }
        
        if (arrowDown) {
            arrowDown.addEventListener('click', function() {
                playSound('selectionSound');
                timelineItemsWrapper.scrollBy({
                    top: 100,
                    behavior: 'smooth'
                });
            });
        }
    }
    
    // ========================================
    // CONTENT DISPLAY FUNCTIONS
    // ========================================
    function updateContent(itemId) {
        // Hide all content containers
        const contentContainers = document.querySelectorAll('.content-container');
        contentContainers.forEach(container => {
            container.classList.remove('active');
        });
        
        // Show selected content container
        const selectedContainer = document.querySelector(`.content-container[data-id="${itemId}"]`);
        if (selectedContainer) {
            selectedContainer.classList.add('active');
        }
    }
    
    // ========================================
    // INITIALIZE TIMELINE
    // ========================================
    initializeTimeline();
    

});