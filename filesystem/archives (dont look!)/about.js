// ========== ABOUT PAGE ==========

document.addEventListener('DOMContentLoaded', function() {
    // ===== GENERATE STAR BACKGROUND =====
    const starsContainer = document.querySelector('.stars');
    const starCount = 180; 
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.animationDelay = Math.random() * 10 + 's';
        star.style.animationDuration = 5 + Math.random() * 5 + 's';
        starsContainer.appendChild(star);
    }
    
    // ===== GENERATE FALLING STARS =====
    const starfield = document.querySelector('.starfall-container .starfield');
    const skySegments = [
        { x: [0, 33], y: [0, 33] },
        { x: [33, 66], y: [0, 33] },
        { x: [66, 100], y: [0, 33] },
        { x: [0, 33], y: [33, 66] },
        { x: [33, 66], y: [33, 66] },
        { x: [66, 100], y: [33, 66] },
        { x: [0, 33], y: [66, 100] },
        { x: [33, 66], y: [66, 100] },
        { x: [66, 100], y: [66, 100] }
    ];
    const starsInSegment = 3;
    
    skySegments.forEach(segment => {
        for (let i = 0; i < starsInSegment; i++) {
            const star = document.createElement('div');
            star.className = 'falling-star';
            const x = segment.x[0] + Math.random() * (segment.x[1] - segment.x[0]);
            const y = segment.y[0] + Math.random() * (segment.y[1] - segment.y[0]);
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            const delay = Math.random() * 9999;
            star.style.animationDelay = `${delay}ms`;
            const duration = 3000 + (Math.random() * 1000 - 500);
            star.style.animationDuration = `${duration}ms`;
            star.style.setProperty('--falling-delay', `${delay}ms`);
            const brightness = 0.75 + Math.random() * 0.5;
            star.style.opacity = brightness;
            starfield.appendChild(star);
        }
    });
    
    // ===== GENERATE BUBBLES =====
    function createBubbles() {
        const bubblesContainer = document.createElement('div');
        bubblesContainer.classList.add('bubbles-container');
        document.body.appendChild(bubblesContainer);
        
        // Crear burbujas a intervalos aleatorios
        function createBubble() {
            const bubble = document.createElement('div');
            bubble.classList.add('bubble');
            
            // Tamaño aleatorio
            const size = 10 + Math.random() * 40;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            
            // Posición horizontal aleatoria
            bubble.style.left = `${Math.random() * 100}%`;
            
            // Velocidad y opacidad aleatorias
            const riseDuration = 15 + Math.random() * 15;
            const opacity = 0.1 + Math.random() * 0.5;
            const scaleEnd = 0.5 + Math.random() * 1;
            
            bubble.style.setProperty('--rise-duration', `${riseDuration}s`);
            bubble.style.setProperty('--bubble-opacity', opacity);
            bubble.style.setProperty('--scale-end', scaleEnd);
            
            // Añadir efecto de bamboleo
            bubble.style.animation = `bubble-rise ${riseDuration}s ease-in infinite, bubble-sway ${2 + Math.random() * 4}s ease-in-out infinite alternate`;
            
            bubblesContainer.appendChild(bubble);
            
            // Eliminar la burbuja después de completar la animación
            setTimeout(() => {
                bubble.remove();
            }, riseDuration * 1000);
        }
        
        // Crear 10 burbujas iniciales
        for (let i = 0; i < 10; i++) {
            setTimeout(createBubble, Math.random() * 5000);
        }
        
        // Crear nuevas burbujas periódicamente
        setInterval(createBubble, 1000);
    }

    // Añadir el efecto de bamboleo para las burbujas
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bubble-sway {
            0% {
                transform: translateX(-20px);
            }
            100% {
                transform: translateX(20px);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Crear burbujas
    createBubbles();
    
    // ===== MOUSE CURSOR EFFECT =====
    var b = document.body;
    var imgurl = "../../assets/mouse/cursor.ico";
    var size = [10, 20];
    
    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    function getSize() {
        return rand(size[0], size[1]);
    }
    
    function lerp(a, b, f) {
        return (b-a)*f+a;
    }
    
    function heart(x, y) {
        var s = getSize();
        x -= s/2;
        y -= s/2;
        x = Math.floor(x) + rand(-5, 5);
        y = Math.floor(y) + rand(-5, 5);
        var fx = x + rand(-40, 40);
        var fy = y + rand(-40, 40);
        var i = document.createElement("img");
        i.src = imgurl;
        i.style = `pointer-events: none; position: fixed; width: ${s}px; left: ${x}px; top: ${y}px; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; z-index: 1000000;`;
        b.appendChild(i);
        var f = 0;
        var interval;
        interval = setInterval(function() {
            var _x = Math.floor(lerp(x, fx, f));
            var _y = Math.floor(lerp(y, fy, f));
            i.style = `pointer-events: none; position: fixed; width: ${s}px; left: ${_x}px; top: ${_y}px; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; z-index: 1000000;`;
            i.style.opacity = 1-f;
            f += 0.01;
            if (f > 1) {
                clearInterval(interval);
                b.removeChild(i);
            }
        }, 10);
    }
    
    function bro(x, y) {
        for (var i = 0; i < 5; i++) {
            heart(x, y);
        }
    }
    
    b.addEventListener("click", function(event) {
        var x = event.clientX;
        var y = event.clientY;
        bro(x, y);
    });
    
    // ===== DYNAMIC BACKGROUND WITH SMOOTH SCROLLING =====
    const parallaxContainer = document.querySelector('.parallax-container');
    const parallaxBg = document.querySelector('.parallax-bg');
    const contentSections = document.querySelector('.content-sections');
    const clockContainer = document.getElementById('clockContainer');

    // Crear la sección del contador si no existe
    if (!document.querySelector('.counter-section')) {
        const counterSection = document.createElement('section');
        counterSection.classList.add('counter-section');
        counterSection.innerHTML = `
            <div class="blink-counter" id="blinkCounter">0</div>
            <div class="counter-title" id="counterTitle">Average number of blinks in a human life</div>
            <div class="counter-message" id="counterMessage">I am halfway through this journey.</div>
        `;
        contentSections.appendChild(counterSection);
    }

    // Función para ajustar la altura del background al contenido
    function adjustBackgroundHeight() {
        if (contentSections) {
            const contentHeight = contentSections.scrollHeight;
            // Asegurar que siempre sea al menos la altura de la ventana + un poco más
            const minHeight = window.innerHeight * 1.2;
            const finalHeight = Math.max(contentHeight, minHeight);
            document.documentElement.style.setProperty('--content-height', `${finalHeight}px`);
        }
    }

    // Iniciar contador cuando sea visible
    let counterStarted = false;
    let targetNumber = 650000000; // Número objetivo

    function startCounter() {
        if (counterStarted) return;
        
        const counterElement = document.getElementById('blinkCounter');
        const counterTitle = document.getElementById('counterTitle');
        const counterMessage = document.getElementById('counterMessage');
        
        if (!counterElement) return;
        
        counterStarted = true;
        let currentNumber = 0;
        let duration = 5000; // Duración total en ms
        let startTime;
        
        // Mostrar título después de un breve retraso
        setTimeout(() => {
            if (counterTitle) counterTitle.classList.add('visible');
        }, 1000);
        
        // Mostrar mensaje final después de completar el contador
        setTimeout(() => {
            if (counterMessage) counterMessage.classList.add('visible');
        }, duration + 1000);
        
        // Función de animación del contador con aceleración
        function animateCounter(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;
            
            if (elapsedTime < duration) {
                // Aplicar una curva de aceleración con easeInOutQuart
                const progress = elapsedTime / duration;
                const easeProgress = progress < 0.5 
                    ? 8 * progress * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 4) / 2;
                
                currentNumber = Math.floor(easeProgress * targetNumber);
                counterElement.textContent = currentNumber.toLocaleString();
                requestAnimationFrame(animateCounter);
            } else {
                counterElement.textContent = targetNumber.toLocaleString();
            }
        }
        
        requestAnimationFrame(animateCounter);
    }

    // Handle scroll effect with smooth animations
    parallaxContainer.addEventListener('scroll', function() {
        // Calculate scroll position as percentage
        const scrollTop = parallaxContainer.scrollTop;
        const containerHeight = parallaxContainer.scrollHeight - window.innerHeight;
        const scrollPercentage = (scrollTop / containerHeight) * 100;
        
        // Make clock appear when scrolled enough
        if (scrollPercentage > 60) {
            clockContainer.classList.add('visible');
        } else {
            clockContainer.classList.remove('visible');
        }
        
        // Check if counter section is visible
        const counterSection = document.querySelector('.counter-section');
        if (counterSection) {
            const counterRect = counterSection.getBoundingClientRect();
            if (counterRect.top < window.innerHeight * 0.8) {
                counterSection.classList.add('visible');
                startCounter();
            }
        }
        
        // Add animation to content sections based on scroll position
        const sections = document.querySelectorAll('.about-section');
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            // Calcular qué tan dentro de la pantalla está la sección
            const visiblePercentage = 1 - (rect.top / (window.innerHeight * 0.8));
            
            if (visiblePercentage > 0 && visiblePercentage <= 1) {
                section.classList.add('visible');
                // Aplicar un efecto de parallax sutil a cada sección
                section.style.transform = `translateY(${(1 - visiblePercentage) * 20}px)`;
            } else if (visiblePercentage <= 0) {
                section.classList.remove('visible');
            }
        });
    });

    // Asegurarse de que el fondo cubra todo el contenido
    window.addEventListener('load', () => {
        adjustBackgroundHeight();
        // Agregar un pequeño retraso para que se ajuste después de cargar todo
        setTimeout(adjustBackgroundHeight, 500);
    });
    
    window.addEventListener('resize', adjustBackgroundHeight);

    // Observer para detectar cambios en el contenido
    const resizeObserver = new ResizeObserver(() => {
        adjustBackgroundHeight();
    });
    
    if (contentSections) {
        resizeObserver.observe(contentSections);
    }
    
    // Trigger initial scroll event to set initial states
    setTimeout(() => {
        parallaxContainer.dispatchEvent(new Event('scroll'));
    }, 100);
    
    // Add smooth scroll effect for section navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                parallaxContainer.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});