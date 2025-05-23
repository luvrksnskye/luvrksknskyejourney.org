const cssStyles = `  
.starfall-container {  
   position: fixed;  
   top: 0;  
   left: 0;  
   width: 100%;  
   height: 100%;  
   pointer-events: none;  
   z-index: 1000;  
}  
  
.starfield {  
   position: relative;  
   width: 100%;  
   height: 100%;  
}  
  
.falling-star {  
   position: absolute;  
   width: 4px;  
   height: 4px;  
   background: white;  
   border-radius: 50%;  
   pointer-events: all;  
   transition: all 0.3s ease-out;  
}  
  
.falling-star.clickable-star {  
   cursor: pointer;  
}  
  
.falling-star.named-star {  
   background: white;  
   border-radius: 50%;  
   width: 4px;  
   height: 4px;  
   transition: all 0.3s ease-out;  
}  

@keyframes floatingPanel {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.star-info-panel {
  position: fixed;
  top: 20px;
  right: -350px;
  width: 350px;
  padding: 15px;
  opacity: 0;
  transition: right 0.5s ease-in-out, opacity 0.5s ease-in-out;
  z-index: 1001;
  cursor: pointer;
  animation: floatingPanel 3s ease-in-out infinite;
}

.star-info-panel.show {
  right: 20px;
  opacity: 1;
}

.star-info-panel img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.star-info-panel h3, .star-info-panel p {
  display: none;
}

/* Zodiac star colors */  
.falling-star.Aries {
  background-color: rgb(200, 200, 200) !important;
}
.falling-star.Taurus {
  background-color: rgb(185, 255, 135) !important;
}
.falling-star.Gemini {
  background-color: rgb(88, 141, 255) !important;
}
.falling-star.Cancer {
  background-color: rgb(255, 119, 210) !important;
}
.falling-star.Leo {
  background-color: rgb(255, 255, 125) !important;
}
.falling-star.Virgo {
  background-color: rgb(218, 125, 255) !important;
}
.falling-star.Libra {
  background-color: rgba(134, 255, 223, 0.68) !important;
}
.falling-star.Scorpio {
  background-color: rgba(255, 224, 130, 0.81) !important;
}
.falling-star.Sagittarius {
  background-color: rgb(119, 235, 255) !important;
}
.falling-star.Capricorn {
  background-color: rgba(255, 134, 154, 0.76) !important;
}
.falling-star.Aquarius {
  background-color: rgb(175, 90, 255) !important;
}
.falling-star.Pisces {
  background-color: rgb(205, 244, 255) !important;
}

`;

let lastZodiacStarTime = 0;
let zodiacStarsCreatedInInterval = 0;
const ZODIAC_INTERVAL = 300000; // 5 minutes in milliseconds
const MAX_ZODIAC_STARS_PER_INTERVAL = 2;

const styleSheet = document.createElement('style');  
styleSheet.type = 'text/css';  
styleSheet.innerText = cssStyles;  
document.head.appendChild(styleSheet);  
  
// Star Sound Effects  
const sounds = {  
  starTouch: new Audio('../../assets/sound-effects/star-touch.mp3'),  
  luma: new Audio('../../assets/sound-effects/luma.mp3'),  
  dogbark: new Audio('../../assets/sound-effects/undertale dog bark.mp3'),
  catsound: new Audio('../../assets/sound-effects/undertale hot cat sound effect.mp3')
};  
  
const namedStars = [  
  { name: 'Sirius', description: 'The brightest star in Earth\'s night sky' },  
  { name: 'Vega', description: 'A brilliant blue-white star in Lyra' },  
  { name: 'Antares', description: 'The red supergiant heart of Scorpius' },  
  { name: 'Betelgeuse', description: 'A red supergiant in Orion\'s shoulder' },  
  { name: 'Aldebaran', description: 'The angry eye of Taurus' },  
  { name: 'Rigel', description: 'The bright blue foot of Orion' },  
  { name: 'Arcturus', description: 'The guardian of the bear' },  
  { name: 'Polaris', description: 'The North Star' },  
  { name: 'Deneb', description: 'The tail of the swan' },  
  { name: 'Altair', description: 'The flying eagle' }  
];  

const petStars = [  
  { name: 'Cachi', description: 'A playful star that brings good dreams', type: 'dog' },
  { name: 'Gordo', description: 'A energetic star that loves to dance', color: 'dog' },
  { name: 'Yogui', description: 'A gentle star that guides lost travelers', color: 'dog' },
  { name: 'Midnight', description: 'A curious star that collects stardust', color: 'cat' },
  { name: 'Dawn', description: 'A brave star that protects the night sky', color: 'cat' },
  { name: 'Mochi', description: 'A magical star that paints the northern lights', color: 'cat' },
  { name: 'Cream', description: 'A swift star that races through the cosmos', color: 'cat' },
  { name: 'Filomeno', description: 'A resilient star that never fades away', color: 'cat' }
];

const currentYear = moment().year();

const zodiacPeriods = [
  { sign: 'Aries', start: moment(`${currentYear}-03-21`), end: moment(`${currentYear}-04-19`) },
  { sign: 'Taurus', start: moment(`${currentYear}-04-20`), end: moment(`${currentYear}-05-20`) },
  { sign: 'Gemini', start: moment(`${currentYear}-05-21`), end: moment(`${currentYear}-06-20`) },
  { sign: 'Cancer', start: moment(`${currentYear}-06-21`), end: moment(`${currentYear}-07-22`) },
  { sign: 'Leo', start: moment(`${currentYear}-07-23`), end: moment(`${currentYear}-08-22`) },
  { sign: 'Virgo', start: moment(`${currentYear}-08-23`), end: moment(`${currentYear}-09-22`) },
  { sign: 'Libra', start: moment(`${currentYear}-09-23`), end: moment(`${currentYear}-10-22`) },
  { sign: 'Scorpio', start: moment(`${currentYear}-10-23`), end: moment(`${currentYear}-11-21`) },
  { sign: 'Sagittarius', start: moment(`${currentYear}-11-22`), end: moment(`${currentYear}-12-21`) },
  { sign: 'Capricorn', start: moment(`${currentYear}-01-01`), end: moment(`${currentYear}-01-19`) },
  { sign: 'Aquarius', start: moment(`${currentYear}-01-20`), end: moment(`${currentYear}-02-18`) },
  { sign: 'Pisces', start: moment(`${currentYear}-02-19`), end: moment(`${currentYear}-03-20`) }
];

let data;

// Load the stars JSON data
fetch('stars.json')
  .then((response) => response.json())
  .then((starsData) => {
    data = starsData;
    createStarfield();
  });

function createInfoPanel(star) {
  const unlockedStars = localStorage.getItem('unlockedStars');
  let starsArray;
  if (unlockedStars) {
    starsArray = JSON.parse(unlockedStars);
  } else {
    starsArray = [];
  }

  if (star.dataset.zodiac) {
    const zodiacStarId = getZodiacStarId(star.dataset.zodiac);
    if (zodiacStarId !== null && starsArray.includes(zodiacStarId)) {
      return; // Don't create the info panel if the star is already unlocked
    }
  } else if (star.dataset.name) {
    const namedStarId = getNamedStarId(star.dataset.name);
    if (namedStarId !== null && starsArray.includes(namedStarId)) {
      return; // Don't create the info panel if the star is already unlocked
    }
  }

  const panel = document.createElement('div');
  panel.className = 'star-info-panel';
  
  const img = document.createElement('img');
  img.src = '../../assets/achievements/New-star.png';
  img.alt = 'Star Achievement';
  
  panel.appendChild(img);
  
  panel.addEventListener('click', () => {
    window.location.href = '../../stellar-hunter/index.html';
  });
  
  document.body.appendChild(panel);
  
  setTimeout(() => panel.classList.add('show'), 100);
  
  setTimeout(() => {
    panel.classList.remove('show');
    setTimeout(() => panel.remove(), 500);
  }, 5000);
}

function canCreateZodiacStar() {
  const now = Date.now();
  
  if (now - lastZodiacStarTime >= ZODIAC_INTERVAL) {
    lastZodiacStarTime = now;
    zodiacStarsCreatedInInterval = 0;
  }

  return zodiacStarsCreatedInInterval < MAX_ZODIAC_STARS_PER_INTERVAL;
}
  
function playSound(sound) {  
  sound.currentTime = 0;  
  sound.play().catch(err => console.log('Audio play failed:', err));  
}  
  
function isCurrentlyInZodiacPeriod(zodiacSign) {
  const now = moment();
  const period = zodiacPeriods.find(p => p.sign === zodiacSign);

  if (!period) {
    console.warn(`Zodiac sign ${zodiacSign} not found in periods.`);
    return false;
  }

  console.log(`Checking ${zodiacSign}: Now=${now}, Start=${period.start}, End=${period.end}`);
  return now.isBetween(period.start, period.end, null, '[)');
}


function getDayNightMultiplier() {  
  const now = moment();  
  const hours = now.hour();  
   
  if (hours >= 19 || hours < 5) {  
   return {  
    starCount: 1.7,
    namedStarChance: 0.2,
    zodiacStarChance: 0.5,
    petStarChance: 0.15  
   };  
  }  
   
  return {  
   starCount: 1.0,
   namedStarChance: 0.1,
   zodiacStarChance: 0.01,
   petStarChance: 0.05 
  };  
}
  
function handleStarClick(event) {  
  const star = event.currentTarget;  
  
  // Get the pet star data if it's a pet star
  let petStar;
  if (star.dataset.petStar) {
    petStar = petStars.find(pet => pet.name === star.dataset.petStar);
  }
  
  // Determine which sound to play
  let soundToPlay;
  if (star.dataset.petStar && petStar) {
    if (petStar.color === 'cat') {
      soundToPlay = sounds.catsound;
    } else if (petStar.color === 'dog') {
      soundToPlay = sounds.dogbark;
    }
  } else if (star.dataset.zodiac) {
    soundToPlay = sounds.luma;
  } else {
    soundToPlay = sounds.starTouch;
  }
  
  playSound(soundToPlay);
  
  if (star.dataset.zodiac || star.dataset.name || star.dataset.petStar) {
    createInfoPanel(star);
  }
  
  console.log(`You clicked on the ${star.dataset.zodiac || star.dataset.name || star.dataset.petStar} star!`);
  
  // Store the unlocked star in local storage
  const unlockedStars = localStorage.getItem('unlockedStars');
  let starsArray;
  if (unlockedStars) {
    starsArray = JSON.parse(unlockedStars);
  } else {
    starsArray = [];
  }

  if (star.dataset.zodiac) {
    const zodiacStarId = getZodiacStarId(star.dataset.zodiac);
    if (zodiacStarId !== null && !starsArray.includes(zodiacStarId)) {
      starsArray.push(zodiacStarId);
    }
  } else if (star.dataset.name) {
    const namedStarId = getNamedStarId(star.dataset.name);
    if (namedStarId !== null && !starsArray.includes(namedStarId)) {
      starsArray.push(namedStarId);
    }
  } else if (star.dataset.petStar) {
    const petStarId = getPetStarId(star.dataset.petStar);
    if (petStarId !== null && !starsArray.includes(petStarId)) {
      starsArray.push(petStarId);
    }
  }

  localStorage.setItem('unlockedStars', JSON.stringify(starsArray));

  star.style.transform = 'scale(1.5)';  
  star.style.opacity = '0';  
  setTimeout(() => {  
    star.remove();  
  }, 300);  
}
  
function createStarfield() {
  const starfield = document.querySelector('.starfall-container .starfield');
  if (!starfield) return;

  starfield.innerHTML = '';

  const multiplier = getDayNightMultiplier();
  const totalStars = Math.floor(40 * multiplier.starCount);
  const allStars = [];

  const activeZodiacSigns = zodiacPeriods
    .filter(period => isCurrentlyInZodiacPeriod(period.sign))
    .map(period => period.sign);

    for (let i = 0; i < totalStars; i++) {
      const star = document.createElement('div');
      star.className = 'falling-star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
  
      // Random chance logic for different star types
      const random = Math.random();
      if (random < multiplier.petStarChance && petStars.length > 0) {
  
        const unlockedStars = localStorage.getItem('unlockedStars');
        let starsArray;
        if (unlockedStars) {
          starsArray = JSON.parse(unlockedStars);
        } else {
          starsArray = [];
        }
  
        let petStarIndex;
        if (starsArray.length === petStars.length) {
          // If the user has all pet stars, don't create a new one
          continue;
        } else {
          // If the user already has some pet stars, choose a new one
          const availablePetStars = petStars.filter((petStar) => !starsArray.includes(getPetStarId(petStar.name)));
          petStarIndex = Math.floor(Math.random() * availablePetStars.length);
          const petStar = availablePetStars[petStarIndex];
          star.dataset.petStar = petStar.name;
          star.dataset.description = petStar.description;
          star.classList.add('pet-star');
          star.classList.add('clickable-star');
          star.title = `${petStar.name}: ${petStar.description}`;
          star.addEventListener('click', handleStarClick);
          // Removed the playSound(sounds.luma) from here
        }
      } else if (random < (multiplier.petStarChance + multiplier.namedStarChance) && namedStars.length > 0) {
        
        const namedStarIndex = Math.floor(Math.random() * namedStars.length);
        const namedStar = namedStars[namedStarIndex];
        star.dataset.name = namedStar.name;
        star.dataset.description = namedStar.description;
        star.classList.add('named-star');
        star.title = `${namedStar.name}: ${namedStar.description}`;
        star.classList.add('clickable-star');
        star.addEventListener('click', handleStarClick);
      } else if (
        random < (multiplier.petStarChance + multiplier.namedStarChance + multiplier.zodiacStarChance) && 
        activeZodiacSigns.length > 0 && 
        canCreateZodiacStar()
      ) {
  
        const zodiac = activeZodiacSigns[Math.floor(Math.random() * activeZodiacSigns.length)];
        star.dataset.zodiac = zodiac;
        star.classList.add(zodiac);
        star.classList.add('zodiac-star');
        star.classList.add('clickable-star');
        star.addEventListener('click', handleStarClick);
        zodiacStarsCreatedInInterval++;
      }
  

    const delay = Math.random() * 15000;
    star.style.animationDelay = `${delay}ms`;
    const duration = 4000 + Math.random() * 2000;
    star.style.animationDuration = `${duration}ms`;

    allStars.push(star);
    starfield.appendChild(star);
  }

  const now = moment();
  const nextRefresh = moment().hour(5).minute(0).second(0);
  if (now.hour() >= 5) {
    nextRefresh.add(1, 'day');
  }
  const timeUntilNextRefresh = nextRefresh.diff(now);

  setTimeout(createStarfield, timeUntilNextRefresh);
}

// Helper functions to get the star ID from the JSON data
function getPetStarId(name) {
  if (!data) {
    console.error('Data is not yet defined');
    return null;
  }
  const petStarsData = data.stars.filter((star) => star.type === 'pet');
  const petStar = petStarsData.find((star) => star.name === name);
  return petStar ? petStar.id : null;
}

function getZodiacStarId(zodiacSign) {
  if (!data) {
    console.error('Data is not yet defined');
    return null;
  }
  const zodiacStars = data.stars.filter((star) => star.type === 'zodiac');
  const zodiacStar = zodiacStars.find((star) => star.name === zodiacSign);
  return zodiacStar.id;
}

function getNamedStarId(name) {
  if (!data) {
    console.error('Data is not yet defined');
    return null;
  }
  const namedStars = data.stars.filter((star) => star.type === 'special');
  const namedStar = namedStars.find((star) => star.name === name);
  return namedStar.id;
}

(function() {  
  if (!document.querySelector('.starfall-container')) {  
    const container = document.createElement('div');  
    container.className = 'starfall-container';  
    const starfield = document.createElement('div');  
    starfield.className = 'starfield';  
    container.appendChild(starfield);  
    document.body.appendChild(container);  
  }
})();
