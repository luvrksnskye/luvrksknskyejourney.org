// Get the diary frame element
const diaryFrame = document.getElementById('diaryFrame');

// Load the JSON data
const jsonData = {
  "stars": [
    {
      "id": 1,
      "name": "aries",
      "type": "zodiac",
      "entry": "entry1.html"
    },
    {
      "id": 2,
      "name": "taurus",
      "type": "zodiac",
      "entry": "entry2.html"
    },
    {
      "id": 3,
      "name": "gemini",
      "type": "zodiac",
      "entry": "entry3.html"
    },
    {
      "id": 4,
      "name": "cancer",
      "type": "zodiac",
      "entry": "entry4.html"
    },
    {
      "id": 5,
      "name": "leo",
      "type": "zodiac",
      "entry": "entry5.html"
    },
    {
      "id": 6,
      "name": "virgo",
      "type": "zodiac",
      "entry": "entry6.html"
    },
    {
      "id": 7,
      "name": "libra",
      "type": "zodiac",
      "entry": "entry7.html"
    },
    {
      "id": 8,
      "name": "scorpio",
      "type": "zodiac",
      "entry": "entry8.html"
    },
    {
      "id": 9,
      "name": "sagittarius",
      "type": "zodiac",
      "entry": "entry9.html"
    },
    {
      "id": 10,
      "name": "capricorn",
      "type": "zodiac",
      "entry": "entry10.html"
    },
    {
      "id": 11,
      "name": "aquarius",
      "type": "zodiac",
      "entry": "entry11.html"
    },
    {
      "id": 12,
      "name": "pisces",
      "type": "zodiac",
      "entry": "entry12.html"
    },
    {
      "id": 13,
      "name": "Sirius",
      "type": "special",
      "entry": "entry13.html"
    },
    {
      "id": 14,
      "name": "Vega",
      "type": "special",
      "entry": "entry14.html"
    },
    {
      "id": 15,
      "name": "Antares",
      "type": "special",
      "entry": "entry15.html"
    },
    {
      "id": 16,
      "name": "Betelgeuse",
      "type": "special",
      "entry": "entry16.html"
    },
    {
      "id": 17,
      "name": "Aldebaran",
      "type": "special",
      "entry": "entry17.html"
    },
    {
      "id": 18,
      "name": "Rigel",
      "type": "special",
      "entry": "entry18.html"
    },
    {
      "id": 19,
      "name": "Arcturus",
      "type": "special",
      "entry": "entry19.html"
    },
    {
      "id": 20,
      "name": "Polaris",
      "type": "special",
      "entry": "entry20.html"
    },
    {
      "id": 21,
      "name": "Deneb",
      "type": "special",
      "entry": "entry21.html"
    },
    {
      "id": 22,
      "name": "Altair",
      "type": "special",
      "entry": "entry22.html"
    }
  ]
};

// Function to load the diary entry
function loadDiaryEntry(starId) {
  const star = jsonData.stars.find((star) => star.id === starId);
  if (star) {
    const url = `entries/${star.entry}`;
    loadPage(url);
  }
}

// Function to load the page
function loadPage(url) {
  const pageFlipSound = new Audio('../../assets/sound-effects/sound effect.mp3');
  pageFlipSound.currentTime = 0;
  pageFlipSound.play()
    .catch(error => console.log('Audio playback failed:', error));
  
  diaryFrame.style.opacity = '0';
  
  setTimeout(() => {
    diaryFrame.src = url;
    diaryFrame.style.opacity = '1';
  }, 300);
  
  return false;
}

// Listen for changes in local storage
window.addEventListener('storage', (event) => {
  if (event.key === 'unlockedStars') {
    const unlockedStars = JSON.parse(event.newValue);
    const latestUnlockedStar = unlockedStars[unlockedStars.length - 1];
    loadDiaryEntry(latestUnlockedStar);
  }
});
