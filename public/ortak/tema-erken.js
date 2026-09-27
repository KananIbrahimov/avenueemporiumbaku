// Temanı səhifə görünmədən tətbiq edir (ağ/qara "flaş" olmasın). Standart: qaranlıq.
(function () {
  var mod = "qaranliq";
  try { if (localStorage.getItem("temaRejim") === "aciq") mod = "aciq"; } catch (e) {}
  document.documentElement.setAttribute("data-tema", mod);
  // Face ID kilidi aktivdirsə, kilid ekranı gələnə qədər məzmunu gizlət
  try {
    if (localStorage.getItem("kilit") && !sessionStorage.getItem("kilitAcildi")) document.documentElement.classList.add("kilitli");
  } catch (e) {}
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", mod === "aciq" ? "#f3f4f6" : "#0b0c0e");
})();

// Tətbiq kimi davransın: iki barmaqla və ikiqat toxunuşla böyütmə olmasın (iOS Safari)
(function () {
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (e) {
    document.addEventListener(e, function (ev) { ev.preventDefault(); }, { passive: false });
  });
  var son = 0;
  document.addEventListener("touchend", function (ev) {
    var indi = Date.now();
    if (indi - son < 300 && !(ev.target.closest && ev.target.closest("input, textarea, select"))) ev.preventDefault();
    son = indi;
  }, { passive: false });
})();
