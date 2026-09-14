class SoundEffects {
  constructor() {
    this.sounds = {
      click: new Audio('assets/audio/sfx/select.mp3'),
      open: new Audio('assets/audio/sfx/open.wav'),
      close: new Audio('/assets/audio/sfx/gear.mp3'),
      hover: new Audio('/assets/audio/sfx/selection.mp3')
    };
    
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.3;
    });
  }
  
  play(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      const soundClone = sound.cloneNode();
      soundClone.play().catch(err => console.log('Reproducción de sonido bloqueada:', err));
    }
  }
}

class DesktopManager {
  constructor() {
    this.sfx = new SoundEffects();
    this.activeModal = null;
    this.terminalVisible = false;
    
    this.initializeDesktopIcons();
    this.initializeModals();
    this.initializeTerminalToggle();
  }
  
  initializeDesktopIcons() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      icon.addEventListener('mouseenter', () => this.sfx.play('hover'));
      
      icon.addEventListener('click', () => {
        this.sfx.play('click');
        const modalId = icon.getAttribute('data-modal');
        
        modalId === 'terminal' ? this.toggleTerminal(true) : this.openModal(modalId);
      });
    });
  }
  
  initializeModals() {
    document.querySelectorAll('.modal-close').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.sfx.play('close');
        this.closeModal(e.target.closest('.modal-overlay').id);
      });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.sfx.play('close');
          this.closeModal(overlay.id);
        }
      });
    });
  }
  
  initializeTerminalToggle() {
    const toggleButton = document.getElementById('show-terminal');
    let closeButton = document.getElementById('close-terminal') || this.createTerminalCloseButton();
    
    if (!document.getElementById('close-terminal')) {
      document.body.appendChild(closeButton);
    }
    
    toggleButton?.addEventListener('click', () => {
      this.sfx.play('click');
      this.toggleTerminal(true);
    });
    
    closeButton.addEventListener('click', () => {
      this.sfx.play('close');
      this.toggleTerminal(false);
    });
  }
  
  createTerminalCloseButton() {
    const closeButton = document.createElement('button');
    closeButton.id = 'close-terminal';
    closeButton.innerHTML = '×';
    closeButton.className = 'terminal-close-btn';
    closeButton.style.display = 'none';
    
    return closeButton;
  }
  
  openModal(modalId) {
    const modalElement = document.getElementById(`${modalId}-modal`);
    if (!modalElement) return;
    
    if (this.activeModal) {
      this.closeModal(this.activeModal);
    }
    
    const modalWindow = modalElement.querySelector('.modal-window');
    
    this.sfx.play('open');
    
    modalWindow.classList.add('opening');
    modalElement.classList.add('active');
    this.activeModal = `${modalId}-modal`;
    
    setTimeout(() => modalWindow.classList.remove('opening'), 500);
  }
  
  closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;
    
    const modalWindow = modalElement.querySelector('.modal-window');
    modalWindow.classList.add('closing');
    
    setTimeout(() => {
      modalElement.classList.remove('active');
      modalWindow.classList.remove('closing');
      this.activeModal = null;
    }, 400);
  }
  
  toggleTerminal(show) {
    const terminalContainer = document.querySelector('.container');
    const toggleButton = document.getElementById('show-terminal');
    const closeButton = document.getElementById('close-terminal');
    
    if (show) {
      this.sfx.play('open');
      terminalContainer.style.display = 'flex';
      terminalContainer.classList.add('active');
      toggleButton && (toggleButton.style.display = 'none');
      closeButton && (closeButton.style.display = 'flex');
      this.terminalVisible = true;
    } else {
      this.sfx.play('close');
      terminalContainer.classList.remove('active');
      closeButton && (closeButton.style.display = 'none');
      
      setTimeout(() => {
        terminalContainer.style.display = 'none';
        toggleButton && (toggleButton.style.display = 'block');
        this.terminalVisible = false;
      }, 400);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.desktopManager = new DesktopManager();
  
  setTimeout(() => {
    const startupSound = new Audio('assets/audio/sfx/startup.wav');
    startupSound.volume = 0.15;
    startupSound.play().catch(err => console.log('Sonido de inicio bloqueado:', err));
  }, 600);
});