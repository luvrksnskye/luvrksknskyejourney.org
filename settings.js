function openPanel(panelType) {
    // Create and play the sound effect
    const clickSound = new Audio('assets/sound-effects/click.wav');
    clickSound.play();

    const overlay = document.getElementById('modalOverlay');
    const panel = document.getElementById(panelType + 'Panel');

    document.querySelectorAll('.modal-panel').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });

    panel.style.display = 'block';
    overlay.classList.add('active');

    void panel.offsetWidth;

    panel.classList.add('active');
}

function closePanel() {
    // Create and play the exit sound effect
    const exitSound = new Audio('assets/sound-effects/exit.wav');
    exitSound.play();

    const overlay = document.getElementById('modalOverlay');
    const panels = document.querySelectorAll('.modal-panel');

    overlay.classList.remove('active');
    panels.forEach(panel => {
        panel.classList.remove('active');
    });

    // Delay hiding panels until animation completes
    setTimeout(() => {
        panels.forEach(panel => {
            panel.style.display = 'none';
        });
    }, 300);
}

// Close panel when Escape key is pressed
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
});