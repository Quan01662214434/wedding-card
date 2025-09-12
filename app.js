// ===== Utilities =====
const $ = (id) => document.getElementById(id);
const q = (sel, root=document) => root.querySelector(sel);
const toSlug = (str) => (str || "")
  .normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/[^a-zA-Z0-9\s-]/g, "")
  .trim().replace(/\s+/g, "-")
  .toLowerCase();

const DB_KEY = "wedding_invites_v2"; // localStorage key
function loadDB(){ try{ return JSON.parse(localStorage.getItem(DB_KEY))||{} }catch(_){ return {} } }
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)) }
function formatVND(n){ return (n||0).toLocaleString("vi-VN") }

// ===== Template presets (album mặc định theo mẫu) =====
const TEMPLATE_PRESETS = {
  classic: {
    cover: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522673603387-7a36b0948b45?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop"
    ],
    effect: "album-fade"
  },
  floral: {
    cover: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504198266285-165a3c88b93b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493589976221-c2357c31ad77?q=80&w=1200&auto=format&fit=crop"
    ],
    effect: "album-tilt"
  },
  minimal: {
    cover: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517260911035-3f58c5322b39?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1495562569060-2eec283d3391?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1475724017904-b712052c192a?q=80&w=1200&auto=format&fit=crop"
    ],
    effect: "album-zoom"
  },
  royal: {
    cover: "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?q=80&w=1600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1521312702322-c0f03659c4aa?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop"
    ],
    effect: "album-carousel"
  },
  premium: {
    cover: "https://images.unsplash.com/photo-1523800503107-5bc3ba2a6f81?q=80&w=1600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop"
    ],
    effect: "album-kenburns"
  }
};

// ===== VietQR =====
function makeVietQR({ bankCode="970422", accountNo, amount, addInfo="WEDDING" }){
  const base = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png`;
  const p = new URLSearchParams();
  if(amount>0) p.set("amount", String(amount));
  if(addInfo) p.set("addInfo", addInfo);
  return `${base}?${p.toString()}`;
}

// ===== Preview (iframe) =====
function renderPreviewInto(doc, data){
  const themeMap = { classic:"theme-classic", floral:"theme-floral", minimal:"theme-minimal", royal:"theme-royal", premium:"theme-premium" };
  const themeClass = themeMap[data.template] || "theme-classic";
  const cover = (data.images?.[data.coverIndex||0]) || data.cover || TEMPLATE_PRESETS[data.template]?.cover;

  const galleryHtml = (data.images && data.images.length>1)
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:10px;">
        ${data.images.map((src,i)=>`<img src="${src}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;border:${i===(data.coverIndex||0)?'2px solid #0b6cff':'1px solid #eee'};">`).join("")}
       </div>`
    : "";

  doc.open();
  doc.write(`
    <link rel="stylesheet" href="style.css">
    <div class="invite-root ${themeClass}">
      <div class="invite-card">
        <img class="invite-cover" src="${cover}" alt="cover"/>
        <div class="invite-body">
          <h2>Trân trọng kính mời</h2>
          <h1>${data.bride||""} & ${data.groom||""}</h1>
          <p><strong>Thời gian:</strong> ${data.date||""} ${data.time||""}</p>
          <p><strong>Địa điểm:</strong> ${data.venue||""}</p>
          ${data.address?`<p>${data.address}</p>`:""}
          ${data.parents?`<p style="margin-top:8px">${data.parents}</p>`:""}
          ${data.maps?`<p style="margin-top:10px"><a href="${data.maps}" target="_blank">Xem Google Maps</a></p>`:""}
          ${data.note?`<p style="margin-top:12px">${data.note}</p>`:""}
          ${galleryHtml}
        </div>
      </div>
    </div>
  `);
  doc.close();
}

// ===== Builder Page =====
function initBuilder(){
  const templateSelect=$("templateSelect");
  const bride=$("bride"), groom=$("groom");
  const date=$("date"), time=$("time");
  const venue=$("venue"), address=$("address"), maps=$("maps");
  const brideFather=$("brideFather"), brideMother=$("brideMother");
  const groomFather=$("groomFather"), groomMother=$("groomMother");
  const note=$("note"), coverInput=$("cover");

  const previewBtn=$("previewBtn"), payBtn=$("payBtn"), publishBtn=$("publishBtn");
  const previewFrame=$("previewFrame");
  const qrImg=$("qrImg"), qrLink=$("qrLink"), copyBtn=$("copyBtn");
  const accNo=$("accNo").textContent.trim(), amountText=$("amountText");
  const thumbs=$("thumbs"), coverInfo=$("coverInfo"), coverNameEl=$("coverName");

  const chosen = localStorage.getItem("wedding_template");
  if (chosen && q(`#templateSelect option[value="${chosen}"]`)) templateSelect.value = chosen;

  function priceOf(t){ return t==="premium" ? 400000 : 300000 }
  function refreshPrice(){ const p=priceOf(templateSelect.value); amountText.textContent = formatVND(p); return p }
  templateSelect.addEventListener("change", refreshPrice); refreshPrice();

  copyBtn.addEventListener("click", ()=> navigator.clipboard.writeText(accNo).then(()=>alert("Đã sao chép số tài khoản!")));

  // Multiple images
  let images=[]; let coverIndex=0;
  function renderThumbs(){
    if(!thumbs){return}
    if(!images.length){ thumbs.innerHTML=""; coverInfo.style.display="none"; return }
    thumbs.innerHTML = images.map((src,i)=>`
      <div style="position:relative">
        <img src="${src}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;border:${i===coverIndex?'2px solid #0b6cff':'1px solid #eee'};">
        <button data-i="${i}" class="set-cover" style="position:absolute;bottom:6px;left:6px;font-size:11px;padding:4px 6px;border:none;border-radius:6px;background:#0b6cff;color:#fff;cursor:pointer;">Bìa</button>
        <button data-rm="${i}" class="rm-img" style="position:absolute;top:6px;right:6px;font-size:11px;padding:4px 6px;border:none;border-radius:6px;background:#b11e2d;color:#fff;cursor:pointer;">Xoá</button>
      </div>`).join("");
    coverInfo.style.display="block"; coverNameEl.textContent=`Ảnh #${coverIndex+1}`;
    thumbs.querySelectorAll(".set-cover").forEach(b=>b.addEventListener("click",(e)=>{coverIndex=Number(e.currentTarget.getAttribute("data-i")); renderThumbs(); updatePreview()}));
    thumbs.querySelectorAll(".rm-img").forEach(b=>b.addEventListener("click",(e)=>{const i=Number(e.currentTarget.getAttribute("data-rm")); images.splice(i,1); if(coverIndex>=images.length) coverIndex=Math.max(0,images.length-1); renderThumbs(); updatePreview()}));
  }
  coverInput.addEventListener("change",(e)=>{
    const files=Array.from(e.target.files||[]).slice(0,12);
    if(!files.length) return;
    let loaded=0;
    files.forEach(f=>{const fr=new FileReader(); fr.onload=()=>{images.push(String(fr.result)); loaded++; if(loaded===files.length){ if(coverIndex>=images.length) coverIndex=0; renderThumbs(); updatePreview(); } }; fr.readAsDataURL(f)});
  });

  function collect(){
    const parents=[brideFather.value,brideMother.value,groomFather.value,groomMother.value].filter(Boolean).join(" • ");
    // auto preset nếu không có ảnh upload
    let imgs = images.slice(0);
    if(!imgs.length){
      const preset=TEMPLATE_PRESETS[templateSelect.value];
      if(preset) imgs = preset.images.slice(0);
    }
    return {
      template: templateSelect.value,
      bride: bride.value, groom: groom.value,
      date: date.value, time: time.value,
      venue: venue.value, address: address.value, maps: maps.value,
      parents, note: note.value,
      images: imgs, coverIndex: Math.min(coverIndex, Math.max(0, imgs.length-1)),
      cover: imgs[0] || TEMPLATE_PRESETS[templateSelect.value]?.cover || "",
      effect: TEMPLATE_PRESETS[templateSelect.value]?.effect || "album-fade",
      paid:false
    };
  }

  function updatePreview(){ const data=collect(); const doc = previewFrame.contentDocument || previewFrame.contentWindow.document; renderPreviewInto(doc, data) }
  previewBtn.addEventListener("click", updatePreview); updatePreview();

  payBtn.addEventListener("click", ()=>{
    const data=collect();
    const url = makeVietQR({ bankCode: "970422", accountNo: accNo, amount: priceOf(templateSelect.value), addInfo: `WEDDING-${toSlug(data.bride)}-${toSlug(data.groom)}` });
    if(qrImg){ qrImg.style.display="block"; qrImg.src=url }
    if(qrLink){ qrLink.href=url }
    alert("Quét QR để thanh toán. Sau đó bấm 'Xuất & Lấy link'.");
    publishBtn.disabled=false;
  });

  publishBtn.addEventListener("click", ()=>{
    const data=collect();
    if(!data.bride || !data.groom){ alert("Vui lòng nhập tên cô dâu và chú rể!"); return }
    const slug = `${toSlug(data.bride)}-${toSlug(data.groom)}` || "thiep-cuoi";
    const db = loadDB(); db[slug] = { ...data, paid:true, createdAt: Date.now() }; saveDB(db);
    // sang trang xuất link hoàn chỉnh
    location.href = `share.html?slug=${encodeURIComponent(slug)}`;
  });
}

// ===== Invitation Page =====
function initInvitation(){
  const params=new URLSearchParams(location.search); const slug=params.get("slug"); const root=$("inviteRoot");
  if(!slug){ root.textContent="Thiếu tham số slug"; return }
  const data=loadDB()[slug]; if(!data){ root.textContent="Không tìm thấy thiệp."; return }
  const themeMap={ classic:"theme-classic", floral:"theme-floral", minimal:"theme-minimal", royal:"theme-royal", premium:"theme-premium" };
  const themeClass=themeMap[data.template]||"theme-classic";
  const cover = data.images?.[data.coverIndex||0] || data.cover || TEMPLATE_PRESETS[data.template]?.cover;

  const gallery = (data.images && data.images.length>1)
    ? `<div class="album ${data.effect||'album-fade'}">${data.images.map(src=>`<img src="${src}" alt="">`).join("")}</div>`
    : "";

  const wrap=document.createElement("div");
  wrap.className=`invite-root ${themeClass}`;
  wrap.innerHTML=`
    <div class="invite-card">
      <img class="invite-cover" src="${cover}" alt="cover"/>
      <div class="invite-body">
        <h2>Trân trọng kính mời</h2>
        <h1>${data.bride} & ${data.groom}</h1>
        <p><strong>Thời gian:</strong> ${data.date} ${data.time}</p>
        <p><strong>Địa điểm:</strong> ${data.venue}</p>
        ${data.address?`<p>${data.address}</p>`:""}
        ${data.parents?`<p style="margin-top:8px">${data.parents}</p>`:""}
        ${data.maps?`<p style="margin-top:10px"><a href="${data.maps}" target="_blank">Xem Google Maps</a></p>`:""}
        ${data.note?`<p style="margin-top:12px">${data.note}</p>`:""}
        ${gallery}
      </div>
    </div>`;
  root.innerHTML=""; root.appendChild(wrap);
}

// ===== Manager Page =====
function initManager(){
  const list=$("orders"); const db=loadDB();
  const items=Object.entries(db).sort((a,b)=>(b[1]?.createdAt||0)-(a[1]?.createdAt||0));
  if(!items.length){ list.textContent="Chưa có thiệp nào."; return }
  list.innerHTML=items.map(([slug,d])=>`
    <div class="card">
      <div><strong>${d.bride} & ${d.groom}</strong></div>
      <div>${d.date} ${d.time}</div>
      <div>${d.venue}</div>
      <div class="badge">${d.template}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
        <a target="_blank" href="invitation.html?slug=${encodeURIComponent(slug)}">Xem thiệp</a>
        <a href="#" onclick="(function(){ const all=JSON.parse(localStorage.getItem('${DB_KEY}')||'{}'); delete all['${slug}']; localStorage.setItem('${DB_KEY}', JSON.stringify(all)); location.reload(); })(); return false;">Xoá</a>
      </div>
    </div>`).join("");
}

// ===== Router =====
document.addEventListener("DOMContentLoaded",()=>{
  const p=location.pathname;
  if(p.endsWith("admin.html")) return initBuilder();
  if(p.endsWith("invitation.html")) return initInvitation();
  if(p.endsWith("manager.html")) return initManager();
});
