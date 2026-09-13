

const starsContainer = document.querySelector('.stars');
      const starCount = 300; 

      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.animationDelay = Math.random() * 10 + 's';
        star.style.animationDuration = 5 + Math.random() * 5 + 's';
        starsContainer.appendChild(star);
      }

      var b = document.body;
      var imgurl = "../../assets/mouse/cursor.ico";
      var size = [10, 20];
      function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
      }
      function getSize() {
        return rand(size[0], size[1]);
      }
      function lerp(a,b,f) {
        return (b-a)*f+a;
      }
      function heart(x,y) {
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
      function bro(x,y) {
        for (var i = 0; i < 5; i++) {
          heart(x,y);
        }
      }
      b.addEventListener("click", function(event){
        var x = event.clientX;
        var y = event.clientY;
        bro(x,y);
      });

window.addEventListener('load', function() {
    setTimeout(function() {

      const skyeWorkstation = document.querySelector('.skye-workstation');
      if (skyeWorkstation) skyeWorkstation.classList.add('active');
    }, 1000);

    setTimeout(function() {

      const descriptionParagraph = document.querySelector('.description-paragraph');
      if (descriptionParagraph) descriptionParagraph.classList.add('active');
    }, 1500);

    setTimeout(function() {

      const textWrapper = document.querySelector('.text-wrapper');
      if (textWrapper) textWrapper.classList.add('active');
    }, 2000);

    setTimeout(function() {

      const decorativeDiv = document.querySelector('.box .div');
      const rectangle4 = document.querySelector('.rectangle-4');
      if (decorativeDiv) decorativeDiv.classList.add('active');
      if (rectangle4) rectangle4.classList.add('active');
    }, 3000);
  });
