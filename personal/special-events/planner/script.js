const sounds = {};

function preloadSounds() {
  ['page-flip-left', 'page-flip-right', 'open-calendar', 'close-calendar'].forEach((name) => {
    const a = new Audio(`planner-sounds/${name}.mp3`);
    a.load();
    sounds[name] = a;
  });
}

function playSound(name) {
  const src = sounds[name];
  if (!src) return;
  const clone = src.cloneNode();
  clone.play().catch(() => {});
}

function processEventDateRanges() {
  window.eventsWithRanges = [];
  window.eventsData.events.forEach((event) => {
    const startDate = moment(event.startDate);
    const endDate = moment(event.endDate);
    const duration = endDate.diff(startDate, 'days') + 1;
    const isSeason = event.category === 'zodiac';
    for (let i = 0; i < duration; i++) {
      const currentDate = moment(startDate).add(i, 'days');
      window.eventsWithRanges.push({
        ...event,
        date: currentDate.format('YYYY-MM-DD'),
        isStart: i === 0,
        isEnd: i === duration - 1,
        duration,
        isSeason,
      });
    }
  });
}

function generateYearCalendar(year) {
  const container = document.getElementById('calendar-container');
  if (!container) return;
  container.replaceChildren();

  const currentMonthEl = document.getElementById('current-month');

  for (let month = 0; month < 12; month++) {
    const firstDay = moment([year, month, 1]);
    const monthName = firstDay.format('MMMM');
    const daysInMonth = firstDay.daysInMonth();

    const monthContainer = document.createElement('div');
    monthContainer.className = 'month-container';
    monthContainer.dataset.month = month;
    monthContainer.addEventListener('mouseenter', () => {
      if (currentMonthEl) currentMonthEl.textContent = monthName;
      playSound('page-flip-right');
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment([year, month, day]);
      const dayOfWeek = currentDate.format('ddd');
      const formattedDate = currentDate.format('YYYY-MM-DD');

      const dayContainer = document.createElement('div');
      dayContainer.className = 'day-container';
      dayContainer.dataset.date = formattedDate;

      const dayInfo = document.createElement('div');
      dayInfo.className = 'day-info vertical';
      dayInfo.innerHTML = `<span class="day-number">${day}</span><span class="day-name">${dayOfWeek}</span>`;
      dayContainer.appendChild(dayInfo);

      const contentContainer = document.createElement('div');
      contentContainer.className = 'day-content';
      dayContainer.appendChild(contentContainer);

      const eventsOnThisDay = window.eventsWithRanges.filter((e) => e.date === formattedDate);
      if (eventsOnThisDay.length > 0) {
        const indicators = document.createElement('div');
        indicators.className = 'event-indicators';

        const seasons = eventsOnThisDay.filter((e) => e.isSeason);
        const importantDates = eventsOnThisDay.filter((e) => !e.isSeason);

        importantDates.forEach((event) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'event-wrapper';
          const icon = document.createElement('img');
          icon.className = 'event-icon';
          icon.src = event.icon;
          icon.alt = event.title;
          icon.dataset.eventId = event.id;
          icon.addEventListener('click', () => {
            showEventDetails(event.id);
            playSound('page-flip-left');
          });
          const title = document.createElement('span');
          title.className = 'event-title-indicator';
          title.textContent = event.title;
          wrapper.append(icon, title);
          indicators.appendChild(wrapper);
          dayContainer.dataset.specialEvent = event.id;
        });

        seasons.forEach((event) => {
          if (!event.isStart) return;
          const wrapper = document.createElement('div');
          wrapper.className = 'event-wrapper';
          const icon = document.createElement('img');
          icon.className = 'event-icon';
          icon.src = event.icon;
          icon.alt = event.title;
          icon.dataset.eventId = event.id;
          icon.addEventListener('click', () => {
            showEventDetails(event.id);
            playSound('page-flip-left');
          });
          const title = document.createElement('span');
          title.className = 'event-title-indicator';
          title.textContent = event.title;
          wrapper.append(icon, title);
          indicators.appendChild(wrapper);
          dayContainer.dataset.seasonStart = event.id;
        });

        contentContainer.appendChild(indicators);
      }

      monthContainer.appendChild(dayContainer);
    }

    container.appendChild(monthContainer);
  }
}

function showEventDetails(eventId) {
  document.dispatchEvent(new CustomEvent('eventSelected', { detail: { eventId } }));

  const event = window.eventsData.events.find((e) => e.id === eventId);
  if (!event) return;

  const startDate = moment(event.startDate).format('MMMM D, YYYY');
  const endDate = moment(event.endDate).format('MMMM D, YYYY');
  const dateDisplay = event.startDate === event.endDate ? startDate : `${startDate} - ${endDate}`;
  const eventType = event.category === 'zodiac' ? 'Season' : 'Important Date';

  const stickerHTML = event.stickers?.[0]
    ? `<div class="event-stickers">
         <img src="${event.stickers[0]}" alt="${event.title} sticker" class="event-detail-sticker">
       </div>`
    : '';

  const details = document.getElementById('event-details');
  if (!details) return;
  details.innerHTML = `
    <div class="event-detail-container">
      <h2 class="event-title">${event.title}</h2>
      <div class="event-date">${dateDisplay}</div>
      <div class="event-type">${eventType}</div>
      <div class="event-category" style="background-color: ${event.color};">${event.category}</div>
      <div class="event-description">${event.description}</div>
      ${stickerHTML}
    </div>
  `;
}

function placeStickersOn(dayContainers, positions, sizeRange) {
  dayContainers.forEach((dayContainer) => {
    const eventId = parseInt(dayContainer.dataset.specialEvent || dayContainer.dataset.seasonStart, 10);
    const event = window.eventsData.events.find((e) => e.id === eventId);
    if (!event?.stickers?.length) return;
    const count = Math.min(3 + Math.floor(Math.random() * 2), event.stickers.length);
    for (let i = 0; i < count; i++) {
      const sticker = document.createElement('img');
      sticker.className = 'event-sticker';
      sticker.src = event.stickers[i];
      sticker.alt = 'Event sticker';
      const pos = positions[i % positions.length];
      const size = sizeRange[0] + Math.random() * sizeRange[1];
      Object.assign(sticker.style, {
        position: 'absolute',
        top: `${pos.top}%`,
        left: `${pos.left}%`,
        width: `${size}px`,
        height: 'auto',
        zIndex: '1',
        transform: `rotate(${Math.random() * 40 - 20}deg)`,
      });
      dayContainer.appendChild(sticker);
    }
  });
}

function addStickersAroundEvents() {
  setTimeout(() => {
    const rand = () => Math.random();
    const specialPositions = [
      { top: 85 + rand() * 15, left: 0 + rand() * 30 },
      { top: 90 + rand() * 15, left: 40 + rand() * 30 },
      { top: 80 + rand() * 15, left: 75 + rand() * 25 },
      { top: 105 + rand() * 15, left: 20 + rand() * 30 },
      { top: 110 + rand() * 15, left: 60 + rand() * 30 },
    ];
    const seasonPositions = [
      { top: 95 + rand() * 15, left: 5 + rand() * 25 },
      { top: 90 + rand() * 15, left: 45 + rand() * 30 },
      { top: 85 + rand() * 15, left: 80 + rand() * 20 },
      { top: 115 + rand() * 15, left: 30 + rand() * 30 },
      { top: 110 + rand() * 15, left: 70 + rand() * 25 },
    ];
    placeStickersOn(document.querySelectorAll('.day-container[data-special-event]'), specialPositions, [80, 25]);
    placeStickersOn(document.querySelectorAll('.day-container[data-season-start]'), seasonPositions, [75, 30]);
  }, 500);
}

function scrollCalendarTo(targetEl) {
  const container = document.getElementById('calendar-container');
  if (!container || !targetEl) return;
  const containerTop = container.getBoundingClientRect().top;
  const targetTop = targetEl.getBoundingClientRect().top;
  const delta = targetTop - containerTop + container.scrollTop;
  container.scrollTo({ top: delta, behavior: 'smooth' });
}

function addZodiacTimeline() {
  const leftPage = document.querySelector('.left-page');
  if (!leftPage) return;

  const timelineContainer = document.createElement('div');
  timelineContainer.className = 'zodiac-timeline-container';
  leftPage.appendChild(timelineContainer);

  const zodiacSeasons = window.eventsData.events
    .filter((e) => e.category === 'zodiac')
    .sort((a, b) => moment(a.startDate).diff(moment(b.startDate)));

  const yearStart = moment('2025-01-01');
  const yearEnd = moment('2025-12-31');
  const yearDuration = yearEnd.diff(yearStart, 'days') + 1;

  zodiacSeasons.forEach((season, index) => {
    const startPosition = (moment(season.startDate).diff(yearStart, 'days') / yearDuration) * 100;

    const tab = document.createElement('div');
    tab.className = 'timeline-tab';
    tab.innerHTML = `
      <div class="tab-content">
        <img src="${season.icon}" alt="${season.title}" class="tab-icon">
        <span class="tab-label">${season.title}</span>
      </div>
    `;
    Object.assign(tab.style, {
      position: 'absolute',
      right: '0',
      top: `${startPosition}%`,
      backgroundColor: season.color,
      zIndex: String(30 - index),
      transformOrigin: 'right center',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      cursor: 'pointer',
    });

    const label = tab.querySelector('.tab-label');
    tab.addEventListener('mouseenter', () => {
      tab.style.width = '140px';
      tab.style.zIndex = '40';
      if (label) label.style.opacity = '1';
    });
    tab.addEventListener('mouseleave', () => {
      tab.style.width = '40px';
      tab.style.zIndex = String(30 - index);
      if (label) label.style.opacity = '0';
    });
    tab.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('eventSelected', { detail: { eventId: season.id } }));
      const firstDay = Array.from(document.querySelectorAll('.day-container')).find(
        (el) => el.dataset.date === season.startDate,
      );
      if (firstDay) {
        scrollCalendarTo(firstDay);
        playSound('page-flip-right');
      }
    });

    timelineContainer.appendChild(tab);
  });

  for (let month = 0; month < 12; month++) {
    const monthStart = moment([2025, month, 1]);
    const position = (monthStart.diff(yearStart, 'days') / yearDuration) * 100;

    const monthTab = document.createElement('div');
    monthTab.className = 'month-tab';
    monthTab.textContent = monthStart.format('MMM');
    Object.assign(monthTab.style, {
      position: 'absolute',
      right: '0',
      top: `${position}%`,
      backgroundColor: '#7a5e81',
      zIndex: '10',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      cursor: 'pointer',
    });
    monthTab.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('eventSelected', { detail: { eventId: null } }));
      const firstDayOfMonth = document.querySelector(
        `.month-container[data-month="${month}"] .day-container:first-child`,
      );
      if (firstDayOfMonth) {
        scrollCalendarTo(firstDayOfMonth);
        playSound('page-flip-right');
      }
    });

    timelineContainer.appendChild(monthTab);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('events.json')
    .then((r) => r.json())
    .then((data) => {
      window.eventsData = data;
      preloadSounds();
      processEventDateRanges();
      generateYearCalendar(2025);
      addStickersAroundEvents();
      addZodiacTimeline();
      playSound('open-calendar');
    })
    .catch((err) => console.error('Failed to load events.json:', err));

  window.addEventListener('beforeunload', () => playSound('close-calendar'));
});
