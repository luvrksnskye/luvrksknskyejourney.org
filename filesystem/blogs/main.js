var grid; 

function initMuuri() {
    grid = new Muuri('.grid', {
        dragEnabled: true,
        dragHandle: '.cardsHeader',
        showDuration: 600,
        showEasing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        visibleStyles: {
            opacity: '1',
            transform: 'scale(1)'
        },
        hiddenStyles: {
            opacity: '0',
            transform: 'scale(0.5)'
        },
        layout: {
            fillGaps: true,
        }
    });
    
    window.addEventListener('load', function () {
        grid.refreshItems().layout();
    });
}

function handleMuuriFiltering() {
    // Handle category filter buttons
    const categoryButtons = document.querySelectorAll('.option-box');
    const searchInput = document.getElementById('search-filter');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove 'selected' class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('selected'));
            // Add 'selected' class to clicked button
            this.classList.add('selected');
            
            const filterValue = this.getAttribute('data-value');
            applyFilters(filterValue, searchInput.value.trim());
        });
    });
    
    // Handle search input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const selectedButton = document.querySelector('.option-box.selected');
            const categoryFilter = selectedButton ? selectedButton.getAttribute('data-value') : 'all';
            applyFilters(categoryFilter, this.value.trim());
        });
    }
}

function applyFilters(categoryFilter, searchText) {
    grid.filter(function(item) {
        const element = item.getElement();
        const category = element.getAttribute('data-category');
        const tagElement = element.querySelector('.tag');
        const titleElement = element.querySelector('.title');
        const descriptionElement = element.querySelector('.description');
        
        // Check category filter
        let categoryMatch = true;
        if (categoryFilter && categoryFilter !== 'all') {
            categoryMatch = category === categoryFilter;
        }
        
        // Check search filter
        let searchMatch = true;
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            const tagText = tagElement ? tagElement.textContent.toLowerCase() : '';
            const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';
            const descriptionText = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
            
            searchMatch = tagText.includes(searchLower) || 
                         titleText.includes(searchLower) || 
                         descriptionText.includes(searchLower);
        }
        
        return categoryMatch && searchMatch;
    });
}

// Initialize when DOM is loaded
window.addEventListener("DOMContentLoaded", (event) => {
    initMuuri(); 
    handleMuuriFiltering(); 
});