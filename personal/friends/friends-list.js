const clickSound = document.createElement('audio');
clickSound.id = 'click-sound';
clickSound.src = '../../assets/sound-effects/select.mp3';
document.body.appendChild(clickSound);

const starSound = document.createElement('audio');
starSound.id = 'star-sound';
starSound.src = '../../assets/sound-effects/mystical-chime.mp3';
document.body.appendChild(starSound);

const blurOverlay = document.createElement('div');
blurOverlay.className = 'blur-overlay';
document.body.appendChild(blurOverlay);

const constellationImage = document.createElement('div');
constellationImage.className = 'constellation-image';
document.body.appendChild(constellationImage);

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .blur-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.05);
        display: none;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }

    .constellation-image {
        position: fixed;
        left: 900px;
        top: 50%;
        transform: translateY(-50%) scale(0.95);
        width: 400px;
        height: 400px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        display: none;
        z-index: 999;
        opacity: 0;
        transition: opacity 0.6s cubic-bezier(0.19, 1, 0.22, 1), 
                    transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    filter 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) 
               drop-shadow(0 0 40px rgba(255, 255, 255, 0.6)) 
               drop-shadow(0 0 60px rgba(255, 255, 255, 0.4));
    }

    .constellation-image.active {
        opacity: 1;
        transform: translateY(-50%) scale(1);
    }

    @keyframes pulseGlow {
        0%, 100% {
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))
                   drop-shadow(0 0 40px rgba(255, 255, 255, 0.6))
                   drop-shadow(0 0 60px rgba(255, 255, 255, 0.4));
        }
        50% {
            filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1))
                   drop-shadow(0 0 50px rgba(255, 255, 255, 0.8))
                   drop-shadow(0 0 70px rgba(255, 255, 255, 0.6));
        }
    }

    .constellation-image {
        animation: pulseGlow 2s infinite;
    }

    .inventory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 1rem;
        padding: 1rem;
    }

    .inventory-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.5rem;
        transform: translateY(20px);
        opacity: 0;
        animation: itemAppear 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    }
    
    @keyframes itemAppear {
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .inventory-item:nth-child(1) { animation-delay: 0.1s; }
    .inventory-item:nth-child(2) { animation-delay: 0.2s; }
    .inventory-item:nth-child(3) { animation-delay: 0.3s; }
    .inventory-item:nth-child(4) { animation-delay: 0.4s; }
    .inventory-item:nth-child(5) { animation-delay: 0.5s; }

    .inventory-item img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                   filter 0.3s cubic-bezier(0.19, 1, 0.22, 1);
    }

    .inventory-item span {
        font-size: 0.9rem;
        color: #fff;
    }
    
    .constellation-image:hover {
        filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1))
                drop-shadow(0 0 50px rgba(255, 255, 255, 0.8))
                drop-shadow(0 0 70px rgba(255, 255, 255, 0.6));
    }

    .inventory-item img:hover {
        filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1))
                drop-shadow(0 0 50px rgba(255, 255, 255, 0.8))
                drop-shadow(0 0 70px rgba(255, 255, 255, 0.6));
        transform: scale(1.15); 
    }
    
    .info-panel {
        position: fixed;
        left: 30%;
        top: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 2rem;
        width: 500px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        opacity: 0;
        box-shadow: 0 10px 30px rgba(255, 255, 255, 0.5);
        transition: opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1),
                    transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .info-panel.visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    
    .website-link {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
        text-decoration: none;
        border-radius: 4px;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .website-link:hover {
        background-color: rgba(255, 255, 255, 0.34);
        filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1))
                drop-shadow(0 0 50px rgba(255, 255, 255, 0.8))
                drop-shadow(0 0 70px rgba(255, 255, 255, 0.6));
        transform: scale(1.05);
    }
    
    .close-button {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .close-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }
    
    .star-tabs {
        display: flex;
        gap: 5px;
        margin-bottom: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        padding-bottom: 10px;
    }
    
    .star-tab {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 4px;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .star-tab:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
    }
    
    .star-tab.active {
        color: white;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }
    
    .star-tab-content {
        display: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    .star-tab-content.active {
        display: block;
        animation: fadeInUp 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(styleSheet);

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

const infoPanel = document.createElement('div');
infoPanel.className = 'info-panel';
document.body.appendChild(infoPanel);

const particles = [];
const num_particles = 250;
const distance = 200;
const speed = 0.3;
const radius = 3;
const lineWidth = 0.5;
const maxConnections = 5;

const specialParticles = [
    {
        name: "SelySun",
        description: "Selysun is a digital artist, anime fan, pokémon lover and part of the furry fandom. She is very creative and loves to draw and illustrate. She manages many projects and works alongside Skye to develop amazing things! She is a video game enthusiast. Her drawings are illustrated with an adorable and friendly theme with soft colors.",
        attributes: `✦ Creative drawing and character design skills
✦ INFP 4w5
✦ Cat lover
✦ Personality: Kind
✦ Sobble lover!!
✦ Videogames lover
✦ She likes to look at the clouds lol`,
        inventory: [
            {
                img: "friends-items/dreamy-cone-three-flavors.png",
                name: "dreamy ice cream cone"
            },
            {
                img: "friends-items/a-leisurely-sip.png",
                name: "catpuccino"
            },
            {
                img: "friends-items/lighter-than-air-pancake.png",
                name: "breakfast...?"
            },
            {
                img: "friends-items/tricolor-dango.png",
                name: "dango"
            }
        ],
        websiteUrl: "https://selysun.carrd.co/",
        constellation: "friends-constellation/sely.png"
    },
    {
        name: "RegreDanger",
        description: "RegreDanger is a young developer passionate about technology and code, he is one of Skye's friends who usually shares that love of messing around with code and tech. Regre is learning about programming languages, has projects in mind and is quite motivated by them. He likes Java and Python.",
        attributes: `✦ Future software developer
✦ ISFJ 9w1
✦ Really loves tech!!
✦ Personality: Peppy
✦ Pokémon lover
✦ Java programming skills
✦ Silly humor
✦ Indie videogames lover
✦ Likes to draw`,
        inventory: [
            {
                img: "friends-items/taiyaki.png",
                name: "taiyaki"
            },
            {
                img: "friends-items/potato-fries-sundae.png",
                name: "french fries... with ice cream?"
            },
            {
                img: "friends-items/dream-syrup.png",
                name: "dream syrup"
            },
            {
                img: "friends-items/rainbow-macarons.png",
                name: "macarons!!"
            },
            {
                img: "friends-items/IconCoffe_1.png",
                name: "coffe"
            }
        ],
        website: "",
        websiteUrl:"https://luvrksnskye.github.io/Regredanger-Website/",
        constellation: "friends-constellation/regre.png"
    },
    {
        name: "Luciferaza",
        description: "Luciferaza is a full-time freelance artist who also designs amazing characters and often sells adopts. Her coloring is fantastic and beautiful, she is very good at illustrating and if you would like to find an artist with good content to commission, then she would be your choice!",
        attributes: `✦ Extremely good and constantly improving drawing skills!!
✦ ISFP 6w7
✦ Initially portrayed as stubborn and rude, though she opens up and acts like a good friend
✦ Personality: Lazy
✦ She really enjoys sushi
✦ Xiao lover fr fr
✦ Very silly humor
✦ Indie videogames fan
✦ Loves buttercup flowers
✦ She has many cats and loves them
✦ Genderfluid`,
        inventory: [
            {
                img: "friends-items/hundredlayer-sundae-zero-calories.png",
                name: "huge ice cream lol"
            },
            {
                img: "friends-items/sweet-dream.png",
                name: "sweet dream... Xiao's specialty!"
            },
            {
                img: "friends-items/tuna-sushi.png",
                name: "a full stack of poisoned sushi for some reason"
            },
            {
                img: "friends-items/onigiri.png",
                name: "onigiri"
            },
            {
                img: "friends-items/tea-break-pancake.png",
                name: "very cute breakfast"
            }
        ],
        website: "",
        websiteUrl: "https://linktr.ee/luciferaza",
        constellation: "friends-constellation/luciferaza.png"
    },
    {
        name: "Noiz",
        description: "Noiz is a very talented and unique furry artist, and a good friend too! This rbg dragon has incredible flexibility about his art and the way he handles colors and character designs is just amazing. If you're looking for an artist to illustrate your best scenarios or are looking for someone who specializes in big boys and dragons, then Noiz is the ideal person.",
        attributes: `✦ Big boy with a big heart
✦ INTP 5w6
✦ Really loves dragons!!
✦ Personality: Peppy
✦ Pokémon fan
✦ Kazuha lover
✦ Silly humor
✦ Nice and friendly dragon
✦ He loves cake!!`,
        inventory: [
            {
                img: "friends-items/pour-la-justice.png",
                name: "cake"
            },
            {
                img: "friends-items/rainbow-aster.png",
                name: "rainbow aster"
            },
            {
                img: "friends-items/padisarah-pudding.png",
                name: "pudding!"
            },
            {
                img: "friends-items/sweet-shrimp-sushi.png",
                name: "some sushi he took from his girlfriend"
            },
            {
                img: "friends-items/la-lettre-a-focalors.png",
                name: "more cake"
            },
            {
                img: "friends-items/golden-chicken-burger.png",
                name: "golden chicken burger"
            }
        ],
        website: "Check out Noiz social media!",
        websiteUrl: "https://linktr.ee/NoisyDragon",
        constellation: "friends-constellation/noiz.png"
    },
    {
        name: "Narr",
        description: "A passionate graphic designer and digital artist with a special love for Undertale. Creating unique visual experiences through digital art and design. Narr has been one of my best friends for many years, we've grown together and we're still together today. His content is really good, and his characters have interesting stories. If you like Undertale or indie video games, you should definitely check out his Twitter (X) or carrd!",
        attributes: `✦ Character design skills
✦ Undertale enthusiast
✦ Sans lover
✦ Undertale and FNAF nerd!!
✦ idk we are besties
✦ Video games lover
✦ Local seal with internet access who likes to annoy their friends`,
        inventory: [
            {
                img: "friends-items/energizing-bento.png",
                name: "cute bento box"
            },
            {
                img: "friends-items/invigorating-kitty-meal.png",
                name: "kitty meal!"
            },
            {
                img: "friends-items/lightless-eye-of-the-maelstrom.png",
                name: "there is a black hole in their pocket"
            },
            {
                img: "friends-items/trash.png",
                name: "trash???"
            },
            {
                img: "friends-items/pleasantlooking-trash.png",
                name: "pleasant looking trash lol"
            }
        ],
        website: "Check out their carrd!!",
        websiteUrl: "https://mochynarr.carrd.co/",
        constellation: "friends-constellation/narr.png" 
    },
    {
        name: "Planet MFN Pearlia",
        description: "Hana is a technical designer with a love for interactive experiences and cute design work. A refugee of modern social media, she is a strong lover of the indie web and promotes as many people as possible making their own sites.",
        attributes: `✦ Very kind and driven
✦ Strong Graphic and Web Design skills
✦ Unsettling aesthetic lover
✦ Can be quite socially awkward at times. lol
✦ Enjoys video games of all types`,
        inventory: [
            {
                img: "friends-items/Rose_Bush.png",
                name:  "a cute and big rose bush!"
            },
            {
                img: "friends-items/Unknown.png",
                name:  "Unknown"
            },
            {
                img: "friends-items/Unknown.png",
                name:  "Unknown"
            },
            {
                img: "friends-items/Unknown.png",
                name:  "Unknown"
            },
            {
                img: "friends-items/Unknown.png",
                name: "Unknown"
            }
        ],
        website: "",
        websiteUrl: "https://planetpearlia.com/",
        constellation: "friends-constellation/PEARLIA.png" 
    },
    {
        name: "Lilithdev",
        description: "Lilith is a web developer and fandom dweller. She has a passion for recreating things she loves and trying new things in Javascript!",
        attributes: `✦ Will always do her best to help out
✦ Likes to learn new things
✦ Obsessive, will work on the same project for a month straight
✦ No artistic or design abilities, has been winging everything as close enough
✦ Negative social skills`,
        inventory: [
            {
                img: "friends-items/scissors.PNG",
                name:  "scissors"
            },
            {
                img: "friends-items/pien.PNG",
                name:  "pien"
            },
            {
                img: "friends-items/phone.PNG",
                name:  "a cracked phone"
            },
            {
                img: "friends-items/stairs.PNG",
                name:  "waxed weathered cut copper stairs"
            },
            {
                img: "friends-items/amethyst.PNG",
                name: "amethyst"
            }
        ],
        website: "Go check out the Lilithdev website!",
        websiteUrl: "https://lilithdev.neocities.org/",
        constellation: "friends-constellation/lilith.png" 
    },
    {
        name: "Chissuuu",
        description: "Vón and I have been friends for almost three years. We're very close, and I'm always fascinated by his art and character lore. His way of capturing colors is amazing, and he's very good at traditional art; this artist is excellent at what he does! He enjoys drawing in graphite and charcoal. If you're looking for an artist who creates beautiful, detailed works and enjoys depicting characters in different styles, consider following him on Facebook or other social media! Vón and I share character lore, and he loves animals just like I do!",
        attributes: `✦ My best friend and one of the people I care about the most, Sanji Lover, loves ice cream, is charismatic, and quite sweet. He has a rather silly and pleasant sense of humor, and he's a cat lover! His favorite ice cream is mint ice cream, and he loves homemade noodles with meat sauce! ✦ ESTP Scorpio`,
        inventory: [
            {
                img: "friends-items/comfort-food.png",
                name:  "noddles!"
            },
            {
                img: "friends-items/IconCoffe_21.png",
                name:  "some ice coffe"
            },
            {
                img: "friends-items/bubble-tea.png",
                name:  "sweet bubble tea"
            },
            {
                img: "friends-items/dreamy-cone-three-flavors.png",
                name:  "dreamy ice cream!"
            },
            {
                img: "friends-items/hundredlayer-sundae-zero-calories.png",
                name: "huge ice cream"
            }
        ],
        website: ":3",
        websiteUrl: "https://www.facebook.com/chissssuuuuu",
        constellation: "friends-constellation/chissuu.png" 
    },
    {
        name: "RedRxven",
        description: "RedRxven is a Mexican digital artist and animation student—and one of my best friends! Time really flies, doesn’t it? We’ve been friends for nearly eight years, maybe even longer, growing alongside each other. She’s incredibly creative, has a great sense of humor, and is one of the sweetest people I know. I love her so much, and I’m so grateful for our friendship. I hope it lasts forever!",
        attributes: `✦ ENFP or INFP? I don't know, it's like Schordinger's cat. ✦ Personality: Lazy!! `,
        inventory: [
            {
                img: "friends-items/berry-and-mint-burst.png",
                name:  "blueberry smoothie"
            },
            {
                img: "friends-items/coffee-bavarois.png",
                name:  "coffe pudding :D"
            },
            {
                img: "friends-items/fruits-of-the-festival.png",
                name:  "fresh fruit juice"
            },
            {
                img: "friends-items/sparkling-berry-juice.png",
                name:  "sparkling berry juice!"
            },
            {
                img: "friends-items/starconch.png",
                name: "starconch"
            }
        ],
        website: "Go check out RedRxven social media!",
        websiteUrl: "https://x.com/Redccoon",
        constellation: "friends-constellation/red.png" 
    },
    {
        name: "ne0nbandit",
        description: "Jay is a digital artist from Portugal who loves character design and storytelling! Being honest? I'm fascinated by their work and think they're quite talented artists and wonderful content creators. I like the design of their website and think they're a very nice person. If you have a chance to visit their website, do it! It's beautiful and colorful, quite creative. It inspires me so much. I couldn't pass up the opportunity to add them to my friends list on my site!! OH! And they're also the creator of Deltacable Au, so go check that out too, their design is very nice, I admire it so much.",
        attributes: `✦Living paradox
✦ Non-Euclidian entity in the shape of a Raccoon
✦ Jack of All Trades, Master of Heck all
✦ Loves helping people with their code
✦ Wants you to ask them about their OCs  `,
        inventory: [
            {
                img: "friends-items/Hypercube.webp",
                name:  "hypercube"
            },
            {
                img: "friends-items/Pink-and blue gradient.gif",
                name:  "pink and blue gradient (??? how do they have this?)"
            },
            {
                img: "friends-items/monster.webp",
                name:  "monster can"
            },
            {
                img: "friends-items/spritzee.gif",
                name:  "spritzee"
            }
        ],
        website: "Go check out ne0nbandit site and learn about their art!",
        websiteUrl: "https://ne0nbandit.art/",
        constellation: "friends-constellation/ne0nbandit.png" 
    },
    {
        name: "Morita",
        description: "Morita is an Argentine artist with a sweet tooth and a taste for drawing that's quite beautiful. She and her colors, as soft as pastels, are simply enchanting. If you're looking for an artist with a talent for handling soft colors, then she's the one! I made a small website for her as a gift, so feel free to visit it whenever you like. I love and appreciate Morita very much, she is a very nice and friendly girl!",
        attributes: `✦ Her creative approach covers various disciplines, from digital illustration to traditional art, always seeking to capture the unique essence of each drawing she makes. She is an enthusiastic, passionate person, always looking for new experiences that expand her creative paths! You can currently check out her art gallery and more details on her website! She's definitely very talented, so go check her out! <3`,
        inventory: [
            {
                img: "friends-items/original-resin.png",
                name:  "a piece of moon!"
            },
            {
                img: "friends-items/rainbow-macarons.png",
                name:  "rainbow macarons!"
            },
            {
                img: "friends-items/pour-la-justice.png",
                name:  "some cake"
            },
            {
                img: "friends-items/la-lettre-a-focalors.png",
                name:  "another dessert"
            },
            {
                img: "friends-items/polarizing-prism.png",
                name: "prism"
            },
            {
                img: "friends-items/super-magnificent-pizza.png",
                name: "huge pizza!"
            }
        ],
        website: "Go check out Morita website!",
        websiteUrl: "https://luvrksnskye.github.io/Douce-Framboise-Cafe-Website/",
        constellation: "friends-constellation/morita.png" 
    },
];

class Particle {
    constructor(isSpecial = false, specialInfo = null, specialIndex = null) {
        this.x = ctx.canvas.width * Math.random();
        this.y = ctx.canvas.height * Math.random();
        this.vx = speed * 2 * Math.random() - speed;
        this.vy = speed * 2 * Math.random() - speed;
        this.connections = 0;
        this.radius = isSpecial ? radius * 4 : radius;
        this.isSpecial = isSpecial;
        this.specialInfo = specialInfo;
        this.specialIndex = specialIndex;
        this.isHovered = false;
        this.pulseScale = 1;
        this.pulseDirection = 0.01;
        this.targetSize = this.radius;
        this.currentSize = this.radius;

        // Animation properties
        this.scale = 0;
        this.targetScale = 1;
        this.delay = isSpecial ? (specialIndex * 200) : (Math.random() * 1000);
        this.animationStarted = false;

        // Add icon for special particles
        if (isSpecial) {
            this.icon = new Image();
            // Alternate between friend.png and friends.png
            this.icon.src = specialIndex % 2 === 0 ? 
                'space-constellation-map/friend.png' : 
                'space-constellation-map/friends.png';
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        if (!this.animationStarted && Date.now() - startTime > this.delay) {
            this.animationStarted = true;
        }
        
        if (this.animationStarted) {
            this.scale += (this.targetScale - this.scale) * 0.1;
        }

        // For normal particles
        if (!this.isSpecial) {
            ctx.beginPath();
            ctx.fillStyle = "#FFFFFF";
            ctx.arc(0, 0, this.currentSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
            return;
        }
        
        // For special particles
        this.targetSize = this.radius * (this.isHovered ? 1.5 : 1);
        this.currentSize += (this.targetSize - this.currentSize) * 0.1;
        
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.1) this.pulseDirection = -0.005;
        if (this.pulseScale < 0.9) this.pulseDirection = 0.005;
        
        const glowRadius = this.currentSize * this.pulseScale;
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, glowRadius * 2
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(0, 0, glowRadius * 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw the icon
        const iconSize = glowRadius * 8;
        ctx.drawImage(
            this.icon, 
            -iconSize/2, 
            -iconSize/2, 
            iconSize, 
            iconSize
        );
        
        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = '14px departure-mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(this.specialInfo.name, 0, glowRadius * 2);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 + this.radius || this.x + this.radius > canvas.width) {
            this.vx = -this.vx;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy = -this.vy;
        }
    }

    isPointInside(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return distance <= this.radius * (this.isSpecial ? 3 : 1);
    }
}

class OrbitalCircle {
    constructor(imgSrc, size, speed, startAngle = 0) {
        this.img = new Image();
        this.img.src = imgSrc;
        this.size = size;
        this.speed = speed;
        this.angle = startAngle;
        this.centerX = ctx.canvas.width / 2;
        this.centerY = ctx.canvas.height / 2;
        
        // Animation properties
        this.scale = 0;
        this.targetScale = 1;
        this.delay = Math.random() * 500; // Randomize delay for smoother appearance
        this.animationStarted = false;
        this.animationProgress = 0;
    }
    
    update() {
        // Increase speed by 50%
        this.angle += this.speed * 3;
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
        
        // Smooth animation
        if (!this.animationStarted && Date.now() - startTime > this.delay) {
            this.animationStarted = true;
        }
        
        if (this.animationStarted && this.animationProgress < 1) {
            this.animationProgress += 0.015; // Faster animation
            if (this.animationProgress > 1) this.animationProgress = 1;
        }
        
        // Use cubic-bezier like easing for smoother pop-in
        this.scale = this.easeOutBack(this.animationProgress);
    }
    
    // Custom easing function for a nice pop effect
    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(
            this.img, 
            -this.size/2, 
            -this.size/2, 
            this.size, 
            this.size
        );
        ctx.restore();
    }
}


const startTime = Date.now();

const orbitalCircles = [
    new OrbitalCircle('space-constellation-map/middle.png', 100, 0.002), 
    new OrbitalCircle('space-constellation-map/center.png', 500, 0.0012, Math.PI / 4), 
    new OrbitalCircle('space-constellation-map/circle.png', 800, 0.0008, Math.PI / 2), 
    new OrbitalCircle('space-constellation-map/other-circle.png', 1200, 0.0004, Math.PI),
    new OrbitalCircle('space-constellation-map/circle-lol.png', 1600, 0.0002, Math.PI * 1.5) 
];
function dist(x1, x2, y1, y2) {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a * a + b * b);
}

let mouseX = 0;
let mouseY = 0;
let lastFrameTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    particles.forEach(particle => {
        if (particle.isSpecial && particle.isPointInside(clickX, clickY)) {
            const starSoundElement = document.querySelector('#star-sound');
            if (starSoundElement) {
                starSoundElement.currentTime = 0;
                starSoundElement.play();
            }
            showInfo(particle.specialInfo);
        }
    });
});

function showInfo(info) {
    const clickSound = document.querySelector('#click-sound');
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play();
    }

    blurOverlay.style.display = 'block';
    setTimeout(() => {
        blurOverlay.style.opacity = '1';
    }, 10);
    
    constellationImage.style.display = 'block';
    constellationImage.style.backgroundImage = `url(${info.constellation})`;
    setTimeout(() => {
        constellationImage.classList.add('active');
    }, 10);

    const content = `
    <button class="close-button" onclick="closeInfoPanel()">×</button>
    <h2>${info.name}</h2>
    
    <div class="star-tabs">
        <button class="star-tab active" onclick="switchStarTab(this, 'overview')">Overview</button>
        <button class="star-tab" onclick="switchStarTab(this, 'attributes')">Attributes</button>
        <button class="star-tab" onclick="switchStarTab(this, 'inventory')">Inventory</button>
        <button class="star-tab" onclick="switchStarTab(this, 'website')">Website</button>
    </div>

    <div class="star-tab-content active" id="overview">
        <p>${info.description}</p>
    </div>
    <div class="star-tab-content" id="attributes">
        <p>${info.attributes}</p>
    </div>
    <div class="star-tab-content" id="inventory">
        <div class="inventory-grid">
            ${info.inventory.map(item => `
                <div class="inventory-item">
                    <img src="${item.img}" alt="${item.name}">
                    <span>${item.name}</span>
                </div>
            `).join('')}
        </div>
    </div>
    <div class="star-tab-content" id="website">
        <p>${info.website || ''}</p>
        <a href="${info.websiteUrl}" target="_blank" class="website-link">Visit Website</a>
    </div>
`;
    infoPanel.innerHTML = content;
    infoPanel.style.display = 'block';
   
    requestAnimationFrame(() => {
        infoPanel.classList.add('visible');
    });
}

function closeInfoPanel() {
    const clickSound = document.querySelector('#click-sound');
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play();
    }

    blurOverlay.style.opacity = '0';
    constellationImage.classList.remove('active');
    infoPanel.classList.remove('visible');
    
    setTimeout(() => {
        constellationImage.style.display = 'none';
        blurOverlay.style.display = 'none';
        infoPanel.style.display = 'none';
    }, 500); 
}

function switchStarTab(tab, contentId) {
    const clickSound = document.querySelector('#click-sound');
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play();
    }

    document.querySelectorAll('.star-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.star-tab-content').forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(contentId).classList.add('active');
}

blurOverlay.addEventListener('click', (e) => {
    if (e.target === blurOverlay) {
        closeInfoPanel();
    }
});

function loop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameTime) {
        lastFrameTime = timestamp - (elapsed % frameTime);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw orbital circles first (as background)
        orbitalCircles.forEach(circle => {
            circle.update();
            circle.draw(ctx);
        });
        
        let anyHovered = false;
        particles.forEach(particle => {
            particle.connections = 0;
            particle.isHovered = particle.isSpecial && particle.isPointInside(mouseX, mouseY);
            if (particle.isHovered) {
                anyHovered = true;
            }
        });
        
        canvas.style.cursor = anyHovered ? 'pointer' : 'default';

        for (let i = 0; i < particles.length; i++) {
            let nearbyParticles = [];
            for (let j = 0; j < particles.length; j++) {
                if (i !== j) {
                    const eachPartDist = dist(
                        particles[j].x,
                        particles[i].x,
                        particles[j].y,
                        particles[i].y
                    );
                    if (eachPartDist <= distance) {
                        nearbyParticles.push({index: j, distance: eachPartDist});
                    }
                }
            }
            
            nearbyParticles.sort((a, b) => a.distance - b.distance);
            nearbyParticles = nearbyParticles.slice(0, maxConnections);
            
            for (const nearby of nearbyParticles) {
                const j = nearby.index;
                const eachPartDist = nearby.distance;
                
                if (particles[i].connections < maxConnections && 
                    particles[j].connections < maxConnections) {
                    
                    const opacity = 1 - (eachPartDist / distance);
                    
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    
                    if (particles[i].isHovered || particles[j].isHovered) {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 1.5})`;
                        ctx.lineWidth = lineWidth * 2;
                    } else {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
                        ctx.lineWidth = lineWidth;
                    }
                    
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    
                    particles[i].connections++;
                    particles[j].connections++;
                }
            }
            
            particles[i].update();
            particles[i].draw(ctx);
        }
    }
    requestAnimationFrame(loop);
}

for (let i = 0; i < num_particles; i++) {
    if (i < specialParticles.length) {
        particles.push(new Particle(true, specialParticles[i], i));
    } else {
        particles.push(new Particle());
    }
}

window.addEventListener('resize', () => {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    

    orbitalCircles.forEach(circle => {
        circle.centerX = ctx.canvas.width / 2;
        circle.centerY = ctx.canvas.height / 2;
    });
});

window.switchStarTab = switchStarTab;
window.closeInfoPanel = closeInfoPanel;

requestAnimationFrame(loop);