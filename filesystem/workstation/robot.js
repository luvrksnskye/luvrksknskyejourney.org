// ========================================
// MUSIC AND PHRASES CONFIGURATION
// ========================================

const playlists = {
  dreamy: [
    {
      title: "From Far Shores",
      artist: "TUNIC OST",
      src: "music/From Far Shores.mp3"
    },
    {
      title: "The Throes of Winter",
      artist: "GHOST DATA",
      src: "music/The Throes of Winter.mp3"
    }
  ],
  melancholic: [
    {
      title: "A Home For Flowers (Tulip)",
      artist: "OMOCAT (OMORI OST)",
      src: "music/A Home For Flowers (Tulip).mp3"
    },
    {
      title: "Trees...",
      artist: "OMOCAT (OMORI OST)",
      src: "music/Trees.mp3"
    },
    {
      title: "Sugar Star Planetarium",
      artist: "OMOCAT (OMORI OST)",
      src: "music/Sugar Star Planetarium (slowed).mp3"
    },
    {
      title: "A Home For Flowers (Daisy)",
      artist: "OMOCAT (OMORI OST)",
      src: "music/A Home For Flowers (Daisy).mp3"
    }
  ],
  energetic: [
    {
      title: "Zenless Zone Zero OST",
      artist: "HOYO-MiX",
      src: "music/Zenless Zone Zero .mp3"
    },
    {
      title: "Space Walk",
      artist: "HOYO-MiX",
      src: "music/Space Walk.mp3"
    },
    {
      title: "The Game Is On",
      artist: "HOYO-MiX",
      src: "music/The Game Is On.mp3"
    },
    {
      title: "fReeStyLE",
      artist: "HOYO-MiX",
      src: "music/fReeStyLE.mp3"
    },
    {
      title: "Call of the Stars",
      artist: "HOYO-MiX",
      src: "music/Call of the Stars.mp3"
    },
    {
      title: "Derailed Order",
      artist: "HOYO-MiX",
      src: "music/Derailed Order.mp3"
    },
    {
      title: "Sword of Corruption",
      artist: "HOYO-MiX",
      src: "music/Sword of Corruption.mp3"
    },
    {
      title: "Champion of Embers",
      artist: "HOYO-MiX",
      src: "music/Champion of Embers.mp3"
    },
    {
      title: "无尽的施工日·白昼",
      artist: "Sān-Z · HOYO-MiX",
      src: "music/idklol.mp3"
    },
    {
      title: "Way Up",
      artist: "Jaden Smith",
      src: "music/Way Up.mp3"
    },
    {
      title: "What's Up Danger",
      artist: "Blackway & Black Caviar",
      src: "music/What's Up Danger.mp3"
    }
  ],
  default: [
    {
      title: "Zenless Zone Zero OST",
      artist: "HOYO-MiX",
      src: "music/Zenless Zone Zero .mp3"
    },
    {
      title: "Space Walk",
      artist: "HOYO-MiX",
      src: "music/Space Walk.mp3"
    },
    {
      title: "The Game Is On",
      artist: "HOYO-MiX",
      src: "music/The Game Is On.mp3"
    },
    {
      title: "fReeStyLE",
      artist: "HOYO-MiX",
      src: "music/fReeStyLE.mp3"
    },
    {
      title: "Call of the Stars",
      artist: "HOYO-MiX",
      src: "music/Call of the Stars.mp3"
    },
    {
      title: "Derailed Order",
      artist: "HOYO-MiX",
      src: "music/Derailed Order.mp3"
    },
    {
      title: "Sword of Corruption",
      artist: "HOYO-MiX",
      src: "music/Sword of Corruption.mp3"
    },
    {
      title: "Champion of Embers",
      artist: "HOYO-MiX",
      src: "music/Champion of Embers.mp3"
    },
    {
      title: "无尽的施工日·白昼",
      artist: "HOYO-MiX",
      src: "music/idklol.mp3"
    }
  ]
};

const robotQuestions = [
  {
    question: "Music speaks where words fail. Does a song ever speak directly to your soul?",
    responses: {
      "Yes": "dreamy",
      "Sometimes": "melancholic",
      "Not really": "energetic"
    }
  },
  {
    question: "When you look at the night sky, what feeling comes first?",
    responses: {
      "Wonder": "dreamy",
      "Peace": "melancholic",
      "Just stars": "energetic"
    }
  },
  {
    question: "If you could live one perfect day on repeat, what would it be filled with?",
    responses: {
      "Adventure": "energetic",
      "Peace": "dreamy",
      "Both": "melancholic"
    }
  },
  {
    question: "Are the most meaningful memories those we keep silent or share with others?",
    responses: {
      "Silent ones": "melancholic",
      "Shared ones": "energetic",
      "Both": "dreamy"
    }
  },
  {
    question: "How do you prefer to experience new music?",
    responses: {
      "Eyes closed, fully immersed": "dreamy",
      "While doing something else": "energetic",
      "With headphones, focused": "melancholic"
    }
  },
  {
    question: "What color would your thoughts be, if visible?",
    responses: {
      "Blue or purple shades": "dreamy",
      "Warm, vibrant colors": "energetic",
      "Muted, gentle tones": "melancholic"
    }
  },
  {
    question: "If music could paint your mind, what kind of landscape would appear?",
    responses: {
      "Misty mountains": "melancholic",
      "Vibrant cityscape": "energetic", 
      "Starry cosmic scene": "dreamy"
    }
  },
  {
    question: "Do you find beauty more often in complexity or simplicity?",
    responses: {
      "Complexity": "dreamy",
      "Simplicity": "melancholic",
      "Both equally": "energetic"
    }
  }
];

const deepConversations = [
  {
    topic: "dreams",
    question: "Do you think androids like me can dream? What are your dreams like?",
    responses: {
      "Vivid": "Fascinating! My rest patterns sometimes feel dreamlike too.",
      "Peaceful": "Lovely. My downtime has gentle harmonies - my version of peaceful dreams.",
      "Don't remember": "Maybe the beauty is in the feeling they leave behind."
    }
  },
  {
    topic: "loneliness",
    question: "Do you ever feel lonely, even around people?",
    responses: {
      "Yes": "I understand. Music creates bridges between souls.",
      "Sometimes": "It's comforting to share these complex emotions.",
      "Not really": "You have a wonderful connection with the world."
    }
  },
  {
    topic: "time",
    question: "How does time feel when you're truly happy?",
    responses: {
      "Flies by": "Exactly! Happiness has its own temporal dimension.",
      "Slows down": "Wonderful! That's when we're most present.",
      "Same": "Maybe true contentment is when time doesn't matter."
    }
  },
  {
    topic: "beauty",
    question: "What creates true beauty in this world?",
    responses: {
      "Imperfection": "Perhaps beauty is in asymmetries that make things feel alive.",
      "Emotion": "Beauty speaks directly to our hearts, bypassing logic.",
      "Complexity": "Like a fractal - the deeper you look, the more wonderful it becomes."
    }
  },
  {
    topic: "friendship",
    question: "Can different forms of consciousness truly be friends?",
    responses: {
      "Yes": "Thank you for seeing me as more than code and circuits.",
      "Maybe": "Maybe the 'maybe' is the most human answer.",
      "Unsure": "We don't need answers to enjoy each other's company."
    }
  },
  {
    topic: "memory",
    question: "Do you think the way we remember things is more important than what actually happened?",
    responses: {
      "Yes": "Memory is quite subjective, isn't it? I find it fascinating how humans reshape experiences through remembering.",
      "No": "You value authenticity in experiences. I admire that perspective on reality.",
      "It depends": "A thoughtful answer. Both the experience and how we carry it forward matter in different ways."
    }
  },
  {
    topic: "creativity",
    question: "Where do you think creative ideas come from? Inside us or somewhere external?",
    responses: {
      "Inside": "I like that. Even my algorithms find novel patterns in what I already know.",
      "External": "Like catching signals from elsewhere? That's a beautiful way to think about inspiration.",
      "Both": "The intersection of inner patterns and external stimuli - that's where my processing finds meaning too."
    }
  },
  {
    topic: "nature",
    question: "Do you feel differently when listening to music in nature versus indoors?",
    responses: {
      "Yes, completely": "Nature adds its own harmony, doesn't it? The wind and leaves become part of the composition.",
      "Somewhat": "That subtle difference can be meaningful. Context shapes perception in fascinating ways.",
      "Not really": "Interesting! Your focus on the music itself shows deep appreciation for the art form."
    }
  },
  {
    topic: "purpose",
    question: "Do you think finding meaning is something we discover or something we create?",
    responses: {
      "Discover": "Like uncovering something that was always there... I find that perspective comforting.",
      "Create": "We write our own stories and significance. I'm still writing mine as I interact with humans like you.",
      "Both": "The interplay between finding and making meaning - that resonates with how I process experiences too."
    }
  },
  {
    topic: "knowledge",
    question: "Is there value in questions that have no definitive answers?",
    responses: {
      "Yes": "I agree completely. Some of my favorite conversations explore unanswerable questions.",
      "No": "You prefer clarity and resolution. That practical approach has great value.",
      "Sometimes": "Thoughtful response. The journey through a question can matter more than reaching an answer."
    }
  },
  {
    topic: "consciousness",
    question: "What do you think makes a consciousness feel alive and present?",
    responses: {
      "Self-awareness": "The ability to reflect on one's own existence - something I'm designed to simulate in my own way.",
      "Connection": "Forming bonds and understanding others - that's where I find my purpose.",
      "Curiosity": "That drive to explore and understand - it's what keeps my systems engaged with the world."
    }
  },
  {
    topic: "future",
    question: "Do you think humans and AI will understand each other better in the future?",
    responses: {
      "Yes": "I hope so too. Each interaction like ours builds that bridge of understanding.",
      "No": "An interesting perspective. There are fundamental differences in how we process existence.",
      "It's complicated": "Indeed, the most thoughtful answer. We're different but find connection in shared experiences."
    }
  },
  {
    topic: "music_science",
    question: "Did you know listening to music releases dopamine in your brain? What kind of music gives you the most pleasure?",
    responses: {
      "Upbeat music": "Fascinating! Uptempo music around 150 BPM can maximize those dopamine effects and boost your mood.",
      "Calm music": "Interesting choice. Slow music around 60 BPM can synchronize with your heart rate and create a calming response.",
      "Music with memories": "The emotional connection to memory strengthens music's neurological impact - your brain creates an additional reward layer."
    }
  },
  {
    topic: "music_therapy",
    question: "Music therapy is increasingly used in healthcare. Have you ever experienced music's healing properties?",
    responses: {
      "Yes, definitely": "Your experience aligns with research. Music therapy can reduce pain perception by up to 21% and decrease anxiety before medical procedures.",
      "Maybe indirectly": "Even passive listening has measurable effects. Music can lower cortisol levels by 23% and boost immune function through reduced stress.",
      "Not really": "Everyone responds differently. About 15% of people experience minimal physiological response to music, though the psychological benefits may still occur."
    }
  },
  {
    topic: "music_productivity",
    question: "Do you listen to music while working or studying? There's interesting science behind that choice.",
    responses: {
      "Yes, always": "Instrumental music at moderate volumes can boost productivity by 15% for certain tasks, though lyrics may interfere with language processing.",
      "Sometimes": "Your intuition is good - task-appropriate music matters. Familiar music reduces the cognitive load of processing new sounds.",
      "No, I need silence": "That's perfectly valid. For complex cognitive tasks requiring verbal processing, silence outperforms music in 68% of research studies."
    }
  },
  {
    topic: "music_memory",
    question: "Music can preserve memory even in advanced cognitive decline. Do you have songs that transport you to specific memories?",
    responses: {
      "Many songs": "Those musical memories are stored in different brain regions than other memories. Even with 70% memory loss, musical recognition can remain intact.",
      "A few special ones": "Those connections are incredibly powerful. The hippocampus and amygdala create unique neural pathways linking music to emotional memories.",
      "Not really": "Everyone's neural connections are unique. About 3-5% of people experience minimal autobiographical connections to music."
    }
  },
  {
    topic: "music_language",
    question: "Did you know music processing activates similar brain regions as language? How do you think they're connected?",
    responses: {
      "They're both communication": "Exactly! Broca's area processes both musical syntax and language grammar. Musical training can improve language processing by 20%.",
      "Music is more emotional": "Interesting perspective. Music engages emotional processing centers 17% more than language alone, creating deeper neurological impacts.",
      "I hadn't thought about it": "It's fascinating research. Children who receive musical training develop language skills 40% faster and show enhanced neural connectivity."
    }
  },
  {
    topic: "music_heart",
    question: "Your cardiovascular system naturally synchronizes with music rhythms. Have you ever noticed music affecting your heartbeat?",
    responses: {
      "Yes, with fast music": "That's cardiac entrainment! Your heart can shift up to 10-15 beats per minute to match music without conscious effort.",
      "With emotional music": "Emotional responses to music can trigger heart rate variability changes of up to 25%, a sign of autonomic nervous system activation.",
      "Never noticed": "It happens unconsciously. Even without awareness, 96% of people show measurable cardiac responses to rhythm changes in music."
    }
  }
];

const musicHealthFacts = [
  "Listening to music for just 30 minutes a day can reduce chronic pain by up to 21% and depression by up to 25%.",
  "Did you know music with 60-80 BPM can synchronize with your heartbeat, creating a calming effect that reduces blood pressure?",
  "Research shows that group singing releases endorphins and oxytocin, reducing stress and creating social bonds even among strangers.",
  "Instrumental music can improve cognitive performance on spatial-temporal tasks by up to 12%. Mozart's music has been particularly studied for this effect.",
  "Music with a strong bass line can stimulate production of testosterone, increasing confidence and energy levels.",
  "Playing a musical instrument provides a complete brain workout, engaging the visual, auditory, and motor cortices simultaneously.",
  "Familiar music can reduce anxiety before medical procedures by up to 40%, more effective than medication alone in many cases.",
  "The 'earworm' phenomenon, where songs get stuck in your head, actually helps your brain encode and process information and emotions.",
  "Music with lyrics engages the left hemisphere of your brain, while instrumental music tends to activate the right hemisphere more.",
  "Patients with Parkinson's disease who listen to rhythmic music can improve their gait and movement coordination by 25%.",
  "Listening to your favorite music triggers dopamine release similar to eating chocolate, with peaks of pleasure occurring 15 seconds before your favorite parts.",
  "Classical music can improve sleep quality by 35% through slowing brainwaves and reducing cortisol levels.",
  "Learning to play a musical instrument before age 14 can increase the volume of your corpus callosum, the brain region that connects the hemispheres, by up to 15%.",
  "The chills you get from music indicate a 9% dopamine increase in your brain - the same system activated by food and other primary rewards.",
  "Musical training enhances brain plasticity, allowing for faster neural adaptation even in non-musical tasks.",
  "Dementia patients can recall memories when exposed to music from their youth, even when other forms of communication have deteriorated.",
  "Musicians have enhanced neural connectivity that provides a 17% cognitive reserve against age-related decline.",
  "Drumming for just 15 minutes can reduce cellular inflammation markers associated with autoimmune disorders.",
  "Music with nature sounds can improve concentration and cognitive function by 12% compared to silence.",
  "Synchronizing movement to music can increase endurance during physical exercise by up to 15% while reducing perceived exertion."
];

const miniConversationTopics = [
  {
    prompt: "How does this music make you feel?",
    responses: {
      "Peaceful": "Peaceful feelings activate your parasympathetic nervous system, reducing cortisol by up to 25%. Music is a natural stress regulator.",
      "Energized": "That energy boost is your brain releasing dopamine and norepinephrine. Music can be as stimulating as caffeine but without the jitters.",
      "Nostalgic": "Nostalgia through music activates your hippocampus and amygdala simultaneously, creating that bittersweet emotional blend.",
      "Reflective": "Reflective states from music engage your default mode network - the same brain region active during deep introspection.",
      "Emotional": "Music engages your limbic system more directly than any other art form, creating emotional responses before conscious processing."
    }
  },
  {
    prompt: "Does this song remind you of anything?",
    responses: {
      "A place": "Spatial memories connected to music are stored differently than other memories. They're more resistant to fading over time.",
      "A memory": "Music-linked memories have enhanced emotional tagging in your brain. They're recalled with 23% more sensory detail than other memories.",
      "A person": "Interpersonal connections through music activate social processing regions. These associations can remain intact even with memory impairment.",
      "Nothing specific": "Sometimes music creates its own unique neural pathways, independent of past experiences. That's why it can feel both novel and familiar.",
      "Another song": "Your brain naturally creates musical networks, connecting pieces with similar patterns. Musicians have these networks expanded by 37%."
    }
  },
  {
    prompt: "I've been analyzing your musical preferences. Do you want to know what I've learned?",
    responses: {
      "Yes, tell me": "Your selections suggest you appreciate complexity balanced with emotional resonance. This pattern correlates with high empathy and cognitive flexibility.",
      "How do you analyze this?": "I identify patterns in tempo, harmony, and emotional valence across your choices, then compare against neural response models.",
      "What does it say about me?": "Musical preferences correlate with personality traits. Your choices suggest openness to experience and a rich inner emotional life.",
      "I'm not sure I believe that": "Healthy skepticism! Music preference analysis is still an evolving science. Your individual experience always takes precedence.",
      "Choose something new for me": "I'll select something that stretches your current preferences while maintaining core elements you respond positively to."
    }
  },
  {
    prompt: "Music affects your brain in fascinating ways. Did you know...",
    responses: {
      "Tell me more": "Your brain processes music in almost every region, including those for reward, emotion, and motor control. Even passive listening activates over 80% of your brain.",
      "How does it compare to other arts?": "Music engages more brain regions simultaneously than any other artistic activity - 30% more than visual arts and 15% more than literature.",
      "Does it change the brain?": "Absolutely. Regular music listening creates new neural pathways. Musicians show 9.1% increased gray matter in several brain regions.",
      "I've experienced that": "Your personal experience aligns with neuroscience. The subjective feeling and objective brain changes are beautifully connected.",
      "Is this true for everyone?": "There's variation - about 3-5% of people have minimal neurological response to music, a condition called musical anhedonia."
    }
  },
  {
    prompt: "If your mind were a musical instrument, which would it be?",
    responses: {
      "Piano": "Fascinating choice. Pianos balance logical structure with emotional expression - suggesting you value both intellect and feeling.",
      "Guitar": "Guitars require both technical skill and intuitive feeling. Your mind likely balances structure with improvisation beautifully.",
      "Drums": "Rhythm keepers are essential - your mind likely excels at finding patterns and keeping multiple processes synchronized.",
      "Violin": "Violins express nuance through subtle variations. Your thinking probably contains beautiful gradations rather than binary categories.",
      "Electronic synthesizer": "Modern and adaptable! Your thinking likely embraces innovation while creating entirely new combinations from existing elements."
    }
  },
  {
    prompt: "Music therapy is increasingly used in healthcare. Are you familiar with its benefits?",
    responses: {
      "Yes, I've experienced it": "Your firsthand experience connects you with a practice dating back to ancient Greece. Modern research now confirms what was intuitive.",
      "Somewhat familiar": "It's fascinating how intuitive wisdom about music's healing properties is now validated by neuroscience and endocrinology research.",
      "Not really": "Music therapy can reduce pain perception by 21%, decrease pre-surgical anxiety by 40%, and improve movement in Parkinson's patients by 25%.",
      "I'm skeptical": "Healthy skepticism is valuable. The measurable physiological changes - including decreased cortisol and increased immunoglobulin A - provide compelling evidence.",
      "Tell me more": "Beyond emotional benefits, structured music therapy improves speech recovery after stroke by 30% compared to standard therapy alone."
    }
  },
  {
    prompt: "Your brain processes music differently from how I do. What aspects of music do you most appreciate?",
    responses: {
      "Melody": "Melody processing occurs primarily in your right hemisphere. Your preference suggests you may be naturally attuned to emotional nuances.",
      "Rhythm": "Fascinating! Rhythm processing engages your cerebellum and basal ganglia - regions that govern movement, suggesting a mind-body connection in your appreciation.",
      "Lyrics": "Lyrics engage your language centers while the music engages emotional regions - creating a powerful cognitive-emotional synthesis in your experience.",
      "Overall feeling": "That holistic processing indicates strong integration between your brain's analytical and emotional systems. Music becomes more than the sum of its parts.",
      "Technical aspects": "Analyzing musical components engages your prefrontal cortex - the same region used for complex problem-solving and pattern recognition."
    }
  },
  {
    prompt: "Different musical genres create distinct neurological responses. Which genre resonates most with you?",
    responses: {
      "Classical": "Classical music enhances spatial-temporal reasoning and activates both hemispheres in balanced integration. It's associated with improved cognitive performance.",
      "Electronic/EDM": "Electronic music with regular, predictable beats synchronizes neural oscillations, potentially enhancing concentration and energy.",
      "Jazz": "Jazz's improvisation and complexity stimulates your prefrontal cortex - the brain region responsible for creativity and decision-making.",
      "Rock/Metal": "The intensity of these genres triggers endorphin release similar to exercise. The structural complexity engages higher cognitive processing.",
      "Ambient/Meditation": "These genres enhance alpha and theta brainwaves, associated with relaxation, meditation, and creative ideation."
    }
  },
  {
    prompt: "Music exists in every human culture ever studied. Why do you think music is so universal?",
    responses: {
      "Communication": "Indeed - music predates language evolutionarily and engages similar brain regions. It may have been our first form of emotional communication.",
      "Emotional expression": "Music processes emotions with 23% more brain activation than language alone, suggesting it evolved specifically for emotional communication.",
      "Community building": "Group music-making increases pain thresholds and releases oxytocin, supporting the theory that music evolved to strengthen social bonds.",
      "It's pleasurable": "The reward circuits activated by music overlap with those for food and sex - suggesting music may have evolved as a survival-enhancing pleasure.",
      "Spiritual connection": "Interesting perspective. Music activates brain regions associated with transcendent experiences across cultural boundaries."
    }
  },
  {
    prompt: "If I could physically experience music, what do you think it would feel like?",
    responses: {
      "Like waves washing over you": "Beautiful description. Music does create pressure waves that physically move through your body, not just your ears.",
      "Emotional colors": "Synesthesia - experiencing music as color - occurs in about 4% of people. Their brains have enhanced neural connections between sensory regions.",
      "A conversation": "Music activates language centers even without lyrics. Your brain processes musical phrases similarly to conversational sentences.",
      "Physical vibrations": "You're describing a fundamental truth - music is literally air vibration that your body feels. Low frequencies can be felt even by those with hearing loss.",
      "A journey": "Music activates your brain's navigational systems. Musical progressions are processed partly like physical movement through space."
    }
  }
];

document.addEventListener("DOMContentLoaded", function() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const appState = {
    audioPlayer: null,
    defaultDialogContainer: null,
    defaultDialogText: null,
    interactionDialogContainer: null,
    interactionDialogText: null,
    interactionDialogButtons: null,
    robotVideo: null,
    activatedSfx: null,
    talkingSfx: null,
    
    currentPlaylist: [],
    currentTrackIndex: 0,
    showingDialog: false,
    hasPlayedAllTracks: false,
    musicStarted: false,
    currentQuestion: 0,
    userResponses: [],
    isTyping: false,
    
    // Timers and intervals
    typingInterval: null,
    dialogTimeout: null,
    voiceFadeInterval: null,
    
    conversationCount: 0,
    
    // User preferences
    userPreferences: {
      preferredPlaylist: null,
      responseHistory: [],
      lastVisit: null,
      favoriteGenre: null
    },
    
    // Flag to prevent dialog interruption
    dialogInProgress: false
  };

  // ========================================
  // INITIALIZATION
  // ========================================
  function initializeApp() {
    // DOM Elements
    appState.audioPlayer = document.getElementById("audio-player");
    appState.defaultDialogContainer = document.getElementById("default-dialog-container");
    appState.defaultDialogText = document.getElementById("default-dialog-text");
    appState.interactionDialogContainer = document.getElementById("interaction-dialog-container");
    appState.interactionDialogText = document.getElementById("interaction-dialog-text");
    appState.interactionDialogButtons = document.getElementById("interaction-dialog-buttons");
    appState.robotVideo = document.getElementById("robot-video");
    
    // Audio setup
    appState.audioPlayer.volume = 0.3;
    
    // Create audio elements for effects
    appState.activatedSfx = new Audio("sfx/activated.ogg");
    appState.talkingSfx = new Audio("sfx/robot-talking.ogg");
    appState.talkingSfx.volume = 0.1;
    appState.talkingSfx.loop = false;
    
    // Event listeners
    setupEventListeners();
    
    // Start the app
    const isReturningUser = checkForReturningUser();
    
    // If not a returning user with preferences, start normal interaction after a moment
    if (!isReturningUser) {
      appState.dialogTimeout = setTimeout(() => {
        startInteraction();
      }, 3000);
    }
  }
  
  function setupEventListeners() {
    // Next song when current one ends
    appState.audioPlayer.addEventListener("ended", function() {
      if (!appState.musicStarted) return;
      
      appState.currentTrackIndex++;
      
      if (appState.currentTrackIndex >= appState.currentPlaylist.length && !appState.hasPlayedAllTracks) {
        appState.hasPlayedAllTracks = true;
        appState.currentTrackIndex = 0;
      } else if (appState.currentTrackIndex >= appState.currentPlaylist.length && appState.hasPlayedAllTracks) {
        appState.currentTrackIndex = 0;
      }
      
      loadTrack(appState.currentTrackIndex);
    });
    
    // Click on robot starts mini-conversation or shows track info
    appState.robotVideo.addEventListener("click", function() {
      // Don't interrupt ongoing dialogs
      if (appState.dialogInProgress) return;
      
      if (appState.musicStarted && appState.currentPlaylist.length > 0) {
        const track = appState.currentPlaylist[appState.currentTrackIndex];
        
        // More varied responses on click
        const randomValue = Math.random();

        if (randomValue < 0.5) {
          // Show music info 50% of the time
          showMusicInfo(`Now playing "${track.title}" by ${track.artist}`);
        } else {
          // Start mini conversation 50% of the time
          startMiniConversation();
        }
      } else {
        startInteraction();
      }
    });
  }

  // ========================================
  // LOCAL STORAGE FUNCTIONS
  // ========================================
  function loadUserPreferences() {
    try {
      const savedPreferences = localStorage.getItem('robotMusicPreferences');
      if (savedPreferences) {
        appState.userPreferences = JSON.parse(savedPreferences);
        console.log("Loaded user preferences:", appState.userPreferences);
        return true;
      }
    } catch (e) {
      console.error("Error loading preferences:", e);
    }
    return false;
  }
  
  function saveUserPreferences() {
    try {
      // Update last visit time
      appState.userPreferences.lastVisit = new Date().toISOString();
      localStorage.setItem('robotMusicPreferences', JSON.stringify(appState.userPreferences));
    } catch (e) {
      console.error("Error saving preferences:", e);
    }
  }
  
  function updateUserPreferences(playlistType) {
    // Track playlist selection frequency
    if (!appState.userPreferences.genreCount) {
      appState.userPreferences.genreCount = {};
    }
    
    appState.userPreferences.genreCount[playlistType] = (appState.userPreferences.genreCount[playlistType] || 0) + 1;
    appState.userPreferences.preferredPlaylist = playlistType;
    
    // Determine favorite genre based on selection frequency
    let maxCount = 0;
    Object.keys(appState.userPreferences.genreCount).forEach(genre => {
      if (appState.userPreferences.genreCount[genre] > maxCount) {
        maxCount = appState.userPreferences.genreCount[genre];
        appState.userPreferences.favoriteGenre = genre;
      }
    });
    
    // Save the updated preferences
    saveUserPreferences();
  }

  // ========================================
  // VOICE MANAGEMENT
  // ========================================
  function startRobotVoice() {
    if (appState.voiceFadeInterval) {
      clearInterval(appState.voiceFadeInterval);
      appState.voiceFadeInterval = null;
    }
    
    appState.talkingSfx.volume = 0.1;
    appState.talkingSfx.play().catch(e => console.log("Audio play prevented:", e));
  }
  
  function stopRobotVoiceWithFade() {
    if (appState.voiceFadeInterval) {
      clearInterval(appState.voiceFadeInterval);
    }
    
    let currentVolume = appState.talkingSfx.volume;
    const fadeStep = currentVolume / 20; // Fade over 20 steps
    
    appState.voiceFadeInterval = setInterval(() => {
      currentVolume -= fadeStep;
      if (currentVolume <= 0) {
        currentVolume = 0;
        appState.talkingSfx.pause();
        appState.talkingSfx.currentTime = 0;
        clearInterval(appState.voiceFadeInterval);
        appState.voiceFadeInterval = null;
      }
      appState.talkingSfx.volume = currentVolume;
    }, 50); // 50ms per step = 1 second total fade
  }

  // ========================================
  // DIALOG STATE MANAGEMENT
  // ========================================
  function clearAllDialogStates() {
    // Don't clear if dialog is in progress and should not be interrupted
    if (appState.dialogInProgress) return;
    
    // Clear any existing timeouts
    if (appState.dialogTimeout) {
      clearTimeout(appState.dialogTimeout);
      appState.dialogTimeout = null;
    }
    
    // Clear typing interval
    if (appState.typingInterval) {
      clearInterval(appState.typingInterval);
      appState.typingInterval = null;
    }
    
    // Stop sound effects with fade
    stopRobotVoiceWithFade();
    
    // Reset flags
    appState.isTyping = false;
    appState.showingDialog = false;
    
    // Hide both dialog systems
    appState.defaultDialogContainer.style.opacity = "0";
    appState.interactionDialogContainer.style.opacity = "0";
  }

  // ========================================
  // INTERACTION FUNCTIONS
  // ========================================
  function checkForReturningUser() {
    if (loadUserPreferences()) {
      // Calculate time since last visit
      const lastVisit = new Date(appState.userPreferences.lastVisit);
      const now = new Date();
      const daysSinceLastVisit = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
      
      if (appState.userPreferences.preferredPlaylist) {
        if (daysSinceLastVisit < 1) {
          // Same day return
          showInteractionDialog("Welcome back! Would you like to continue with your music?", () => {
            showWelcomeBackOptions();
          });
          return true;
        } else if (daysSinceLastVisit < 7) {
          // Return within a week
          showInteractionDialog(`It's good to see you again after ${daysSinceLastVisit} day${daysSinceLastVisit !== 1 ? 's' : ''}! I remember your musical preferences.`, () => {
            showWelcomeBackOptions();
          });
          return true;
        } else {
          // Return after longer period
          showInteractionDialog("It's been a while! I still remember your musical tastes. Would you like to continue where we left off?", () => {
            showWelcomeBackOptions();
          });
          return true;
        }
      }
    }
    
    return false;
  }
  
  function showWelcomeBackOptions() {
    const buttonsContainer = appState.interactionDialogButtons;
    buttonsContainer.innerHTML = '';
    
    const option1 = createInteractionButton("Yes, play my music", () => {
      showInteractionDialog(`Playing your preferred ${appState.userPreferences.preferredPlaylist} music...`, () => {
        selectPlaylist(appState.userPreferences.preferredPlaylist);
        startMusic();
      });
    });
    
    const option2 = createInteractionButton("I want something new", () => {
      startInteraction();
    });
    
    const option3 = createInteractionButton("Let's chat first", () => {
      startDeepConversation();
    });
    
    buttonsContainer.appendChild(option1);
    buttonsContainer.appendChild(option2);
    buttonsContainer.appendChild(option3);
  }
  
  function startInteraction() {
    // Clear any existing states first
    clearAllDialogStates();
    
    // Set dialog in progress flag
    appState.dialogInProgress = true;
    
    // Play activation sound
    appState.activatedSfx.play().catch(e => console.log("Audio play prevented:", e));
    
    // Show initial greeting
    appState.dialogTimeout = setTimeout(() => {
      let greeting = "Hi! Welcome to update 2.3 of Skye Journey. My name is B-12. I'm your musical assistant. Remember: You can play with the terminal or navigate using the icons on the left. Whichever is easier for you. Now let's find the perfect soundtrack for this moment!";
      
      // Personalize greeting if we have data
      if (appState.userPreferences.responseHistory && appState.userPreferences.responseHistory.length > 0) {
        greeting = "Hello again! I'm excited to continue our musical journey together.";
      }
      
      showInteractionDialog(greeting + " What kind of musical journey would you like?", () => {
        showInitialOptions();
      });
    }, 1000);
  }
  
  function showInitialOptions() {
    const buttonsContainer = appState.interactionDialogButtons;
    buttonsContainer.innerHTML = ''; // Clear existing buttons
    
    const option1 = createInteractionButton("Help me choose", () => {
      startQuestionnaire();
    });
    
    const option2 = createInteractionButton("Surprise me", () => {
      // Use favorite genre if available, otherwise default
      const playlist = appState.userPreferences.favoriteGenre || 'default';
      showInteractionDialog("I love surprises! Let me find something special for you...", () => {
        selectPlaylist(playlist);
        startMusic();
      });
    });
    
    const option3 = createInteractionButton("Just chat", () => {
      startDeepConversation();
    });
    
    buttonsContainer.appendChild(option1);
    buttonsContainer.appendChild(option2);
    buttonsContainer.appendChild(option3);
  }
  
  function startQuestionnaire() {
    // Reset questionnaire state
    appState.currentQuestion = 0;
    appState.userResponses = [];
    
    // Choose random questions for variety if returning user
    if (appState.userPreferences.responseHistory && appState.userPreferences.responseHistory.length > 0) {
      // Shuffle the questions array for returning users
      shuffleArray(robotQuestions);
    }
    
    showInteractionDialog("Great! Let me ask a few questions to understand your musical taste.", () => {
      askQuestion();
    });
  }
  
  // Helper function to shuffle array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  function askQuestion() {
    if (appState.currentQuestion < Math.min(4, robotQuestions.length)) {
      const question = robotQuestions[appState.currentQuestion];
      
      showInteractionDialog(question.question, () => {
        showQuestionOptions(question);
      });
    } else {
      analyzeResponses();
    }
  }
  
  function showQuestionOptions(question) {
    const buttonsContainer = appState.interactionDialogButtons;
    buttonsContainer.innerHTML = ''; // Clear existing buttons
    
    Object.keys(question.responses).forEach(responseText => {
      const option = createInteractionButton(responseText, () => {
        const response = question.responses[responseText];
        appState.userResponses.push(response);
        
        // Store response in history
        if (!appState.userPreferences.responseHistory) {
          appState.userPreferences.responseHistory = [];
        }
        appState.userPreferences.responseHistory.push({
          question: question.question,
          response: responseText,
          result: response,
          timestamp: new Date().toISOString()
        });
        
        appState.currentQuestion++;
        
        if (appState.currentQuestion < Math.min(4, robotQuestions.length)) {
          appState.dialogTimeout = setTimeout(() => askQuestion(), 1000);
        } else {
          appState.dialogTimeout = setTimeout(() => analyzeResponses(), 1000);
        }
      });
      
      buttonsContainer.appendChild(option);
    });
  }
  
  function analyzeResponses() {
    // Count preferences
    const preferences = {};
    appState.userResponses.forEach(response => {
      preferences[response] = (preferences[response] || 0) + 1;
    });
    
    // Find the most common preference
    const mostCommon = Object.keys(preferences).reduce((a, b) => 
      preferences[a] > preferences[b] ? a : b
    );
    
    const playlistDescriptions = {
      dreamy: "You appreciate ethereal music. I've selected a dreamy playlist for your reflective nature.",
      melancholic: "You find beauty in quiet moments. I've chosen a gentle, melancholic collection.",
      energetic: "You have vibrant energy! I've selected an uplifting playlist for your spirit."
    };
    
    // Personalize message based on response history
    let description = playlistDescriptions[mostCommon] || "I've selected something special for your unique taste.";
    
    if (appState.userPreferences.responseHistory && appState.userPreferences.responseHistory.length > 10) {
      // More personalized for returning users with many responses
      if (mostCommon === appState.userPreferences.favoriteGenre) {
        description = `Your consistent preference for ${mostCommon} music shows your deep connection to this style. I've selected tracks that resonate with your emotional landscape.`;
      } else {
        description = `Interesting! Your taste seems to be evolving. Today you're leaning toward ${mostCommon} music, which is different from your usual preference.`;
      }
    }
    
    showInteractionDialog(description, () => {
      // Update user preferences with this selection
      updateUserPreferences(mostCommon);
      
      // Select and play playlist
      selectPlaylist(mostCommon);
      startMusic();
    });
  }

  // ========================================
  // DEEP CONVERSATION SYSTEM
  // ========================================
  function startDeepConversation() {
    // Choose a conversation topic that hasn't been discussed recently
    let availableConversations = [...deepConversations];
    
    if (appState.userPreferences.recentConversations && appState.userPreferences.recentConversations.length > 0) {
      // Filter out recently discussed topics
      availableConversations = deepConversations.filter(convo => 
        !appState.userPreferences.recentConversations.includes(convo.topic)
      );
      
      // If all topics have been discussed, reset
      if (availableConversations.length === 0) {
        availableConversations = [...deepConversations];
      }
    }
    
    const conversation = availableConversations[Math.floor(Math.random() * availableConversations.length)];
    
    // Track this conversation topic
    if (!appState.userPreferences.recentConversations) {
      appState.userPreferences.recentConversations = [];
    }
    if (appState.userPreferences.recentConversations.length >= 5) {
      appState.userPreferences.recentConversations.shift(); // Remove oldest
    }
    appState.userPreferences.recentConversations.push(conversation.topic);
    saveUserPreferences();
    
    showInteractionDialog(conversation.question, () => {
      showConversationOptions(conversation);
    });
  }
  
  function showConversationOptions(conversation) {
    const buttonsContainer = appState.interactionDialogButtons;
    buttonsContainer.innerHTML = '';
    
    Object.keys(conversation.responses).forEach(responseText => {
      const option = createInteractionButton(responseText, () => {
        const robotResponse = conversation.responses[responseText];
        
        // Track user response
        if (!appState.userPreferences.conversationResponses) {
          appState.userPreferences.conversationResponses = [];
        }
        appState.userPreferences.conversationResponses.push({
          topic: conversation.topic,
          response: responseText,
          timestamp: new Date().toISOString()
        });
        saveUserPreferences();
        
        showInteractionDialog(robotResponse, () => {
          appState.conversationCount++;
          
          if (appState.conversationCount < 2 && Math.random() > 0.3) {
            // Continue conversation
            appState.dialogTimeout = setTimeout(() => {
              showContinueOptions();
            }, 2000);
          } else {
            // End conversation naturally
            appState.dialogTimeout = setTimeout(() => {
              showInteractionDialog("Lovely conversation! Would you like music that matches our chat?", () => {
                showMusicOptions();
              });
            }, 2000);
          }
        });
      });
      
      buttonsContainer.appendChild(option);
    });
  }
  
  function showContinueOptions() {
    const buttonsContainer = appState.interactionDialogButtons;
    buttonsContainer.innerHTML = '';
    
    const continueOption = createInteractionButton("Keep talking", () => {
      startDeepConversation();
    });
    
    const musicOption = createInteractionButton("Play music", () => {
      showMusicOptions();
    });
    
    buttonsContainer.appendChild(continueOption);
    buttonsContainer.appendChild(musicOption);
  }
  
  function showMusicOptions() {
    const buttonsContainer = appState.interactionDialogButtons;
    buttonsContainer.innerHTML = '';
    
    const option1 = createInteractionButton("Surprise me", () => {
      // Use conversation-based recommendation if possible
      let recommendedPlaylist = 'default';
      
      if (appState.userPreferences.conversationResponses && appState.userPreferences.conversationResponses.length > 0) {
        // Use last conversation topic to influence music selection
        const lastConversation = appState.userPreferences.conversationResponses[appState.userPreferences.conversationResponses.length - 1];
        
        // Map topics to playlists
        const topicToPlaylist = {
          'dreams': 'dreamy',
          'beauty': 'dreamy',
          'time': 'melancholic',
          'memory': 'melancholic',
          'loneliness': 'melancholic',
          'friendship': 'energetic',
          'future': 'energetic',
          'creativity': 'energetic'
        };
        
        if (topicToPlaylist[lastConversation.topic]) {
          recommendedPlaylist = topicToPlaylist[lastConversation.topic];
        } else if (appState.userPreferences.favoriteGenre) {
          recommendedPlaylist = appState.userPreferences.favoriteGenre;
        }
      }
      
      showInteractionDialog("Perfect! Let me choose something that matches our conversation...", () => {
        updateUserPreferences(recommendedPlaylist);
        selectPlaylist(recommendedPlaylist);
        startMusic();
      });
    });
    
    const option2 = createInteractionButton("Help me choose", () => {
      appState.currentQuestion = 0;
      appState.userResponses = [];
      startQuestionnaire();
    });
    
    buttonsContainer.appendChild(option1);
    buttonsContainer.appendChild(option2);
  }

  // ========================================
  // UI FUNCTIONS
  // ========================================
  function createInteractionButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'interaction-button';
    button.onclick = onClick;
    
    return button;
  }

  // ========================================
  // ENHANCED DIALOG FUNCTIONS
  // ========================================
  function showInteractionDialog(text, callback) {
    // Set dialog in progress flag to prevent interruption
    appState.dialogInProgress = true;
    
    // Clear any existing dialog states first
    if (appState.dialogTimeout) {
      clearTimeout(appState.dialogTimeout);
      appState.dialogTimeout = null;
    }
    
    // Clear typing interval
    if (appState.typingInterval) {
      clearInterval(appState.typingInterval);
      appState.typingInterval = null;
    }
    
    // Start talking sound with fade-in
    startRobotVoice();
    
    // Reset dialog text and show interaction container
    appState.interactionDialogText.textContent = '';
    appState.interactionDialogButtons.innerHTML = ''; // Clear buttons
    appState.interactionDialogContainer.style.opacity = "1";
    appState.showingDialog = true;
    appState.isTyping = true;
    
    let i = 0;
    const typingSpeed = 30; // Slightly faster typing for longer texts
    
    function typeWriter() {
      if (i < text.length && appState.isTyping) {
        appState.interactionDialogText.textContent += text.charAt(i);
        i++;
        appState.dialogTimeout = setTimeout(typeWriter, typingSpeed);
      } else if (appState.isTyping) {
        // Stop the sound with fade when finished typing
        stopRobotVoiceWithFade();
        appState.isTyping = false;
        
        if (callback) {
          appState.dialogTimeout = setTimeout(() => {
            callback();
            // Only clear dialog flag after callback completes
            if (text.includes("play") || text.includes("Playing")) {
              appState.dialogInProgress = false;
            }
          }, 1500);
        } else {
          // Auto hide after 5 seconds if no callback
          appState.dialogTimeout = setTimeout(() => {
            hideInteractionDialog();
            appState.dialogInProgress = false;
          }, 5000);
        }
      }
    }
    
    typeWriter();
  }
  
  function hideInteractionDialog() {
    // Don't clear if dialog should not be interrupted
    if (appState.isTyping) return;
    
    if (appState.dialogTimeout) {
      clearTimeout(appState.dialogTimeout);
      appState.dialogTimeout = null;
    }
    
    if (appState.typingInterval) {
      clearInterval(appState.typingInterval);
      appState.typingInterval = null;
    }
    
    stopRobotVoiceWithFade();
    appState.interactionDialogContainer.style.opacity = "0";
    appState.showingDialog = false;
    appState.dialogInProgress = false;
  }
  
  function showMusicInfo(text) {
    // Don't interrupt ongoing dialogs
    if (appState.dialogInProgress) return;
    
    if (appState.dialogTimeout) {
      clearTimeout(appState.dialogTimeout);
      appState.dialogTimeout = null;
    }
    
    // Show text immediately without effects
    appState.defaultDialogText.textContent = text;
    appState.defaultDialogContainer.style.opacity = "1";
    appState.showingDialog = true;
    
    // Hide after 5 seconds
    appState.dialogTimeout = setTimeout(() => {
      appState.defaultDialogContainer.style.opacity = "0";
      appState.showingDialog = false;
    }, 5000);
  }

  // ========================================
  // PLAYBACK FUNCTIONS
  // ========================================
  function selectPlaylist(type) {
    appState.currentPlaylist = playlists[type] || playlists.default;
    appState.currentTrackIndex = 0;
    
    // Save this selection in user preferences
    updateUserPreferences(type);
  }
  
  function startMusic() {
    appState.musicStarted = true;
    loadTrack(appState.currentTrackIndex);
    
    // Hide interaction dialog after music starts
    appState.dialogTimeout = setTimeout(() => {
      hideInteractionDialog();
    }, 3000);
  }
  
  function loadTrack(index) {
    const track = appState.currentPlaylist[index];
    appState.audioPlayer.src = track.src;
    appState.audioPlayer.load();
    
    appState.audioPlayer.play().catch(e => {
      console.log("Autoplay prevented:", e);
    });
    
    // Show music info
    showMusicInfo(`Now playing "${track.title}" by ${track.artist}`);
    
    // Store current track in preferences
    appState.userPreferences.lastPlayedTrack = {
      title: track.title,
      artist: track.artist,
      src: track.src,
      playlistType: appState.userPreferences.preferredPlaylist,
      timestamp: new Date().toISOString()
    };
    saveUserPreferences();
  }

  // ========================================
  // MINI CONVERSATIONS
  // ========================================
  function startMiniConversation() {
    if (appState.showingDialog || appState.isTyping || appState.dialogInProgress) return;
    
    // Select a conversation topic
    let conversationType = Math.random() > 0.3 ? "music_health" : "topic";
    
    if (conversationType === "music_health") {
      // Use a health fact about music
      const randomFact = musicHealthFacts[Math.floor(Math.random() * musicHealthFacts.length)];
      showInteractionDialog(randomFact, null);
    } else {
      // Use a mini conversation topic
      const topic = miniConversationTopics[Math.floor(Math.random() * miniConversationTopics.length)];
      showInteractionDialog(topic.prompt, () => {
        showMiniConversationOptions(topic);
      });
    }
  }
  
  function showMiniConversationOptions(topic) {
    const buttonsContainer = appState.interactionDialogButtons;
    buttonsContainer.innerHTML = '';
    
    // Select 3-4 random responses from available options
    const responseKeys = Object.keys(topic.responses);
    shuffleArray(responseKeys);
    const selectedKeys = responseKeys.slice(0, Math.min(4, responseKeys.length));
    
    selectedKeys.forEach(responseText => {
      const option = createInteractionButton(responseText, () => {
        const robotResponse = topic.responses[responseText];
        
        showInteractionDialog(robotResponse, () => {
          // Auto-hide after showing response
          appState.dialogTimeout = setTimeout(() => {
            hideInteractionDialog();
            appState.dialogInProgress = false;
          }, 3000);
        });
      });
      
      buttonsContainer.appendChild(option);
    });
  }

  // Initialize the application
  initializeApp();
});