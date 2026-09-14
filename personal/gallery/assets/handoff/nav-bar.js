(() => {
  const wrapper = document.getElementById('nav2-wrapper');
  if (!wrapper) return;

  const toggle = wrapper.querySelector('#nav2-sidebar-toggle');
  const sidebar = wrapper.querySelector('#nav2-custom-sidebar');
  const overlay = wrapper.querySelector('.nav2-blur-overlay');
  if (!toggle || !sidebar || !overlay) return;

  const open = () => {
    toggle.classList.add('active');
    sidebar.classList.remove('hidden');
    sidebar.classList.add('active');
    overlay.classList.add('active');
  };

  const close = () => {
    toggle.classList.remove('active');
    sidebar.classList.remove('active');
    sidebar.classList.add('hidden');
    overlay.classList.remove('active');
  };

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('active') ? close() : open();
  });

  overlay.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) close();
  });
})();
