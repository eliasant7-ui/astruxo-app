// Google Analytics 4 - astruXo
(function() {
  // Load Google Analytics script
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-ER6QWJSEL0';
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ER6QWJSEL0', {
    'send_page_view': true,
    'anonymize_ip': true
  });

  // Make gtag available globally
  window.gtag = gtag;
})();
