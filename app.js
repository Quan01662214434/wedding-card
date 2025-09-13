const $ = (id) => document.getElementById(id);
const q = (sel, root=document) => root.querySelector(sel);
const toSlug = (str) => (str || "").normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();

const DB_KEY = "wedding_invites_v2";
function loadDB(){ try{ return JSON.parse(localStorage.getItem(DB_KEY))||{} }catch(_){ return {} } }
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)) }
function formatVND(n){ return (n||0).toLocaleString("vi-VN") }

function makeVietQR({ bankCode="970422", accountNo, amount, addInfo="WEDDING" }){
  const base = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png`;
  const p = new URLSearchParams();
  if(amount>0) p.set("amount", String(amount));
  if(addInfo) p.set("addInfo", addInfo);
  return `${base}?${p.toString()}`;
}

function renderPreviewInto(doc, data){
  doc.open();
  doc.write(`
    <link rel="stylesheet" href="style.css">
    <div class="invite-root theme-${data.template}">
      <div class="invite-card">
        <img class="invite-cover" src="${data.images[0]||''}" alt="cover"/>
        <div class="invite-body">
          <h2>Trân trọng kính mời</h2>
          <h1>${data.bride} & ${data.groom}</h1>
          <p><strong>Thời gian:</strong> ${data.date} ${data.time}</p>
          <p><strong>Địa điểm:</strong> ${data.venue}</p>
          ${data.address?`<p>${data.address}</p>`:""}
          ${data.parents?`<p>${data.parents}</p>`:""}
          ${data.maps?`<p><a href="${data.maps}" target="_blank">Xem Google Maps</a></p>`:""}
          ${data.note?`<p>${data.note}</p>`:""}
          <div class="album">
            ${data.images.map(src=>`<img src="${src}" alt="">`).join("")}
          </div>
        </div>
      </div>
    </div>
  `);
  doc.close();
}

function initBuilder(){
  const bride=$("bride"), groom=$("groom");
  const date=$("date"), time=$("time");
  const venue=$("venue"), address=$("address"), maps=$("maps");
  const brideFather=$("brideFather"), brideMother=$("brideMother");
  const groomFather=$("groomFather"), groomMother=$("groomMother");
  const note=$("note");
  const albumInput=$("albumInput"), thumbs=$("thumbs");
  const previewBtn=$("previewBtn"), payBtn=$("payBtn"), publishBtn=$("publishBtn");
  const previewFrame=$("previewFrame");
  const qrImg=$("qrImg"), qrLink=$("qrLink"), copyBtn=$("copyBtn");
  const accNo=$("accNo").textContent.trim(), amountText=$("amountText");

  // multi-images
  let images=[];
  albumInput.addEventListener("change",(e)=>{
    const files=Array.from(e.target.files).slice(0,10);
    images=[];
    let loaded=0;
    files.forEach(file=>{
      const reader=new FileReader();
      reader.onload=()=>{
        images.push(reader.result);
        loaded++;
        if(loaded===files.length) renderThumbs();
      };
      reader.readAsDataURL(file);
    });
  });
  function renderThumbs(){
    thumbs.innerHTML="";
    images.forEach((src,i)=>{
      const div=document.createElement("div");
      div.innerHTML=`<img src="${src}"><button onclick="removeImg(${i})">x</button>`;
      thumbs.appendChild(div);
    });
  }
  window.removeImg=(i)=>{ images.splice(i,1); renderThumbs(); };

  function getSelectedTemplate(){
    const checked=document.querySelector('input[name="template"]:checked');
    return checked?checked.value:"classic";
  }

  function collect(){
    const parents=[brideFather.value,brideMother.value,groomFather.value,groomMother.value].filter(Boolean).join(" • ");
    return {
      template:getSelectedTemplate(),
      bride:bride.value,groom:groom.value,
      date:date.value,time:time.value,
      venue:venue.value,address:address.value,maps:maps.value,
      parents,note:note.value,
      images:images,cover:images[0]||"",paid:false
    };
  }

  function updatePreview(){ renderPreviewInto(previewFrame.contentDocument, collect()); }
  previewBtn.addEventListener("click", updatePreview);

  function priceOf(t){ return t==="premium"?400000:300000 }
  function refreshPrice(){ amountText.textContent=formatVND(priceOf(getSelectedTemplate())); }
  refreshPrice();

  copyBtn.addEventListener("click",()=>navigator.clipboard.writeText(accNo).then(()=>alert("Đã sao chép số tài khoản!")));

  payBtn.addEventListener("click",()=>{
    const data=collect();
    const url=makeVietQR({ bankCode:"970422",accountNo:accNo,amount:priceOf(data.template),addInfo:`WEDDING-${toSlug(data.bride)}-${toSlug(data.groom)}` });
    qrImg.src=url; qrLink.href=url;
    alert("Quét QR để thanh toán. Sau đó bấm Xuất & Lấy link.");
    publishBtn.disabled=false;
  });

  publishBtn.addEventListener("click",()=>{
    const data=collect();
    if(!data.bride||!data.groom){ alert("Vui lòng nhập tên cô dâu và chú rể!"); return; }
    const slug=`${toSlug(data.bride)}-${toSlug(data.groom)}`||"thiep-cuoi";
    const db=loadDB(); db[slug]={...data,paid:true,createdAt:Date.now()}; saveDB(db);
    location.href=`share.html?slug=${encodeURIComponent(slug)}`;
  });
}

function initInvitation(){
  const params=new URLSearchParams(location.search),slug=params.get("slug"),root=$("inviteRoot");
  if(!slug){root.textContent="Thiếu slug";return;}
  const data=loadDB()[slug]; if(!data){root.textContent="Không tìm thấy thiệp.";return;}
  const wrap=document.createElement("div");
  wrap.className=`invite-root theme-${data.template}`;
  wrap.innerHTML=`
    <div class="invite-card">
      <img class="invite-cover" src="${data.images[0]||''}" alt="cover"/>
      <div class="invite-body">
        <h2>Trân trọng kính mời</h2>
        <h1>${data.bride} & ${data.groom}</h1>
        <p><strong>Thời gian:</strong> ${data.date} ${data.time}</p>
        <p><strong>Địa điểm:</strong> ${data.venue}</p>
        ${data.address?`<p>${data.address}</p>`:""}
        ${data.parents?`<p>${data.parents}</p>`:""}
        ${data.maps?`<p><a href="${data.maps}" target="_blank">Xem Google Maps</a></p>`:""}
        ${data.note?`<p>${data.note}</p>`:""}
        <div class="album">
          ${data.images.map(src=>`<img src="${src}" alt="">`).join("")}
        </div>
      </div>
    </div>`;
  root.innerHTML=""; root.appendChild(wrap);
}

function initManager(){
  const list=$("orders"),db=loadDB();
  const items=Object.entries(db).sort((a,b)=>(b[1]?.createdAt||0)-(a[1]?.createdAt||0));
  if(!items.length){list.textContent="Chưa có thiệp nào.";return;}
  list.innerHTML=items.map(([slug,d])=>`
    <div class="card">
      <div><strong>${d.bride} & ${d.groom}</strong></div>
      <div>${d.date} ${d.time}</div>
      <div>${d.venue}</div>
      <div class="badge">${d.template}</div>
      <div style="margin-top:8px;display:flex;gap:8px;">
        <a target="_blank" href="invitation.html?slug=${encodeURIComponent(slug)}">Xem thiệp</a>
        <a href="#" onclick="(function(){ const all=JSON.parse(localStorage.getItem('${DB_KEY}')||'{}'); delete all['${slug}']; localStorage.setItem('${DB_KEY}', JSON.stringify(all)); location.reload(); })(); return false;">Xoá</a>
      </div>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded",()=>{
  const p=location.pathname;
  if(p.endsWith("admin.html")) return initBuilder();
  if(p.endsWith("invitation.html")) return initInvitation();
  if(p.endsWith("manager.html")) return initManager();
});
