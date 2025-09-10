let isDragging = false;
let offsetX, offsetY;

function startDrag(event) {
isDragging = true;
const scrollbox = document.getElementById('updatesBox');

// Calculate the offset
offsetX = event.clientX ? event.clientX - scrollbox.getBoundingClientRect().left : event.touches[0].clientX - scrollbox.getBoundingClientRect().left;
offsetY = event.clientY ? event.clientY - scrollbox.getBoundingClientRect().top : event.touches[0].clientY - scrollbox.getBoundingClientRect().top;

document.addEventListener('mousemove', dragScrollbox);
document.addEventListener('mouseup', stopDrag);
document.addEventListener('touchmove', dragScrollbox);
document.addEventListener('touchend', stopDrag);
}

function dragScrollbox(event) {
if (isDragging) {
const scrollbox = document.getElementById('updatesBox');
const clientX = event.clientX || event.touches[0].clientX;
const clientY = event.clientY || event.touches[0].clientY;
scrollbox.style.left = (clientX - offsetX) + 'px';
scrollbox.style.top = (clientY - offsetY) + 'px';
}
}

function stopDrag() {
isDragging = false;
document.removeEventListener('mousemove', dragScrollbox);
document.removeEventListener('mouseup', stopDrag);
document.removeEventListener('touchmove', dragScrollbox);
document.removeEventListener('touchend', stopDrag);
}

function toggleScrollbox() {
const scrollbox = document.getElementById('updatesBox');
if (scrollbox.style.display === 'none' || scrollbox.style.display === '') {
scrollbox.style.display = 'block'; // Show the scrollbox
setTimeout(() => {
scrollbox.style.opacity = '1'; // Fade in
scrollbox.style.animation = 'bounce 0.3s ease'; // Apply bounce animation
}, 10); // Allow the display to update before changing opacity
} else {
scrollbox.style.opacity = '0'; // Fade out
scrollbox.style.animation = 'none'; // Reset animation before hiding
setTimeout(() => {
scrollbox.style.display = 'none'; // Hide after fading out
}, 500); // Match timeout to CSS transition duration
}
}

function hideScrollbox() {
const scrollbox = document.getElementById('updatesBox');
scrollbox.style.display = 'none'; // Hide the scrollbox immediately
}