function showImageNotification(imagePath) {

  let notification = document.querySelector('.notification-image');
  
  if (!notification) {

    notification = document.createElement('img');
    notification.className = 'notification-image';
    notification.src = imagePath;
    document.body.appendChild(notification);
  } else {

    notification.src = imagePath;
  }

  
  const audio = new Audio('../../assets/sound-effects/mystical-chime.mp3');
  audio.play().catch(err => console.warn('Audio playback failed:', err));

  
  notification.classList.remove('hide');
  

  setTimeout(() => notification.classList.add('show'), 100);


  const handleClick = () => {
    notification.classList.add('hide');
    setTimeout(() => {
      notification.classList.remove('show', 'hide');
      notification.style.transform = ''; 
    }, 500);


    notification.removeEventListener('click', handleClick);
  };

  notification.addEventListener('click', handleClick);
}


showImageNotification('../../assets/panels/rules-panel.png');

