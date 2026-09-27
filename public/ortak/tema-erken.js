// Temanı səhifə görünmədən tətbiq edir (ağ/qara "flaş" olmasın). Standart: qaranlıq.
(function () {
  var mod = "qaranliq";
  try { if (localStorage.getItem("temaRejim") === "aciq") mod = "aciq"; } catch (e) {}
  document.documentElement.setAttribute("data-tema", mod);
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", mod === "aciq" ? "#f3f4f6" : "#0b0c0e");
})();
