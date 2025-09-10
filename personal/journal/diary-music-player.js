$(function () {
    var playerTrack = $("#player-track");
    var bgArtwork = $("#bg-artwork");
    var bgArtworkUrl;
    var albumName = $("#album-name");
    var trackName = $("#track-name");
    var albumArt = $("#album-art");
    var sArea = $("#s-area");
    var seekBar = $("#seek-bar");
    var trackTime = $("#track-time");
    var insTime = $("#ins-time");
    var sHover = $("#s-hover");
    var playPauseButton = $("#play-pause-button");
    var i = playPauseButton.find("i");
    var tProgress = $("#current-time");
    var tTime = $("#track-length");
    var seekT, seekLoc, seekBarPos, cM, ctMinutes, ctSeconds, curMinutes, curSeconds, durMinutes, durSeconds, playProgress, bTime, nTime = 0;
    var buffInterval = null;
    var tFlag = false;

    var albums = [
        "Lacebark pine",
        "Drifter",
        "Resonance",
        "Memory reboot",
        "Offline",
        "River's end",
        "See, i'm sorry",
        "Snowfall",
        "GOTH",
        "Clouds",
        "Afte dark",
        "The ghost",
        "Minecraft",
        "Key",
        "Mine on venus",
        "Subwoofer lullaby"
    ];

    var trackNames = [
        "Whitepine OST",
        "Hallow",
        "HOME",
        "VØJ",
        "L0WS",
        "Thenian",
        "Nectry",
        "Øneheart",
        "Sidewalks and skeletons",
        "PASTEL GOTH",
        "Mr.Kitty",
        "Trevor something",
        "C418",
        "C418",
        "C418",
        "C418"
    ];

    var trackUrl = [
        "diary-music-player/diary-songs/lacebark pine.mp3",
        "diary-music-player/diary-songs/drifter.mp3",
        "diary-music-player/diary-songs/HOME resonance.mp3",
        "diary-music-player/diary-songs/memory reboot.mp3",
        "diary-music-player/diary-songs/offline.mp3",
        "diary-music-player/diary-songs/rivers end.mp3",
        "diary-music-player/diary-songs/see i'm sorry.mp3",
        "diary-music-player/diary-songs/snowfall.mp3",
        "diary-music-player/diary-songs/GOTH.mp3",
        "diary-music-player/diary-songs/clouds.mp3",
        "diary-music-player/diary-songs/after-dark.mp3",
        "diary-music-player/diary-songs/the-ghost.mp3",
        "diary-music-player/diary-songs/Minecraft.mp3",
        "diary-music-player/diary-songs/Key.mp3",
        "diary-music-player/diary-songs/Mice-on-venus.mp3",
        "diary-music-player/diary-songs/Subwoofer-lullaby.mp3"

    ];

    var albumArtworks = ["_1", "_2", "_3", "_4", "_5", "_6", "_7", "_8", "_9", "_10", "_11", "_12", "_13", "_14", "_15", "_16"];

    var currIndex = -1;
    var audio = new Audio();
    var isAutoplay = true; 
    var isPlaylistLoop = true;  

    function playPause() {
        setTimeout(function () {
            if (audio.paused) {
                playerTrack.addClass("active");
                albumArt.addClass("active");
                checkBuffering();
                i.attr("class", "fas fa-pause");
                audio.play();
            } else {
                playerTrack.removeClass("active");
                albumArt.removeClass("active");
                clearInterval(buffInterval);
                albumArt.removeClass("buffering");
                i.attr("class", "fas fa-play");
                audio.pause();
            }
        }, 300);
    }

    function showHover(event) {
        seekBarPos = sArea.offset();
        seekT = event.clientX - seekBarPos.left;
        seekLoc = audio.duration * (seekT / sArea.outerWidth());

        sHover.width(seekT);

        cM = seekLoc / 60;

        ctMinutes = Math.floor(cM);
        ctSeconds = Math.floor(seekLoc - ctMinutes * 60);

        if (ctMinutes < 0 || ctSeconds < 0) return;

        if (ctMinutes < 10) ctMinutes = "0" + ctMinutes;
        if (ctSeconds < 10) ctSeconds = "0" + ctSeconds;

        if (isNaN(ctMinutes) || isNaN(ctSeconds)) insTime.text("--:--");
        else insTime.text(ctMinutes + ":" + ctSeconds);

        insTime.css({ left: seekT, "margin-left": "-21px" }).fadeIn(0);
    }

    function hideHover() {
        sHover.width(0);
        insTime.text("00:00").css({ left: "0px", "margin-left": "0px" }).fadeOut(0);
    }

    function playFromClickedPos() {
        audio.currentTime = seekLoc;
        seekBar.width(seekT);
        hideHover();
    }

    function updateCurrTime() {
        nTime = new Date();
        nTime = nTime.getTime();

        if (!tFlag) {
            tFlag = true;
            trackTime.addClass("active");
        }

        curMinutes = Math.floor(audio.currentTime / 60);
        curSeconds = Math.floor(audio.currentTime - curMinutes * 60);

        durMinutes = Math.floor(audio.duration / 60);
        durSeconds = Math.floor(audio.duration - durMinutes * 60);

        playProgress = (audio.currentTime / audio.duration) * 100;

        if (curMinutes < 10) curMinutes = "0" + curMinutes;
        if (curSeconds < 10) curSeconds = "0" + curSeconds;

        if (durMinutes < 10) durMinutes = "0" + durMinutes;
        if (durSeconds < 10) durSeconds = "0" + durSeconds;

        if (isNaN(curMinutes) || isNaN(curSeconds)) tProgress.text("00:00");
        else tProgress.text(curMinutes + ":" + curSeconds);

        if (isNaN(durMinutes) || isNaN(durSeconds)) tTime.text("00:00");
        else tTime.text(durMinutes + ":" + durSeconds);

        if (isNaN(curMinutes) || isNaN(curSeconds) || isNaN(durMinutes) || isNaN(durSeconds))
            trackTime.removeClass("active");
        else trackTime.addClass("active");

        seekBar.width(playProgress + "%");

        if (playProgress == 100) {
            i.attr("class", "fas fa-play");
            seekBar.width(0);
            tProgress.text("00:00");
            albumArt.removeClass("buffering").removeClass("active");
            clearInterval(buffInterval);
            
           
            if (currIndex < albums.length - 1) {
                selectTrack(1); 
            } else if (isPlaylistLoop) {
                currIndex = -1; 
                selectTrack(1); 
            }
        }
    }

    function checkBuffering() {
        clearInterval(buffInterval);
        buffInterval = setInterval(function () {
            if ((nTime == 0) || (bTime - nTime) > 1000) {
                albumArt.addClass("buffering");
            } else {
                albumArt.removeClass("buffering");
            }

            bTime = new Date();
            bTime = bTime.getTime();
        }, 100);
    }

    function selectTrack(flag) {
        if (flag == 0 || flag == 1) {
            ++currIndex;
        } else {
            --currIndex;
        }

        if (currIndex > -1 && currIndex < albums.length) {
            if (flag == 0) {
                i.attr("class", "fas fa-play");
            } else {
                albumArt.removeClass("buffering");
                i.attr("class", "fas fa-pause");
            }

            seekBar.width(0);
            trackTime.removeClass("active");
            tProgress.text("00:00");
            tTime.text("00:00");

            currAlbum = albums[currIndex];
            currTrackName = trackNames[currIndex];
            currArtwork = albumArtworks[currIndex];

            audio.src = trackUrl[currIndex];

            nTime = 0;
            bTime = new Date();
            bTime = bTime.getTime();

            if (flag != 0 || isAutoplay) {
                audio.play();
                playerTrack.addClass("active");
                albumArt.addClass("active");

                clearInterval(buffInterval);
                checkBuffering();
            }

            albumName.text(currAlbum);
            trackName.text(currTrackName);
            
            albumArt.find("img.active").removeClass("active");
            $("#" + currArtwork).addClass("active");

            bgArtworkUrl = $("#" + currArtwork).attr("src");
            bgArtwork.css({ "background-image": "url(" + bgArtworkUrl + ")" });
        } else {
            if (flag == 0 || flag == 1) {
                --currIndex;
            } else {
                ++currIndex;
            }
        }
    }

    function initPlayer() {
        audio = new Audio();
        selectTrack(0);

        // Set up autoplay
        audio.autoplay = isAutoplay;

        playPauseButton.on("click", playPause);

        sArea.mousemove(function (event) {
            showHover(event);
        });

        sArea.mouseout(hideHover);

        sArea.on("click", playFromClickedPos);

        $(audio).on("timeupdate", updateCurrTime);

        $("#play-previous").on("click", function () {
            selectTrack(-1);
        });
        $("#play-next").on("click", function () {
            selectTrack(1);
        });
    }

    initPlayer();
});