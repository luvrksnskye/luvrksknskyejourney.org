

function updateDayCounter() {
    const startDate = new Date('2023-09-01');
    const currentDate = new Date();

    const timeDifference = currentDate.getTime() - startDate.getTime();

    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

    const counterElement = document.getElementById('days-counter');
    if (counterElement) {
        counterElement.textContent = `♪ DAYS SINCE SITE CREATION: ${daysDifference} DAYS ♪`;
    }
}

document.addEventListener('DOMContentLoaded', updateDayCounter);

setInterval(updateDayCounter, 3600000);
