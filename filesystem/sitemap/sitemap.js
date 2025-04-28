document.addEventListener('DOMContentLoaded', () => {
    const compassImg = document.getElementById('compass-img');
    const centerImg = document.getElementById('center-img');
    let selectedStar = null;
    let mouseX = 0, mouseY = 0;

    const selectionSound = new Audio('visuals/selection.mp3');

    const treeViewButton = document.getElementById('toggle-tree-view');
    const treeViewOverlay = document.getElementById('tree-view-overlay');

    treeViewButton.addEventListener('click', () => {
        treeViewOverlay.classList.add('active');
        selectionSound.play();
    });

    function closeTreeView() {
        treeViewOverlay.classList.remove('active');
    }

    window.closeTreeView = closeTreeView;

    createBackgroundStars();

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateCompass() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);

        const distanceFromCenter = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        const maxDistance = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)) / 2;
        const tiltFactor = distanceFromCenter / maxDistance * 10; 

        const tiltX = ((centerY - mouseY) / centerY) * tiltFactor;
        const tiltY = ((mouseX - centerX) / centerX) * tiltFactor;

        compassImg.style.transform = `rotate(${angle}deg)`;
        centerImg.style.transform = `rotate(${angle * 0.1}deg) perspective(500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        requestAnimationFrame(updateCompass);
    }

    updateCompass();

    const filesystemPages = [
        { name: 'intro', description: 'log-in and updates' },
        { name: 'home', description: 'the homepage' },
        { name: 'about', description: 'infos about the site' },
        { name: 'social', description: 'all my social medias and chat' },
        { name: 'support', description: 'support and contact' },
        { name: 'tos', description: 'terms of service' },
        { name: 'tools', description: 'my digital tools' },
        { name: 'blog', description: 'personal blog' },
        { name: 'resources', description: 'useful tools and data' },
        { name: 'software', description: 'my operating system!' },
        { name: 'credits', description: 'end credits of the site' },
        { name: 'workstation', description: 'my waiting queue' },
        { name: 'sitemap', description: 'map of all pages (you are here!)' }
    ];

    const personalPages = [
        { name: 'about me', description: 'infos about me' },
        { name: 'journal', description: 'my digital diary' },
        { name: 'music', description: 'my fav music' },
        { name: 'video games', description: 'my fav games!!' },
        { name: 'friends', description: 'my internet neighbors' },
        { name: 'guestbook', description: 'my guestbook' },
        { name: 'faq', description: 'frequently asked questions' },
        { name: 'hobbies', description: 'hobbies and extras' },
        { name: 'gallery', description: 'drawings and photos' },
        { name: 'safe space', description: 'page dedicated to my sister!' },
        { name: 'kitty', description: 'shrine for my cats!' },
        { name: 'boyfriend diary', description: 'shrine for my cute bf' },
        { name: 'special events', description: 'calendar of the site' }
    ];

    const stellarHunterPages = [
        { name: 'album', description: 'album of drawings and stories' },
        { name: 'encyclopedia', description: 'infos about the stars' },
        { name: 'end', description: 'thanks for being here!' }
    ];

    createConstellation({
        id: 'filesystem',
        label: 'Filesystem',
        labelPosition: { x: '50%', y: 25 },
        pages: filesystemPages,
        stars: [
            { x: '20%', y: '20%' },
            { x: '30%', y: '30%' },
            { x: '40%', y: '40%' },
            { x: '50%', y: '35%' },
            { x: '60%', y: '40%' },
            { x: '70%', y: '30%' },
            { x: '80%', y: '40%' },
            { x: '70%', y: '50%' },
            { x: '60%', y: '60%' },
            { x: '50%', y: '70%' },
            { x: '40%', y: '60%' },
            { x: '30%', y: '50%' },
            { x: '20%', y: '50%' }
        ],
        lines: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
            [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
            [10, 11], [11, 12], [12, 0]
        ],
        brightStars: [0, 3, 9, 12],
        youAreHere: 12
    });

    createConstellation({
        id: 'personal',
        label: 'Personal',
        labelPosition: { x: '50%', y: 25 },
        pages: personalPages,
        stars: [
            { x: '20%', y: '20%' },
            { x: '30%', y: '30%' },
            { x: '40%', y: '35%' },
            { x: '50%', y: '40%' },
            { x: '60%', y: '35%' },
            { x: '70%', y: '40%' },
            { x: '80%', y: '50%' },
            { x: '70%', y: '60%' },
            { x: '60%', y: '70%' },
            { x: '40%', y: '60%' },
            { x: '30%', y: '50%' },
            { x: '20%', y: '45%' }
        ],
        lines: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
            [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
            [10, 11], [11, 0]
        ],
        brightStars: [0, 4, 8]
    });

    createConstellation({
        id: 'stellar-hunter',
        label: 'Stellar Hunter',
        labelPosition: { x: '50%', y: 25 },
        pages: stellarHunterPages,
        stars: [
            { x: '30%', y: '30%' },
            { x: '50%', y: '50%' },
            { x: '70%', y: '40%' },
        ],
        lines: [
            [0, 1], [1, 2], [2, 0]
        ],
        brightStars: [0, 2]
    });

    animateConstellations();

    window.addEventListener('resize', debounce(() => {
        document.querySelectorAll('.constellation').forEach(c => {
            c.innerHTML = '';
        });

        createConstellation({
            id: 'filesystem',
            label: 'Filesystem',
            labelPosition: { x: '50%', y: 25 },
            pages: filesystemPages,
            stars: [
                { x: '20%', y: '20%' },
                { x: '30%', y: '30%' },
                { x: '40%', y: '40%' },
                { x: '50%', y: '35%' },
                { x: '60%', y: '40%' },
                { x: '70%', y: '30%' },
                { x: '80%', y: '40%' },
                { x: '70%', y: '50%' },
                { x: '60%', y: '60%' },
                { x: '50%', y: '70%' },
                { x: '40%', y: '60%' },
                { x: '30%', y: '50%' },
                { x: '20%', y: '50%' }
            ],
            lines: [
                [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
                [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
                [10, 11], [11, 12], [12, 0]
            ],
            brightStars: [0, 3, 9, 12],
            youAreHere: 12
        });

        createConstellation({
            id: 'personal',
            label: 'Personal',
            labelPosition: { x: '50%', y: 25 },
            pages: personalPages,
            stars: [
                { x: '20%', y: '20%' },
                { x: '30%', y: '30%' },
                { x: '40%', y: '35%' },
                { x: '50%', y: '40%' },
                { x: '60%', y: '35%' },
                { x: '70%', y: '40%' },
                { x: '80%', y: '50%' },
                { x: '70%', y: '60%' },
                { x: '60%', y: '70%' },
                { x: '40%', y: '60%' },
                { x: '30%', y: '50%' },
                { x: '20%', y: '45%' }
            ],
            lines: [
                [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
                [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
                [10, 11], [11, 0]
            ],
            brightStars: [0, 4, 8]
        });

        createConstellation({
            id: 'stellar-hunter',
            label: 'Stellar Hunter',
            labelPosition: { x: '50%', y: 25 },
            pages: stellarHunterPages,
            stars: [
                { x: '30%', y: '30%' },
                { x: '50%', y: '50%' },
                { x: '70%', y: '40%' },
            ],
            lines: [
                [0, 1], [1, 2], [2, 0]
            ],
            brightStars: [0, 2]
        });

        const activeConstId = document.querySelector('.constellation.active').id;
        toggleConstellation(activeConstId);

        document.getElementById('background-stars').innerHTML = '';
        createBackgroundStars();
    }, 200));

    document.addEventListener('click', (e) => {
        const infoPanel = document.getElementById('info-panel');
        const stars = document.querySelectorAll('.star');
        const treeViewOverlay = document.getElementById('tree-view-overlay');
        const treeViewPanel = document.querySelector('.tree-view-panel');

        let clickedOnStar = false;
        stars.forEach(star => {
            if (star.contains(e.target)) {
                clickedOnStar = true;
            }
        });

        if (!clickedOnStar && !infoPanel.contains(e.target) && infoPanel.classList.contains('active')) {
            closeInfoPanel();
        }

        if (treeViewOverlay.classList.contains('active') && 
            !treeViewPanel.contains(e.target) && 
            !treeViewButton.contains(e.target)) {
            closeTreeView();
        }
    });
});

function createBackgroundStars() {
    const container = document.getElementById('background-stars');
    const starCount = Math.floor(window.innerWidth * window.innerHeight / 2000);

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'bg-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.opacity = `${Math.random() * 0.5 + 0.1}`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        container.appendChild(star);
    }
}

function animateConstellations() {
    const constellations = document.querySelectorAll('.constellation');

    constellations.forEach((constellation, index) => {

        const animateConstellation = () => {
            const time = Date.now();

            const xOffset = Math.sin(time / 10000 + index * 0.7) * 5;
            const yOffset = Math.cos(time / 12000 + index * 0.5) * 5;
            const rotateOffset = Math.sin(time / 15000 + index * 0.3) * 0.5; 

            constellation.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0) rotateZ(${rotateOffset}deg)`;
            requestAnimationFrame(animateConstellation);
        };

        animateConstellation();
    });
}

function createConstellation(config) {
    const container = document.getElementById(config.id);

    const label = document.createElement('div');
    label.className = 'constellation-label';
    label.textContent = config.label;
    label.style.left = config.labelPosition.x;
    label.style.top = `${config.labelPosition.y}px`;
    container.appendChild(label);

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    config.stars.forEach((star, index) => {
        const page = config.pages[index];

        const xPos = typeof star.x === 'string' ?
            (parseFloat(star.x) / 100) * containerWidth : star.x;
        const yPos = typeof star.y === 'string' ?
            (parseFloat(star.y) / 100) * containerHeight : star.y;

        const starElement = document.createElement('img');
        starElement.src = 'visuals/star-point.png';
        starElement.className = 'star';
        if (config.brightStars && config.brightStars.includes(index)) {
            starElement.className += ' bright';
        }
        starElement.style.left = `${xPos}px`;
        starElement.style.top = `${yPos}px`;
        starElement.style.animationDelay = `${Math.random() * 2}s`;
        starElement.dataset.page = page.name;
        starElement.dataset.description = page.description;
        starElement.dataset.constellation = config.id;
        starElement.dataset.index = index;

        if (config.youAreHere === index) {
            starElement.dataset.here = "true";
        }

        starElement.addEventListener('click', (e) => {
            e.stopPropagation();

            const selectionSound = new Audio('visuals/selection.mp3');
            selectionSound.play();
            selectStar(starElement);
        });

        container.appendChild(starElement);

        const pageLabel = document.createElement('div');
        pageLabel.className = 'page-label';
        pageLabel.textContent = page.name;
        pageLabel.style.left = `${xPos + 20}px`;
        pageLabel.style.top = `${yPos}px`;

        if (config.youAreHere === index) {
            pageLabel.className += ' you-are-here';
        }

        container.appendChild(pageLabel);
    });

    config.lines.forEach(line => {
        const start = config.stars[line[0]];
        const end = config.stars[line[1]];

        const startX = typeof start.x === 'string' ?
            (parseFloat(start.x) / 100) * containerWidth : start.x;
        const startY = typeof start.y === 'string' ?
            (parseFloat(start.y) / 100) * containerHeight : start.y;
        const endX = typeof end.x === 'string' ?
            (parseFloat(end.x) / 100) * containerWidth : end.x;
        const endY = typeof end.y === 'string' ?
            (parseFloat(end.y) / 100) * containerHeight : end.y;

        const lineElement = document.createElement('div');
        lineElement.className = 'line';

        const length = Math.sqrt(
            Math.pow(endX - startX, 2) +
            Math.pow(endY - startY, 2)
        );

        const angle = Math.atan2(
            endY - startY,
            endX - startX
        ) * 180 / Math.PI;

        lineElement.style.width = `${length}px`;
        lineElement.style.left = `${startX}px`;
        lineElement.style.top = `${startY}px`;
        lineElement.style.transform = `rotate(${angle}deg)`;
        lineElement.style.animationDelay = `${Math.random() * 2}s`;

        container.appendChild(lineElement);
    });
}

function toggleConstellation(id) {
    const selectionSound = new Audio('visuals/selection.mp3');
    selectionSound.play();

    const constellations = document.querySelectorAll('.constellation');
    const buttons = document.querySelectorAll('.category-button');
    const containers = document.querySelectorAll('.constellation-container');

    buttons.forEach(button => {
        if (button.id === `${id}-btn`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    constellations.forEach(c => {
        if (c.id === id) {
            c.classList.add('active');
            c.classList.remove('inactive');
        } else {
            c.classList.add('inactive');
            c.classList.remove('active');
        }
    });

    containers.forEach(container => {
        if (container.id === `${id}-container`) {
            container.style.transform = 'scale(1.1) translateZ(50px)';
            container.style.zIndex = 3;
        } else {
            container.style.transform = 'scale(0.85) translateZ(-50px)';
            container.style.zIndex = 1;
        }
    });

    document.getElementById('current-location').textContent = `Current constellation: ${id.charAt(0).toUpperCase() + id.slice(1)}`;

    closeInfoPanel();
}

function selectStar(star) {
    if (selectedStar) {
        selectedStar.classList.remove('selected');
    }

    if (selectedStar === star) {
        closeInfoPanel();
        selectedStar = null;
        return;
    }

    selectedStar = star;
    star.classList.add('selected');

    const page = star.dataset.page;
    const description = star.dataset.description;
    const isHere = star.dataset.here === "true";

    const panel = document.getElementById('info-panel');
    const panelTitle = document.getElementById('panel-title');
    const panelDescription = document.getElementById('panel-description');

    panelTitle.textContent = page;

    if (isHere) {
        panelDescription.innerHTML = `${description} <span class="you-are-here">(You are here!)</span>`;
    } else {
        panelDescription.textContent = description;
    }

    panel.classList.add('active');

    const starRect = star.getBoundingClientRect();
    panel.style.top = `${starRect.bottom + 10}px`;
    panel.style.left = `${starRect.left}px`;

    setTimeout(() => {
        const panelRect = panel.getBoundingClientRect();
        if (panelRect.right > window.innerWidth) {
            panel.style.left = `${window.innerWidth - panelRect.width - 20}px`;
        }
        if (panelRect.bottom > window.innerHeight) {
            panel.style.top = `${starRect.top - panelRect.height - 10}px`;
        }
    }, 10);
}

function closeInfoPanel() {
    const panel = document.getElementById('info-panel');
    panel.classList.remove('active');

    if (selectedStar) {
        selectedStar.classList.remove('selected');
        selectedStar = null;
    }
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

window.closeTreeView = function() {
    document.getElementById('tree-view-overlay').classList.remove('active');
};