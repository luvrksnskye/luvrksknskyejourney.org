// Create menu panel function
function createMenuPanel() {
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    
    const menuButton = document.createElement('div');
    menuButton.className = 'menu-button';
    menuButton.innerHTML = '<span>☰</span>';
    
    const gifElement = document.createElement('img');
    gifElement.className = 'menu-gif';
    gifElement.src = '../../assets/gifs/sugar-star-cookie-run.gif';
    gifElement.alt = 'Star Cookie';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'menu-nav-buttons';
    
    const navButton1 = document.createElement('a');
    navButton1.href = '../../stellar-hunter/index.html';
    const navImage1 = document.createElement('img');
    navImage1.src = '../../assets/buttons/encyclopedia.png';
    navImage1.alt = 'Navigation 1';
    navButton1.appendChild(navImage1);
    
    const navButton2 = document.createElement('a');
    navButton2.href = '../../stellar-hunter/album.html';
    const navImage2 = document.createElement('img');
    navImage2.src = '../../assets/buttons/album.png';
    navImage2.alt = 'Navigation 2';
    navButton2.appendChild(navImage2);
    
    buttonContainer.appendChild(navButton1);
    buttonContainer.appendChild(navButton2);
    
    const audio = new Audio('../../assets/sound-effects/mystical-chime.mp3');
    
    const menuPanel = document.createElement('div');
    menuPanel.className = 'menu-panel';
    
    menuPanel.innerHTML = `
        <button class="close-button">×</button>
        <div class="menu-section">
            <h2>✦Stellar Hunter mechanics✦</h2>
            <p>Pay attention to the stars falling across the sky! If you do, you'll notice that some stars are different colors and shine brighter than others. They even make different sounds! Each star is special, so catch them, and have fun!</p>
            <p>The meteor shower is intense at night from 7 PM onwards and depending on the real-life star calendar! Use time to your advantage to capture more stars and with their fragments recover the lost constellations, help them regain their light! Unlock your star album and discover their stories! Some shooting stars have different colored tails and different brightness when they fall. Observe them carefully and check your album to learn more about them!</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(menuButton);
    document.body.appendChild(menuPanel);
    document.body.appendChild(gifElement);
    document.body.appendChild(buttonContainer);
    
    menuButton.addEventListener('click', () => {
        menuPanel.classList.add('open');
        overlay.classList.add('active');
        gifElement.classList.add('active');
        buttonContainer.classList.add('active');
        
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    });
    
    const closeButton = menuPanel.querySelector('.close-button');
    closeButton.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
    
    function closeMenu() {
        menuPanel.classList.remove('open');
        overlay.classList.remove('active');
        gifElement.classList.remove('active');
        buttonContainer.classList.remove('active');
    }
}

const menuStyles = `
.menu-button {
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    cursor: pointer;
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.menu-button:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.menu-button span {
    color: white;
    font-size: 24px;
}

.menu-panel {
    position: fixed;
    top: 0;
    left: -500px;
    height: 100vh;
    width: 350px;
    background: rgba(255, 255, 255, 0.37);
    backdrop-filter: blur(10px);
    border-right: 2px solid rgba(255, 255, 255, 0.1);
    padding: 80px 30px 30px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    color: white;
    font-family: "Cinzel", serif;
    overflow: auto;
}

.menu-panel.open {
    left: 0;
}

.menu-panel h2 {
    font-size: 25px;
    margin-bottom: 20px;
    color: #fff;
    font-family: "Cinzel", serif;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.menu-panel p {
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 15px;
    font-family: 'ZHFont', sans-serif;
    color: rgba(255, 255, 255, 0.8);
}

.menu-section {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.close-button {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 5px;
    transition: all 0.3s ease;
}

.close-button:hover {
    transform: scale(1.1);
    color: rgba(255, 255, 255, 0.7);
}

.menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    z-index: 999;
}

.menu-overlay.active {
    opacity: 1;
    pointer-events: auto;
}

.menu-gif {
    position: absolute;
    top: 85%;
    left: 58%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1002;
}

.menu-gif.active {
    transform: translate(-50%, -50%) scale(1);
}

.menu-nav-buttons {
    position: absolute;
    top: 40%;
    left: 58%;
    transform: translate(-50%, -50%) scale(0);
    display: row
    flex-direction: column;
    gap: 0;
   align-items: flex-end;
    z-index: 1003;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-nav-buttons.active {
    transform: translate(-50%, -50%) scale(1);
}

.menu-nav-buttons a {
    display: block;
    transition: transform 0.3s ease;
    line-height: 0;
}

.menu-nav-buttons a:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.27))
            drop-shadow(0 0 50px rgba(255, 255, 255, 0.23))
            drop-shadow(0 0 70px rgba(255, 255, 255, 0.35));
}

.menu-nav-buttons img {
 
.menu-nav-buttons img {
    display: block;
    width: 460px;
    height: 400px;
    margin: 0;
    padding: 0;
    vertical-align: top;
}`;


const menuStyleSheet = document.createElement('style');
menuStyleSheet.type = 'text/css';
menuStyleSheet.innerText = menuStyles;
document.head.appendChild(menuStyleSheet);

// Initialize menu panel
document.addEventListener('DOMContentLoaded', () => {
    createMenuPanel();
});