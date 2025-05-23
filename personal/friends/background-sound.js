document.addEventListener("DOMContentLoaded", function () {
  const audioElement = document.getElementById("background-sound");
  
  if (audioElement) {
    // Ensure looping is enabled
    audioElement.loop = true;
    audioElement.autoplay = true;

    // Try to play the audio
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay failed; wait for user interaction
        const enableSound = () => {
          audioElement.play().catch((error) => {
            console.error("Audio playback failed:", error);
          });
          // event listeners after interaction
          document.removeEventListener("click", enableSound);
          document.removeEventListener("touchstart", enableSound);
        };

        // listeners for user interaction
        document.addEventListener("click", enableSound);
        document.addEventListener("touchstart", enableSound);
      });
    }
  }
});
