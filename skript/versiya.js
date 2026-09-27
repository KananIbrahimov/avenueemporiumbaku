// Hər "firebase deploy"-dan əvvəl avtomatik işləyir (firebase.json → predeploy).
// public/versiya.json faylına yeni versiya nömrəsi yazır — açıq saytlar bunu görüb yenilənir.
const fs = require("fs");
const path = require("path");
const indi = new Date();
const versiya = indi.toISOString().replace(/[-:T]/g, "").slice(0, 12); // məs. 202609272215
const fayl = path.join(__dirname, "..", "public", "versiya.json");
fs.writeFileSync(fayl, JSON.stringify({ versiya, tarix: indi.toISOString() }) + "\n");
console.log("AvenueBaku versiya:", versiya);
