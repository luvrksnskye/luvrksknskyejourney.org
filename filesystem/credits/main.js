var canvas = document.getElementById("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        function rand(min, max) {
            return min + Math.random() * (max - min);
        }

        function Layer() {
            this.incrementY = -(Math.random() * (0.8 - 0.2) + 0.2).toFixed(2);
            this.radius = Math.floor(Math.random() * 3) + 1;
            this.lifetime = Math.random() * 5000 + 3000; // Random lifetime between 3-8 seconds
            this.born = Date.now();
        }

        function Star() {
            this.init();
            this.y = Math.floor(Math.random() * canvas.height);
        }

        Star.prototype.init = function() {
            this.layer = new Layer();
            this.y = canvas.height + this.layer.radius;
            this.x = Math.floor(Math.random() * canvas.width);
            this.opacity = 1;
        };

        Star.prototype.draw = function(context) {
            // Calculate age and fade out
            let age = Date.now() - this.layer.born;
            let lifePercentage = age / this.layer.lifetime;
            
            // Fade out as the star ages
            if (lifePercentage > 0.7) {
                this.opacity = Math.max(0, 1 - ((lifePercentage - 0.7) / 0.3));
            }

            context.beginPath();
            
            var radgrad = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.layer.radius * 2);
            radgrad.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
            radgrad.addColorStop(0.4, `rgba(255, 255, 255, ${this.opacity * 0.8})`);
            radgrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            context.fillStyle = radgrad;
            context.arc(this.x, this.y, this.layer.radius * 2, 0, 2 * Math.PI, false);
            context.fill();
        };

        Star.prototype.isDead = function() {
            return Date.now() - this.layer.born > this.layer.lifetime || this.y + this.layer.radius < 0;
        };

        function animate(context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw stars, remove dead ones
            for (let i = stars.length - 1; i >= 0; i--) {
                let star = stars[i];
                
                if (star.isDead()) {
                    // Remove dead star and create a new one
                    stars.splice(i, 1);
                    stars.push(new Star());
                } else {
                    star.y = (star.y + star.layer.incrementY);
                    star.draw(context);
                }
            }

            requestAnimationFrame(function() {
                animate(context);
            });
        }

        if (canvas.getContext) {
            var context = canvas.getContext('2d');
            context.globalCompositeOperation = 'screen';

            var stars = [];
            var i = 0;
            while (i++ < 100) {
                stars.push(new Star());
            }

            window.onload = function() {
                animate(context);
            };
        }

        window.addEventListener('resize', function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }, false);