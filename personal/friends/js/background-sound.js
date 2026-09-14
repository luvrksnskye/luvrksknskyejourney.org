document.addEventListener("DOMContentLoaded", function () {
  const audioElement = document.getElementById("background-sound");
  
  if (audioElement) {
    audioElement.loop = true;
    audioElement.autoplay = true;

    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const enableSound = () => {
          audioElement.play().catch((error) => {
            console.error("Audio playback failed:", error);
          });
          document.removeEventListener("click", enableSound);
          document.removeEventListener("touchstart", enableSound);
        };

        document.addEventListener("click", enableSound);
        document.addEventListener("touchstart", enableSound);
      });
    }
  }
});
