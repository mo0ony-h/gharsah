  document.addEventListener("DOMContentLoaded", () => {

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
  
    navLinks.forEach(link => {
      if (link.href.includes(currentPath)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const initMap = (shop) => {
      const lat = parseFloat(shop.dataset.lat);
      const lng = parseFloat(shop.dataset.lng);
      const mapElement = shop.querySelector('.map');
      
      const map = new google.maps.Map(mapElement, {
        center: { lat, lng },
        zoom: 16,
        mapTypeId: 'hybrid',
        streetViewControl: false,
        fullscreenControl: false
      });

      new google.maps.Marker({
        position: { lat, lng },
        map,
        title: shop.querySelector('h3').textContent,
        icon: 'https://maps.google.com/mapfiles/ms/icons/tree.png'
      });
    };

    document.querySelectorAll('.shop-card').forEach(initMap);
  });