// When the keyboard opens the page gets shorter. Bring the box you tapped to the middle of what is left, like other mobile browsers do.
(function () {
  function isField(e) {
    if (!e) return false;
    var t = e.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || e.isContentEditable;
  }
  function bring() {
    var e = document.activeElement;
    if (!isField(e)) return;
    try { e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }); } catch (_) { try { e.scrollIntoView(); } catch (__) {} }
  }
  document.addEventListener('focusin', function () { setTimeout(bring, 250); setTimeout(bring, 650); }, true);
  window.addEventListener('resize', function () { setTimeout(bring, 60); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { setTimeout(bring, 60); });
})();
