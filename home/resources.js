            const resourcesLink = document.getElementById('resourcesLink');
        const modal = document.getElementById('resourcesModal');
        const okayBtn = document.getElementById('okayBtn');
        const goBackBtn = document.getElementById('goBackBtn');

        const originalHref = resourcesLink.getAttribute('href');

        class AudioManager {
            constructor() {
                this.sounds = {
                    option: new Audio('../filesystem/resources/sfx/ui_option_click.wav'),
                    confirm: new Audio('../filesystem/resources/sfx/ui_button_confirm.wav'),
                    selectResources: new Audio('../filesystem/resources/sfx/ui_select-resources.wav')
                };

                Object.values(this.sounds).forEach(audio => {
                    audio.preload = 'auto';
                    audio.volume = 0.7; 
                });
            }

            play(soundName) {
                if (this.sounds[soundName]) {

                    this.sounds[soundName].currentTime = 0;
                    this.sounds[soundName].play().catch(e => {
                        console.log('Audio play failed:', e);
                    });
                }
            }
        }

        const audioManager = new AudioManager();

        resourcesLink.addEventListener('click', function(e) {
            e.preventDefault(); 
            audioManager.play('selectResources'); 
            showModal();
        });

        function showModal() {
            modal.classList.add('active');
            document.body.style.overflow = 'auto'; 
        }

        function hideModal() {
            modal.classList.remove('active');
            document.body.style.overflow = ''; 
        }

        function setupButtonEffects(button, soundType) {

            button.addEventListener('mouseenter', function() {
                audioManager.play('option'); 
                button.classList.add('selected'); 
            });

            button.addEventListener('mouseleave', function() {
                button.classList.remove('selected');
            });

            button.addEventListener('click', function() {
                audioManager.play(soundType); 

                button.classList.add('selected');
                setTimeout(() => {
                    button.classList.remove('selected');
                }, 150);
            });
        }

        setupButtonEffects(okayBtn, 'confirm');
        setupButtonEffects(goBackBtn, 'option');

        okayBtn.addEventListener('click', function() {
            hideModal();

            setTimeout(() => {
                window.location.href = originalHref;
            }, 300);
        });

        goBackBtn.addEventListener('click', function() {
            hideModal();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                hideModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (!modal.classList.contains('active')) return;

            if (e.key === 'Tab') {
                e.preventDefault();
                audioManager.play('option');

                if (okayBtn.classList.contains('selected')) {
                    okayBtn.classList.remove('selected');
                    goBackBtn.classList.add('selected');
                } else if (goBackBtn.classList.contains('selected')) {
                    goBackBtn.classList.remove('selected');
                    okayBtn.classList.add('selected');
                } else {
                    okayBtn.classList.add('selected');
                }
            }

            if (e.key === 'Enter') {
                if (okayBtn.classList.contains('selected')) {
                    okayBtn.click();
                } else if (goBackBtn.classList.contains('selected')) {
                    goBackBtn.click();
                }
            }
        });
