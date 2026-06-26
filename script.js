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
     Photo slot — drag an image onto it, or click to browse.
     Persisted to localStorage so it survives a reload.
     --------------------------------------------------------------- */
  (function initPhotoSlot() {
    var slot = document.getElementById('me-photo');
    if (!slot) return;

    var img = slot.querySelector('.photo-slot__img');
    var STORE_KEY = 'akmxlhilmi:me-photo';
    var MAX_BYTES = 6 * 1024 * 1024; // 6 MB guardrail

    // Hidden file input for click-to-browse
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    function apply(dataUrl) {
      if (!dataUrl) return;
      img.src = dataUrl;
      img.hidden = false;
      slot.classList.add('has-image');
    }

    function readFile(file) {
      if (!file || file.type.indexOf('image/') !== 0) return;
      if (file.size > MAX_BYTES) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var url = e.target.result;
        apply(url);
        try { localStorage.setItem(STORE_KEY, url); } catch (err) { /* quota — ignore */ }
      };
      reader.readAsDataURL(file);
    }

    // Restore a previously dropped image
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved) apply(saved);
    } catch (err) { /* storage blocked — ignore */ }

    // Drag & drop
    slot.addEventListener('dragenter', function (e) { e.preventDefault(); slot.classList.add('is-drop'); });
    slot.addEventListener('dragover',  function (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      slot.classList.add('is-drop');
    });
    slot.addEventListener('dragleave', function ()  { slot.classList.remove('is-drop'); });
    slot.addEventListener('drop', function (e) {
      e.preventDefault();
      slot.classList.remove('is-drop');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        readFile(e.dataTransfer.files[0]);
      }
    });

    // Click / keyboard to browse
    slot.addEventListener('click', function () { fileInput.click(); });
    slot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files.length) readFile(fileInput.files[0]);
    });
  })();

})();
