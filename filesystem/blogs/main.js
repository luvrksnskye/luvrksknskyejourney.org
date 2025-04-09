var grid; // Declare grid in the global scope

// Initialize Muuri
document.addEventListener('DOMContentLoaded', function () {
    initMuuri();
    handleMuuriFiltering();

    // Add search functionality
    document.getElementById('search-filter').addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        applyFilters(searchTerm);
    });

    // Add click handler for category options
    document.querySelectorAll('.option-box').forEach(function (button) {
        button.addEventListener('click', function () {
            document.querySelectorAll('.option-box').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            
            // Get search term (if any)
            const searchTerm = document.getElementById('search-filter').value.toLowerCase();
            applyFilters(searchTerm);
        });
    });
});

// Apply both category and search filters together
function applyFilters(searchTerm) {
    const selectedCategory = document.querySelector('.option-box.selected').getAttribute('data-value');
    
    grid.filter(function (item) {
        const element = item.getElement();
        const content = element.querySelector('.window-muuri-content').textContent.toLowerCase();
        const itemCategories = element.getAttribute('data-category') || '';
        
        // Check if search term matches
        const matchesSearch = searchTerm === '' || content.indexOf(searchTerm) > -1;
        
        // Check if category matches
        const matchesCategory = selectedCategory === 'all' || itemCategories.includes(selectedCategory);
        
        // Item must match both filters
        return matchesSearch && matchesCategory;
    });
    
    // Re-layout after filtering
    setTimeout(function () {
        grid.refreshItems().layout();
    }, 10);
}

// Muuri Initialization
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
            fillGaps: true, // Enable filling gaps
            horizontal: false,
            alignRight: false,
            alignBottom: false,
            rounding: false
        },
        layoutOnResize: true,
        layoutOnInit: true,
        layoutDuration: 400,
        layoutEasing: 'ease',
        sortData: {
            id: function (item, element) {
                return element.querySelector('.title').innerText;
            },
            date: function (item, element) {
                return element.querySelector('.date').innerText;
            }
        }
    });

    // Refresh layout on window load
    window.addEventListener('load', function () {
        grid.refreshItems().layout();
    });
}

// Function to handle Muuri filtering (keeping for backward compatibility)
function handleMuuriFiltering() {
    document.querySelectorAll('.sort-btn li').forEach(function (li) {
        li.addEventListener('click', function () {
            document.querySelectorAll('.sort-btn li').forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            const className = this.classList[0];
            if (className === 'sort00') {
                grid.filter('*'); // Show all elements if 'All Items' is clicked
            } else {
                grid.filter('.' + className); // Filter elements based on the clicked tag class
            }

            // Re-layout after filtering
            setTimeout(function () {
                grid.refreshItems().layout();
            }, 10);
        });
    });
}

// Window resize handler to maintain grid alignment
window.addEventListener('resize', function () {
    if (grid) {
        grid.refreshItems().layout();
    }
});