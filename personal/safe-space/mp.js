let track_name = document.querySelector(".songtitle .marquee-content");
let track_index = 0;
let curr_track = document.getElementById("music");

curr_track.volume = 0.2; 

let track_list = [
   {
      name:"Animal Crossing New Horizons OST, 2 AM",
      path:"music/2-am.mp3"
   },
   {
      name:"Animal Crossing New Horizons OST, 12 AM",
      path:"music/12-am.mp3"
   },
   {
      name:"Animal Crossing New Horizons OST, Festivale", 
      path:"music/fireworks-show-acnh.mp3"
   }
];

function loadTrack(track_index) {
    curr_track.src = track_list[track_index].path;
    curr_track.load();
    
    curr_track.volume = 0.4; 
    
    track_name.textContent = "♪ playing: " + track_list[track_index].name + " ♪";
    
    curr_track.play().catch(error => {
        console.log("Auto-play prevented:", error);
        document.addEventListener('click', () => {
            curr_track.play();
        }, { once: true });
    });
}

function nextTrack() {
    if (track_index < track_list.length - 1) {
        track_index += 1;
    } else {
        track_index = 0;
    }
    loadTrack(track_index);
}

curr_track.addEventListener("ended", nextTrack);

window.addEventListener('load', () => {
    loadTrack(track_index);
});

document.addEventListener('click', () => {
    if (curr_track.paused) {
        curr_track.play();
    }
}, { once: true });