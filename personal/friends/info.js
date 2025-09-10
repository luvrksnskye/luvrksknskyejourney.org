document.addEventListener('DOMContentLoaded', () => {

    const skyeIcon = document.createElement('div');
    skyeIcon.classList.add('skye-icon');
    document.body.appendChild(skyeIcon);


    const woahSound = new Audio('../../assets/sound-effects/woah.mp3');
    woahSound.volume = 0.8; 


    const skyePanelOverlay = document.createElement('div');
    skyePanelOverlay.classList.add('skye-panel-overlay');
    
    // Create Main Panel
    const skyePanel = document.createElement('div');
    skyePanel.classList.add('skye-panel', 'left-panel');
    skyePanel.innerHTML = `
        <div class="skye-panel-close">&times;</div>
        <div class="panel-content">
            <div class="header-container" style="display: flex; justify-content: center; align-items: center;">
                <img src="../../assets/special-icons/arrow-left.png" class="enter-arrow left-arrow" alt="Left Arrow" style="display: none;">
                <h2 style="color: white; text-align: center;">About</h2>
                <img src="../../assets/special-icons/arrow-right.png" class="enter-arrow right-arrow" alt="Right Arrow" style="display: none;">
            </div>
            <p style="color: white; text-align: center;">My friends travel among the stars! Can you find them and learn from them? Have fun reading about my friends on this star map. I made this to express my love and admiration for the people I know, and perhaps in the future I can expand the list and make this map even bigger than it already is.</p>
            <p style="color: white; text-align: center;">When I was a kid, the internet felt like a wonderland of unique and creative sites—places built for self-expression rather than profit. My goal here is to nurture that same spirit of creativity and provide a space where people can truly shine. Like stars forming a constellation, each site adds to something beautiful, inviting discovery and celebrating authenticity. I just want to help my friends shine.</p>
            <p style="color: white; text-align: center;">Anyway! This section isn't perfect, but it's something. To the right of this panel, you'll see another panel with updates on the people who are added to the constellations. Remember, you can send me a message if you'd like to be added! Although I'd like to keep this section for my friends, I also want to give visibility to people's websites, so in future updates, I could add a section for that.</p>
        </div>
    `;

    // Create Updates Panel
    const updatesPanel = document.createElement('div');
    updatesPanel.classList.add('skye-panel', 'right-panel');
    updatesPanel.innerHTML = `
        <div class="skye-panel-close">&times;</div>
        <div class="panel-content">
            <div class="header-container" style="display: flex; justify-content: center; align-items: center;">
                <h2 style="color: white; text-align: center;">Update 2.2 Constellation</h2>
            </div>
            <div class="update-list">
                <h3 style="color: white; text-align: center; margin-bottom: 15px;">New Stars Added</h3>
                <ul style="color: white; list-style-type: none; padding: 0;">
                    <li style="margin-bottom: 10px; text-align: center;">
                        <b>ne0nbandit</b> -  Digital Artist from Portugal with an affinity for Character Design and Storytelling!
                    </li>
                    <li style="margin-bottom: 10px; text-align: center;">
                        <b>Chissuuu</b> - A very talented traditional artist and close friend of mine!
                    </li>
                    <li style="margin-bottom: 10px; text-align: center;">
                        <b>RedRxven</b> - A digital artist and animation student, a long-time close friend
                    </li>
                    <li style="margin-bottom: 10px; text-align: center;">
                        <b>Morita</b> - An illustrator and graphic design student!
                    </li>
            </div>
        </div>
    `;


    skyePanelOverlay.appendChild(skyePanel);
    skyePanelOverlay.appendChild(updatesPanel);
    document.body.appendChild(skyePanelOverlay);

  
    const leftArrow = skyePanel.querySelector('.left-arrow');
    const rightArrow = skyePanel.querySelector('.right-arrow');

 
    const closePanelButtons = skyePanelOverlay.querySelectorAll('.skye-panel-close');


    skyeIcon.addEventListener('click', () => {
        skyePanelOverlay.classList.add('show');

        woahSound.currentTime = 0; 
        woahSound.play().catch(error => {
            console.warn('Audio play failed:', error);
        });
        
  
        setTimeout(() => {
            leftArrow.style.display = 'block';
            rightArrow.style.display = 'block';
        }, 300);
    });

    
    closePanelButtons.forEach(closeButton => {
        closeButton.addEventListener('click', () => {
        
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
            skyePanelOverlay.classList.remove('show');
        });
    });


    skyePanelOverlay.addEventListener('click', (e) => {
        if (e.target === skyePanelOverlay) {
   
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
            skyePanelOverlay.classList.remove('show');
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && skyePanelOverlay.classList.contains('show')) {

            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
            skyePanelOverlay.classList.remove('show');
        }
    });
});