

const musicIcon = document.getElementById('music-stats-icon');
const statsModal = document.getElementById('stats-modal');
const statsClose = document.getElementById('stats-close');
const selectSound = new Audio('../select.mp3');

const musicDatabase = {
  song1: "Danse Macabre",
  song2: "1812 Overture",
  song3: "La Foule",
  song4: "Lily pads",
  song5: "My City",
  song6: "Inkoming!, Blitz It!, Entropical (Live)",
  song7: "Anarchy Rainbow (Splatfest)",
  song8: "The Seed",
  song9: "Warrior",
  song10: "Portal 2 OST Volume 1: Science is Fun",
  song11: "Phantom Liberty",
  song12: "Come Play (Arcane)",
  album1: "Minecraft: volume alpha",
  album2: "Subnautica Below Zero",
  album3: "Honkai Star Rail - Out of Control",
  album4: "The Deepsea Oddities",
  album5: "Splatune 2",
  album6: "Splatoon Live in Makuhari",
  album7: "TRON: Legacy",
  album8: "Minecraft: volume beta"
};

musicIcon.addEventListener('mouseenter', () => {
  musicIcon.src = '../music-assets/music-icon-hover.png';
});

musicIcon.addEventListener('mouseleave', () => {
  musicIcon.src = '../music-assets/music-icon.png';
});

musicIcon.addEventListener('click', () => {
  selectSound.play();
  updateStatsModal();
  statsModal.style.display = 'flex';
  setTimeout(() => {
    statsModal.classList.add('show');
  }, 10);
});

statsClose.addEventListener('click', closeStatsModal);

statsModal.addEventListener('click', (e) => {
  if (e.target === statsModal) {
    closeStatsModal();
  }
});

function closeStatsModal() {
  statsModal.classList.remove('show');
  setTimeout(() => {
    statsModal.style.display = 'none';
  }, 600);
}

function updateStatsModal() {
  const likedMedia = JSON.parse(localStorage.getItem('likedMedia')) || {};
  const likedCount = Object.keys(likedMedia).length;
  const likedCountElement = document.getElementById('liked-count');
  const firstLikedElement = document.getElementById('first-liked');
  const likedItemsContainer = document.getElementById('liked-items-container');
  const statsMessage = document.getElementById('stats-message');

  likedCountElement.textContent = likedCount;

  let firstLikedDate = null;
  let firstLikedDays = '—';
  
  if (likedCount > 0) {
    firstLikedDate = Math.min(...Object.values(likedMedia).map(item => item.timestamp));
    const daysSince = Math.floor((Date.now() - firstLikedDate) / (1000 * 60 * 60 * 24));
    firstLikedDays = daysSince;
  }
  
  firstLikedElement.textContent = firstLikedDays;

  likedItemsContainer.innerHTML = '';

  if (likedCount === 0) {
    likedItemsContainer.innerHTML = `
      <div class="no-liked-message">
        You haven't liked any music yet. Click the heart button on songs or albums you enjoy!
      </div>
    `;
    
    statsMessage.textContent = "You haven't liked any music yet. Explore and find something that moves you!";
  } else {
    const sortedLiked = Object.entries(likedMedia)
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    const getTitleFromId = (id) => {
      const match = id.match(/^(album|song)(\d+)$/);
      if (match) {
        const [, type, number] = match;
        const dbKey = `${type}${number}`;
        return musicDatabase[dbKey] || `${type.charAt(0).toUpperCase() + type.slice(1)} ${number}`;
      }
      return id; 
    };
    
    sortedLiked.forEach(([id, info]) => {
      const isAlbum = info.type === 'album';
      const mediaType = isAlbum ? 'Album' : 'Song';
      const likeDate = new Date(info.timestamp);
      const formattedDate = likeDate.toLocaleDateString();
      const title = getTitleFromId(id);
      
      const likedItem = document.createElement('div');
      likedItem.className = 'liked-item';
      likedItem.innerHTML = `
        <div class="liked-icon">
          <i class="fas fa-${isAlbum ? 'compact-disc' : 'music'}"></i>
        </div>
        <div class="liked-details">
          <h4 class="liked-title">${title}</h4>
          <span class="liked-type">${mediaType}</span>
        </div>
        <div class="liked-date">${formattedDate}</div>
      `;
      
      likedItemsContainer.appendChild(likedItem);
    });

    if (likedCount === 1) {
      statsMessage.textContent = "You've liked your first piece of music! Keep exploring to find more gems.";
    } else if (likedCount < 5) {
      statsMessage.textContent = "You're building a nice collection of favorites. Your musical journey is just beginning!";
    } else if (likedCount < 10) {
      statsMessage.textContent = "You have a great selection of music! Your taste is quite refined.";
    } else {
      statsMessage.textContent = "You're a true music enthusiast with an impressive collection of favorites!";
    }
  }
}
