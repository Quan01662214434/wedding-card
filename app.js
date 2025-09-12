// ===== Utilities =====
const $ = (id) => document.getElementById(id);
const q = (sel, root=document) => root.querySelector(sel);
const toSlug = (str) => (str || "")
  .normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/[^a-zA-Z0-9\s-]/g, "")
  .trim().replace(/\s+/g, "-")
  .toLowerCase();

const DB_KEY = "wedding_invites_v2"; // localStorage key

function loadDB() { 
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || {}; } 
  catch(_) { return {}; } 
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function formatVND(n) { return (n||0).toLocaleString("vi-VN"); }

// ===== QR (VietQR) =====
function makeVietQR({ bankCode = "MB", accountNo, amount, addInfo = "WEDDING" }) {
  const base = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png`;
  const params = new URLSearchParams();
  if (amount && amount > 0) params.set("amount", String(amount));
  if (addInfo) params.set("addInfo", addInfo);
  return `${base}?${params.toString()}`;
}

// ===== Preview renderer =====
function renderPreviewInto(doc, data) {
  const themeMap = {
    classic: "theme-classic",
    floral: "theme-floral",
    minimal: "theme-minimal",
    royal: "theme-royal",
    premium: "theme-premium"
  };
  const themeClass = themeMap[data.template] || "theme-classic";
  const cover = data.cover || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1400&auto=format&fit=crop";

  doc.open();
  doc.write(`
    <link rel="stylesheet" href="style.css">
    <div class="invite-root ${themeClass}">
      <div class="invite-card">
        <img class="invite-cover" src="${cover}" alt="cover"/>
        <div class="invite-body">
          <h2>Trân trọng kính mời</h2>
          <h1>${data.bride || ""} & ${data.groom || ""}</h1>
          <p><strong>Thời gian:</strong> ${data.date || ""} ${data.time || ""}</p>
          <p><strong>Địa điểm:</strong> ${data.venue || ""}</p>
          ${data.address ? `<p>${data.address}</p>` : ""}
          ${data.parents ? `<p style="margin-top:8px">${data.parents}</p>` : ""}
          ${data.maps ? `<p style="margin-top:10px"><a href="${data.maps}" target="_blank">Xem Google Maps</a></p>` : ""}
          ${data.note ? `<p style="margin-top:12px">${data.note}</p>` : ""}
        </div>
      </div>
    </div>
  `);
  doc.close();
}

// ===== Builder Page =====
function initBuilder() {
  const templateSelect = $("templateSelect");
  const bride = $("bride"); const groom = $("groom");
  const date = $("date"); const time = $("time");
  const venue = $("venue"); const address = $("address"); const maps = $("maps");
  const brideFather = $("brideFather"), brideMother = $("brideMother");
  const groomFather = $("groomFather"), groomMother = $("groomMother");
  const note = $("note"); const cover = $("cover");

  const previewBtn = $("previewBtn"); 
  const payBtn = $("payBtn"); 
  const publishBtn = $("publishBtn");
  const previewFrame = $("previewFrame");
  const qrImg = $("qrImg"); 
  const copyBtn = $("copyBtn");
  const accNo = $("accNo").textContent.trim(); 
  const amountText = $("amountText");

  // prefill template
  const chosen = localStorage.getItem("wedding_template");
  if (chosen && q(`#templateSelect option[value="${chosen}"]`)) {
    templateSelect.value = chosen;
  }

  // pricing: 4 templates 300k, premium 400k
  function getPrice(template) { return template === "premium" ? 400000 : 300000; }
  function refreshPrice() {
    const price = getPrice(templateSelect.value);
    amountText.textContent = formatVND(price);
    return price;
  }
  templateSelect.addEventListener("change", refreshPrice);
  refreshPrice();

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(accNo).then(()=> alert("Đã sao chép số tài khoản!"));
  });

  let coverDataUrl = "";
  cover.addEventListener("change", (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => { coverDataUrl = String(fr.result); updatePreview(); };
    fr.readAsDataURL(f);
  });

  function collect() {
    const parents = [
      brideFather.value || "", brideMother.value || "",
      groomFather.value || "", groomMother.value || ""
    ].filter(Boolean).join(" • ");
    return {
      template: templateSelect.value,
      bride: bride.value, groom: groom.value,
      date: date.value, time: time.value,
      venue: venue.value, address: address.value, maps: maps.value,
      parents,
      note: note.value,
      cover: coverDataUrl,
      paid: false
    };
  }

  function updatePreview() {
    const data = collect();
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    renderPreviewInto(iframeDoc, data);
  }
  previewBtn.addEventListener("click", updatePreview);
  updatePreview();

  payBtn.addEventListener("click", () => {
    const data = collect();
    const amount = refreshPrice();
    const addInfo = `WEDDING-${toSlug(data.bride)}-${toSlug(data.groom)}`;
    qrImg.src = makeVietQR({ bankCode: "MB", accountNo: accNo, amount, addInfo });
    alert("Quét QR để thanh toán. Sau khi thanh toán, bấm 'Xuất & Lấy link' để tạo thiệp.");
    publishBtn.disabled = false; 
  });

  publishBtn.addEventListener("click", () => {
    const data = collect();
    if(!data.bride || !data.groom){
      alert("Vui lòng nhập tên cô dâu và chú rể!");
      return;
    }
    const slug = `${toSlug(data.bride)}-${toSlug(data.groom)}` || "thiep-cuoi";
    const db = loadDB();
    db[slug] = { ...data, paid: true, createdAt: Date.now() };
    saveDB(db);

    const url = `invitation.html?slug=${encodeURIComponent(slug)}`;
    navigator.clipboard.writeText(url).catch(()=>{});
    alert(`Thiệp đã xuất! Link đã copy: \n${url}`);
    location.href = url;
  });
}

// ===== Invitation Page =====
function initInvitation() {
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const root = $("inviteRoot");
  if(!slug) { root.textContent = "Thiếu tham số slug"; return; }
  const db = loadDB();
  const data = db[slug];
  if(!data) { root.textContent = "Không tìm thấy thiệp."; return; }

  const themeMap = {
    classic: "theme-classic",
    floral: "theme-floral",
    minimal: "theme-minimal",
    royal: "theme-royal",
    premium: "theme-premium"
  };
  const themeClass = themeMap[data.template] || "theme-classic";
  const cover = data.cover || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1400&auto=format&fit=crop";

  const wrap = document.createElement("div");
  wrap.className = `invite-root ${themeClass}`;
  wrap.innerHTML = `
    <div class="invite-card">
      <img class="invite-cover" src="${cover}" alt="cover"/>
      <div class="invite-body">
        <h2>Trân trọng kính mời</h2>
        <h1>${data.bride} & ${data.groom}</h1>
        <p><strong>Thời gian:</strong> ${data.date} ${data.time}</p>
        <p><strong>Địa điểm:</strong> ${data.venue}</p>
        ${data.address ? `<p>${data.address}</p>` : ""}
        ${data.parents ? `<p style="margin-top:8px">${data.parents}</p>` : ""}
        ${data.maps ? `<p style="margin-top:10px"><a href="${data.maps}" target="_blank">Xem Google Maps</a></p>` : ""}
        ${data.note ? `<p style="margin-top:12px">${data.note}</p>` : ""}
      </div>
    </div>`;
  root.innerHTML = "";
  root.appendChild(wrap);
}

// ===== Manager Page =====
function initManager() {
  const list = $("orders");
  const db = loadDB();
  const items = Object.entries(db).sort((a,b)=> (b[1]?.createdAt||0) - (a[1]?.createdAt||0));
  if(items.length === 0) { list.textContent = "Chưa có thiệp nào."; return; }

  list.innerHTML = items.map(([slug, d]) => `
    <div class="card">
      <div><strong>${d.bride} & ${d.groom}</strong></div>
      <div>${d.date} ${d.time}</div>
      <div>${d.venue}</div>
      <div class="badge">${d.template}</div>
      <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
        <a target="_blank" href="invitation.html?slug=${encodeURIComponent(slug)}">Xem thiệp</a>
        <a href="#" onclick="(function(){ const all=JSON.parse(localStorage.getItem('${DB_KEY}')||'{}'); delete all['${slug}']; localStorage.setItem('${DB_KEY}', JSON.stringify(all)); location.reload(); })(); return false;">Xoá</a>
      </div>
    </div>
  `).join("");
}

// ===== Router =====
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname;
  if (path.endsWith("/admin.html") || path.endsWith("admin.html")) return initBuilder();
  if (path.endsWith("/invitation.html") || path.endsWith("invitation.html")) return initInvitation();
  if (path.endsWith("/manager.html") || path.endsWith("manager.html")) return initManager();
});
