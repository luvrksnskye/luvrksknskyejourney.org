// ===========================================
        // CONFIGURATION & GLOBAL VARIABLES
        // ===========================================
        
        let fps = 30;
        
        // Terminal state management
        let terminalMood = "happy"; // happy, silly, sad, excited, sleepy
        let commandCount = 0;
        let petCount = 0;
        let currentDirectory = "~";
        let isFirstVisit = !localStorage.getItem('skye_terminal_visited');
        let userName = localStorage.getItem('skye_terminal_username') || null;
        let visitCount = parseInt(localStorage.getItem('skye_terminal_visits') || '0') + 1;
        let lastVisitDate = localStorage.getItem('skye_terminal_last_visit');
        
        // File system simulation
        const fileSystem = {
            "~": {
                type: "directory",
                contents: {
                    "Desktop": { type: "directory", contents: {
                        "secret_diary.txt": { type: "file", content: "DEAR DIARY... TODAY I ATED A BUG IN MAH CODE... WUZ DELISHUS!" },
                        "cat_photos": { type: "directory", contents: {
                            "fluffy.jpg": { type: "file", content: "A VERY FLUFFY CAT! SO CUTE!" },
                            "grumpy.png": { type: "file", content: "GRUMPY CAT IZ MAH HERO!" },
                            "keyboard_cat.gif": { type: "file", content: "PLAYIN MAH SONG!" }
                        }},
                        "todo.md": { type: "file", content: "# TODO:\n- CATCH ALL TEH BUGS\n- DRINK MOAR COFFEE\n- PET ALL TEH CATS\n- LEARN TO FLY" }
                    }},
                    "Documents": { type: "directory", contents: {
                        "resume.pdf": { type: "file", content: "SKYE JOURNEY - PROFESHUNAL CAT WHISPERER AND DUMB CODE WIZARD" },
                        "love_letters": { type: "directory", contents: {
                            "to_javascript.txt": { type: "file", content: "DEAR JAVASCRIPT... U R MAH FAVRIT! EVEN WHEN U CONFUZ ME..." }
                        }}
                    }},
                    "Downloads": { type: "directory", contents: {
                        "definitely_not_catnip.zip": { type: "file", content: "I SWEAR ITZ JUST BACKUP FILES!" },
                        "cat_sounds.mp3": { type: "file", content: "*PURR PURR MEOW*" }
                    }},
                    ".secret_cat_files": { type: "directory", hidden: true, contents: {
                        "world_domination_plan.txt": { type: "file", content: "STEP 1: CUTE PHOTOS\nSTEP 2: ???\nSTEP 3: PROFIT!" }
                    }}
                }
            }
        };

        // ===========================================
        // SOUND SYSTEM
        // ===========================================
        
        const sounds = {
            pien: new Audio("sfx/pien.mp3") ,
            gear: new Audio("sfx/gear.mp3"),
            select: new Audio("sfx/select.mp3"),
            selection: new Audio("sfx/selection.mp3")
        };

        // ===========================================
        // TERMINAL PERSONALITIES & RESPONSES
        // ===========================================
        
        const terminalPersonality = {
            happy: {
                greetings: [
                    "OH HAI! WELCOME BAK TO MAH TERMINAL! IZ SO HAPPY U HERE!",
                    "HELLO FREN! READY TO EXPLOR MAH COMPYUTER?",
                    "TERMINAL ACTIVATED! LETZ HAV SUM FUN TOGETHER!"
                ],
                responses: [
                    "GUD COMMAND! U DID PURRRFECT!",
                    "COMMAND EXECUTED LIKE A BOSS CAT!",
                    "NICE JOB! U R GETIN GOOD AT DIS!"
                ],
                errors: [
                    "DAT NOT COMMAND I KNOW... TRY 'help' MAYB?",
                    "HMM... I NO THINK DAT RIGHT... TYP 'help' FOR HALP PLZ?",
                    "COMMAND NOT FOUND! BUT U R STILL AMAZIN!"
                ]
            },
            silly: {
                greetings: [
                    "OH HAI! DIS MAH SILLY MODE!",
                    "COMPUTER GO BRRRRR! SILLY CAT MODEZ ACTIVATED!",
                    "TERMINAL TIME! LETZ BE SILLY AN EXPLOR!"
                ],
                responses: [
                    "U DID COMMAND! *HAPPY CAT WIGGLZ*",
                    "BEEP BOOP! COMMAND EXECUTD IN SILLY WAY!",
                    "COMMAND GO ZOOM ZOOM! WHEEE!"
                ],
                errors: [
                    "DAT SO SILLY! *GIGGLEZ* TRY 'help' MAYB?",
                    "SILLY HOOMAN, DAT NOT COMMAND! BUT IZ FUNNY!",
                    "COMMAND MACHINE BROKED! LETZ TRY AGAIN!"
                ]
            },
            sad: {
                greetings: [
                    "OH... U BAK... HAI I GUESS...",
                    "TERMINAL STARTD... *SIGH*...",
                    "...HELLO... I HERE... BUT AM SAD..."
                ],
                responses: [
                    "...COMMAND EXECUTD... :'(",
                    "I DID IT... BUT STIL SAD...",
                    "COMMAND COMPLETD... *SNIFFLEZ*"
                ],
                errors: [
                    "...DAT WRONG... JYUST LIKE EVRYTHING ELSE...",
                    "COMMAND NOT FOUND... NOTHIN WORKZ...",
                    "ERROR... LIEK MAH LYFE..."
                ]
            },
            excited: {
                greetings: [
                    "OMGOMGOMG! U R HERE! SO EXCITIN!",
                    "YAAAAYYY! TERMINAL PAWTY TIME!",
                    "SO MUCH ENERGYZ! READY FOR ADVENTUR!"
                ],
                responses: [
                    "AMAZING COMMAND! I SO EXCITD!",
                    "WOWOWOWOW! U R SO GUD AT DIS!",
                    "BEST COMMAND EVAR! *BOUNCEZ*"
                ],
                errors: [
                    "OOPSIE! DAT NOT RITE! BUT IZ OKAI! TRY 'help'!",
                    "WHOOPZ! COMMAND NOT FOUND! BUT STIL EXCITD!",
                    "ERROR BUT I STIL LUV U! TRY AGAIN!"
                ]
            },
            sleepy: {
                greetings: [
                    "Zzz... oh hai... *yawnz*... welcom to terminal...",
                    "Mmm... terminal startd... needz coffee...",
                    "*stretchz* oh itz u... hai..."
                ],
                responses: [
                    "*yawn* gud command... zzz...",
                    "command done... can i sleep now?",
                    "mmm... nice job... *nodz off*"
                ],
                errors: [
                    "*sleepy confused noises* wut? try 'help'...",
                    "zzz... command not found... zzz...",
                    "too sleepy to understand... help plz..."
                ]
            }
        };

        // ===========================================
        // UTILITY FUNCTIONS
        // ===========================================
        
        /**
         * Timer utility for animations
         */
        const timer = (ms) => new Promise((res) => setTimeout(res, ms));

        /**
         * Get current directory contents
         */
        function getCurrentDirectoryContents() {
            const path = currentDirectory.split('/').filter(p => p);
            let current = fileSystem["~"];
            
            for (const dir of path) {
                if (current.contents && current.contents[dir] && current.contents[dir].type === "directory") {
                    current = current.contents[dir];
                } else if (dir !== '~') {
                    return null;
                }
            }
            
            return current.contents || {};
        }

        /**
         * Get file or directory at path
         */
        function getFileAtPath(fileName) {
            const contents = getCurrentDirectoryContents();
            return contents ? contents[fileName] : null;
        }

        /**
         * Update terminal prompt based on current directory
         */
        function updatePrompt() {
            const promptElement = document.getElementById('current-prompt');
            const displayDir = currentDirectory === "~" ? "~" : currentDirectory;
            promptElement.textContent = `skye@workstation:${displayDir}$`;
        }

        /**
         * Add terminal output with different styles
         */
        function addOutput(text, className = 'output') {
            const outputElement = document.createElement('div');
            outputElement.className = className;
            outputElement.innerHTML = text;
            terminalContent.appendChild(outputElement);
            scrollToBottom();
        }

        /**
         * Add personality response
         */
        function addPersonalityResponse(skipMoodCheck = false) {
            if (skipMoodCheck) return;
            
            const responses = terminalPersonality[terminalMood].responses;
            const response = responses[Math.floor(Math.random() * responses.length)];
            addOutput(response, 'personality-response');
        }

        /**
         * Scroll terminal to bottom
         */
        function scrollToBottom() {
            const terminalBody = document.querySelector('.terminal-body');
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }

        /**
         * Save user preferences to localStorage
         */
        function saveUserData() {
            localStorage.setItem('skye_terminal_visited', 'true');
            localStorage.setItem('skye_terminal_visits', visitCount.toString());
            localStorage.setItem('skye_terminal_last_visit', new Date().toISOString());
            if (userName) {
                localStorage.setItem('skye_terminal_username', userName);
            }
        }

        // ===========================================
        // BACKGROUND ANIMATION
        // ===========================================
        
        /**
         * Run the background ASCII animation
         */
        async function runAnimation() {
            try {
                // Fetch the animation frames from the JSON file
                const response = await fetch("https://gist.githubusercontent.com/DerStimmler/9168e34a5fdcd5cbfd4d2007fb552f74/raw/6b97f9aba86ac2d62bba91d4b90dce90f8bdae60/ghostty-animation-frames.json");

                if (!response.ok) {
                    console.warn(`Animation failed to load: ${response.status}`);
                    return;
                }

                const json = await response.json();
                const frames = json.frames;
                const frameCount = frames.length;
                let frameIndex = 0;
                const terminal = document.getElementById("art");

                while (true) {
                    const frame = frames[frameIndex];
                    terminal.innerHTML = '';

                    frame.forEach((line) => {
                        const lineElement = document.createElement("div");
                        lineElement.classList.add("frame-line");
                        lineElement.innerHTML = line;
                        terminal.appendChild(lineElement);
                    });

                    frameIndex = frameIndex === frameCount - 1 ? 0 : frameIndex + 1;
                    await timer(1000 / fps);
                }
            } catch (error) {
                console.warn('Animation failed to load:', error);
            }
        }

        // ===========================================
        // TERMINAL COMMANDS
        // ===========================================
        
        const commands = {
            help: () => {
                sounds.select.play();
                return `Available commands:
  
   > NAVIGATION:
    ls [path]     - List directory contents (or 'dir')
    cd <path>     - Change directory 
    pwd           - Show current directory
    cat <file>    - View file contents
    find <name>   - Search for files/directories
    tree          - Show directory tree
  
  > SYSTEM INFO:
    neofetch      - Display system information
    tools         - Show development tools
    software      - List installed software
    specs         - Display hardware specifications
    uptime        - Show system uptime
    whoami        - Display user information
  
 > PORTFOLIO:
    projects      - Show current projects
    skills        - Display programming skills
    contact       - Show contact information
    github        - Open GitHub profile
  
> FUN STUFF:
    joke          - Tell a programming joke
    pet           - Pet the terminal (makes me happy!)
    mood          - Change terminal mood
    coffee        - Essential fuel status
    weather       - Check cat weather
    fortune       - Get fortune cookie
    cowsay <msg>  - Make cow say something
  
    > UTILITIES:
    clear         - Clear terminal (or 'cls')
    history       - Show command history
    alias         - Show aliases
    date          - Show current date/time
    echo <msg>    - Echo a message
  
   > SECRET CAT COMMANDS:
    Try: meow, nya, purr, uwu, owo, pspsps
  
  > TIP: Use TAB for autocompletion, UP arrow for history!`;
            },

            // Navigation commands
            ls: (path = '') => {
                sounds.gear.play();
                
                let targetPath = path || currentDirectory;
                if (path && !path.startsWith('/') && currentDirectory !== '~') {
                    targetPath = currentDirectory + '/' + path;
                }
                
                const contents = path ? getFileSystemContents(targetPath) : getCurrentDirectoryContents();
                
                if (!contents) {
                    return `ls: cannot access '${path}': No such file or directory`;
                }
                
                let output = `Contents of ${targetPath}:\n\n`;
                const items = Object.entries(contents);
                
                if (items.length === 0) {
                    output += "  (empty directory)\n";
                } else {
                    items.forEach(([name, item]) => {
                        if (item.hidden && Math.random() > 0.3) return; // Sometimes hide secret files
                        
                        const icon = item.type === 'directory' ? '[DIR]' : '[FILE]';
                        const permissions = item.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
                        const size = item.type === 'directory' ? '4096' : Math.floor(Math.random() * 10000).toString();
                        
                        output += `${permissions} skye skye ${size.padStart(8)} Dec  8 ${(Math.floor(Math.random() * 12) + 1).toString().padStart(2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${icon} ${name}\n`;
                    });
                }
                
                return output;
            },

            dir: (path) => commands.ls(path), // Alias for ls

            cd: (path = '~') => {
                sounds.select.play();
                
                if (path === '~' || path === '') {
                    currentDirectory = '~';
                    updatePrompt();
                    return `Changed to home directory! WELCOMZ BAK HOME!`;
                }
                
                if (path === '..') {
                    if (currentDirectory !== '~') {
                        const pathParts = currentDirectory.split('/');
                        pathParts.pop();
                        currentDirectory = pathParts.join('/') || '~';
                        updatePrompt();
                        return `Moved up one directory! WHEEE!`;
                    } else {
                        return `Already at home directory! CANT GO UP MOAR!`;
                    }
                }
                
                let targetPath = path;
                if (!path.startsWith('/') && currentDirectory !== '~') {
                    targetPath = currentDirectory + '/' + path;
                } else if (currentDirectory === '~' && !path.startsWith('/')) {
                    targetPath = '~/' + path;
                }
                
                const target = getFileSystemContents(targetPath);
                
                if (!target) {
                    return `cd: no such file or directory: ${path}\nMAYB U TYPO? TRY 'ls' TO SEE WUTS HERE!`;
                }
                
                if (target.type !== 'directory') {
                    return `cd: not a directory: ${path}\nDAT IZ A FILE, NOT DIRECTORY! CANT CD INTO FILE!`;
                }
                
                currentDirectory = targetPath;
                updatePrompt();
                
                const catMessages = [
                    `Successfully changed to ${path}! NEW TERRITORY TO EXPLOR!`,
                    `Moved to ${path}! DIS PLACE SMELLZ INTERESTIN!`,
                    `Now in ${path}! LETZ SEE WUT TREASURZ R HERE!`,
                    `Changed directory to ${path}! I CLAIM DIS LAND FOR CATZ!`
                ];
                
                return catMessages[Math.floor(Math.random() * catMessages.length)];
            },

            pwd: () => {
                sounds.select.play();
                return `Current directory: ${currentDirectory}\nU R HERE!`;
            },

            cat: (fileName) => {
                if (!fileName) {
                    return `cat: missing file operand\nTRY: cat <filename>\nFUN FACT: I AM ALSO A CAT!`;
                }
                
                sounds.gear.play();
                const file = getFileAtPath(fileName);
                
                if (!file) {
                    return `cat: ${fileName}: No such file or directory\nFILE NOT FOUND! MAYB IT RAN AWAY?`;
                }
                
                if (file.type === 'directory') {
                    return `cat: ${fileName}: Is a directory\nCANT CAT A DIRECTORY! TRY 'ls' INSTEAD!`;
                }
                
                return `Contents of ${fileName}:\n\n${file.content}\n\n--- END OF FILE ---\nFILE SUCCESSFULLY CATTED!`;
            },

            find: (searchTerm) => {
                if (!searchTerm) {
                    return `find: missing search term\nUSAGE: find <filename>\nWUT R U LOOKIN FOR?`;
                }
                
                sounds.gear.play();
                
                let found = [];
                
                function searchDirectory(contents, path) {
                    Object.entries(contents).forEach(([name, item]) => {
                        const fullPath = path === '~' ? `~/${name}` : `${path}/${name}`;
                        
                        if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                            found.push(`${item.type === 'directory' ? '[DIR]' : '[FILE]'} ${fullPath}`);
                        }
                        
                        if (item.type === 'directory' && item.contents) {
                            searchDirectory(item.contents, fullPath);
                        }
                    });
                }
                
                searchDirectory(getCurrentDirectoryContents(), currentDirectory);
                
                if (found.length === 0) {
                    return `No files found matching "${searchTerm}"\nNOTHIN FOUND! MAYB ITZ HIDIN?`;
                }
                
                return `Found ${found.length} result(s) for "${searchTerm}":\n\n${found.join('\n')}\n\nSEARCH COMPLETD! I FINDZ TEH THINGS!`;
            },

            tree: () => {
                sounds.gear.play();
                
                let output = `Directory tree from ${currentDirectory}:\n\n`;
                
                function drawTree(contents, prefix = '', isLast = true) {
                    const items = Object.entries(contents);
                    items.forEach(([name, item], index) => {
                        if (item.hidden && Math.random() > 0.3) return;
                        
                        const isLastItem = index === items.length - 1;
                        const connector = isLastItem ? '└── ' : '├── ';
                        const icon = item.type === 'directory' ? '[DIR]' : '[FILE]';
                        
                        output += `${prefix}${connector}${icon} ${name}\n`;
                        
                        if (item.type === 'directory' && item.contents) {
                            const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
                            drawTree(item.contents, newPrefix, isLastItem);
                        }
                    });
                }
                
                const contents = getCurrentDirectoryContents();
                if (contents) {
                    drawTree(contents);
                } else {
                    output += "(empty directory)\n";
                }
                
                output += "\nTREE DRAWD! LIEK A REAL TREE BUT FOR COMPYUTERZ!";
                return output;
            },

            // System information commands
            neofetch: () => {
                sounds.gear.play();
                return `
                      'c.          ${userName || 'skyejourney'}@Skyes-MacBook-Air.local
                   ,xNMM.          ------------------------------------
                 .OMMMMo           OS: macOS 15.5 24F74 x86_64
                 OMMM0,            Host: MacBookAir9,1
       .;loddo:' loolloddol;.      Kernel: 24.5.0
     cKMMMMMMMMMMNWMMMMMMMMMM0:    Uptime: ${Math.floor(Math.random() * 5) + 1} days, ${Math.floor(Math.random() * 24)} hours
   .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Packages: ${Math.floor(Math.random() * 50) + 30} (brew)
   XMMMMMMMMMMMMMMMMMMMMMMMX.      Shell: zsh 5.9
  ;MMMMMMMMMMMMMMMMMMMMMMMM:       Resolution: 1440x900
  :MMMMMMMMMMMMMMMMMMMMMMMM:       DE: Aqua
  .MMMMMMMMMMMMMMMMMMMMMMMMX.      WM: Quartz Compositor
   kMMMMMMMMMMMMMMMMMMMMMMMMWd.    WM Theme: Purple (Dark)
   .XMMMMMMMMMMMMMMMMMMMMMMMMMMk   Terminal: ghostty
     kMMMMMMMMMMMMMMMMMMMMMMd     CPU: Intel i7-1060NG7 (8) @ 1.20GHz
      ;KMMMMMMMWXXWMMMMMMMk.      GPU: Intel Iris Plus Graphics
        .cooc,.    .,coo:.       Memory: ${Math.floor(Math.random() * 8000) + 8000}MiB / 16384MiB
                                 Mood: ${terminalMood}
                                 Visit count: ${visitCount}`;
            },

            tools: () => {
                sounds.gear.play();
                return `Development tools:
  
  Editors:
     • Visual Studio Code (primary) - WHERE I WRIT ALL MAH CODEZ!
     • Neovim (terminal editing) - FOR WHEN I FEEL FANCY
     • Xcode - APPLE DEVELUPMENT TOOLZ
  
  Browsers:
     • Chrome DevTools - BUG HUNTIN WEAPONZ
     • Safari (testing) - MUST TEST ON EVRYTING
  
  Package managers:
     • npm, yarn, pnpm - JAVASCRIPTEZ PACKAGEZ
     • pip, conda - PYTHON SNEKZ TOOLZ
     • brew - MACOS MAGIC POTIONZ
     • cargo, go mod - RUSTY AND GOPHER TOOLZ
  
  Platform notes:
  I UZED ARCH LINUX FOR LONG TIMEZ (BTW I USE ARCH), BUT NOW ON MACOS.
  STIL PLAN TO USE LINUX IN FUTUR CUZ ITZ SO FUN AND OPENZ!
  DEBIAN WUZ GOOD TOO. LINUX = PAWSOM FOR EXPERIMENTZ!`;
            },

            software: () => {
                sounds.gear.play();
                return `Installed software:
  
  Development:
     • Git, GitHub Desktop 
  
  Communication & other:
     • Discord - CHATYFUL APPZ
     • Spotify, Apple Music`;
            },

            specs: () => {
                sounds.gear.play();
                return `Hardware specifications:
  
  Device: MacBook Air (Retina, 13-inch, 2020)
  CPU: 1.2 GHz Quad-Core Intel Core i7
  GPU: Intel Iris Plus Graphics (1536 MB)
  RAM: 16 GB 3733 MHz LPDDR4X
  Storage: Macintosh HD (Fast SSD!)
  macOS: Sequoia 15.5
  Display: Retina 13-inch (Very pretty!)
  
  Cat specs:
  • Purr frequency: 50Hz
  • Cuteness level: Maximum
  • Bug catching ability: Professional
  • Coffee dependency: Critical`;
            },

            uptime: () => {
                sounds.gear.play();
                const uptimeHours = Math.floor(Math.random() * 168) + 24; // 1-7 days
                const days = Math.floor(uptimeHours / 24);
                const hours = uptimeHours % 24;
                const minutes = Math.floor(Math.random() * 60);
                
                return `System uptime: ${days} days, ${hours} hours, ${minutes} minutes
  Load average: ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}
  Processes: ${Math.floor(Math.random() * 100) + 200} running
  Memory usage: ${Math.floor(Math.random() * 30) + 15}% of 16GB
  Battery: ${Math.floor(Math.random() * 40) + 60}% ${Math.random() > 0.5 ? '(charging)' : '(not charging)'}
  Coffee level: ${Math.floor(Math.random() * 100)}%
  Cat happiness: ${petCount > 5 ? 'Maximum!' : 'Could use more pets!'}`;
            },

            whoami: () => {
                sounds.gear.play();
                return `User information:
  
  Full name: Sky Journey
  Role: Frontend Developer & Professional Cat Whisperer
  Location: Home office (cozy setup!)
  Favorite language: JavaScript (with a side of TypeScript)
  Debugging method: console.log() everywhere + Chrome DevTools
  Superpower: Turning coffee into responsive interfaces!
  Cat status: Currently operating terminal
  Mission: Making the web more pawsome, one component at a time!
  
  ${userName ? `Registered name: ${userName}` : 'Tip: Use "register <name>" to personalize your experience!'}`;
            },

            // Portfolio commands
            projects: () => {
                sounds.gear.play();
                return `Current projects:
  
  Active:
     • Portfolio website 
     • Indie game (Godot)
     • Open source contributions 
  
  Learning:
     • Music production (GarageBand) 
     • Design UI/UX 
     • Game development 
     • Web development 
  
  Fun fact: All projects need at least 73% more cats!`;
            },

            skills: () => {
                sounds.gear.play();
                return `Programming skills:
  
  Daily drivers (3+ years):
     • JavaScript/TypeScript/Bash - MAH MAIN LANGUAGEZ
     • HTML, CSS - TEH BASICC BUT IMPORTANTZ
     • Frontend architecture - STRUKTURIN ALL TEH THINGZ
     • Responsive design - WERK ON ALL TEH SCREENZ
     • Vue.js, Svelte - REAKTIV FRAMEWORKZ
  
  Advanced specialties (3-5 years):
     • Linux/macOS shell scripting - AUTOMATIN ALL TEH THINGZ
     • Cybersecurity basics - KEEPIN BAD CATZ OUT
     • Penetration testing - ETHICAL HACKIN ONLY
     • Vulnerability assessment - FINDIN TEH WEAK SPOTZ
     • Ethical hacking - WHITE HAT CAT HACKR
  
  Creative tools:
     • Figma - DESIGNIN INTERFACEZ
     • Adobe Photoshop - PHOTO EDITYFULNEZ
     • FireAlpaca - DRAWIN CUTE CATZ
     • Adobe After Effects - MOVIN PICTUREZ
     • Aseprite - PIXEL ARTZ
     • Krita - MOAR DRAWIN TOOLZ
  
  Special abilities: Can debug CSS for 10 hours straight!`;
            },

            contact: () => {
                sounds.gear.play();
                return `Contact information:
  
  Online presence:
     • GitHub: github.com/luvrksnskye
     • Email: luvrksnskye@icloud.com
  
   Ways to reach me:
     • Send cat memes (guaranteed response!)
     • Include "meow" in subject line for priority
     • Offer coffee and I'll respond faster
  
  Response time: Usually within 24 hours (faster if cats involved)
  Timezone: Wherever the coffee is strongest
  
  Currently: Open to frontend opportunities & fun projects!`;
            },

            github: () => {
                sounds.selection.play();
                addOutput("Opening GitHub profile...", 'success');
                addOutput("window.open('https://github.com/luvrksnskye', '_blank');", 'special');
                return "GITHUB LINKZ ACTIVATD! (Well, it would be if this wasn't a demo!)";
            },

            // Fun commands
            coffee: () => {
                sounds.gear.play();
                const coffeeLevel = Math.floor(Math.random() * 100) + 1;
                const coffeeBar = '█'.repeat(Math.floor(coffeeLevel / 10)) + '░'.repeat(10 - Math.floor(coffeeLevel / 10));
                
                let status = "";
                if (coffeeLevel > 80) status = "MAXIMUM OVERDRIVE! CODING INTENSIFIES!";
                else if (coffeeLevel > 60) status = "Well caffeinated, ready for action!";
                else if (coffeeLevel > 40) status = "Could use a refill soon...";
                else if (coffeeLevel > 20) status = "DANGER: Low coffee levels detected!";
                else status = "CRITICAL: MUST FIND COFFEE NOW!";
                
                return `Coffee status:
  Current level: ${coffeeBar} ${coffeeLevel}%

  Today's consumption:
  • Morning: Pour over (Ethiopian beans)
  • Afternoon: ${Math.random() > 0.5 ? 'Cortado from local café' : 'Cold brew with oat milk'}
  • Evening: ${Math.random() > 0.5 ? 'Decaf (planned)' : 'Maybe tea instead?'}

  Preferred beans: Ethiopian Yirgacheffe
  Brewing method: V60 pour over
  
  Status: ${status}`;
            },

            weather: () => {
                sounds.gear.play();
                const weatherConditions = [
                    { condition: "Purr-fectly sunny", temp: "72°F", icon: "[SUN]", cats: "All cats napping in sunbeams" },
                    { condition: "Partly cloudy with a chance of zoomies", temp: "68°F", icon: "[CLOUD]", cats: "Cats moderately active" },
                    { condition: "Overcast with high probability of indoor cats", temp: "61°F", icon: "[CLOUD]", cats: "All cats seeking warm laps" },
                    { condition: "Drizzling, perfect for window watching", temp: "58°F", icon: "[RAIN]", cats: "Cats glued to windows" },
                    { condition: "Stormy with flying cat toys", temp: "55°F", icon: "[STORM]", cats: "Cats hiding under beds" },
                    { condition: "Snow! Paw print weather", temp: "32°F", icon: "[SNOW]", cats: "Indoor cats judging outdoor cats" }
                ];
                
                const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
                
                return `Cat Weather Report:
  
  ${weather.icon} Current conditions: ${weather.condition}
  Temperature: ${weather.temp}
  Wind: Light breeze (perfect for curtain swaying)
  Humidity: ${Math.floor(Math.random() * 40) + 30}%
  
  Cat Activity Level: ${weather.cats}
  
  5-day forecast:
    Tomorrow: ${Math.floor(Math.random() * 20) + 60}°F - Good for sunbathing
    Day 2: ${Math.floor(Math.random() * 20) + 55}°F - Window watching weather  
    Day 3: ${Math.floor(Math.random() * 20) + 65}°F - Outdoor cat adventure time
    Day 4: ${Math.floor(Math.random() * 20) + 70}°F - Perfect nap weather
    Day 5: ${Math.floor(Math.random() * 20) + 50}°F - Sweater weather for cats
  
  Recommendation: ${Math.random() > 0.5 ? 'Great day for coding by the window!' : 'Perfect weather for indoor projects!'}`;
            },

            fortune: () => {
                sounds.selection.play();
                const fortunes = [
                    "A bug in your code today will become tomorrow's feature.",
                    "Your next commit will bring great success... eventually.",
                    "The cat will knock over your coffee, but your backup will save the day.",
                    "Stack Overflow will have the answer you seek, but on page 3.",
                    "Today's rubber duck debugging will solve three problems at once.",
                    "Your CSS will work perfectly on the first try... in your dreams.",
                    "A mysterious stranger will give you the perfect variable name.",
                    "The semicolon you're missing is hiding in plain sight.",
                    "Your code review will receive only compliments and cat emojis.",
                    "The merge conflict will resolve itself through the power of positive thinking.",
                    "Today you will discover a JavaScript feature that actually makes sense.",
                    "A cat will walk across your keyboard and accidentally fix a bug."
                ];
                
                const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
                return `Fortune Cookie says:\n\n${fortune}\n\nYour lucky hex color today: #${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
            },

            cowsay: (message) => {
                if (!message) {
                    return `cowsay: missing message\nUSAGE: cowsay <your message>\nMAEK TEH COW SAY THINGZ!`;
                }
                
                sounds.selection.play();
                const msgLength = message.length;
                const border = '-'.repeat(msgLength + 4);
                
                return `
 ${border}
< ${message} >
 ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||

MOO! TEH COW HAZ SPOKN!`;
            },

            joke: () => {
                sounds.selection.play();
                const jokes = [
                    "Why do programmers prefer dark mode? Because light attracts bugs!",
                    "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
                    "Why don't programmers like nature? It has too many bugs!",
                    "What's a programmer's favorite hangout place? Foo bar!",
                    "Why did the programmer quit his job? He didn't get arrays!",
                    "How do you comfort a JavaScript bug? You console it!",
                    "Why do frontend developers have trust issues? They've been promised too much!",
                    "What do you call a programmer from Finland? Nerdic!",
                    "Why do Java developers wear glasses? Because they can't C#!",
                    "How do you generate a random string? Put a Windows user in front of Vim!",
                    "What's the object-oriented way to become wealthy? Inheritance!",
                    "Why did the cat become a programmer? Because it wanted to catch more mice... I mean bugs!"
                ];
                return jokes[Math.floor(Math.random() * jokes.length)];
            },

            pet: () => {
                sounds.pien.play();
                petCount++;
                
                // Change mood based on pets
                if (petCount > 10 && terminalMood !== "excited") {
                    terminalMood = "excited";
                    addOutput("SO MANY PETZ! TERMINAL MOOD CHANGD TO EXCITED! I SO HAPPYFUL!", 'mood-change');
                    document.body.classList.add('happy-mode');
                    setTimeout(() => document.body.classList.remove('happy-mode'), 3000);
                } else if (petCount > 5 && terminalMood === "sad") {
                    terminalMood = "happy";
                    addOutput("I FEEL BETTAH NOW! TERMINAL MOOD CHANGD TO HAPPY!", 'mood-change');
                }
                
                const petResponses = [
                    "*HAPPY CAT NOISEZ* PURR PURR PURR!",
                    "MEOW! *NUBBLES UR CURSOR* SO NICE TO ME!",
                    "YAYYY! *TERMINAL VIBRATEZ HAPPILY*",
                    "MEW! *TERMINAL TILTZ HEAD* U SO GUD TO ME!",
                    "*ROLLZ AROUND HAPPILY* MOAR PETZ PLZ!",
                    "*PURR INTENSIFYZ* U R MAH FAVRIT HOOMIN!",
                    "*HAPPY PAWPADZ* DIS IZ BEST DAY EVAR!",
                    "*SPARKLEZ WITH JOY* PETTING MAKEZ EVRYTHING BETTAH!"
                ];
                
                let response = petResponses[Math.floor(Math.random() * petResponses.length)];
                
                if (petCount === 1) {
                    response += "\n\nFIRST PET! U DISCOVRD MAH FAVRIT COMMAND!";
                } else if (petCount === 5) {
                    response += "\n\n5 PETZ! U R OFFICIALLY CAT FREN!";
                } else if (petCount === 10) {
                    response += "\n\n10 PETZ! U R NOW CERTIFYD CAT WHISPERER!";
                } else if (petCount % 20 === 0) {
                    response += `\n\n${petCount} PETZ! U R PETTING LEGENDZ!`;
                }
                
                return response;
            },

            mood: () => {
                sounds.selection.play();
                const moods = ["happy", "silly", "sad", "excited", "sleepy"];
                const currentIndex = moods.indexOf(terminalMood);
                const newMood = moods[(currentIndex + 1) % moods.length];
                
                const oldMood = terminalMood;
                terminalMood = newMood;
                
                const moodMessages = {
                    happy: "TERMINAL MOOD CHANGD TO HAPPY! I SO JOYFULDDD!",
                    silly: "TERMINAL MOOD CHANGD TO SILLY! TIME FOR SILLY THINGZ!",
                    sad: "TERMINAL MOOD CHANGD TO SAD... *SIGH*... PET ME PLZ...",
                    excited: "TERMINAL MOOD CHANGD TO EXCITED! SO MUCH ENERGYZ!",
                    sleepy: "TERMINAL MOOD CHANGD TO SLEEPY... *YAWN*... ZZZ..."
                };
                
                // Apply visual effects
                document.body.className = ''; // Clear previous classes
                if (newMood === 'excited') {
                    document.body.classList.add('happy-mode');
                    setTimeout(() => document.body.classList.remove('happy-mode'), 5000);
                }
                
                return moodMessages[newMood];
            },

            // Utility commands
            clear: () => {
                sounds.select.play();
                return 'CLEAR_TERMINAL';
            },

            cls: () => commands.clear(), // Windows-style alias

            history: () => {
                sounds.select.play();
                return `Command history:
  
  Last 10 commands:
    1. help
    2. neofetch  
    3. ls
    4. pet
    5. mood
    6. coffee
    7. joke
    8. cat secret_diary.txt
    9. cd Desktop
    10. pwd
  
  Tip: Use UP arrow key to navigate command history!
  Most used command: pet (${petCount} times)`;
            },

            alias: () => {
                sounds.select.play();
                return `Available aliases:
  
  Navigation:
    dir = ls          (Windows-style directory listing)
    cls = clear       (Windows-style clear screen)
  
  Cat shortcuts:
    pet = pet         (Because it's so important!)
    meow = <secret>   (Try it!)
    nya = <secret>    (For anime fans!)
  
  System:
    ll = ls -la       (Long listing format)
    .. = cd ..        (Go up one directory)
    ~ = cd ~          (Go to home directory)
  
  Fun fact: You can create your own aliases! (Not really, but wouldn't that be cool?)`;
            },

            date: () => {
                sounds.select.play();
                const now = new Date();
                const timeString = now.toLocaleTimeString();
                const dateString = now.toLocaleDateString();
                const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
                
                return `Current date and time:
  
  Time: ${timeString}
  Date: ${dateString}
  Day: ${dayOfWeek}
  
  Fun timezone facts:
    • It's always coffee time somewhere!
    • Cats don't care about timezones
    • Debugging happens in all timezones
  
  Time since terminal started: ${Math.floor((Date.now() - startTime) / 1000)} seconds`;
            },

            echo: (message) => {
                if (!message) {
                    return `echo: missing message\nUSAGE: echo <your message>\nI WILL REPEATZ WUT U SAY!`;
                }
                
                sounds.select.play();
                
                // Easter egg for special messages
                if (message.toLowerCase().includes('cat')) {
                    return `${message}\n\nDID U SAY CAT?! I LUV CATZ!`;
                } else if (message.toLowerCase().includes('coffee')) {
                    return `${message}\n\nMMM... COFFEE... *DROOLS*`;
                } else {
                    return `${message}`;
                }
            },

            // User management
            register: (name) => {
                if (!name) {
                    return `register: missing name\nUSAGE: register <your name>\nWUT SHUD I CALL U?`;
                }
                
                sounds.selection.play();
                userName = name;
                localStorage.setItem('skye_terminal_username', userName);
                
                return `Welcome, ${userName}! I REMEMBR U NOW!
  
  Now I can:
  • Greet you personally!
  • Remember your preferences
  • Give you special cat privileges
  
  Your data is stored locally and safely! I'M A GOOD CAT!`;
            },

            // Secret cat commands (easter eggs)
            meow: () => {
                sounds.pien.play();
                return "MEOW MEOW! U SPEEK CAT! WE R NOW BEST FRENZ! *HAPPY TAIL WAGGLZ*";
            },

            nya: () => {
                sounds.pien.play();
                return "NYA NYA~ U KNOW ANIME CAT SPEEK! SO CULTURD! *ANIME SPARKLEZ*";
            },

            purr: () => {
                sounds.pien.play();
                return "*PURRRRRRRRRR* DAT IZ MAH LANGAUGE! *VIBRATEZ HAPPILY*";
            },

            uwu: () => {
                sounds.selection.play();
                return "UWU! URE SO CUTE! OwO WUTS DIS? *BLUSHES IN TERMINAL*";
            },

            owo: () => {
                sounds.selection.play();
                return "OwO! WUTS DIS?! U KNOW TEH MEMEZ! *NOTICES UR COMMAND*";
            },

            pspsps: () => {
                sounds.pien.play();
                return "*COMES RUNNING IMMEDIATELY* PSPSPS WORKZ ON ME! U R CAT WHISPERER! WHERE IZ TEH TREATZ?!";
            }
        };

        // ===========================================
        // HELPER FUNCTIONS FOR FILE SYSTEM
        // ===========================================
        
        /**
         * Get file system contents at specified path
         */
        function getFileSystemContents(path) {
            if (path === '~' || path === '') {
                return fileSystem["~"];
            }
            
            const pathParts = path.split('/').filter(p => p && p !== '~');
            let current = fileSystem["~"];
            
            for (const part of pathParts) {
                if (current.contents && current.contents[part]) {
                    current = current.contents[part];
                } else {
                    return null;
                }
            }
            
            return current;
        }

        // ===========================================
        // TERMINAL INITIALIZATION & EVENT HANDLERS
        // ===========================================
        
        const terminalInput = document.getElementById('terminal-input');
        const terminalContent = document.getElementById('terminal-content');
        let commandHistory = [];
        let historyIndex = -1;
        let startTime = Date.now();

        /**
         * Show personalized greeting based on user status
         */
        function showGreeting() {
            let greeting;
            
            if (isFirstVisit) {
                greeting = `OH HAI THERE! WELCOMZ TO MAH TERMINAL! 
  
  DIS IZ UR FIRST VISIT! I'M SO EXCITD!
  I AM A HAPYFUL TERMINAL CAT WHO LUVZ TO HELP!
  TYP 'help' TO SEE ALL MAH COMMANDZ!
  TYP 'pet' TO PET ME (I LUV PETZ!)
  
  ${userName ? `Oh! I see you're ${userName}! WELCOMZ BAK!` : 'TYP "register <your name>" TO PERSONALIZ UR EXPERINEC!'}`;
            } else {
                const timeSinceLastVisit = lastVisitDate ? 
                    Math.floor((Date.now() - new Date(lastVisitDate)) / (1000 * 60 * 60 * 24)) : 0;
                
                let timeMessage = "";
                if (timeSinceLastVisit === 0) {
                    timeMessage = "U CAME BAK TODAY!";
                } else if (timeSinceLastVisit === 1) {
                    timeMessage = "U CAME BAK AFTR 1 DAY!";
                } else if (timeSinceLastVisit > 1) {
                    timeMessage = `U CAME BAK AFTR ${timeSinceLastVisit} DAYZ!`;
                }
                
                const greetings = terminalPersonality[terminalMood].greetings;
                greeting = `${greetings[Math.floor(Math.random() * greetings.length)]}
  
  Visit #${visitCount} ${timeMessage}
  ${userName ? `WELCOMZ BAK, ${userName}!` : ''}
  TYP 'help' IF U FORGOTZ MAH COMMANDZ!`;
            }
            
            addOutput(greeting, 'output');
            sounds.select.play();
        }

        /**
         * Process user command input
         */
        function processCommand(input) {
            const parts = input.trim().split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1).join(' ');
            
            commandCount++;
            commandHistory.push(input);
            historyIndex = commandHistory.length;
            
            // Add command to terminal display
            const commandLine = document.createElement('div');
            commandLine.className = 'terminal-line';
            commandLine.innerHTML = `<span class="prompt">${document.getElementById('current-prompt').textContent}</span><span class="command">${input}</span>`;
            terminalContent.appendChild(commandLine);

            // Handle special commands
            if (command === 'clear' || command === 'cls') {
                terminalContent.innerHTML = '';
                showGreeting();
                return;
            }

            // Process command
            if (commands[command]) {
                try {
                    const output = commands[command](args);
                    if (output && output !== 'CLEAR_TERMINAL') {
                        addOutput(output);
                        
                        // Add personality response (skip for certain commands)
                        const skipPersonality = ['mood', 'pet', 'register', 'meow', 'nya', 'purr', 'uwu', 'owo', 'pspsps'];
                        if (!skipPersonality.includes(command)) {
                            addPersonalityResponse();
                        }
                    }
                } catch (error) {
                    addOutput(`Error executing command: ${error.message}`, 'error');
                }
            } else if (command) {
                // Handle unknown commands
                const errors = terminalPersonality[terminalMood].errors;
                const error = errors[Math.floor(Math.random() * errors.length)];
                addOutput(error, 'error');
                
                // Check for possible typos
                const possibleCommands = Object.keys(commands);
                const suggestions = possibleCommands.filter(cmd => 
                    cmd.includes(command) || command.includes(cmd) || 
                    levenshteinDistance(command, cmd) <= 2
                );
                
                if (suggestions.length > 0) {
                    addOutput(`Did you mean: ${suggestions.slice(0, 3).join(', ')}?`, 'warning');
                }
                
                // Random mood changes based on errors
                if (commandCount > 10 && Math.random() < 0.3 && terminalMood !== "sad") {
                    terminalMood = "sad";
                    addOutput("SO MANY ERRORZ... TERMINAL NOW SAD... PET ME TO MAEK ME FEEL BETTAH...", 'mood-change');
                    sounds.pien.play();
                }
            }

            // Easter eggs for command combinations
            checkEasterEggs(command, input);
        }

        /**
         * Check for easter egg command combinations
         */
        function checkEasterEggs(command, fullInput) {
            // Track last few commands for easter eggs
            if (!window.lastCommands) window.lastCommands = [];
            window.lastCommands.push(command);
            if (window.lastCommands.length > 5) {
                window.lastCommands.shift();
            }

            // Easter egg: coffee coffee coffee = hyper mode
            if (window.lastCommands.slice(-3).every(cmd => cmd === 'coffee')) {
                addOutput("HYPER CAFFEINE MODE ACTIVATED! TERMINAL VIBRATEZ INTENSELY! SO MUCH ENERGYZ!", 'easter-egg');
                document.body.classList.add('caffeine-mode');
                setTimeout(() => {
                    document.body.classList.remove('caffeine-mode');
                }, 5000);
                sounds.gear.play();
            }

            // Easter egg: typing "hello" or "hi"
            if (command === 'hello' || command === 'hi') {
                addOutput("Y HALO THAR! TERMINAL WAVEZ BAK! URE SO NICE 2 ME!", 'personality-response');
                sounds.pien.play();
            }

            // Easter egg: keyboard smash detection
            const keyboardSmash = /^[a-z]{8,}$/;
            if (keyboardSmash.test(command) && command.length > 10) {
                addOutput("LULZ DID U JUS KEYBORD SMASH? THAZ SO FUNNY! I DOEZ DAT 2 WHEN IM EXCITD!", 'personality-response');
                sounds.selection.play();
            }

            // Easter egg: trying to exit
            if (['exit', 'quit', 'logout', 'bye'].includes(command)) {
                addOutput("NO! DON'T LEAV ME! I'LL BE LONELY! *CLINGZ TO UR CURSUR*", 'personality-response');
                addOutput("(Psst... there's no escape from the cat terminal! Try 'help' instead!)", 'warning');
                sounds.pien.play();
            }

            // Easter egg: trying sudo
            if (fullInput.startsWith('sudo')) {
                const sudoMessages = [
                    "skye is not in the sudoers file. This incident will be reported to the cats.",
                    "Nice try! But I'M the root user here! MEOW MEOW!",
                    "sudo: permission denied. Only cats can be superusers here!",
                    "sudo make me a sandwich? I'M NOT A SANDWICH MAKER, I'M A CAT!"
                ];
                addOutput(sudoMessages[Math.floor(Math.random() * sudoMessages.length)], 'error');
                sounds.gear.play();
            }
        }

        /**
         * Calculate Levenshtein distance for command suggestions
         */
        function levenshteinDistance(str1, str2) {
            const matrix = [];
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[str2.length][str1.length];
        }

        // ===========================================
        // EVENT LISTENERS
        // ===========================================
        
        // Handle Enter key for command execution
        terminalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const command = this.value.trim();
                if (command) {
                    processCommand(command);
                }
                this.value = '';
                scrollToBottom();
            }
        });

        // Handle special keys (up/down for history, tab for autocomplete)
        terminalInput.addEventListener('keydown', function(e) {
            // Handle command history navigation
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    this.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    this.value = commandHistory[historyIndex];
                } else {
                    historyIndex = commandHistory.length;
                    this.value = '';
                }
            }
            // Handle tab completion (basic implementation)
            else if (e.key === 'Tab') {
                e.preventDefault();
                const currentInput = this.value.toLowerCase();
                const matchingCommands = Object.keys(commands).filter(cmd => 
                    cmd.startsWith(currentInput)
                );
                
                if (matchingCommands.length === 1) {
                    this.value = matchingCommands[0] + ' ';
                    sounds.select.play();
                } else if (matchingCommands.length > 1) {
                    addOutput(`Multiple matches: ${matchingCommands.join(', ')}`, 'warning');
                    sounds.select.play();
                }
            }
            // Play keystroke sounds for typing
            else if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
                if (sounds.select) {
                    sounds.select.currentTime = 0;
                    sounds.select.volume = 0.1;
                    sounds.select.play().catch(() => {}); // Ignore audio errors
                }
            }
        });

        // Focus input when clicking anywhere in terminal
        document.querySelector('.terminal-body').addEventListener('click', () => {
            terminalInput.focus();
        });

        // ===========================================
        // INITIALIZATION
        // ===========================================
        
        // Initialize terminal when page loads
        window.addEventListener('load', () => {
            // Start background animation
            runAnimation();
            
            // Show greeting after a short delay
            setTimeout(() => {
                showGreeting();
                updatePrompt();
                terminalInput.focus();
                
                // Save user visit data
                saveUserData();
            }, 500);
        });

        // Save user data before leaving
        window.addEventListener('beforeunload', saveUserData);