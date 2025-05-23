$(document).ready(function() {

  $.getJSON('events.json', function(data) {

    window.eventsData = data;

    preloadSounds();

    processEventDateRanges();

    generateYearCalendar(2025);

    addCustomStyles();

    addStickersAroundEvents();

    addZodiacTimeline();

    playSound('open-calendar');
  });

  $(window).on('beforeunload', function() {
    playSound('close-calendar');
  });
});

function preloadSounds() {
  window.sounds = {
    'page-flip-left': new Audio('planner-sounds/page-flip-left.mp3'),
    'page-flip-right': new Audio('planner-sounds/page-flip-right.mp3'),
    'open-calendar': new Audio('planner-sounds/open-calendar.mp3'),
    'close-calendar': new Audio('planner-sounds/close-calendar.mp3')
  };

  for (const sound in window.sounds) {
    window.sounds[sound].load();
  }
}

function playSound(soundName) {
  if (window.sounds && window.sounds[soundName]) {

    const soundClone = window.sounds[soundName].cloneNode();
    soundClone.play();
  }
}

function processEventDateRanges() {

  window.eventsWithRanges = [];

  eventsData.events.forEach(event => {
    const startDate = moment(event.startDate);
    const endDate = moment(event.endDate);

    const duration = endDate.diff(startDate, 'days') + 1;

    const isSeason = event.category === 'zodiac';

    for (let i = 0; i < duration; i++) {
      const currentDate = moment(startDate).add(i, 'days');

      const dailyEvent = {
        ...event,
        date: currentDate.format('YYYY-MM-DD'),
        isStart: i === 0,
        isEnd: i === (duration - 1),
        duration: duration,
        isSeason: isSeason
      };

      window.eventsWithRanges.push(dailyEvent);
    }
  });
}

function generateYearCalendar(year) {
  const $calendarContainer = $('#calendar-container');
  $calendarContainer.empty();

  for (let month = 0; month < 12; month++) {
    const firstDayOfMonth = moment([year, month, 1]);
    const monthName = firstDayOfMonth.format('MMMM');
    const daysInMonth = firstDayOfMonth.daysInMonth();

    const $monthContainer = $('<div class="month-container" data-month="' + month + '"></div>');

    $monthContainer.on('mouseenter', function() {
      $('#current-month').text(monthName);
      playSound('page-flip-right');
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment([year, month, day]);
      const dayOfWeek = currentDate.format('ddd');
      const formattedDate = currentDate.format('YYYY-MM-DD');

      const $dayContainer = $('<div class="day-container"></div>');
      $dayContainer.attr('data-date', formattedDate);

      const $dayInfo = $(
        '<div class="day-info vertical">' +
          '<span class="day-number">' + day + '</span>' +
          '<span class="day-name">' + dayOfWeek + '</span>' +
        '</div>'
      );
      $dayContainer.append($dayInfo);

      const $contentContainer = $('<div class="day-content"></div>');
      $dayContainer.append($contentContainer);

      const eventsOnThisDay = window.eventsWithRanges.filter(event => event.date === formattedDate);

      if (eventsOnThisDay.length > 0) {
        const $eventIndicators = $('<div class="event-indicators"></div>');

        const seasons = eventsOnThisDay.filter(event => event.isSeason);
        const importantDates = eventsOnThisDay.filter(event => !event.isSeason);

        importantDates.forEach(event => {
          const $eventWrapper = $('<div class="event-wrapper"></div>');
          const $eventIcon = $('<img class="event-icon" src="' + event.icon + '" alt="' + event.title + '" data-event-id="' + event.id + '">');
          const $eventTitle = $('<span class="event-title-indicator">' + event.title + '</span>');

          $eventIcon.on('click', function() {
            showEventDetails(event.id, formattedDate);
            playSound('page-flip-left');
          });

          $eventWrapper.append($eventIcon);
          $eventWrapper.append($eventTitle);
          $eventIndicators.append($eventWrapper);

          $dayContainer.attr('data-special-event', event.id);
        });

        seasons.forEach(event => {

          if (event.isStart) {
            const $eventWrapper = $('<div class="event-wrapper"></div>');
            const $eventIcon = $('<img class="event-icon" src="' + event.icon + '" alt="' + event.title + '" data-event-id="' + event.id + '">');
            const $eventTitle = $('<span class="event-title-indicator">' + event.title + '</span>');

            $eventIcon.on('click', function() {
              showEventDetails(event.id, formattedDate);
              playSound('page-flip-left');
            });

            $eventWrapper.append($eventIcon);
            $eventWrapper.append($eventTitle);
            $eventIndicators.append($eventWrapper);

            $dayContainer.attr('data-season-start', event.id);
          }
        });

        $contentContainer.append($eventIndicators);
      }

      $monthContainer.append($dayContainer);
    }

    $calendarContainer.append($monthContainer);
  }
}

function showEventDetails(eventId, date) {

  document.dispatchEvent(new CustomEvent('eventSelected', {
    detail: { eventId: eventId }
  }));

  const event = eventsData.events.find(e => e.id === eventId);

  if (event) {
    const startDate = moment(event.startDate).format('MMMM D, YYYY');
    const endDate = moment(event.endDate).format('MMMM D, YYYY');
    const dateDisplay = event.startDate === event.endDate ? 
      startDate : 
      `${startDate} - ${endDate}`;

    const $eventDetails = $('#event-details');

    const eventType = event.category === 'zodiac' ? 'Season' : 'Important Date';

    let stickerHTML = '';
    if (event.stickers && event.stickers.length > 0) {
      stickerHTML = `
        <div class="event-stickers">
          <img src="${event.stickers[0]}" alt="${event.title} sticker" class="event-detail-sticker">
        </div>
      `;
    }

    $eventDetails.empty().html(`
      <div class="event-detail-container">
        <h2 class="event-title">${event.title}</h2>
        <div class="event-date">${dateDisplay}</div>
        <div class="event-type">${eventType}</div>
        <div class="event-category" style="background-color: ${event.color};">${event.category}</div>
        <div class="event-description">${event.description}</div>
        ${stickerHTML}
      </div>
    `);
  }
}

function addStickersAroundEvents() {

  setTimeout(() => {

    const specialEventDays = $('.day-container[data-special-event]');
    specialEventDays.each(function() {
      const $dayContainer = $(this);
      const eventId = parseInt($dayContainer.attr('data-special-event'));
      const event = eventsData.events.find(e => e.id === eventId);

      if (!event || !event.stickers || event.stickers.length === 0) return;

      const stickerSet = event.stickers;

      const numberOfStickers = Math.min(3 + Math.floor(Math.random() * 2), stickerSet.length);

      for (let i = 0; i < numberOfStickers; i++) {
        const stickerPath = stickerSet[i];

        const $sticker = $(`<img class="event-sticker" src="${stickerPath}" alt="Event sticker">`);

        const positions = [
          { top: 85 + (Math.random() * 15), left: 0 + (Math.random() * 30) },    
          { top: 90 + (Math.random() * 15), left: 40 + (Math.random() * 30) },   
          { top: 80 + (Math.random() * 15), left: 75 + (Math.random() * 25) },   
          { top: 105 + (Math.random() * 15), left: 20 + (Math.random() * 30) },  
          { top: 110 + (Math.random() * 15), left: 60 + (Math.random() * 30) }   
        ];

        const position = positions[i % positions.length];

        $sticker.css({
          'position': 'absolute',
          'top': position.top + '%',
          'left': position.left + '%',
          'width': (80 + Math.random() * 25) + 'px', 
          'height': 'auto',
          'z-index': 1,
          'transform': 'rotate(' + (Math.random() * 40 - 20) + 'deg)'
        });

        $dayContainer.append($sticker);
      }
    });

    const seasonStartDays = $('.day-container[data-season-start]');
    seasonStartDays.each(function() {
      const $dayContainer = $(this);
      const eventId = parseInt($dayContainer.attr('data-season-start'));
      const event = eventsData.events.find(e => e.id === eventId);

      if (!event || !event.stickers || event.stickers.length === 0) return;

      const stickerSet = event.stickers;
      const numberOfStickers = Math.min(3 + Math.floor(Math.random() * 2), stickerSet.length);

      for (let i = 0; i < numberOfStickers; i++) {
        const stickerPath = stickerSet[i];

        const $sticker = $(`<img class="event-sticker" src="${stickerPath}" alt="Season sticker">`);

        const positions = [
          { top: 95 + (Math.random() * 15), left: 5 + (Math.random() * 25) },    
          { top: 90 + (Math.random() * 15), left: 45 + (Math.random() * 30) },   
          { top: 85 + (Math.random() * 15), left: 80 + (Math.random() * 20) },   
          { top: 115 + (Math.random() * 15), left: 30 + (Math.random() * 30) },  
          { top: 110 + (Math.random() * 15), left: 70 + (Math.random() * 25) }   
        ];

        const position = positions[i % positions.length];

        $sticker.css({
          'position': 'absolute',
          'top': position.top + '%',
          'left': position.left + '%',
          'width': (75 + Math.random() * 30) + 'px', 
          'height': 'auto',
          'z-index': 1,
          'transform': 'rotate(' + (Math.random() * 35 - 15) + 'deg)'
        });

        $dayContainer.append($sticker);
      }
    });
  }, 500);
}

function addZodiacTimeline() {

  const $leftPage = $('.left-page');
  const $timelineContainer = $('<div class="zodiac-timeline-container"></div>');
  $leftPage.append($timelineContainer);

  const zodiacSeasons = eventsData.events.filter(event => event.category === 'zodiac');

  zodiacSeasons.sort((a, b) => {
    return moment(a.startDate).diff(moment(b.startDate));
  });

  const yearStart = moment('2025-01-01');
  const yearEnd = moment('2025-12-31');
  const yearDuration = yearEnd.diff(yearStart, 'days') + 1;

  zodiacSeasons.forEach((season, index) => {
    const startDate = moment(season.startDate);
    const endDate = moment(season.endDate);

    const startPosition = startDate.diff(yearStart, 'days') / yearDuration * 100;
    const duration = endDate.diff(startDate, 'days') + 1;

    const $tab = $('<div class="timeline-tab"></div>');

    const $tabContent = $(`
      <div class="tab-content">
        <img src="${season.icon}" alt="${season.title}" class="tab-icon">
        <span class="tab-label">${season.title}</span>
      </div>
    `);

    $tab.append($tabContent);

    $tab.css({
      'position': 'absolute',
      'right': '0',
      'top': startPosition + '%',
      'background-color': season.color,
      'z-index': 30 - index, 
      'transform-origin': 'right center',
      'box-shadow': '0 2px 5px rgba(0,0,0,0.3)',
      'cursor': 'pointer'
    });

    $tab.on('mouseenter', function() {
      $(this).css({
        'width': '140px',
        'z-index': '40'
      });

      $(this).find('.tab-label').css('opacity', '1');
    });

    $tab.on('mouseleave', function() {
      $(this).css({
        'width': '40px',
        'z-index': 30 - index
      });

      $(this).find('.tab-label').css('opacity', '0');
    });

    $tab.on('click', function() {

      document.dispatchEvent(new CustomEvent('eventSelected', {
        detail: { eventId: season.id }
      }));

      const firstDayOfSeason = $('.day-container').filter(function() {
        const dayDate = $(this).attr('data-date');
        return dayDate === season.startDate;
      });

      if (firstDayOfSeason.length) {

        $('#calendar-container').animate({
          scrollTop: firstDayOfSeason.offset().top - $('#calendar-container').offset().top + $('#calendar-container').scrollTop()
        }, 500);

        playSound('page-flip-right');
      }
    });

    $timelineContainer.append($tab);
  });

  for (let month = 0; month < 12; month++) {
    const monthStart = moment([2025, month, 1]);
    const position = monthStart.diff(yearStart, 'days') / yearDuration * 100;
    const monthName = monthStart.format('MMM');

    const $monthTab = $('<div class="month-tab"></div>');

    $monthTab.html(monthName);
    $monthTab.css({
      'position': 'absolute',
      'right': '0',
      'top': position + '%',
      'background-color': '#7a5e81',
      'z-index': '10',
      'box-shadow': '0 1px 3px rgba(0,0,0,0.2)',
      'cursor': 'pointer'
    });

    $monthTab.on('click', function() {

      document.dispatchEvent(new CustomEvent('eventSelected', {
        detail: { eventId: null }
      }));

      const firstDayOfMonth = $('.month-container[data-month="' + month + '"] .day-container:first-child');

      if (firstDayOfMonth.length) {

        $('#calendar-container').animate({
          scrollTop: firstDayOfMonth.offset().top - $('#calendar-container').offset().top + $('#calendar-container').scrollTop()
        }, 500);

        playSound('page-flip-right');
      }
    });

    $timelineContainer.append($monthTab);
  }
}

function addCustomStyles() {

  const customStyles = `
    <style>

      #calendar-container::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      #calendar-container {
        scrollbar-width: none; 
        -ms-overflow-style: none; 
        overflow-y: auto;
        max-height: 100%;
      }

      .tab-title {
        font-size: 1.4em;
        color: rgb(255, 255, 255);
      }

      .month-container {
        margin-bottom: 30px;
        position: relative;
      }

      .day-container {
        display: flex;
        margin-bottom: 12px;
        padding-left: 5px;
        align-items: center;
        position: relative;
        height: 100px; 
      }

      .day-info.vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 40px;
        z-index: 2;
      }

      .day-number {
        font-size: 1.2em;
        color: #a15ebc;
      }

      .day-name {
        color: #aa88ff;
        font-size: 0.85em;
      }

      .day-content {
        display: flex;
        flex-grow: 1;
        height: 100%;
        position: relative;
        z-index: 2;
      }

      .event-indicators {
        display: flex;
        align-items: center;
        margin-left: 10px;
        flex-grow: 1;
        position: relative;
        height: 90%;
        z-index: 2;
      }

      .event-wrapper {
        display: flex;
        align-items: center;
        margin-right: 15px;
      }

      .event-title-indicator {
        margin-left: 8px;
        color: #bb7cff;
        font-size: 0.9em;
        white-space: nowrap;
      }

      .event-icon {
        width: 52px;
        height: auto;
        cursor: pointer;
        transition: transform 0.2s;
        z-index: 2;
      }

      .event-icon:hover {
        transform: scale(1.2);
      }

      .event-detail-container {
        padding: 15px;
        position: relative;
      }

      .event-title {
        font-size: 1.5em;
        margin-bottom: 10px;
        color: #bb7cff;
      }

      .event-date {
        font-style: italic;
        margin-bottom: 10px;
      }

      .event-type {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 15px;
        color: white;
        background-color: #8a2be2;
        margin-right: 10px;
        margin-bottom: 10px;
        font-size: 0.9em;
      }

      .event-category {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 15px;
        color: white;
        margin-bottom: 15px;
        font-size: 0.9em;
      }

      .event-description {
        line-height: 1.5;
        margin-bottom: 20px;
      }

      .no-event-selected {
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: center;
        align-items: center;
        color: #bb7cff;
        font-style: italic;
        padding: 20px;
      }

      .event-stickers {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }

      .event-detail-sticker {
        width: 150px;
        height: auto;
      }

      .event-stickers-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
      }

      .event-sticker {
        position: absolute;
        pointer-events: auto;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .event-sticker:hover {
        transform: scale(1.1) rotate(5deg);
      }

      .zodiac-timeline-container {
        position: absolute;
        top: 0;
        right: 0;
        width: 150px; 
        height: 100%;
        z-index: 10;
        pointer-events: none;
      }

      .timeline-tab {
        width: 40px;
        height: 60px;
        border-radius: 10px 0 0 10px;
        transition: width 0.3s ease, box-shadow 0.3s ease;
        pointer-events: auto;
        display: flex;
        align-items: center;
      }

      .timeline-tab:hover {
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      }

      .tab-content {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        overflow: hidden;
        padding: 0 8px;
      }

      .tab-icon {
        width: 30px;
        height: 30px;
        object-fit: contain;
        margin-right: 8px;
        flex-shrink: 0;
      }

      .tab-label {
        color: white;
        font-size: 0.9em;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .month-tab {
        width: 30px;
        height: 30px;
        border-radius: 8px 0 0 8px;
        color: white;
        font-size: 0.7em;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        transition: background-color 0.2s, width 0.2s;
      }

      .month-tab:hover {
        background-color: #9174aa;
        width: 40px;
      }
    </style>
  `;

  $('head').append(customStyles);
}