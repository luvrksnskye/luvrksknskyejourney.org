

document.addEventListener('DOMContentLoaded', function() {
    let searchTerms = [];

    const categorySelect = document.getElementById('category-filter');
    const optionBoxes = document.querySelectorAll('.option-box');
    const searchFilter = document.getElementById('search-filter');

    const grid = new Muuri('.grid', {
        dragEnabled: true,
        dragStartPredicate: function(item, event) {
            const dragHandle = event.target.closest('.drag-handle');
            return dragHandle !== null;
        },
        dragSortInterval: 50,
        dragContainer: document.body,
        dragReleaseDuration: 400,
        dragReleaseEasing: 'ease',
        layoutDuration: 400,
        layoutEasing: 'ease'
    });

    window.addEventListener('load', () => {
        grid.refreshItems().layout();
    });

    function filterGrid() {
        const selectedCategory = categorySelect.value;
        searchTerms = searchFilter.value.toLowerCase().split(' ').filter(term => term);

        grid.filter(item => {
            const element = item.getElement();
            const tags = element.dataset.tags.toLowerCase();

            const matchingCategory = selectedCategory === 'all' || tags.includes(selectedCategory);

            const matchingSearch = searchTerms.length === 0 ||
                searchTerms.every(term => tags.includes(term));

            return matchingCategory && matchingSearch;
        });
    }

    optionBoxes.forEach(box => {
        box.addEventListener('click', function() {
            optionBoxes.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            categorySelect.value = this.dataset.value;
            
            filterGrid();
        });
    });

    searchFilter.addEventListener('input', filterGrid);

    document.querySelectorAll('.window-muuri-controls .material-icons').forEach(control => {
        control.addEventListener('click', function(e) {
            const action = e.target.textContent;
            const window = e.target.closest('.window-muuri');

            switch(action) {
                case 'close':
                    const item = window.closest('.item');
                    grid.hide([item], {
                        onFinish: () => grid.remove([item])
                    });
                    break;
                case 'crop_square':
                    window.classList.toggle('maximized');
                    grid.refreshItems().layout();
                    break;
                case 'remove':
                    window.classList.toggle('minimized');
                    grid.refreshItems().layout();
                    break;
            }
        });
    });

    document.querySelectorAll('.window-muuri').forEach(window => {
        window.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '6px 6px 0 rgba(225, 246, 255, 0.6)';
        });

        window.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '4px 4px 0 rgba(225, 246, 255, 0.5)';
        });
    });

    grid.on('filter', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            grid.refreshItems().layout();
        }, 100);
    });

    grid.refreshItems().layout();

    document.querySelectorAll('.window-muuri').forEach(window => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    grid.refreshItems().layout();
                }
            });
        });

        observer.observe(window, {
            attributes: true
        });
    });

    grid.on('dragEnd', function() {
        grid.refreshItems().layout();
    });
});
