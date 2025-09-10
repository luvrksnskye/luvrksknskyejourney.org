document.addEventListener('DOMContentLoaded', function() {

  const skyeSprite = document.querySelector('.skye-sprite');
  const dialogueText = document.getElementById('dialogue-text');

  const dialogues = {
    1: "Halloween is my absolute favorite holiday ever! Time to get spooky~ Don't forget to carve some pretty pumpkins!",
    2: "Merry Christmas! Hope you're staying all warm and cozy with your loved ones! *giggles*",
    3: "It's my boyfriend's birthday today! I've got something super special planned... *blushes*",
    4: "Can you believe it's been a whole year since I launched this website? Time flies when you're having fun!",
    5: "It's my birthday today! Yay",
    6: "Capricorn season is all about discipline and responsibility. What sweet goals are you setting?",
    7: "Welcome to Aquarius season! Time to embrace your uniqueness and brilliant ideas!",
    8: "Pisces season is here! Let your imagination and creativity flow like a pretty stream~",
    9: "Aries season brings new beginnings and fresh energy! What lovely things are you starting?",
    10: "Taurus season reminds us to appreciate life's simple pleasures. Take time to smell the pretty roses!",
    11: "Gemini season is perfect for socializing and learning new things! What's on your mind, cutie?",
    12: "Cancer season is all about nurturing and emotional connections. Give someone a big warm hug today!",
    13: "Leo season is here! Time to shine bright and express yourself boldly like a star!",
    14: "Virgo season reminds us to organize and perfect our skills. What special talents are you improving?",
    15: "Libra season brings harmony and balance. How are your precious relationships doing?",
    16: "Scorpio season is intense and transformative! Embrace the magical mysteries of life~",
    17: "Sagittarius season is about exploration and optimism! What wonderful adventures await you?",
    18: "It's my sister's birthday! She's the bestest sister anyone could ever ask for! *twirls happily*",
    19: "Happy birthday to my amazing mom! I'm so grateful for everything she does! *heart melts*",
    21: "Love is in the air! Happy Valentine's Day! Who's your special someone? *winks*",
    22: "Happy Easter! Hope your day is filled with joy and yummy chocolate eggs!",
    23: "Happy Thanksgiving! I'm thankful for YOU visiting my page! You're the best!",
    24: "Winter is here! Time to bundle up and enjoy the snow! Hot cocoa with marshmallows, anyone?",
    25: "Summer vibes! Beach trips, ice cream, and fun in the sunshine!",
    26: "Spring has sprung! The flowers are blooming and everything feels fresh and new and magical!"
  };

  const defaultDialogue = "Hewwo there! Click on a date to see what's happening! I'll tell you all about it with lots of excitement!";

  function typeDialogue(text, element) {

    skyeSprite.src = 'skye-talking/skye-happy.PNG';

    element.textContent = '';

    let i = 0;
    const typingSpeed = 30; 

    if (window.typingInterval) {
      clearInterval(window.typingInterval);
    }

    window.typingInterval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(window.typingInterval);

        setTimeout(() => {
          skyeSprite.src = 'skye-talking/skye-neutral.PNG';
        }, 1000);
      }
    }, typingSpeed);
  }

  typeDialogue(defaultDialogue, dialogueText);

  document.addEventListener('eventSelected', function(e) {
    const eventId = e.detail.eventId;
    const dialogue = dialogues[eventId] || defaultDialogue;
    typeDialogue(dialogue, dialogueText);
  });

});