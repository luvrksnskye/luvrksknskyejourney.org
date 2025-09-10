// Initialize variables
let track_name = document.querySelector(".songtitle .marquee-content");
let track_index = 0;
let curr_track = document.getElementById("music");

// Set volume (0.0 to 1.0, where 0.2 = 20%, 0.4 = 40%)
curr_track.volume = 0.1; 

let track_list = [
   {
      name:"내 영혼의 따뜻한 수프 (Tomato Soup) by Oneul",
      path:"music/Oneul - Tomato Soup.mp3"
   },
   {
      name:"작업공간, 귀여운 룸메이트 (Roommate) by Oneul",
      path:"music/Oneul - Roommate.mp3"
   },
   {
      name:"좋은 일이 생길거야✨ (Good Things) by Oneul",
      path:"music/Oneul - Good Things.mp3"
   }
];

function loadTrack(track_index) {
    // load a new track
    curr_track.src = track_list[track_index].path;
    curr_track.load();
    
    // Ensure volume is set after loading
    curr_track.volume = 0.4; 
    
    // update details of the track
    track_name.textContent = "♪ playing: " + track_list[track_index].name + " ♪";
    
    // auto play the track
    curr_track.play().catch(error => {
        console.log("Auto-play prevented:", error);
        // Create a click handler for first user interaction
        document.addEventListener('click', () => {
            curr_track.play();
        }, { once: true });
    });
}

// moves to the next track when current one ends
function nextTrack() {
    if (track_index < track_list.length - 1) {
        track_index += 1;
    } else {
        track_index = 0; // loop back to first song
    }
    loadTrack(track_index);
}

// Event listeners
curr_track.addEventListener("ended", nextTrack);

// Auto-start when page loads
window.addEventListener('load', () => {
    loadTrack(track_index);
});

// Handle user interaction for autoplay
document.addEventListener('click', () => {
    if (curr_track.paused) {
        curr_track.play();
    }
}, { once: true });