let track_name = document.querySelector(".songtitle .marquee-content");
let track_index = 0;
let curr_track = document.getElementById("music");

curr_track.volume = 0.1; 

let track_list = [
   {
      name:"내 영혼의 따뜻한 수프 (Tomato Soup) by Oneul",
      path:"assets/audio/music/oneul-tomato-soup.mp3"
   },
   {
      name:"작업공간, 귀여운 룸메이트 (Roommate) by Oneul",
      path:"assets/audio/music/oneul-roommate.mp3"
   },
   {
      name:"좋은 일이 생길거야✨ (Good Things) by Oneul",
      path:"assets/audio/music/oneul-good-things.mp3"
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