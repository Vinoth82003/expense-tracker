(function() {
  var scriptTag = document.currentScript;
  var gaId = scriptTag ? scriptTag.getAttribute('data-ga-id') : null;
  if (gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, {
      page_path: window.location.pathname,
      send_page_view: true
    });
  }
})();
