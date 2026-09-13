var loader = document.getElementById("preloader");

window.addEventListener("load", function () {
  setTimeout(function () {
    loader.style.display = "none";
  }, 5000);
});

var s = loader.style;
s.opacity = 1;
setTimeout(function fade() {
  (s.opacity -= 0.1) < 0 ? (s.display = "none") : setTimeout(fade, 80);
}, 5000);
