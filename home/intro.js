// Create an audio element
const navSound = new Audio();
navSound.src = '../assets/sound-effects/sound effect.mp3'; 
navSound.preload = 'auto';

// Get all navigation links
const navLinks = document.querySelectorAll('#nav a');

// Add click event listener to each link
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        // Play the sound
        // We clone the audio to allow multiple rapid clicks :)
        const soundClone = navSound.cloneNode();
        soundClone.play()
            .catch(error => {
                // Handle any autoplay restrictions or audio loading errors
                console.log('Error playing sound:', error);
            });
        
        // Delay the navigation slightly to ensure the sound plays
        if (this.href) {
             e.preventDefault();
             setTimeout(() => {
                 window.location.href = this.href;
             }, 100);
         }
    });
});

// hover sound effect
 const hoverSound = new Audio('../assets/sound-effects/sound effect.mp3');
 navLinks.forEach(link => {
     link.addEventListener('mouseenter', () => {
         const hoverSoundClone = hoverSound.cloneNode();
         hoverSoundClone.play()
            .catch(error => console.log('Error playing hover sound:', error));
    });
 });