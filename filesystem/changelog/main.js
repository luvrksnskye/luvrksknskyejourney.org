function generateMovingStars() {
    const starsContainer = document.querySelector('.stars');
    const starCount = 500; 
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.animationDelay = Math.random() * 10 + 's';
        star.style.animationDuration = 5 + Math.random() * 5 + 's';
        starsContainer.appendChild(star);
    }
}

function initializeStarfall() {
    const starfield = document.querySelector('.starfall-container .starfield');
    if (!starfield) return;

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
}

const MouseEffect = {
    body: document.body,
    imgUrl: "../../assets/mouse/cursor.ico",
    sizeRange: [10, 20],
    
    rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    
    getSize() {
        return this.rand(this.sizeRange[0], this.sizeRange[1]);
    },
    
    lerp(a, b, f) {
        return (b - a) * f + a;
    },
    
    createHeart(x, y) {
        const size = this.getSize();
        x -= size / 2;
        y -= size / 2;
        x = Math.floor(x) + this.rand(-5, 5);
        y = Math.floor(y) + this.rand(-5, 5);
        
        const finalX = x + this.rand(-40, 40);
        const finalY = y + this.rand(-40, 40);
        
        const heartImg = document.createElement("img");
        heartImg.src = this.imgUrl;
        heartImg.style = `
            pointer-events: none; 
            position: fixed; 
            width: ${size}px; 
            left: ${x}px; 
            top: ${y}px; 
            -webkit-touch-callout: none; 
            -webkit-user-select: none; 
            -khtml-user-select: none; 
            -moz-user-select: none; 
            -ms-user-select: none; 
            user-select: none; 
            z-index: 1000000;
        `;
        
        this.body.appendChild(heartImg);
        
        let progress = 0;
        const animationInterval = setInterval(() => {
            const currentX = Math.floor(this.lerp(x, finalX, progress));
            const currentY = Math.floor(this.lerp(y, finalY, progress));
            
            heartImg.style.left = `${currentX}px`;
            heartImg.style.top = `${currentY}px`;
            heartImg.style.opacity = 1 - progress;
            
            progress += 0.01;
            
            if (progress > 1) {
                clearInterval(animationInterval);
                this.body.removeChild(heartImg);
            }
        }, 10);
    },
    
    createMultipleHearts(x, y) {
        for (let i = 0; i < 5; i++) {
            this.createHeart(x, y);
        }
    },
    
    init() {
        this.body.addEventListener("click", (event) => {
            const x = event.clientX;
            const y = event.clientY;
            this.createMultipleHearts(x, y);
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    generateMovingStars();
    
    initializeStarfall();
    
    MouseEffect.init();
    
    console.log('All animations initialized successfully!');
});