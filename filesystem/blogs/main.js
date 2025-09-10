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
    $('.sort-btn li').on('click', function() {
        $('.sort-btn li').removeClass('active'); 
        $(this).addClass('active'); 

        var className = $(this).attr('class').split(' ')[0]; 
        if (className === 'sort00') {
            grid.filter('*'); 
        } else {
            grid.filter('.' + className); 
        }
    });
}

if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    window.addEventListener("DOMContentLoaded", (event) => {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                buildPage(this); 
                initMuuri(); 
                handleMuuriFiltering(); 
            }
        };
        xhttp.open("GET", RSSLink, true);
        xhttp.send();
    });
} else {
    window.addEventListener("DOMContentLoaded", (event) => {
        initMuuri(); 
        handleMuuriFiltering(); 
    });
}