class ResourcesManager {
    constructor() {
        this.currentSelected = 0;
        this.resources = document.querySelectorAll('.resources-about-2, .resources-about, .resources-tools, .resources-tutorials, .resources-gamedev');
        this.contentDiv = document.querySelector('.content-div');
        this.contentText = document.querySelector('.p');
        this.hoverEffects = [];
        this.confirmSound = document.getElementById('confirm-sound');
        this.selectSound = document.getElementById('select-sound');
        this.movingSound = document.getElementById('moving-sound');

        this.resourceMapping = this.createResourceMapping();
        this.init();
    }
    
    createResourceMapping() {
        const mapping = {};
        this.resources.forEach((resource, index) => {
            if (resource.classList.contains('resources-about-2')) {
                mapping[index] = 0; // Frontend Development Resources (first in visual order)
            } else if (resource.classList.contains('resources-about')) {
                mapping[index] = 1; // Graphics and Design Resources (second in visual order)
            } else if (resource.classList.contains('resources-tools')) {
                mapping[index] = 2; // Quick Tools for Coding (third in visual order)
            } else if (resource.classList.contains('resources-tutorials')) {
                mapping[index] = 3; // Tutorials for Web Development (fourth in visual order)
            } else if (resource.classList.contains('resources-gamedev')) {
                mapping[index] = 4; // Game Development Resources (fifth in visual order)
            }
        });
        return mapping;
    }
    
    init() {
        this.createHoverEffects();
        this.addEventListeners();
        this.updateSelection(0, false);
        this.showWelcomeMessage();
    }
    
    showWelcomeMessage() {
        const welcomeMessage = `
            <div style="text-align: center; padding: 40px 20px; color: #eefaffff;">
                <h2 style="margin-bottom: 20px; font-size: 35px; font-family: 'trojan', sans-serif">Welcome to Resources Hub</h2>
                <p style="font-size: 18px; line-height: 1.6; opacity: 0.9;">
                    Select a category from the left menu to explore curated resources for web development or even more.
                    <br><br>
                    Use your mouse to navigate through the options.
                </p>
            </div>
        `;
        this.contentText.innerHTML = welcomeMessage;
        this.contentDiv.style.opacity = '0.6';
        this.contentText.style.opacity = '1';
    }
    
    createHoverEffects() {
        this.resources.forEach((resource, index) => {
            const hoverEffect = document.createElement('img');
            hoverEffect.className = 'hover-effect';
            hoverEffect.src = 'assets/hover-effect.png';
            hoverEffect.style.cssText = `
                position: absolute;
                mix-blend-mode: luminosity;
                background-blend-mode: overlay;
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
                z-index: 1;
            `;
            
            if (resource.classList.contains('resources-about-2')) {
                Object.assign(hoverEffect.style, {
                    width: '889px',
                    height: '83px',
                    top: '8px',
                    left: '78px'
                });
            } else if (resource.classList.contains('resources-gamedev')) {
                Object.assign(hoverEffect.style, {
                    width: '842px',
                    height: '87px',
                    top: '0px',
                    left: '61px'
                });
            } else {
                Object.assign(hoverEffect.style, {
                    width: '842px',
                    height: '87px',
                    top: '0px',
                    left: '61px'
                });
            }
            
            const overlapContainer = resource.querySelector('.overlap-group, .overlap');
            if (overlapContainer) {
                overlapContainer.style.position = 'relative';
                overlapContainer.appendChild(hoverEffect);
            }
            this.hoverEffects.push(hoverEffect);
        });
    }
    
    addEventListeners() {
        this.resources.forEach((resource, index) => {
            resource.addEventListener('mouseenter', () => this.handleHover(index));
            resource.addEventListener('click', () => this.handleSelect(index));
        });

    }
    
    handleHover(index) {
        this.playSound(this.movingSound);
        this.updateSelection(index, false);
    }
    
    handleSelect(index) {
        this.playSound(this.confirmSound);
        this.updateSelection(index, true);
        this.loadContent(index);
    }
    

    
    playSound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    
    updateSelection(index, isConfirm = false) {
        this.currentSelected = index;
        this.hoverEffects.forEach((effect, i) => {
            if (i === index) {
                effect.style.opacity = isConfirm ? '0.8' : '0.6';
                effect.style.transform = isConfirm ? 'scale(1.02)' : 'scale(1)';
            } else {
                effect.style.opacity = '0';
                effect.style.transform = 'scale(1)';
            }
        });
    }
    
    loadContent(index) {
        // Use the mapping to get the correct resource data index
        const dataIndex = this.resourceMapping[index];
        const resources = this.getResourcesData(dataIndex);
        const categoryTitle = this.getCategoryTitle(dataIndex);
        
        this.contentDiv.style.opacity = '0';
        this.contentText.style.opacity = '0';
        
        setTimeout(() => {
            this.createResourceList(resources, categoryTitle);
            this.contentDiv.style.opacity = '0.6';
            this.contentText.style.opacity = '1';
        }, 300);
    }
    
    getCategoryTitle(dataIndex) {
        const titles = [
            "Frontend Development Resources",
            "Graphics and Design Resources", 
            "Quick Tools for Coding",
            "Tutorials for Web Development",
            "Game Development Resources"
        ];
        return titles[dataIndex] || "Resources";
    }
    
    createResourceList(resources, categoryTitle) {
        const existingList = document.querySelector('.resources-scroll-container');
        if (existingList) existingList.remove();
        
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'resources-scroll-container';
        scrollContainer.style.cssText = `
            position: absolute;
            top: 100px;
            left: 67px;
            width: 599px;
            height: 600px;
            overflow-y: auto;
            opacity: 0;
            transition: opacity 0.5s ease;
            padding-right: 10px;
        `;
        
        const listContainer = document.createElement('div');
        listContainer.className = 'resources-list';
        listContainer.style.cssText = `
            font-family: 'zhcn', sans-serif;
            font-size: 20px;
            color: #ffffff;
            padding: 20px 0;
        `;
        

        const titleElement = document.createElement('h3');
        titleElement.textContent = categoryTitle;
        titleElement.style.cssText = `
            color: #ffffffff;
            font-size: 28px;
             font-family: "trojan", Helvetica;
            text-align: center;
            border-bottom: 2px solid rgba(226, 247, 255, 0.3);
            padding-bottom: 10px;
        `;
        listContainer.appendChild(titleElement);
        
        resources.forEach((resource, index) => {
            const listItem = this.createListItem(resource, index);
            listContainer.appendChild(listItem);
        });
        
        scrollContainer.appendChild(listContainer);
        const overlapContainer = document.querySelector('.overlap-2');
        if (overlapContainer) {
            overlapContainer.appendChild(scrollContainer);
        }
        this.contentText.innerHTML = '';
        setTimeout(() => scrollContainer.style.opacity = '1', 100);
    }
    
    createListItem(resource, index) {
        const listItem = document.createElement('div');
        listItem.className = 'resource-item';
        listItem.style.cssText = `
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        `;
        
        const dot = document.createElement('img');
        dot.src = 'assets/list-dot.png';
        dot.style.cssText = `
            width: 40px;
            height: 40px;
            margin-right: 15px;
            margin-top: 5px;
            flex-shrink: 0;
        `;
        
        const text = document.createElement('div');
        text.innerHTML = resource.link ? 
            `<a href="${resource.link}" target="_blank" style="color: #87CEEB; text-decoration: none;">${resource.name}</a> - ${resource.description}` :
            `<strong>${resource.name}</strong> - ${resource.description}`;
        text.style.lineHeight = '1.4';
        
        listItem.appendChild(dot);
        listItem.appendChild(text);
        
        setTimeout(() => {
            listItem.style.opacity = '1';
            listItem.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
        
        return listItem;
    }
    
    getResourcesData(index) {
        const resourcesData = [
            // Frontend Development Resources (index 0)
            [
                { name: "PretraPixel", description: "Very cool neocities site with good resources and tools!", link: "https://petrapixel.neocities.org/" },
                { name: "CSS Grid Generator", description: "Visual CSS grid layout generator", link: "https://cssgrid-generator.netlify.app/" },
                { name: "Flexbox Generator", description: "Interactive flexbox layout generator", link: "https://angrytools.com/css-flex" },
                { name: "HTML Formatter", description: "Online HTML code formatter and beautifier", link: "https://smalldev.tools/html-formatter-online" },
                { name: "CSS Formatter", description: "Beautify and format CSS code online", link: "https://beautifytools.com/css-beautifier.php" },
                { name: "HTML Validator", description: "W3C markup validation service", link: "https://validator.w3.org/" },
                { name: "CSS Validator", description: "W3C CSS validation service", link: "https://jigsaw.w3.org/css-validator/" },
                { name: "Unclosed Divs Finder", description: "Find unclosed HTML divs and tags", link: "https://www.aliciaramirez.com/closing-tags-checker/" },
                { name: "CSS Grid Cheatsheet", description: "Visual CSS grid reference guide", link: "https://grid.malven.co/" },
                { name: "Flexbox Cheatsheet", description: "Visual flexbox reference guide", link: "https://flexbox.malven.co/" },
                { name: "Layoutit Grid", description: "CSS grid layout generator with visual interface", link: "https://grid.layoutit.com/" },
                { name: "Clippy CSS", description: "CSS clip-path maker for complex shapes", link: "https://bennettfeely.com/clippy/" },
                { name: "CSS Background Patterns", description: "Generate CSS background patterns", link: "https://www.magicpattern.design/tools/css-backgrounds" },
                { name: "Hover.css Effects", description: "CSS hover effects and transitions", link: "https://github.com/IanLunn/Hover" },
                { name: "Animate.css", description: "Cross-browser CSS animations library", link: "https://animejs.com/" },
                { name: "30 Seconds of Code", description: "Short code snippets for frontend development", link: "https://www.30secondsofcode.org/" },
                { name: "JavaScript Free Code", description: "Collection of free JavaScript code snippets", link: "https://www.javascriptfreecode.com/" },
                { name: "CSSmatic Tools", description: "CSS tools for web designers and developers", link: "https://cssmatic.com/" },
                { name: "CodeBeautify", description: "Online tools for code formatting and validation", link: "https://codebeautify.org/" },
                { name: "Interactive CSS Grid", description: "Josh Comeau's interactive guide to CSS Grid", link: "https://www.joshwcomeau.com/css/interactive-guide-to-grid/" },
                { name: "Flickity Carousel", description: "Touch-responsive, flickable carousels", link: "https://flickity.metafizzy.co/" },
                { name: "Muuri Layout", description: "JavaScript layout engine for responsive grids", link: "https://github.com/haltu/muuri" },
                { name: "LightGallery", description: "Modular light-box gallery plugin", link: "https://www.lightgalleryjs.com/" },
                { name: "Accessibility Tools", description: "W3C web accessibility evaluation tools", link: "https://www.w3.org/WAI/ER/tools/" },
                { name: "Webpack", description: "Module bundler for modern JavaScript applications", link: "https://webpack.js.org" },
                { name: "Vite", description: "Next generation frontend build tool", link: "https://vitejs.dev" },
                { name: "Tailwind CSS", description: "Utility-first CSS framework for rapid UI development", link: "https://tailwindcss.com" },
                { name: "Bootstrap", description: "Popular CSS framework for responsive web design", link: "https://getbootstrap.com" },
                { name: "Sass/SCSS", description: "CSS preprocessor with variables and mixins", link: "https://sass-lang.com" },
                { name: "TypeScript", description: "Typed superset of JavaScript for large applications", link: "https://typescriptlang.org" },
                { name: "ESLint", description: "JavaScript linter for code quality and consistency", link: "https://eslint.org" },
                { name: "Prettier", description: "Opinionated code formatter for consistent styling", link: "https://prettier.io" }
            ],
            // Graphics and Design Resources (index 1)
            [
                { name: "Design Resources for Developers", description: "Curated list of design and UI resources from stock photos, web templates, CSS frameworks, UI libraries, tools and much more", link: "https://github.com/bradtraversy/design-resources-for-developers" },
                { name: "Simple Icons SVG", description: "SVG icons for popular brands", link: "https://simpleicons.org/" },
                { name: "New Masters Academy Art Course", description: "Comprehensive art courses covering various topics", link: "https://www.nma.art/v3/course-catalog/" },
                {name: "Line of Action", description: "Figure drawing reference tool for art studies", link: "https://line-of-action.com/" },
                {name: "How to Paint by Michał Sawtyruk", description: "6-steps tutorial on digital painting", link: "https://www.youtube.com/watch?v=dkUHSeB9VdY"},
                { name: "Pixel Principles", description: "YouTube channel focused on pixel art techniques and tutorials by an indie artist and dev", link: "https://www.youtube.com/@PixelPrinciples" },
                { name: "Pixel Hoo", description: "YouTube channel dedicated to pixel art tutorials and resources", link: "https://www.youtube.com/@PixelHoo" },
                { name: "How to Draw Pixel Art Trees by Pixel Overload", description: "Learn how to create pixel art trees in this step-by-step tutorial", link: "https://youtu.be/VLuKpgkOuKM?si=yH_wcw-Sue6vTOVL" },
                { name: "Lospec Pixel School", description: "Learn pixel art from the ground up. Lospec also have tutorials and color palettes that you can use for free!", link: "https://lospec.com/pixel-school/" },
                { name: "Pixel Art Guide by Juniper Dev", description: "In-depth guide to creating pixel art as a beginner", link: "https://www.youtube.com/watch?v=DKmrBUpd0yw" },
                { name: "FireAlpaca", description: "Free digital painting software with amazing materials", link: "https://firealpaca.com/" },
                { name: "Krita", description: "Open-source digital painting software", link: "https://krita.org/en/" },
                { name: "Krita Artists Community Forum", description: "Community forum for Krita users. Maybe you can find cool resources like brushes and tools here!", link: "https://krita-artists.org/" },
                { name: "Figma", description: "Collaborative interface design and prototyping tool", link: "https://figma.com" },
                { name: "Adobe Creative Suite", description: "Professional design software including Photoshop, Illustrator", link: "https://adobe.com" },
                { name: "Unsplash", description: "High-quality free stock photography", link: "https://unsplash.com" },
                { name: "Font Awesome", description: "Scalable vector icons and social logos", link: "https://fontawesome.com" },
                { name: "Google Fonts", description: "Free web fonts optimized for the web", link: "https://fonts.google.com" },
                { name: "Coolors", description: "Color palette generator and design inspiration", link: "https://coolors.co" },
                { name: "Dribbble", description: "Design inspiration and creative community", link: "https://dribbble.com" },
                { name: "Canva", description: "Easy-to-use graphic design tool for non-designers", link: "https://canva.com" },
                { name: "Pexels", description: "Free stock photos and videos for commercial use", link: "https://pexels.com" },
                { name: "Pixabay", description: "Free images, photos, and vectors", link: "https://pixabay.com" },
                { name: "Icons8", description: "Icons, illustrations, photos, and design tools", link: "https://icons8.com" },
                { name: "Feather Icons", description: "Simply beautiful open source icons", link: "https://feathericons.com" },
                { name: "Heroicons", description: "Beautiful hand-crafted SVG icons by Tailwind CSS team", link: "https://heroicons.com" },
                { name: "Adobe Color", description: "Create and explore color themes and palettes", link: "https://color.adobe.com" },
                { name: "Sketch", description: "Digital design toolkit for Mac", link: "https://sketch.com" }
            ],
            // Quick Tools for Coding (index 2)
            [
                { name: "Visual Studio Code", description: "Free, powerful source code editor with extensions", link: "https://code.visualstudio.com" },
                { name: "CodePen", description: "Online code editor for front-end development", link: "https://codepen.io" },
                { name: "JSFiddle", description: "Test and share JavaScript, CSS, HTML snippets", link: "https://jsfiddle.net" },
                { name: "GitHub", description: "Version control and collaborative development platform", link: "https://github.com" },
                { name: "Stack Overflow", description: "Programming Q&A community and knowledge base", link: "https://stackoverflow.com" },
                { name: "Can I Use", description: "Browser compatibility tables for web technologies", link: "https://caniuse.com" },
                { name: "Postman", description: "API development and testing tool", link: "https://postman.com" },
                { name: "Chrome DevTools", description: "Built-in browser developer tools for debugging", link: null },
                { name: "RegExr", description: "Learn, build, and test regular expressions", link: "https://regexr.com" },
                { name: "JSON Formatter", description: "Validate and format JSON data online", link: "https://jsonformatter.curiousconcept.com" },
                { name: "Minify", description: "Minify JavaScript, CSS, and HTML code", link: "https://minifier.org" },
                { name: "Base64 Encode/Decode", description: "Encode and decode Base64 strings", link: "https://base64decode.org" },
                { name: "Lorem Ipsum Generator", description: "Generate placeholder text for designs", link: "https://loremipsum.io" },
                { name: "Placeholder.com", description: "Generate placeholder images for layouts", link: "https://placeholder.com" }
            ],
            // Tutorials for Web Development (index 3)
            [
                { name: "MDN Web Docs", description: "Complete web development documentation and tutorials", link: "https://developer.mozilla.org" },
                { name: "freeCodeCamp", description: "Free coding bootcamp with interactive lessons", link: "https://freecodecamp.org" },
                { name: "W3Schools", description: "Easy-to-follow tutorials for web technologies", link: "https://w3schools.com" },
                { name: "CSS-Tricks", description: "Advanced CSS techniques and modern web design", link: "https://css-tricks.com" },
                { name: "JavaScript.info", description: "Modern JavaScript tutorial from basics to advanced", link: "https://javascript.info" },
                { name: "React Documentation", description: "Official React library documentation and guides", link: "https://react.dev" },
                { name: "Vue.js Guide", description: "Progressive JavaScript framework tutorial", link: "https://vuejs.org" },
                { name: "Node.js Tutorials", description: "Server-side JavaScript development guides", link: "https://nodejs.org" },
                { name: "Codecademy", description: "Interactive coding lessons and courses", link: "https://codecademy.com" },
                { name: "Khan Academy", description: "Free computer programming courses", link: "https://khanacademy.org" },
                { name: "Coursera", description: "University-level web development courses", link: "https://coursera.org" },
                { name: "Udemy", description: "Online courses for web development skills", link: "https://udemy.com" },
                { name: "YouTube Coding Channels", description: "Free video tutorials from various creators", link: null },
                { name: "The Odin Project", description: "Full stack web development curriculum", link: "https://theodinproject.com" }
            ],
            // Game Development Resources (index 4)
            [
                { name: "Unity", description: "Powerful cross-platform game engine with C# scripting", link: "https://unity.com" },
                { name: "Unreal Engine", description: "Advanced 3D game engine with visual scripting", link: "https://unrealengine.com" },
                { name: "Godot", description: "Free and open-source game engine with GDScript", link: "https://godotengine.org" },
                { name: "Itch.io", description: "Independent game publishing platform and community", link: "https://itch.io" },
                { name: "Game Development Patterns", description: "Design patterns for game programming", link: "https://gameprogrammingpatterns.com" },
                { name: "Brackeys Tutorials", description: "Popular Unity game development tutorials", link: "https://brackeys.com" },
                { name: "GDC Vault", description: "Game Developers Conference talks and presentations", link: "https://gdcvault.com" },
                { name: "OpenGameArt", description: "Free game assets and art resources", link: "https://opengameart.org" },
                { name: "Kenney Assets", description: "Free game assets and sprites", link: "https://kenney.nl" },
                { name: "Freesound", description: "Free audio samples and sound effects", link: "https://freesound.org" },
                { name: "BFXR", description: "Sound effect generator for retro games", link: "https://www.bfxr.net" },
                { name: "Tiled Map Editor", description: "Flexible tile map editor for 2D games", link: "https://mapeditor.org" },
                { name: "Aseprite", description: "Pixel art and animation tool for sprites", link: "https://aseprite.org" },
                { name: "Blender", description: "Free 3D modeling and animation software", link: "https://blender.org" },
                { name: "GIMP", description: "Free image editor for game graphics", link: "https://gimp.org" },
                { name: "Audacity", description: "Free audio editing software for game sounds", link: "https://audacityteam.org" },
                { name: "Libresprite", description: "Free and open-source sprite editor", link: "https://libresprite.github.io/#!/#page-top" },
                { name: "The Book of Shaders", description: "Learn about shaders and graphics programming in Godot", link: "https://thebookofshaders.com/?lan=es" },
                { name: "Webtyler", description: "Helpful tool to convert 15-piece tilesets to 47-piece sets", link: "https://wareya.github.io/webtyler/" },
                { name: "Dual-Grid system explained by ThinMatrix", description: "Simple and clear explanation of the dual-grid system for game development", link: "https://youtu.be/buKQjkad2I0?si=x0a3d18lravkCYre" },
                { name: "Dual-Grid system explained by Oskar Stålberg", description: "In-depth explanation of the dual-grid system for game development, made by Oskar Stålberg!", link: "https://www.youtube.com/watch?v=Uxeo9c-PX-w&t=308s" },
                { name: "5 Godot Particles for 2D Games by Single-Minded Ryan", description: "Explore five unique particle effects for 2D games in Godot", link: "https://youtu.be/DBrTin3SODY?si=l-NkSJz3T7h_wSWy"},
                { name: "Godot Docs in English", description: "Official documentation for Godot Engine, available in English", link: "https://docs.godotengine.org/en/stable/" },
                { name: "Math for Game Developers?", description: "Learn about essential math concepts for game development", link: "https://www.youtube.com/watch?v=eRVRioN4GwA" },
                { name: "Coco Code", description: "YouTube channel focused on game development tutorials and tips", link: "https://www.youtube.com/@CocoCode" },
                { name: "Dialogue Manager for Godot", description: "Powerful tool for creating and managing dialogues in Godot games", link: "https://dialogue.nathanhoad.net/" },
                { name: "Dialogic", description: "Visual novel and dialogue system for Godot", link: "https://dialogic.pro/" }
            ]
        ];
        return resourcesData[index] || resourcesData[0];
    }
}

const styles = `
    .resources-about-2, .resources-about, .resources-tools, .resources-tutorials, .resources-gamedev {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    .resources-about-2:hover, .resources-about:hover, .resources-tools:hover, .resources-tutorials:hover, .resources-gamedev:hover {
        transform: translateX(5px);
    }
    .content-div {
        transition: opacity 0.3s ease;
    }
    .content-div::-webkit-scrollbar {
        width: 8px;
    }
    .content-div::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
    .content-div::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
    }
    .content-div::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
    .resources-scroll-container::-webkit-scrollbar {
        width: 12px;
    }
    .resources-scroll-container::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 6px;
    }
    .resources-scroll-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.4);
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: content-box;
    }
    .resources-scroll-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.6);
        background-clip: content-box;
    }
    .resources-scroll-container::-webkit-scrollbar-thumb:active {
        background: rgba(255, 255, 255, 0.8);
        background-clip: content-box;
    }
    .p {
        transition: opacity 0.3s ease;
    }
    .resource-item a:hover {
        color: #ADD8E6 !important;
        text-decoration: underline !important;
    }
`;

document.addEventListener('DOMContentLoaded', () => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    new ResourcesManager();
    const audioElements = [
        document.getElementById('background-music'),
        document.getElementById('ambience-sound')
    ];
    audioElements.forEach(audio => {
        if (audio) {
            audio.loop = true;
            audio.play().catch(() => {});
        }
    });
});