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

/* === Album render theo từng mẫu === */
function renderAlbum(data){
  if (data.template === "royal") {
    return `
      <div class="album-carousel">
        <div class="slides">
          ${data.images.map(src=>`<div class="slide"><img src="${src}"></div>`).join("")}
        </div>
        <button class="nav prev">&#10094;</button>
        <button class="nav next">&#10095;</button>
        <script>
          (function(){
            const slides=document.querySelector('.album-carousel .slides');
            const prev=document.querySelector('.album-carousel .prev');
            const next=document.querySelector('.album-carousel .next');
            let index=0;
            prev.addEventListener('click',()=>{index=Math.max(0,index-1);slides.style.transform='translateX(-'+(index*100)+'%)';});
            next.addEventListener('click',()=>{index=Math.min(${data.images.length-1},index+1);slides.style.transform='translateX(-'+(index*100)+'%)';});
          })();
        </script>
      </div>`;
  }
  if (data.template === "premium") {
    return `<div class="album-kenburns">
      ${data.images.map(src=>`<img src="${src}" alt="">`).join("")}
    </div>`;
  }
  if (data.template === "floral") {
    return `<div class="album-tilt">
      ${data.images.map(src=>`<img src="${src}" alt="">`).join("")}
    </div>`;
  }
  if (data.template === "minimal") {
    return `<div class="album-zoom">
      ${data.images.map(src=>`<img src="${src}" alt="">`).join("")}
    </div>`;
  }
  // classic mặc định
  return `<div class="album-fade">
    ${data.images.map(src=>`<img src="${src}" alt="">`).join("")}
  </div>`;
}

/* === Preview trong admin === */
function renderPreviewInto(doc, data){
  const albumHtml = renderAlbum(data);
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
          ${albumHtml}
        </div>
      </div>
    </div>
  `);
  doc.close();
}

/* === Trang admin (builder) === */
function initBuilder(){
  const bride=$("bride"), groom=$("groom");
  const date=$("date"), time=$("time");
  const venue=$("venue"), address=$("address"), maps=$("maps");
  const brideFather=$("brideFather"), brideMother=$("brideMother");
  const groomFather=$("groomFather"), groomMother=$("groomMother");
  const note=$("note");
  const albumInput=$("albumInput"), thumbs=$("thumbs");
  const previewBtn=$("previewBtn"), payBtn=$("payBtn"), confirmBtn=$("confirmBtn");
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

  // QR step
  payBtn.addEventListener("click",()=>{
    const data=collect();
    const url=makeVietQR({ bankCode:"970422",accountNo:accNo,amount:priceOf(data.template),addInfo:`WEDDING-${toSlug(data.bride)}-${toSlug(data.groom)}` });
    qrImg.src=url; qrLink.href=url;
    alert("Vui lòng quét QR để thanh toán. Sau khi chuyển khoản xong, nhấn 'Đã thanh toán'.");
    confirmBtn.disabled=false;
  });

  // Confirm payment
  confirmBtn.addEventListener("click",()=>{
    const data=collect();
    if(!data.bride||!data.groom){ alert("Vui lòng nhập tên cô dâu và chú rể!"); return; }
    if(data.images.length===0){ alert("Vui lòng upload ít nhất 1 ảnh (tối đa 10)."); return; }
    const slug=`${toSlug(data.bride)}-${toSlug(data.groom)}`||"thiep-cuoi";
    const db=loadDB(); db[slug]={...data,paid:true,createdAt:Date.now()}; saveDB(db);
    location.href=`invitation.html?slug=${encodeURIComponent(slug)}`;
  });
}

/* === Trang thiệp riêng (sau thanh toán) === */
function initInvitation(){
  const params=new URLSearchParams(location.search),slug=params.get("slug"),root=$("inviteRoot");
  if(!slug){root.textContent="Thiếu slug";return;}
  const data=loadDB()[slug]; if(!data){root.textContent="Không tìm thấy thiệp.";return;}

  const albumHtml=renderAlbum(data);

  // countdown
  const countdown=`
    <div class="countdown">
      <div><b id="days">0</b>Ngày</div>
      <div><b id="hours">0</b>Giờ</div>
      <div><b id="minutes">0</b>Phút</div>
      <div><b id="seconds">0</b>Giây</div>
    </div>
  `;

  root.innerHTML=`
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
          ${countdown}
          ${albumHtml}
        </div>
      </div>
    </div>
  `;

  // update countdown
  try{
    const dt=new Date(`${data.date}T${data.time||"00:00"}`);
    setInterval(()=>{
      const now=new Date();let diff=dt-now;if(diff<0) diff=0;
      const d=Math.floor(diff/86400000);
      const h=Math.floor((diff%86400000)/3600000);
      const m=Math.floor((diff%3600000)/60000);
      const s=Math.floor((diff%60000)/1000);
      $("#days").textContent=d;$("#hours").textContent=h;$("#minutes").textContent=m;$("#seconds").textContent=s;
    },1000);
  }catch(_){}
}

/* === Trang quản lý === */
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

/* === Router === */
document.addEventListener("DOMContentLoaded",()=>{
  const p=location.pathname;
  if(p.endsWith("admin.html")) return initBuilder();
  if(p.endsWith("invitation.html")) return initInvitation();
  if(p.endsWith("manager.html")) return initManager();
});
