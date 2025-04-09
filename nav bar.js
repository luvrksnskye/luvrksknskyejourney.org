(function() {
    const sidebarToggle = document.querySelector("#nav2-wrapper #nav2-sidebar-toggle");
    const sidebar = document.querySelector("#nav2-wrapper #nav2-custom-sidebar");
    const blurOverlay = document.querySelector("#nav2-wrapper .nav2-blur-overlay");
    
    sidebarToggle.addEventListener("click", function() {
    this.classList.toggle("active");
    sidebar.classList.toggle("active");
    sidebar.classList.toggle("hidden");
    blurOverlay.classList.toggle("active");
    });
    
    function closeNav2Sidebar() {
    sidebarToggle.classList.remove("active");
    sidebar.classList.remove("active");
    sidebar.classList.add("hidden");
    blurOverlay.classList.remove("active");
    }
    
    blurOverlay.addEventListener("click", closeNav2Sidebar);
    })();