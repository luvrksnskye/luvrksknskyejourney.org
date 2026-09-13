(function() {

    const bgCanvas = document.createElement('canvas');
    bgCanvas.id = 'orbital-bg-canvas';
    document.body.prepend(bgCanvas); 
    const bgCtx = bgCanvas.getContext('2d');

    Object.assign(bgCanvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        'z-index': '-1',
        'pointer-events': 'none'
    });

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

            this.scale = 0;
            this.delay = Math.random() * 2000;
            this.animationStarted = false;
            this.animationProgress = 0;

            this.img = new Image();
            this.img.onload = () => {
                this.isLoaded = true;
            };
            this.img.onerror = () => {
                this.createFallbackCircle();
                this.useFallback = true;
                this.isLoaded = true;
            };

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

            if (!this.isLoaded) return;

            ctx.save();
            ctx.globalAlpha = 0.6; 
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

    const orbitalCircles = [
        new OrbitalCircle('visuals/middle.png', 100, 0.002), 
        new OrbitalCircle('visuals/center.png', 500, 0.0012, Math.PI / 4), 
        new OrbitalCircle('visuals/circle.png', 800, 0.0008, Math.PI / 2), 
        new OrbitalCircle('visuals/other-circle.png', 1200, 0.0004, Math.PI),
        new OrbitalCircle('visuals/circle-lol.png', 1600, 0.0002, Math.PI * 1.5) 
    ];

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function animate() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

        bgCtx.fillStyle = 'rgba(255, 255, 255, 0)';
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        orbitalCircles.forEach(circle => {
            circle.update();
            circle.draw(bgCtx);
        });

        requestAnimationFrame(animate);
    }

    animate();
})();