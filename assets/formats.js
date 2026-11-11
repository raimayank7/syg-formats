/* formats: fill the blanks of a letter, then copy / WhatsApp / print / download; list filter; recently opened */
(function () {
  'use strict';
  var d = document, SYG = window.SYG;
  function today(hi) {
    var n = new Date(), m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return hi ? ('0' + n.getDate()).slice(-2) + '/' + ('0' + (n.getMonth() + 1)).slice(-2) + '/' + n.getFullYear() : n.getDate() + ' ' + m[n.getMonth()] + ' ' + n.getFullYear();
  }
  function textOf(sheet) { return sheet.querySelector('.letter').innerText.replace(/ /g, ' ').trim(); }

  d.querySelectorAll('.sheet').forEach(function (sheet) {
    var marks = sheet.querySelectorAll('mark.ph'), box = sheet.querySelector('[data-fill]'), keys = [], hi = sheet.getAttribute('data-sheet') === 'hi';
    marks.forEach(function (m) { var k = m.getAttribute('data-k'); if (keys.indexOf(k) < 0) keys.push(k); });
    if (!keys.length) return;
    var h = '<details><summary>' + (hi ? 'सारी जानकारी एक जगह भरें' : 'Fill in all the blanks in one place') + '</summary><div class="fields">';
    keys.forEach(function (k, i) {
      var id = (hi ? 'h' : 'e') + i;
      h += '<div><label for="' + id + '">' + SYG.esc(k) + '</label><input type="text" id="' + id + '" data-k="' + SYG.esc(k) + '" autocomplete="off"></div>';
    });
    box.innerHTML = h + '</div><div class="acts"><button class="btn sm ghost" type="button" data-clear>' + (hi ? 'खाली करें' : 'Clear all') + '</button></div></details>';
    box.hidden = false;
    function set(k, v, skip) {
      marks.forEach(function (m) {
        if (m.getAttribute('data-k') !== k) return;
        if (m !== skip) m.textContent = v || '[' + k + ']';
        m.classList.toggle('done', !!v);
      });
      var inp = box.querySelector('input[data-k="' + k.replace(/"/g, '\\"') + '"]');
      if (inp && inp !== skip && inp.value !== v) inp.value = v;
    }
    box.addEventListener('input', function (e) { if (e.target.matches('input')) set(e.target.getAttribute('data-k'), e.target.value.trim(), e.target); });
    box.querySelector('[data-clear]').addEventListener('click', function () { keys.forEach(function (k) { set(k, ''); }); });
    /* every blank can be typed into right inside the letter */
    marks.forEach(function (m) {
      m.setAttribute('contenteditable', 'true'); m.setAttribute('spellcheck', 'false'); m.setAttribute('role', 'textbox'); m.setAttribute('aria-label', m.getAttribute('data-k'));
      m.addEventListener('focus', function () { var r = d.createRange(); r.selectNodeContents(m); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
      m.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); m.blur(); } });
      m.addEventListener('input', function () { var v = m.textContent.replace(/\s+/g, ' ').trim(), k = m.getAttribute('data-k'); set(k, v === '[' + k + ']' ? '' : v, m); });
      m.addEventListener('blur', function () { var v = m.textContent.replace(/\s+/g, ' ').trim(), k = m.getAttribute('data-k'); if (!v || v === '[' + k + ']') { m.textContent = '[' + k + ']'; m.classList.remove('done'); } else m.textContent = v; });
      m.addEventListener('paste', function (e) { e.preventDefault(); d.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ')); });
    });
    /* the date blank starts with today's date */
    keys.forEach(function (k) {
      if (k === 'Date' || k === 'दिनांक') set(k, today(hi));
    });
  });

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act],[data-lang]'); if (!b) return;
    if (b.hasAttribute('data-lang')) {
      var hi = b.getAttribute('data-lang') === 'hi';
      d.querySelector('[data-hi]').hidden = !hi; d.querySelector('.sheet[data-sheet=en]').hidden = hi;
      d.querySelectorAll('[data-lang]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      return;
    }
    var sheet = b.closest('.sheet'), t = textOf(sheet), act = b.getAttribute('data-act');
    var left = sheet.querySelectorAll('mark.ph:not(.done)').length;
    if (act === 'copy') SYG.copy(t, left ? 'Copied. ' + left + ' blanks are still empty' : 'Copied');
    else if (act === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener');
    else if (act === 'print') {
      d.getElementById('printbox').textContent = t; d.body.classList.add('pl'); window.print();
      setTimeout(function () { d.body.classList.remove('pl'); }, 500);
    } else if (act === 'txt') {
      var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + t.replace(/\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' }));
      a.download = b.getAttribute('data-name') + '.txt'; d.body.appendChild(a); a.click(); a.remove(); SYG.toast('Saved as a text file');
    }
  });

  /* list filter */
  var q = d.querySelector('[data-filter]');
  if (q) {
    var items = d.querySelectorAll('[data-list] li'), none = d.querySelector('[data-none]');
    q.addEventListener('input', function () {
      var words = q.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
      items.forEach(function (li) {
        var s = li.getAttribute('data-q'), ok = words.every(function (w) { return s.indexOf(w) > -1; });
        li.hidden = !ok; if (ok) shown++;
      });
      d.querySelectorAll('[data-list]').forEach(function (ul) {
        var any = ul.querySelector('li:not([hidden])'), h = ul.previousElementSibling;
        ul.hidden = !any; if (h && h.tagName === 'H2') h.hidden = !any;
      });
      if (none) none.hidden = shown > 0;
    });
  }

  /* recently opened formats (this browser only) */
  var h1 = d.querySelector('.fmt h1');
  if (h1) SYG.recent('fmt-recent', { u: location.pathname, t: h1.textContent });
  var rec = d.querySelector('[data-recent]');
  if (rec) {
    var list = SYG.recent('fmt-recent');
    if (list.length) {
      rec.querySelector('[data-recent-list]').innerHTML = list.map(function (x) { return '<li><a href="' + SYG.esc(x.u) + '">' + SYG.esc(x.t) + '</a></li>'; }).join('');
      rec.hidden = false;
    }
  }
})();
