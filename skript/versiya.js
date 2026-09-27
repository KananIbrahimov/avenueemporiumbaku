// Hər "firebase deploy"-dan əvvəl avtomatik işləyir (firebase.json → predeploy).
// public/versiya.json faylına yeni versiya nömrəsi yazır — açıq saytlar bunu görüb yenilənir.
const fs = require("fs");
const path = require("path");
const indi = new Date();
const versiya = indi.toISOString().replace(/[-:T]/g, "").slice(0, 12); // məs. 202609272215
const surumFayl = fs.readFileSync(path.join(__dirname, "..", "public", "ortak", "surum.js"), "utf8");
const surum = (surumFayl.match(/SURUM\s*=\s*"([^"]+)"/) || [])[1] || "";
const fayl = path.join(__dirname, "..", "public", "versiya.json");
fs.writeFileSync(fayl, JSON.stringify({ versiya, surum, tarix: indi.toISOString() }) + "\n");
console.log(`AvenueBaku v${surum} (${versiya})`);
