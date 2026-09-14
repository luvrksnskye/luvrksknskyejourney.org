

document.addEventListener('DOMContentLoaded', () => {
  function createGridItems(container) {
    container.querySelectorAll('.grid-item-animated').forEach(item => item.remove());
    
    const boxSize = 50;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    const cols = Math.floor(containerWidth / boxSize);
    const rows = Math.floor(containerHeight / boxSize);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item-animated');
        
gridItem.style.width = `${boxSize}px`;
gridItem.style.height = `${boxSize}px`;
gridItem.style.left = `${col * boxSize + 20}px`; 
gridItem.style.top = `${row * boxSize + 5}px`; 

        
        const delay = (row + col) * 0.05;
        gridItem.style.transitionDelay = `${delay}s`;
        gridItem.style.animationDelay = `${delay}s`;
        
        container.appendChild(gridItem);
      }
    }
  }
  
  const gridContainers = document.querySelectorAll('.grid-container, .grid-layout, .page-layout');
  
  gridContainers.forEach(container => {
    createGridItems(container);
  });
  
  window.addEventListener('resize', () => {
    gridContainers.forEach(container => {
      createGridItems(container);
    });
  });
  
  const toggleButtons = document.querySelectorAll('.toggle-button, .toggle-wrapper');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      setTimeout(() => {
        gridContainers.forEach(container => {
          createGridItems(container);
        });
      }, 50);
    });
  });
});
