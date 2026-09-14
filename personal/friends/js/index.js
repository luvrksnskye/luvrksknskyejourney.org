

function updateClock() {
const clockElement = document.getElementById('digital-clock');
const now = new Date();
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateClock, 1000);
updateClock();

document.addEventListener("DOMContentLoaded", () => {

    const observer = new MutationObserver((mutationsList, observer) => {
        const imageElement = document.querySelector('img[src="assets/images/friends-items/pien.png"]');
        if (imageElement) {
            
            imageElement.addEventListener("click", () => {

                const soundEffect = new Audio("/assets/audio/sfx/pien.mp3");

  
                soundEffect.play().catch(error => console.error("Error playing sound:", error));
            });

            observer.disconnect();
        }
    });


    observer.observe(document.body, { childList: true, subtree: true });
});
