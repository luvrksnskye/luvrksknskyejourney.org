

fetch('../filesystem/credits/data/stars.json')
  .then(response => response.json())
  .then(data => {
    const diaryFrame = document.getElementById('diaryFrame');

    function updateEncyclopedia() {
      const unlockedStars = localStorage.getItem('unlockedStars');
      if (unlockedStars) {
        const starsArray = JSON.parse(unlockedStars);
        const specialStars = data.stars.filter((star) => star.type === 'special');
        const zodiacStars = data.stars.filter((star) => star.type === 'zodiac');
        const petStars = data.stars.filter((star) => star.type === 'pet');

        const specialStarsHeader = document.querySelector('.header-special');
        specialStars.forEach((star) => {
          if (starsArray.includes(star.id)) {
            const entryUrl = `entries/${star.entry}`;
            const entryElement = document.createElement('a');
            entryElement.href = '#';
            entryElement.onclick = () => loadPage(entryUrl);
            entryElement.innerHTML = `<b>✦ ${star.name} ✦</b>`;
            if (specialStarsHeader) {
              specialStarsHeader.parentNode.insertBefore(entryElement, specialStarsHeader.nextSibling);
              const hrElement = document.createElement('hr');
              hrElement.style.color = '#7ea9ff';
              hrElement.style.margin = '20px 0'; 
              hrElement.style.borderTopWidth = '1px'; 
              hrElement.style.borderTopStyle = 'solid'; 
              specialStarsHeader.parentNode.insertBefore(hrElement, entryElement.nextSibling);
              const newIcon = document.createElement('img');
              newIcon.src = '/assets/images/gifs/new.gif';
              newIcon.alt = 'new symbol';
              newIcon.style.width = '25px';
              newIcon.style.height = '10px';
              newIcon.style.marginLeft = '5px';
              entryElement.appendChild(newIcon);
              entryElement.addEventListener('click', () => {
                newIcon.remove();
                localStorage.setItem(`star-${star.id}-clicked`, true); 
              });
              if (localStorage.getItem(`star-${star.id}-clicked`)) {
                newIcon.remove(); 
              }
            }
          }
        });

        const specialStarsHeaderMargin = document.createElement('div');
        specialStarsHeaderMargin.style.height = '20px';
        specialStarsHeader.parentNode.insertBefore(specialStarsHeaderMargin, specialStarsHeader.nextSibling);

        const zodiacStarsHeader = document.querySelector('.header-zodiac');
        zodiacStars.forEach((star) => {
          if (starsArray.includes(star.id)) {
            const entryUrl = `entries/${star.entry}`;
            const entryElement = document.createElement('a');
            entryElement.href = '#';
            entryElement.onclick = () => loadPage(entryUrl);
            entryElement.innerHTML = `<b>✦ ${star.name} ✦</b>`;
            if (zodiacStarsHeader) {
              zodiacStarsHeader.parentNode.insertBefore(entryElement, zodiacStarsHeader.nextSibling);
              const hrElement = document.createElement('hr');
              hrElement.style.color = '#7ea9ff';
              hrElement.style.margin = '20px 0'; 
              hrElement.style.borderTopWidth = '1px'; 
              hrElement.style.borderTopStyle = 'solid';
              zodiacStarsHeader.parentNode.insertBefore(hrElement, entryElement.nextSibling);
              const newIcon = document.createElement('img');
              newIcon.src = '/assets/images/gifs/new.gif';
              newIcon.alt = 'new symbol';
              newIcon.style.width = '25px';
              newIcon.style.height = '10px';
              newIcon.style.marginLeft = '5px';
              entryElement.appendChild(newIcon);
              entryElement.addEventListener('click', () => {
                newIcon.remove();
                localStorage.setItem(`star-${star.id}-clicked`, true); 
              });
              if (localStorage.getItem(`star-${star.id}-clicked`)) {
                newIcon.remove();
              }
            }
          }
        });

        const zodiacStarsHeaderMargin = document.createElement('div');
        zodiacStarsHeaderMargin.style.height = '20px'; 
        zodiacStarsHeader.parentNode.insertBefore(zodiacStarsHeaderMargin, zodiacStarsHeader.nextSibling);

        const petStarsHeader = document.querySelector('.header-pets');
        petStars.forEach((star) => {
          if (starsArray.includes(star.id)) {
            const entryUrl = `entries/${star.entry}`;
            const entryElement = document.createElement('a');
            entryElement.href = '#';
            entryElement.onclick = () => loadPage(entryUrl);
            entryElement.innerHTML = `<b>✦ ${star.name} ✦</b>`;
            if (petStarsHeader) {
              petStarsHeader.parentNode.insertBefore(entryElement, petStarsHeader.nextSibling);
              const hrElement = document.createElement('hr');
              hrElement.style.color = '#7ea9ff';
              hrElement.style.margin = '20px 0'; 
              hrElement.style.borderTopWidth = '1px'; 
              hrElement.style.borderTopStyle = 'solid';
              petStarsHeader.parentNode.insertBefore(hrElement, entryElement.nextSibling);
              const newIcon = document.createElement('img');
              newIcon.src = '/assets/images/gifs/new.gif';
              newIcon.alt = 'new symbol';
              newIcon.style.width = '25px';
              newIcon.style.height = '10px';
              newIcon.style.marginLeft = '5px';
              entryElement.appendChild(newIcon);
              entryElement.addEventListener('click', () => {
                newIcon.remove();
                localStorage.setItem(`star-${star.id}-clicked`, true); 
              });
              if (localStorage.getItem(`star-${star.id}-clicked`)) {
                newIcon.remove();
              }
            }
          }
        });

        const petStarsHeaderMargin = document.createElement('div');
        petStarsHeaderMargin.style.height = '20px'; 
        petStarsHeader.parentNode.insertBefore(petStarsHeaderMargin, petStarsHeader.nextSibling);
      }
    }

    updateEncyclopedia();

    window.addEventListener('storage', (event) => {
      if (event.key === 'unlockedStars') {
        updateEncyclopedia();
      }
    });

    function loadPage(url) {
      const pageFlipSound = new Audio('/assets/audio/sfx/sound-effect.mp3');
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
  });
