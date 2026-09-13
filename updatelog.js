let isDragging = false;
let offsetX, offsetY;

function startDrag(event) {
isDragging = true;
const scrollbox = document.getElementById('updatesBox');

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
scrollbox.style.display = 'block';
setTimeout(() => {
scrollbox.style.opacity = '1';
scrollbox.style.animation = 'bounce 0.3s ease';
}, 10);
} else {
scrollbox.style.opacity = '0';
scrollbox.style.animation = 'none';
setTimeout(() => {
scrollbox.style.display = 'none';
}, 500);
}
}

function hideScrollbox() {
const scrollbox = document.getElementById('updatesBox');
scrollbox.style.display = 'none';
}