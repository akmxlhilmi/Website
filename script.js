/* ============================================================
   akmxlhilmi — interactions
   - Scroll-position reveals (robust everywhere; no IntersectionObserver)
   - Frosted nav that sharpens on scroll
   - Scroll cue fade + hero glow parallax
   - Drag / click-to-fill circular photo slot with localStorage persistence
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Scroll reveals
     Drive from getBoundingClientRect — reliable across browsers and
     throttled tabs. Each node reveals once, staggered by --delay.
     --------------------------------------------------------------- */
  var revealNodes = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function show(el) {
    el.classList.add('is-shown');
  }

  function checkReveals() {
    if (!revealNodes.length) return;
    var vh = window.innerHeight || 800;
    for (var i = revealNodes.length - 1; i >= 0; i--) {
      var el = revealNodes[i];
      var rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.9 && rect.bottom > -80) {
        var delay = reduced ? 0 : parseFloat(el.style.getPropertyValue('--delay')) || 0;
        (function (node, d) {
          window.setTimeout(function () { show(node); }, d);
        })(el, delay);
        revealNodes.splice(i, 1); // seen — stop tracking
      }
    }
  }

  /* ---------------------------------------------------------------
     Scroll-driven chrome: nav, cue, glow
     --------------------------------------------------------------- */
  var nav  = document.getElementById('site-nav');
  var cue  = document.getElementById('scroll-cue');
  var glow = document.getElementById('hero-glow');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset || 0;

      if (nav) nav.classList.toggle('is-scrolled', y > 8);
      if (cue) cue.style.opacity = String(Math.max(0, 1 - y / 170));
      if (glow && !reduced) glow.style.transform = 'translate(-50%,' + (-50 + y * 0.04) + '%)';

      checkReveals();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', checkReveals, { passive: true });

  // First paint
  checkReveals();
  onScroll();
  // Safety net: nothing can stay hidden even if a scroll event never fires.
  window.setTimeout(checkReveals, 200);

  /* ---------------------------------------------------------------
     Photo slot — Fixed
     --------------------------------------------------------------- */
  (function initPhotoSlot() {
    var slot = document.getElementById('me-photo');
    if (!slot) return;

    var img = slot.querySelector('.photo-slot__img');
    if (!img) return;

    function ok() {slot.classList.add('has-image')}
    function fail() {slot.classList.remove('has-image'); img.style.display = 'none';}

    if (img.complete){
      (img.naturalWidth > 0 ? ok : fail)();
    } else {
      img.addEventListener('load',ok);
      img.addEventListener('error', fail)
    }
    
  })();

})();
