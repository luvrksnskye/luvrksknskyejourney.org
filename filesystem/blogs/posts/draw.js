

document.addEventListener('DOMContentLoaded', () => {
  // Function to create animated grid items
  function createGridItems(container) {
    // Remove existing animated items if any
    container.querySelectorAll('.grid-item-animated').forEach(item => item.remove());
    
    // Box size for grid items
    const boxSize = 50; // smaller size than original example
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Calculate grid dimensions
    const cols = Math.floor(containerWidth / boxSize);
    const rows = Math.floor(containerHeight / boxSize);
    
    // Create grid items with sequential delays
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item-animated');
        
        // Position each box
gridItem.style.width = `${boxSize}px`;
gridItem.style.height = `${boxSize}px`;
gridItem.style.left = `${col * boxSize + 20}px`; 
gridItem.style.top = `${row * boxSize + 5}px`; 

        
        // Add sequential delay
        const delay = (row + col) * 0.05;
        gridItem.style.transitionDelay = `${delay}s`;
        gridItem.style.animationDelay = `${delay}s`;
        
        container.appendChild(gridItem);
      }
    }
  }
  
  // Find all grid containers
  const gridContainers = document.querySelectorAll('.grid-container, .grid-layout, .page-layout');
  
  // Create grid items for each container
  gridContainers.forEach(container => {
    createGridItems(container);
  });
  
  // Update on window resize
  window.addEventListener('resize', () => {
    gridContainers.forEach(container => {
      createGridItems(container);
    });
  });
  
  // Update when toggle buttons are clicked
  const toggleButtons = document.querySelectorAll('.toggle-button, .toggle-wrapper');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Wait a bit for the perspective class to be applied
      setTimeout(() => {
        gridContainers.forEach(container => {
          createGridItems(container);
        });
      }, 50);
    });
  });
});
