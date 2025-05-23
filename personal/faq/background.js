// Orbital Background System - Self-contained
(function() {
    // Create dedicated canvas for background
    const bgCanvas = document.createElement('canvas');
    bgCanvas.id = 'orbital-bg-canvas';
    document.body.prepend(bgCanvas); // Add as first element in body
    const bgCtx = bgCanvas.getContext('2d');
    
    // Style the background canvas
    Object.assign(bgCanvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        'z-index': '-1',
        'pointer-events': 'none'
    });

    // Set canvas size
    function resizeCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        orbitalCircles.forEach(circle => {
            circle.centerX = bgCanvas.width / 2;
            circle.centerY = bgCanvas.height / 2;
        });
    }

    class OrbitalCircle {
        constructor(imgSrc, size, speed, startAngle = 0) {
            this.size = size;
            this.speed = speed;
            this.angle = startAngle;
            this.centerX = 0;
            this.centerY = 0;
            this.isLoaded = false;
            this.useFallback = false;
            
            // Animation properties
            this.scale = 0;
            this.delay = Math.random() * 2000;
            this.animationStarted = false;
            this.animationProgress = 0;
            
            // Create image and set up load handlers
            this.img = new Image();
            this.img.onload = () => {
                this.isLoaded = true;
            };
            this.img.onerror = () => {
                this.createFallbackCircle();
                this.useFallback = true;
                this.isLoaded = true;
            };
            // Set the source after setting up the handlers
            this.img.src = imgSrc;
        }
        
        createFallbackCircle() {
            const canvas = document.createElement('canvas');
            canvas.width = this.size;
            canvas.height = this.size;
            const ctx = canvas.getContext('2d');
            
            ctx.beginPath();
            ctx.arc(this.size/2, this.size/2, this.size/2 - 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            this.img = canvas;
        }
        
        update() {
            this.angle += this.speed;
            if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
            
            if (!this.animationStarted && performance.now() > this.delay) {
                this.animationStarted = true;
            }
            
            if (this.animationStarted && this.animationProgress < 1) {
                this.animationProgress += 0.008;
                this.scale = this.easeOutBack(this.animationProgress);
            }
        }
        
        easeOutBack(x) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return x === 0 ? 0 : x === 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        }
        
        draw(ctx) {
            // Only draw if the image is loaded or we're using a fallback
            if (!this.isLoaded) return;
            
            ctx.save();
            ctx.globalAlpha = 0.6; // Semi-transparent
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle);
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(
                this.img, 
                -this.size/2, 
                -this.size/2, 
                this.size, 
                this.size
            );
            ctx.restore();
        }
    }

    // Initialize with your specified circles
    const orbitalCircles = [
        new OrbitalCircle('visuals/middle.png', 100, 0.002), 
        new OrbitalCircle('visuals/center.png', 500, 0.0012, Math.PI / 4), 
        new OrbitalCircle('visuals/circle.png', 800, 0.0008, Math.PI / 2), 
        new OrbitalCircle('visuals/other-circle.png', 1200, 0.0004, Math.PI),
        new OrbitalCircle('visuals/circle-lol.png', 1600, 0.0002, Math.PI * 1.5) 
    ];

    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    function animate() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        // Dark background
        bgCtx.fillStyle = 'rgba(255, 255, 255, 0)';
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        // Update and draw circles
        orbitalCircles.forEach(circle => {
            circle.update();
            circle.draw(bgCtx);
        });
        
        requestAnimationFrame(animate);
    }

    // Start animation
    animate();
})();