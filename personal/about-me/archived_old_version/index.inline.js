

// ---- extracted from index.html ----

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing country selector...');
    
    // Elements - with null checks
    const pointer = document.getElementById('pointer');
    const selectionHover = document.getElementById('selectionHover');
    const countryOptions = document.querySelectorAll('.country-option');
    const mapCountryName = document.getElementById('mapCountryName');
    const animationOverlay = document.getElementById('animation-overlay');
    
    // Check if essential elements exist
    if (!pointer || !selectionHover || countryOptions.length === 0 || !mapCountryName || !animationOverlay) {
        console.error('Essential elements not found!');
        // Fallback: make Venezuela clickable directly
        const venezuelaOption = document.querySelector('.country-option[data-country="Venezuela"]');
        if (venezuelaOption) {
            venezuelaOption.addEventListener('click', function() {
                window.location.href = "skye/index.html";
            });
        }
        return;
    }
    
    // Audio elements with error handling
    function createAudio(src) {
        try {
            const audio = new Audio(src);
            audio.preload = 'auto';
            return audio;
        } catch (e) {
            console.warn(`Could not load audio: ${src}`);
            return { play: () => {}, currentTime: 0 };
        }
    }

    const moveSound = createAudio('sfx/ui-mydesignedit-move.wav');
    const selectSound = createAudio('sfx/ui-phone-start-4.wav');
    const errorSound = createAudio('sfx/ui-closet-in.wav');

    // Pointer positions - adjust these to match your layout
    const pointerPositions = [
        210, // Venezuela
        306, // Colombia
        402, // Panama
        498, // United States
        594  // Puerto Rico
    ];

    const hoverPositions = [
        205, // Venezuela
        301, // Colombia
        397, // Panama
        493, // United States
        589  // Puerto Rico
    ];

    let currentIndex = 0;
    let animationInProgress = false;

    // Update pointer and hover position
    function updatePosition(index) {
        if (pointer && selectionHover) {
            pointer.style.top = pointerPositions[index] + 'px';
            selectionHover.style.top = hoverPositions[index] + 'px';
        }
        
        if (mapCountryName && countryOptions[index]) {
            mapCountryName.textContent = countryOptions[index].getAttribute('data-country');
        }
        
        console.log(`Position updated to index ${index}: ${countryOptions[index]?.getAttribute('data-country')}`);
    }

    // Initialize position
    updatePosition(currentIndex);

    // Handle keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (animationInProgress) {
            console.log('Animation in progress, ignoring input');
            return;
        }

        let newIndex = currentIndex;
        
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            newIndex = Math.max(0, currentIndex - 1);
        }
        else if (event.key === 'ArrowDown') {
            event.preventDefault();
            newIndex = Math.min(countryOptions.length - 1, currentIndex + 1);
        }
        else if (event.key === 'Enter') {
            event.preventDefault();
            trySelectCountry();
            return;
        }
        
        // If position changed
        if (newIndex !== currentIndex) {
            console.log(`Moving from ${currentIndex} to ${newIndex}`);
            
            moveSound.currentTime = 0;
            moveSound.play().catch(e => console.warn('Could not play move sound:', e));
            
            currentIndex = newIndex;
            updatePosition(currentIndex);
        }
    });

    // Make countries clickable
    countryOptions.forEach((option, index) => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (animationInProgress) return;
            
            console.log('Country clicked:', this.getAttribute('data-country'));
            
            currentIndex = index;
            updatePosition(currentIndex);
            
            if (!this.classList.contains('disabled')) {
                trySelectCountry();
            } else {
                errorSound.currentTime = 0;
                errorSound.play().catch(e => console.warn('Could not play error sound:', e));
            }
        });
    });

    // Try to select a country
    function trySelectCountry() {
        if (animationInProgress || !countryOptions[currentIndex]) {
            console.log('Cannot select country - animation in progress or invalid index');
            return;
        }

        const selectedCountry = countryOptions[currentIndex];
        const countryName = selectedCountry.getAttribute('data-country');
        
        console.log('Attempting to select:', countryName);
        
        if (selectedCountry.classList.contains('disabled')) {
            console.log('Country is disabled');
            errorSound.currentTime = 0;
            errorSound.play().catch(e => console.warn('Could not play error sound:', e));
            return;
        }

        // Play select sound
        selectSound.currentTime = 0;
        selectSound.play().catch(e => console.warn('Could not play select sound:', e));
        
        console.log('Country selected successfully:', countryName);
        
        // Set animation flag
        animationInProgress = true;

        // Start appropriate animation based on country
        if (countryName === 'Venezuela') {
            startVenezuelaAnimation();
        } else {
            // For other countries (if they become available)
            startGeneralAnimation();
        }
    }

    // Venezuela-specific animation sequence
    function startVenezuelaAnimation() {
        console.log('Starting Venezuela animation sequence as overlay...');
        
        // Show animation overlay
        animationOverlay.style.display = 'block';
        
        // Create background elements
        const blueBg = document.createElement('div');
        blueBg.className = 'cover-image blue-bg';
        animationOverlay.appendChild(blueBg);
        
        const blackBg = document.createElement('div');
        blackBg.className = 'cover-image black-bg';
        animationOverlay.appendChild(blackBg);
        
        // Play Dodo Airlines sound immediately without delays
        try {
            const dodoSound = new Audio('sfx/dodo-airlines-start.mp3');
            dodoSound.play().catch(e => console.warn('Could not play Dodo sound:', e));
        } catch (e) {
            console.warn('Could not create Dodo sound:', e);
        }
        
        // Start the animation timeline
        var tl = gsap.timeline({
            onComplete: function() {
                console.log('Animation complete, redirecting...');
                // Redirect to Skye's page after animation
                window.location.href = "skye/index.html";
            }
        });

        gsap.set("#logo-svg", { opacity: 0 });
        gsap.set("#plane-container", { opacity: 0 }); // Hide plane initially

        tl.set("#foot-fly, #wing-fly-1, #wing-fly-2, #bill-2", { opacity: 0 });

        // Blue background expansion (smooth intro)
        tl.to(blueBg, 1.4, {
            webkitClipPath: "circle(100% at 50% 50%)",
            clipPath: "circle(100% at 50% 50%)",
            ease: "power2.inOut"
        });

        // Fade In Logo
        tl.to("#logo-svg", 1.3, { opacity: 1 }, "-=0.5");

        // Smush Bird Down
        tl.set("#bill-1", { opacity: 0, delay: 0.5 });
        tl.set("#bill-2", { opacity: 1, y: -15 });
        tl.to("#bird-body-container", 0.3, {
            transformOrigin: "bottom center",
            transform: "scaleY(.7)",
            y: 3
        });
        tl.set("#bill-1", { opacity: 1, delay: 0.3 });
        tl.set("#bill-2", { opacity: 0 });
        tl.to("#bird-body-container", 0.1, { transform: "scaleY(1)" });
        tl.set("#wing-still", { opacity: 0 });
        tl.set(" #foot-land", { opacity: 0, delay: -0.1 });
        tl.set(" #foot-fly", { opacity: 1, delay: -0.1 });

        tl.add(flapWings());

        // Fade out logo
        tl.to("#logo-container", 1, { opacity: 0 });

        // Black background expansion FIRST
        tl.to(blackBg, 1.4, {
            webkitClipPath: "circle(100% at 50% 50%)",
            clipPath: "circle(100% at 50% 50%)",
            ease: "power2.inOut"
        });

        // THEN show plane animation after black background is fully expanded
        tl.to("#plane-container", 0.5, { opacity: 1 });

        // Final pause before redirect
        tl.to({}, 2, {});
    }

    // General animation for other countries
    function startGeneralAnimation() {
        console.log('Starting general animation...');
        
        animationOverlay.style.display = 'block';
        
        const tl = gsap.timeline({
            onComplete: function() {
                window.location.href = "skye/index.html";
            }
        });

        gsap.set("#logo-svg", { opacity: 0 });
        tl.to("#logo-svg", 1, { opacity: 1, delay: 1 });
        tl.to("#logo-container", 1, { opacity: 0, delay: 2 });
        tl.to({}, 1, {});
    }

    // Wing flapping animation function
    function flapWings() {
        var flaptl = gsap.timeline({ repeat: 15 });
        flaptl.to("#wing-fly-2", 0.1, { opacity: 1, ease: "none" });
        flaptl.to("#wing-fly-2", 0.1, { opacity: 0 });
        flaptl.to("#wing-fly-1", 0.1, { opacity: 1, ease: "none" });
        flaptl.to("#wing-fly-1", 0.1, { opacity: 0 });
        return flaptl;
    }

    // Continuous plane animations
    gsap.set("#propellor-group", {
        transformOrigin: "center center",
        transform: "scaleX(.25)"
    });

    gsap.to("#propellor", 1, {
        transformOrigin: "center center",
        rotation: "-500deg",
        ease: "none",
        repeat: -1
    });

    gsap.fromTo(
        "#plane",
        3,
        { y: -30 },
        { ease: "sine.inOut", y: 30, yoyo: true, repeat: -1 }
    );

    gsap.fromTo(
        "#cloud1",
        5,
        { x: -150 },
        { x: 280, repeatDelay: 1.5, repeat: -1, ease: "none" }
    );
    
    gsap.fromTo(
        "#cloud2",
        5,
        { x: -150 },
        { x: 280, repeatDelay: 3, repeat: -1, delay: 1, ease: "none" }
    );
    
    console.log('JavaScript initialization complete');
});
