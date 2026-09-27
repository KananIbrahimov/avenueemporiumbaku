// Səhifə görünmədən əvvəl temanı tətbiq edir (ağ-qara "flaş" olmasın).
// <head> içində, stil faylından ƏVVƏL, adi <script> kimi yüklənir.
(function () {
  var t = {};
  try { t = JSON.parse(localStorage.getItem("tema") || "{}") || {}; } catch (e) {}
  var mod = t.mod || "sistem";
  var qaranliq = mod === "qaranliq" ||
    (mod === "sistem" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  var d = document.documentElement;
  d.setAttribute("data-tema", qaranliq ? "qaranliq" : "aciq");
  if (t.renk && /^#[0-9a-fA-F]{6}$/.test(t.renk)) d.style.setProperty("--vurgu", t.renk);
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", qaranliq ? "#0f0f10" : "#faf8f5");
})();
