var loader = document.getElementById("preloader");

window.addEventListener("load", function () {
  setTimeout(function () {
    loader.style.display = "none";
  }, 5000); // 5 seconds delay
});

// Optional Fade Out
var s = loader.style;
s.opacity = 1;
setTimeout(function fade() {
  (s.opacity -= 0.1) < 0 ? (s.display = "none") : setTimeout(fade, 80);
}, 5000); // Start fading after 5 seconds
