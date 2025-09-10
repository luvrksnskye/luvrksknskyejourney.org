// Music Player Script
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const titleBar = document.querySelector('.title-bar');
const discContainer = document.querySelector('.disc');
const discImg = document.querySelector('.disc img');
const arm = document.querySelector('.arm');
const genrePanels = document.querySelectorAll('.panel');

const audio = new Audio();
audio.volume = 0.7;

let youtubePlayer;
let youtubePlayerReady = false;

let isPlaying = false;
let currentTrackIndex = 0;
let currentPlaylist = [];
let currentGenre = 'default';
let likedMedia = JSON.parse(localStorage.getItem('likedMedia')) || {};
let currentPlaybackMethod = 'youtube'; 
let isYouTubePlaylist = false;


function loadConfettiScript() {
  if (!document.querySelector('script[src*="confetti.browser.min.js"]')) {
    const confettiScript = document.createElement('script');
    confettiScript.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js";
    document.head.appendChild(confettiScript);
  }
}


function fireConfetti() {
  if (typeof confetti !== 'undefined') {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      

      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.5, 0.7) },
        colors: ['#ff64b1', '#ff5e97', '#ff477f', '#ff84c4'],
      }));
      
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.5, 0.7) },
        colors: ['#64c8ff', '#72c7ff', '#43b5ff', '#a1dfff'],
      }));

    }, 250);
  }
}

const playlists = {
  default: [
      {
        title:"Skye's fav",
        artist:"",
        youtubeId: 'PLbpytgpi11WqIktKzJFpBVsa7rnHTgwWb',
        isPlaylist: true
      }
  ],
  rock: [
    {
      title: "Rock Collection",
      artist: "Various Artists",
      youtubeId: "PLbpytgpi11Wo86rIGZWepLKnuM3VgzlRa",
      isPlaylist: true
    }
  ],
  pop: [
    {
      title: "Pop Hits Collection",
      artist: "Various Artists",
      youtubeId: "PLbpytgpi11WqRt4gPMELxfKVROpq-1USK",
      isPlaylist: true
    }
  ],
  soundtracks: [
    {
      title: "Soundtracks Collection",
      artist: "Various Game Composers",
      youtubeId: "PLbpytgpi11WpZcdDUdEMHD_W7hN9lJoSw",
      isPlaylist: true
    }
  ],
  classical: [
    {
      title: "Classical Masterpieces",
      artist: "Various Composers",
      cover: "../music-assets/classical.jpg",
      youtubeId: "PLbpytgpi11WoXMLQpiFYdVN_NlQd2FXBP",
      isPlaylist: true
    }
  ]
};

function loadYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player('youtube-player', {
    height: '0',
    width: '0',
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1,
      'rel': 0,
      'loop': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  youtubePlayerReady = true;
  
  if (currentPlaylist.length > 0) {
    const firstTrack = currentPlaylist[0];
    if (firstTrack.isPlaylist && firstTrack.youtubeId) {
      loadYouTubePlaylist(firstTrack.youtubeId, firstTrack.title, firstTrack.artist || '');
    } else {
      loadTrack(currentTrackIndex);
      if (isPlaying) playAudio();
    }
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED && !isYouTubePlaylist) {
    playNext();
  }
  
  if (event.data === YT.PlayerState.ENDED && isYouTubePlaylist) {
    const currentIndex = youtubePlayer.getPlaylistIndex();
    const playlistLength = youtubePlayer.getPlaylist().length;
    
    if (currentIndex === playlistLength - 1) {
      youtubePlayer.playVideoAt(0);
    }
  }
  
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    updatePlayButton();
    startDiscAnimation();
  } else if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    updatePlayButton();
    pauseDiscAnimation();
  }
}

function initPlayer() {
  loadYouTubeAPI();
  loadConfettiScript();
  
  if (!document.getElementById('youtube-player')) {
    const youtubeContainer = document.createElement('div');
    youtubeContainer.id = 'youtube-player';
    youtubeContainer.style.display = 'none';
    document.body.appendChild(youtubeContainer);
  }
  
  currentPlaylist = playlists.default;
  currentPlaybackMethod = 'youtube';
  
  loadTrack(0);
  playAudio();
  
  genrePanels.forEach((panel) => {
    panel.addEventListener('click', () => {
      const genreName = panel.querySelector('.panel-name').textContent.toLowerCase();
      
      if (playlists[genreName]) {
        if (currentPlaybackMethod === 'audio') {
          audio.pause();
        } else if (currentPlaybackMethod === 'youtube' && youtubePlayerReady) {
          youtubePlayer.stopVideo();
        }
        
        currentPlaylist = playlists[genreName];
        currentGenre = genreName;
        currentTrackIndex = 0;
        
        currentPlaybackMethod = 'youtube';
        
        isYouTubePlaylist = false;
        
        loadTrack(currentTrackIndex);
        playAudio();
      }
    });
  });

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrev);
  nextBtn.addEventListener('click', playNext);
  
  audio.addEventListener('ended', playNext);
  
  initAlbumsAndSongs();
  
  updateStyles();
}


function loadTrack(index) {
  if (currentPlaylist.length === 0) return;
  
  const track = currentPlaylist[index];
  
  if (currentPlaybackMethod === 'audio') {
    audio.src = track.path;
    titleBar.textContent = `Now Playing: ${track.title} - ${track.artist || 'Unknown Artist'}`;
  } else if (currentPlaybackMethod === 'youtube') {
    if (track.isPlaylist && track.youtubeId) {
      loadYouTubePlaylist(track.youtubeId, track.title, track.artist);
    } else if (youtubePlayerReady && track.youtubeId) {
      isYouTubePlaylist = false;
      youtubePlayer.loadVideoById(track.youtubeId);
      titleBar.textContent = `Now Playing: ${track.title} - ${track.artist || 'Unknown Artist'}`;
    } else {
      titleBar.textContent = `Loading: ${track.title} - ${track.artist || 'Unknown Artist'}`;
    }
  }
}

function loadYouTubePlaylist(playlistId, title, artist) {
  if (youtubePlayerReady) {
    isYouTubePlaylist = true;
    
    youtubePlayer.loadPlaylist({
      list: playlistId,
      listType: 'playlist',
      index: 0,
      startSeconds: 0
    });
    
    titleBar.textContent = `Now Playing Playlist: ${title} - ${artist || 'Various Artists'}`;
    
    currentPlaybackMethod = 'youtube';
    
    isPlaying = true;
    updatePlayButton();
    startDiscAnimation();
  }
}

function playAudio() {
  if (currentPlaybackMethod === 'audio') {
    audio.play().then(() => {
      isPlaying = true;
      updatePlayButton();
      startDiscAnimation();
    }).catch(error => {
      console.error('Error playing audio:', error);
    });
  } else if (currentPlaybackMethod === 'youtube') {
    if (youtubePlayerReady) {
      youtubePlayer.playVideo();
      isPlaying = true;
      updatePlayButton();
      startDiscAnimation();
    }
  }
}

function startDiscAnimation() {
  arm.style.transform = 'rotate(35deg)';
  
  discContainer.style.animationPlayState = 'running';
  
  discContainer.classList.add('active');
  discContainer.classList.remove('paused');
}

function pauseDiscAnimation() {
  arm.style.transform = 'rotate(15deg)';
  
  discContainer.style.animationPlayState = 'paused';
  
  discContainer.classList.remove('active');
  discContainer.classList.add('paused');
}

function pauseAudio() {
  if (currentPlaybackMethod === 'audio') {
    audio.pause();
    isPlaying = false;
    updatePlayButton();
    pauseDiscAnimation();
  } else if (currentPlaybackMethod === 'youtube') {
    if (youtubePlayerReady) {
      youtubePlayer.pauseVideo();
      isPlaying = false;
      updatePlayButton();
      pauseDiscAnimation();
    }
  }
}

function togglePlay() {
  if (isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function playPrev() {
  if (isYouTubePlaylist && youtubePlayerReady) {
    youtubePlayer.previousVideo();
    return;
  }
  
  currentTrackIndex--;
  if (currentTrackIndex < 0) {
    currentTrackIndex = currentPlaylist.length - 1;
  }
  
  loadTrack(currentTrackIndex);
  
  if (isPlaying) playAudio();
}

function playNext() {
  if (isYouTubePlaylist && youtubePlayerReady) {
    youtubePlayer.nextVideo();
    return;
  }
  
  currentTrackIndex++;
  if (currentTrackIndex >= currentPlaylist.length) {
    currentTrackIndex = 0;
  }
  
  loadTrack(currentTrackIndex);
  
  if (isPlaying) playAudio();
}

function updatePlayButton() {
  if (isPlaying) {
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
}

function initAlbumsAndSongs() {
  const albums = [
    {
      id: 'album1',
      title: 'Minecraft: volume alpha',
      artist: 'C418',
      cover: '../music-assets/minecraftvolalpha.jpg',
      description: 'The iconic soundtrack for Minecraft. I feel so old when I think about this, but I started playing Minecraft when I was 10 lol. I love everything about Minecraft and it will always be one of my favorite games for both its gameplay and soundtrack. Minecraft Volume Alpha holds so many beautiful memories for me, when I used to play this with my best friend in the afternoons after school and when I would spend entire nights having fun building in the game on my Xbox 360. I love this!',
      releaseDate: 'March 4, 2011',
      genre: 'Soundtrack',
      duration: '58:50',
      youtubeId: 'PLHykAyQQdTart3T8wrDjEnAFEmbVstInA',
      isPlaylist: true
    },
    {
      id: 'album2',
      title: 'Subnautica Below Zero',
      artist: 'Ben Prunty',
      cover: '../music-assets/subnautica.jpg',
      description: 'The atmospheric soundtrack for Subnautica: Below Zero, an underwater adventure game set on an alien planet. Another wonderful album about the ocean, what can I say? I love the entire soundtrack album for Subnautica and Subnautica Below Zero, but this latest one holds a special place in my heart. I also love all jukebox songs from the game! Subnautica Below Zero challenged me to further overcome my fear, and as I played this game, I realized how beautiful it was. At first, I was afraid of going out at night at sea, but I lost my fear and started enjoying it more than I expected. My favorite songs on this album are Below Zero, Lily Pads, and A Thousand Strings. If you haven\'t heard Ben Prunty\'s music, I highly recommend you do! His range includes science fiction, horror, survival, adventure, strategy, fantasy, and comedy.',
      releaseDate: 'May 4, 2021',
      genre: 'Soundtrack',
      duration: '2 hr',
      youtubeId: 'PLDisKgcnAC4Te0v8NH5Ddy-tcBKBtryhR',
      isPlaylist: true
    },
    {
      id: 'album3',
      title: 'Honkai Star Rail - Out of Control',
      artist: 'HOYO-MiX',
      cover: '../music-assets/HSR.jpeg',
      description: 'The soundtrack for Honkai: Star Rail, a space fantasy RPG with turn-based combat. I adore and love the music of Honkai Star Rail! I started playing this game during the Jarilo-VI arc. Since then, I\'ve fallen in love with its theme and everything it has to offer. Anyway, I don\'t think that\'s a mystery, huh? My entire website has a theme based on that game, lol. My favorite song on this album is "fReeStyLE" and "Call of the Stars"',
      releaseDate: 'March 24, 2023',
      genre: 'Soundtrack',
      duration: '25:12',
      youtubeId: 'PLBO2h-GzDvIZba2z0gPlRj0xP9_6sI4lG',
      isPlaylist: true
    },
    {
      id: 'album4',
      title: 'The Deepsea Oddities',
      artist: 'Jim Gifford (Captain Spitvalve)',
      cover: '../music-assets/deep-sea.jpeg',
      description: 'An album featuring ambient sounds that evoke the mysterious atmosphere of the deep sea! I discovered the Deep Sea Oddities channel when I was 15, and I was still afraid of the ocean. I was always terrified of the ocean, and generally of large, deep pools as well! But little by little, I conquered my fear and fell in love with the ocean, to the point where I watched the channel\'s videos every day and started listening to their entire album, discovering that it brought me a lot of peace. I finally overcame my fear of the ocean when I turned 18, when I went to Florida and started going to beaches and even deep waters. To this day, I love the ocean and its creatures. I discovered this channel through one of their videos about the Magnapinna Squid! If you\'re interested in learning more about this creature, I recommend reading NOAA\'s articles on marine exploration',
      releaseDate: 'August 5, 2020',
      genre: 'Sea Ambient / Soundtrack',
      duration: '43:28',
      youtubeId: 'OLAK5uy_me61-J9b-gCQsA7lzHTR9j6su9nQILLac',
      isPlaylist: true
    },
    {
      id: 'album5',
      title: 'Splatune 2',
      artist: 'KADOKAWA, enterbrain',
      cover: '../music-assets/Splatune2.jpg',
      description: 'Splatune 2 is the first original soundtrack for Splatoon 2, and serves as a sequel to the first Splatune. It features two discs with 82 tracks total of in-game music and sound effects. Also included are album cover art of the various bands featured in the game, lyrics to the music by Off the Hook and interviews with Wet Floor and Marina. The first production run also came with a Splatoon-themed guitar pick. It was released in Japan on 29 November 2017!!',
      releaseDate: 'November 29, 2017',
      genre: 'Soundtrack',
      duration: '2:14:44',
      youtubeId: '4BznvlNLJ-o',
      isPlaylist: false 
    },
    {
      id: 'album6',
      title: 'Splatoon Live in Makuhari',
      artist: 'KADOKAWA, enterbrain',
      cover: '../music-assets/LiveInMakuhariCover.jpg',
      description: 'Splatoon Live in Makuhari -シオカライブ- (Shiokalive, a portmanteau of "Squid Sisters" and "Live") is a live album by the Squid Sisters. It contains recordings of the performances from Niconico Tokaigi 2016 and Cho-ongakusai 2016. Additionally, it includes in-game music that was not released on Splatune and a demo version of City of Color. It also comes with the translations for the spoken dialogue between songs at the concerts and the lyrics to all the songs performed. It was released in Japan on 13 July 2016! I dont have the album here, but Im leaving you a nice album to play below of some of the songs from Squid Sisters and Off the Hook!',
      releaseDate: 'July 13, 2016',
      genre: 'Soundtrack',
      duration: 'N/A',
      youtubeId:'PLwQt24PP3Le7_h9MTtdhUBnC90GBc9uvX',
      isPlaylist: true
    },
    {
      id: 'album7',
      title: 'TRON: Legacy',
      artist: 'Daft Punk',
      cover: '../music-assets/TRON.jpeg',
      description: 'I love the movie TRON: Legacy, and what makes me love it so much is its soundtrack. I don\'t have much to say because words aren\'t enough; I feel like it\'s not enough to express how beautiful it is. I love the songs Daft Punk wrote back then for the movie; I feel like they give it a unique touch. My favorite songs from this complete collection are "The Grid", "Arena" and "End of the Line"!',
      releaseDate: '2010',
      genre: 'Soundtrack',
      duration: '1 hr',
      youtubeId: 'PLue_k3rjMkaAxEHRjNCdjL5XVJUsUU0Sx',
      isPlaylist: true
    },
    {
      id: 'album8',
      title: 'Minecraft: volume beta',
      artist: 'C418',
      cover: '../music-assets/Volume-Beta.jpeg',
      description: 'I hold so many memories of Volume Beta close to my heart. Its an album filled with emotions for me, mostly nostalgia and feelings I have stuck in the past. My favorite songs on this album? Alpha, Dead Voxel, and Blind Spots... Awe man, really when I listen to this I feel slightly sad but emotional. I love C418 music so much. I sometimes listen to it when I want to feel better, when I feel like Im just low on energy, or need some comfort. Minecraft is such a special game to me. It was the first game of my entire life.',
      releaseDate: 'November 9, 2013',
      genre: 'Soundtrack',
      duration: '2 hr',
      youtubeId: 'PLNG8gFz9vUpsLXnWdCEf0svaFEfbY-kHh', 
      isPlaylist: true 
    }
  ];
  

  const songs = [
    {
      id: 'song1',
      title: 'Danse Macabre',
      artist: 'Camille Saint-Saëns',
      cover: '../music-assets/danse-macabre.jpg',
      description: 'Camille Saint-Saëns was many things. Also a scholar and writer of wide-ranging interests and an equally wide-ranging traveler, he was a multifaceted musician who excelled as a keyboardist, composer, conductor, teacher, and editor. He lived to scorn the work of Debussy and Stravinsky (among others) and is often regarded as a conservative – if not reactionary – composer. But in the early and middle years of his career Saint-Saëns championed the most progressive wing of contemporary music (including Schumann, Wagner, and Liszt) and his own music was often highly original in form and orchestration. Danse macabre is a case in point. It is one of four tone poems Saint-Saëns composed in the 1870s. The text merges the legend of Death fiddling on Halloween as skeletons dance on their graves with the late Medieval tradition of the Dance of Death (danse macabre, Totentanz), in which all are equal, from king to peasant, and are led dancing to the grave!',
      releaseDate: '1874',
      genre: 'Musical Composition',
      duration: '7:10',
      youtubeId: 'YyknBTm_YyM' 
    },
    {
      id: 'song2',
      title: '1812 Overture',
      artist: 'Tchaikovsky',
      cover: '../music-assets/182-overture.jpg',
      description: 'I love this topic so much with all my soul. The 1812 Overture was written in 1880 to commemorate the Russian victory over Napoleon during his invasion of Russia. It was originally written as part of the festivities for the opening of the Cathedral of Christ the Saviour, also built to commemorate that victory. The Tsar would also have his 25th anniversary of coronation in the same year, and an All-Russia Expo was coming to Moscow, so that idea was that the piece could be used as a big part of the spectacle for these events. I spent hours trying to find the best version of this song, with the canons, because I consider it to be the best part without a doubt. Despite this, I highly recommend checking out the Harmony Haven Project version on Spotify!',
      releaseDate: '1880',
      genre: 'Symphonic Overture',
      duration: '15:08',
      youtubeId: 'VbxgYlcNxE8'
    },
    {
      id: 'song3',
      title: 'La Foule',
      artist: 'Edith Piaf',
      cover: '../music-assets/EDITH_PIAF.jpg',
      description: 'La Foule is one of the best known songs by French singer Edith Piaf. The song sounds typically French, but in fact its origin is in South America, in a Peruvian waltz. The original song is entitled "Que nadie sepa mi sufrir" and was composed in 1927 by Argentinian musician Angel Cabral. The song has a popular connotation, in the tradition of the Peruvian waltz. This style mixes the waltz of European origin with more typically Latin American rhythmic elements. Edith Piaf travelled to Argentina in the early 1950s, heard the song and decided to render it in French. The lyrics were completely rewritten by Michel Rivgauche, and the song was published in 1957 under the title La Foule and with enormous success!',
      releaseDate: '1957',
      genre: 'Chanson',
      duration: '2:57',
      youtubeId: 'o2Tz1yV48NQ' 
    },
    {
      id: 'song4',
      title: 'Lily pads',
      artist: 'Ben Prunty',
      cover: '../music-assets/subnautica.jpg',
      description: 'A serene piece from the Subnautica: Below Zero soundtrack, creating an underwater atmosphere. I love this one a lot',
      releaseDate: '2021-04-30',
      genre: 'Soundtrack',
      duration: '3:51',
      youtubeId: 'sG4drWQWYZQ'
    },
    {
      id: 'song5',
      title: 'My City',
      artist: 'Egzod and Anna Yvette',
      cover: '../music-assets/NCS.jpg',
      description: 'NCS is a British record label that releases royalty-free electronic dance music. Originally starting as a music promotion YouTube channel, it reached 1 million paid downloads in 2017. Ya\'ll need to check out their music, is so cool!!',
      releaseDate: '2018-02-10',
      genre: 'Electronic',
      duration: '2:46',
      youtubeId: 'ZpliS49gdxg'
    },
    {
      id: 'song6',
      title: 'Inkoming!, Blitz It!, Entropical (Live)',
      artist: 'Toru Minegishi, Ryo Nagamatsu',
      cover: '../music-assets/TentaLiveInMakuhariCover.jpg',
      description: 'MY FAVORITE!!! I love, love, love these songs. They\'re so energizing and beautiful, they fill me with happiness! You should definitely listen to them. Try to find a recording with Splattack! but I couldn\'t have it. Anyways is a song originally performed by Squid Squad, which has been rearranged by Dedf1sh and C-Side. Like most Squid Squad songs, Splattack! is a fusion of rock and electronic music, with an emphasis on the backing drums and prominent guitar riffs, but also features singing in the Inkling language by Ichiya. What appears to be the band shouting "Squid Squad!" can be heard throughout the song, such as at the five-second mark. ',
      releaseDate: '2019-07-24',
      genre: 'Soundtrack',
      duration: '5:32',
      youtubeId: 'P-zeVHhXxT0'
    },
    {
      id: 'song7',
      title: 'Anarchy Rainbow (Splatfest)',
      artist: 'Deep Cut',
      cover: '../music-assets/Band_Deep_Cut.jpg',
      description: 'Anarchy Rainbow is an energetic song drawing inspiration from Japanese odori and Brazilian samba music. The song starts with drum beats, followed by an instrumental intro. After the intro, Shiver sings the first verse of Anarchy Poisons (Bird Mix). This is followed by Big Man speaking with electronic notes playing. Frye then sings the second verse of Anarchy Poisons (Snake Mix), which is sung in a style resembling traditional Indian music!! I love this song so muchhh',
      releaseDate: '2022-08-10',
      genre: 'Soundtrack',
      duration: '1:32',
      youtubeId: 'sZ4vY_UmMIY'
    },
    {
      id: 'song8',
      title: 'The Seed',
      artist: 'Aurora',
      cover: '../music-assets/Aurora.jpg',
      description: '"The Seed" – a plea to save the earth, against a backdrop of gentle vocals, shots of nature, protests, and dancing that flows like water through a spring. Climate change has been a hot topic for a while, and for good reason. Like sitting in a bathtub that gets a few degrees hotter every hour, we lay blissfully unaware of how damaging it is until we stand and realise we\'ve been burnt. This was one of the best songs I\'ve heard from Aurora, and I\'m simply fascinated by it. It\'s beautiful and one of my favorites.',
      releaseDate: '2019',
      genre: 'Indie',
      duration: '4:26',
      youtubeId: '_Mc_OM5oNA8'
    },
    {
      id: 'song9',
      title: 'Warrior',
      artist: 'Aurora',
      cover: '../music-assets/AURORA.webp',
      description: '"I call myself a warrior even though I\'ve never held a sword or anything else that can hurt people physically, but people have fights in their lives, small and and big. And it\'s a nice thought, that people can walk around and call themselves warriors, which they should do, whether they\'re a fan of me or not. It\'s strong. It\'s important to remember that, how strong we are." -AURORA',
      releaseDate: '2016',
      genre: 'Indie',
      duration: '3:44',
      youtubeId: '4CmcnWQ-754'
    },
    {
      id: 'song10',
      title: 'Portal 2 OST Volume 1: Science is Fun',
      artist: 'Mike Morasky',
      cover: '../music-assets/PORTAL2.webp',
      description: 'I LOVE AND ADORE ALL THE PORTAL GAMES RAAAAAAWWWW. I first played this game back in 2012 when I was a kid, and I absolutely loved it. Portal and Portal 2 are my favorite games. And let\'s not even talk about their soundtracks! Mike Morasky has scored many games, including the Left 4 Dead series (another of my favorites), Portal 2, Counter-Strike: Global Offensive, Half-Life: Alyx, and Counter-Strike 2! He also worked on several of the visual effects for The Matrix film trilogies!',
      releaseDate: '2011',
      genre: 'Soundtrack',
      duration: '2:34',
      youtubeId: 'oAg4yjEmerU'
    },
    {
      id: 'song11',
      title: 'Phantom Liberty',
      artist: 'Dawid Podsiadło, P.T. Adamczyk',
      cover: '../music-assets/PHANTOM_LIBERTY.jpg',
      description: 'If you haven\'t heard this song, you should, and if you haven\'t played the Phantom Liberty DLC for Cyberpunk 2077, you should too, lol. Nothing to say! I love this song; it\'s one of my favorites, along with the Johnny Silverhand and Lizzy Wizzy songs.',
      releaseDate: '2023',
      genre: 'Soundtrack',
      duration: '5:48',
      youtubeId: 'u15tEo0wsQI'
    },
    {
      id: 'song12',
      title: 'Come Play (Arcane)',
      artist: 'Stray Kids, Young Miko, Tom Morello',
      cover: '../music-assets/ARCANE.jpg',
      description: 'I love this song so much omgggg',
      releaseDate: '2024',
      genre: 'Soundtrack',
      duration: '2:41',
      youtubeId: '3jf6xOg6e7Y'
    }
  ];
  
  createMediaSections(albums, songs);
  
  setupModal(albums, songs);
}

function createMediaSections(albums, songs) {
  const mainContainer = document.querySelector('.main-container');
  
  const albumsSection = document.createElement('div');
  albumsSection.innerHTML = `
    <div class="section-title">My Albums</div>
    <div class="albums-container">
      ${albums.map(album => `
        <div class="album-panel" data-id="${album.id}" data-type="album">
          <div class="album-cover">
            <img src="${album.cover}" alt="${album.title}">
            ${album.isPlaylist ? '<div class="playlist-badge"><i class="fas fa-list"></i> Playlist</div>' : ''}
          </div>
          <div class="album-info">
            <div class="album-name">${album.title}</div>
            <div class="album-artist">${album.artist}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  const songsSection = document.createElement('div');
  songsSection.innerHTML = `
    <div class="section-title">Favorite Songs</div>
    <div class="songs-container">
      ${songs.map(song => `
        <div class="song-panel" data-id="${song.id}" data-type="song">
          <div class="song-cover">
            <img src="${song.cover}" alt="${song.title}">
          </div>
          <div class="song-info">
            <div class="song-name">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  const modalElement = document.createElement('div');
  modalElement.id = 'detail-modal';
  modalElement.className = 'modal';
  modalElement.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <div class="modal-header">
        <img id="modal-cover" src="" alt="Cover">
        <div class="modal-title-container">
          <h2 id="modal-title"></h2>
          <p id="modal-artist"></p>
          <div id="modal-playlist-badge" class="modal-playlist-badge"><i class="fas fa-list"></i> YouTube Playlist</div>
        </div>
      </div>
      <div class="modal-body">
        <div id="modal-description"></div>
        <div class="modal-stats">
          <div class="stat-item">
            <span class="stat-label">Release Date:</span>
            <span id="modal-release-date"></span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Genre:</span>
            <span id="modal-genre"></span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Duration:</span>
            <span id="modal-duration"></span>
          </div>
        </div>
        <div id="youtube-embed-container" class="youtube-embed-container"></div>
      </div>
      <div class="modal-footer">
        <button id="modal-like-btn" class="like-btn">
          <i class="fas fa-heart"></i> I Like This
        </button>
        <button id="modal-play-btn" class="play-btn">
          <i class="fas fa-play"></i> Play Now
        </button>
      </div>
    </div>
  `;
  
  mainContainer.appendChild(albumsSection);
  mainContainer.appendChild(songsSection);
  
  document.body.appendChild(modalElement);
}


function updateStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .panel {
      background-color: rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(15px) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      box-shadow: 0 4px 12px rgba(114, 199, 255, 0.15) !important;
      transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1) !important;
    }
    
    .panel:hover {
      background-color: rgba(255, 255, 255, 0.25) !important;
      border: 1px solid rgba(114, 199, 255, 0.4) !important;
      box-shadow: 0 8px 20px rgba(114, 199, 255, 0.25) !important;
      transform: translateY(-5px) !important;
    }
    
    .panel-name {
      color: rgba(255, 255, 255, 0.9) !important;
      text-shadow: 0 0 5px rgba(114, 199, 255, 0.5) !important;
    }
    
    .section-title {
      font-size: 2rem;
      text-align: center;
      margin: 40px 0 20px;
      letter-spacing: 2px;
      text-transform: uppercase;
      position: relative;
      font-weight: 100;
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 0 10px rgba(114, 199, 255, 0.3);
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(114, 199, 255, 0.8), transparent);
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .albums-container, .songs-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .album-panel, .song-panel {
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      overflow: hidden;
      backdrop-filter: blur(15px);
      box-shadow: 0 5px 15px rgba(114, 199, 255, 0.15);
      transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transform: translateY(50px);
      opacity: 0;
      animation: fade-in 0.8s forwards;
    }
    
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fade-out {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(50px);
      }
    }
    
    .album-panel:nth-child(1), .song-panel:nth-child(1) { animation-delay: 0.1s; }
    .album-panel:nth-child(2), .song-panel:nth-child(2) { animation-delay: 0.2s; }
    .album-panel:nth-child(3), .song-panel:nth-child(3) { animation-delay: 0.3s; }
    .album-panel:nth-child(4), .song-panel:nth-child(4) { animation-delay: 0.4s; }
    
    .album-panel:hover, .song-panel:hover {
      transform: translateY(-5px) scale(1.03);
      background-color: rgba(255, 255, 255, 0.25);
      box-shadow: 0 10px 25px rgba(114, 199, 255, 0.25), 0 0 15px rgba(114, 199, 255, 0.5);
      border: 1px solid rgba(114, 199, 255, 0.3);
    }
    
    .album-cover, .song-cover {
      width: 100%;
      aspect-ratio: 1/1;
      overflow: hidden;
      position: relative;
    }
    
    .album-cover img, .song-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    
    .album-panel:hover .album-cover img, 
    .song-panel:hover .song-cover img {
      transform: scale(1.1);
    }
    
    .playlist-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(100, 200, 255, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 100;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      z-index: 1;
      backdrop-filter: blur(5px);
    }
    
    .modal-playlist-badge {
      display: none;
      background-color: rgba(100, 200, 255, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 100;
      align-items: center;
      gap: 5px;
      margin-top: 10px;
      width: fit-content;
    }
    
    .album-info, .song-info {
      padding: 12px;
      text-align: center;
    }
    
    .album-name, .song-name {
      font-size: 1.1rem;
      margin-bottom: 5px;
      font-weight: 100;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: rgba(255, 255, 255, 0.95);
    }
    
    .album-artist, .song-artist {
      font-size: 0.9rem;
      opacity: 0.8;
      font-weight: 100;
      color: rgba(114, 199, 255, 0.9);
    }
    
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(20, 40, 80, 0.5);
      backdrop-filter: blur(10px);
      z-index: 1000;
      overflow-y: auto;
      align-items: center;
      justify-content: center;
      transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    .modal.show {
      opacity: 1;
    }
    
    .modal.hide {
      opacity: 0;
    }
    
    .modal-content {
      background-color: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      margin: 50px auto;
      width: 80%;
      max-width: 800px;
      border-radius: 15px;
      box-shadow: 0 0 30px rgba(114, 199, 255, 0.3), 0 0 100px rgba(114, 199, 255, 0.2);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: modal-fade-in 0.4s ease-out;
      transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    .modal-content.hide {
      animation: modal-fade-out 0.4s ease-out forwards;
    }
    
    @keyframes modal-fade-in {
      from {
        opacity: 0;
        transform: translateY(-50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes modal-fade-out {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(50px);
      }
    }
    
    .close-modal {
      position: absolute;
      top: 15px;
      right: 20px;
      font-size: 28px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      z-index: 10;
      opacity: 0.8;
      transition: all 0.3s ease;
    }
    
    .close-modal:hover {
      opacity: 1;
      color: rgba(114, 199, 255, 1);
      transform: scale(1.2);
    }
    
    .modal-header {
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 1px solid rgba(114, 199, 255, 0.2);
      background-color: rgba(114, 199, 255, 0.1);
    }
    
    #modal-cover {
      width: 150px;
      height: 150px;
      border-radius: 10px;
      object-fit: cover;
      box-shadow: 0 5px 15px rgba(114, 199, 255, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .modal-title-container {
      flex: 1;
    }
    
    #modal-title {
      margin: 0 0 10px 0;
      font-size: 2rem;
      font-weight: 100;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 0 10px rgba(114, 199, 255, 0.5);
    }
    
    #modal-artist {
      font-size: 1.2rem;
      color: rgba(114, 199, 255, 0.9);
      margin: 0;
      text-shadow: 0 0 5px rgba(114, 199, 255, 0.3);
    }
    
    .modal-body {
      padding: 25px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    #modal-description {
      margin-bottom: 20px;
      line-height: 1.6;
      font-weight: 100;
    }
    
    .modal-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 20px;
      border-top: 1px solid rgba(114, 199, 255, 0.2);
      padding-top: 15px;
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .stat-label {
      font-size: 0.9rem;
      color: rgba(114, 199, 255, 0.7);
      margin-bottom: 5px;
    }
    
    .modal-footer {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(114, 199, 255, 0.2);
      background-color: rgba(114, 199, 255, 0.05);
    }
    
    .like-btn, .play-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .like-btn {
      background-color: rgba(255, 100, 177, 0.6);
      backdrop-filter: blur(5px);
        font-family: 'ZHFont', sans-serif !important;
    }
    
    .like-btn.liked {
      background-color: rgba(255, 100, 177, 0.9);
    }
    
    .play-btn {
      background-color: rgba(100, 200, 255, 0.6);
      backdrop-filter: blur(5px);
        font-family: 'ZHFont', sans-serif !important;
    }
    
    .like-btn:hover {
      background-color: rgba(255, 100, 159, 0.9);
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(255, 100, 131, 0.4);
    }
    
    .play-btn:hover {
      background-color: rgba(100, 200, 255, 0.9);
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(100, 200, 255, 0.4);
    }
    
    @keyframes heart-beat {
      0% { transform: scale(1); }
      25% { transform: scale(1.3); }
      50% { transform: scale(1); }
      75% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    
    .heart-beat {
      animation: heart-beat 0.8s ease-in-out;
    }
      .youtube-embed-container {
      display: none !important;
      visibility: hidden;
      height: 0;
      width: 0;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }
    
    .youtube-embed-container iframe {
      display: none !important;
      width: 0;
      height: 0;
    }
    @media (max-width: 768px) {
      .albums-container, .songs-container {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .modal-content {
        width: 95%;
        margin: 30px auto;
      }
      
      .modal-header {
        flex-direction: column;
        text-align: center;
      }
      
      .modal-stats {
        grid-template-columns: 1fr;
      }
      
      .modal-footer {
        flex-direction: column;
        gap: 10px;
      }
      
      .like-btn, .play-btn {
        width: 100%;
        justify-content: center;
      }
    }
    
    @media (max-width: 480px) {
      .albums-container, .songs-container {
        grid-template-columns: 1fr;
      }
      
      #modal-cover {
        width: 120px;
        height: 120px;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}


function setupModal(albums, songs) {
  const albumPanels = document.querySelectorAll('.album-panel');
  const songPanels = document.querySelectorAll('.song-panel');
  const modal = document.getElementById('detail-modal');
  const modalContent = modal.querySelector('.modal-content');
  const closeModal = document.querySelector('.close-modal');
  const likeBtn = document.getElementById('modal-like-btn');
  const playBtn = document.getElementById('modal-play-btn');
  const youtubeContainer = document.getElementById('youtube-embed-container');
  const playlistBadge = document.getElementById('modal-playlist-badge');
  
  const selectSound = new Audio('../select.mp3');
  const confettiSound = new Audio('../confetti.mp3');

  
  const allMediaItems = [...albums, ...songs].reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
  
  albumPanels.forEach(panel => {
    panel.addEventListener('click', () => {
      const itemId = panel.getAttribute('data-id');
      const item = allMediaItems[itemId];
      if (item) openModal(item);
    });
  });
  
  songPanels.forEach(panel => {
    panel.addEventListener('click', () => {
      const itemId = panel.getAttribute('data-id');
      const item = allMediaItems[itemId];
      if (item) openModal(item);
    });
  });
  
  closeModal.addEventListener('click', () => {
    closeModalWithAnimation();
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModalWithAnimation();
    }
  });
  
  likeBtn.addEventListener('click', () => {
    const mediaId = likeBtn.getAttribute('data-id');
    const mediaType = likeBtn.getAttribute('data-type');
    
    if (likedMedia[mediaId]) {
      delete likedMedia[mediaId];
      likeBtn.classList.remove('liked');
      likeBtn.innerHTML = `<i class="fas fa-heart"></i> I Like This`;
    } else {
      likedMedia[mediaId] = { type: mediaType, timestamp: Date.now() };
      likeBtn.classList.add('liked');
      likeBtn.innerHTML = `<i class="fas fa-heart"></i> Liked!`;
      
      confettiSound.play();
      fireConfetti();
      
      const heartIcon = likeBtn.querySelector('i');
      heartIcon.classList.add('heart-beat');
      
      setTimeout(() => {
        heartIcon.classList.remove('heart-beat');
      }, 800);
    }
    
    localStorage.setItem('likedMedia', JSON.stringify(likedMedia));
  });
  
  playBtn.addEventListener('click', () => {
    selectSound.play();
    
    const mediaId = playBtn.getAttribute('data-id');
    const mediaType = playBtn.getAttribute('data-type');
    const item = allMediaItems[mediaId];
    
    if (!item) return;
    
    if (currentPlaybackMethod === 'audio') {
      audio.pause();
    } else if (currentPlaybackMethod === 'youtube' && youtubePlayerReady) {
      youtubePlayer.stopVideo();
    }
    
    const mediaTitle = item.title;
    const mediaArtist = item.artist;
    const youtubeId = item.youtubeId;
    
    const singleItemPlaylist = [{
      title: mediaTitle,
      artist: mediaArtist,
      youtubeId: youtubeId,
      isPlaylist: item.isPlaylist || false
    }];
    
    if (mediaType === 'album' && item.isPlaylist && youtubeId) {
      loadYouTubePlaylist(youtubeId, mediaTitle, mediaArtist);
    }
    else if (youtubeId) {
      currentPlaylist = singleItemPlaylist;
      currentTrackIndex = 0;
      currentPlaybackMethod = 'youtube';
      
      isYouTubePlaylist = false;
      
      if (youtubePlayerReady) {
        youtubePlayer.loadVideoById(youtubeId);
        isPlaying = true;
        updatePlayButton();
        startDiscAnimation();
        
        titleBar.textContent = `Now Playing: ${mediaTitle} - ${mediaArtist}`;
      }
    }
    
    closeModalWithAnimation();
  });
  
  function closeModalWithAnimation() {
    youtubeContainer.innerHTML = '';
    youtubeContainer.style.display = 'none';
    
    modal.classList.add('hide');
    modalContent.classList.add('hide');
    
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('hide');
      modalContent.classList.remove('hide');
    }, 400);
  }
}

function fireConfetti() {
  if (typeof confetti !== 'undefined') {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Particles burst from heart button
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.5, 0.7) },
        colors: ['#ff64b1', '#ff5e97', '#ff477f', '#ff84c4'],
      }));
      
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.5, 0.7) },
        colors: ['#64c8ff', '#72c7ff', '#43b5ff', '#a1dfff'],
      }));

    }, 250);
  }
}

function openModal(item) {
  const modal = document.getElementById('detail-modal');
  const modalCover = document.getElementById('modal-cover');
  const modalTitle = document.getElementById('modal-title');
  const modalArtist = document.getElementById('modal-artist');
  const modalDescription = document.getElementById('modal-description');
  const modalReleaseDate = document.getElementById('modal-release-date');
  const modalGenre = document.getElementById('modal-genre');
  const modalDuration = document.getElementById('modal-duration');
  const likeBtn = document.getElementById('modal-like-btn');
  const playBtn = document.getElementById('modal-play-btn');
  const youtubeContainer = document.getElementById('youtube-embed-container');
  const playlistBadge = document.getElementById('modal-playlist-badge');
  
  modalCover.src = item.cover;
  modalTitle.textContent = item.title;
  modalArtist.textContent = item.artist;
  modalDescription.textContent = item.description;
  modalReleaseDate.textContent = item.releaseDate;
  modalGenre.textContent = item.genre;
  modalDuration.textContent = item.duration;
  
  likeBtn.setAttribute('data-id', item.id);
  likeBtn.setAttribute('data-type', item.id.includes('album') ? 'album' : 'song');
  playBtn.setAttribute('data-id', item.id);
  playBtn.setAttribute('data-type', item.id.includes('album') ? 'album' : 'song');
  
  if (item.isPlaylist) {
    playlistBadge.style.display = 'flex';
  } else {
    playlistBadge.style.display = 'none';
  }
  
  if (item.youtubeId) {
    let embedUrl;
    if (item.isPlaylist) {
      embedUrl = `https://www.youtube.com/embed/videoseries?list=${item.youtubeId}&rel=0&showinfo=0`;
    } else {
      embedUrl = `https://www.youtube.com/embed/${item.youtubeId}?rel=0&showinfo=0`;
    }
    
    youtubeContainer.innerHTML = `
      <iframe 
        src="${embedUrl}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
    youtubeContainer.style.display = 'block';
  } else {
    youtubeContainer.innerHTML = '';
    youtubeContainer.style.display = 'none';
  }
  
  if (likedMedia[item.id]) {
    likeBtn.classList.add('liked');
    likeBtn.innerHTML = `<i class="fas fa-heart"></i> Liked!`;
  } else {
    likeBtn.classList.remove('liked');
    likeBtn.innerHTML = `<i class="fas fa-heart"></i> I Like This`;
  }
  
  modal.style.display = 'flex';
  
  modal.focus();
}

document.addEventListener('DOMContentLoaded', initPlayer);