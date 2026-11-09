const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){toast('Storage is full or blocked');return false}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

let settings=ld('pos_settings',{name:'',upi:'',addr:''});
let products=ld('pos_products',[]);
let history=ld('pos_history',[]);
let counter=ld('pos_counter',0);
let cart={}, customs={}, disc=0, cur=null, filt='all', editId=null, mode='new';

let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(tt);tt=setTimeout(()=>t.classList.add('hidden'),2200)}

/* ---------- PWA ---------- */
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}

/* ---------- Tabs ---------- */
function setTab(t){
  ['bill','hist','set'].forEach(k=>$('#p-'+k).classList.toggle('hidden',k!==t));
  $$('.tabbtn').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  if(t==='hist')renderHist();
  if(t==='bill')renderBill();
  $('#bar').classList.toggle('hidden',t!=='bill'||!cartCount());
  window.scrollTo(0,0);
}
$$('.tabbtn').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
const curTab=()=>['bill','hist','set'].find(k=>!$('#p-'+k).classList.contains('hidden'));

/* ---------- Billing ---------- */
const cartCount=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const allItems=()=>[...products,...Object.values(customs)];
const subtotal=()=>allItems().reduce((a,p)=>a+(cart[p.id]||0)*p.price,0);
const total=()=>Math.max(0,subtotal()-Math.min(disc,subtotal()));

const PAL=[['#FFF3E0','#FAE2B6'],['#FFEFEA','#F8D5CC'],['#E8F0FD','#CBDDF8'],['#E6F6EC','#C5E8D1'],['#F2EDFD','#DCD2F6'],['#FFFFFF','#E2E3E9']];
const pal=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return PAL[h%PAL.length]};
const PIN=on=>on?'<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg>':'<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4v5c0 1.12.37 2.16 1 3H9c.65-.86 1-1.9 1-3V4h4m3-2H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3V4h1c.55 0 1-.45 1-1s-.45-1-1-1z"/></svg>';
const CHK='<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
function card(p){
  const q=cart[p.id]||0,[bg,bd]=pal(p.id);
  return `<div class="p-4" style="background:${bg};border:1.5px solid ${q?'var(--brand)':bd};box-shadow:${q?'0 0 0 1px var(--brand)':'none'};border-radius:28px">
    <div class="flex items-start justify-between gap-2">
      <div data-add="${p.id}" class="cursor-pointer select-none min-w-0 flex-1"><div class="serif text-[19px] font-bold leading-tight break-words">${p.name}</div><div class="mono text-[15px] font-medium mt-1.5" style="color:var(--brand-d)">${money(p.price)}</div></div>
      <button data-tp="${p.id}" aria-label="${p.pin?'Unpin ':'Pin '}${esc(p.name)}" class="shrink-0" style="color:${p.pin?'var(--brand)':'#7C808A'}">${PIN(p.pin)}</button>
    </div>
    <div class="flex items-center justify-between mt-4">
      <button data-dec="${p.id}" aria-label="Remove one ${esc(p.name)}" class="btn w-11 h-11 text-2xl" style="background:rgba(255,255,255,.8);border:1.5px solid ${bd}">−</button>
      <span class="mono text-xl font-medium">${q}</span>
      <button data-add="${p.id}" aria-label="Add one ${esc(p.name)}" class="btn w-11 h-11 text-2xl text-white" style="background:var(--brand)">+</button>
    </div></div>`;
}
function renderBill(){
  const ok=!!settings.upi.trim();
  $('#shopTitle').textContent=settings.name||'QuickBill';
  $('#shopSub').textContent=ok?(settings.addr||'Tap an item to add it'):'Add your UPI ID in Settings to take payments';
  const st=$('#stat');st.style.background=ok?'#DDF1E6':'#FDEBD3';st.style.color=ok?'#1E9E5A':'#C26A00';st.innerHTML=ok?CHK:'<b class="text-xl">!</b>';
  const pins=products.filter(p=>p.pin), oth=products.filter(p=>!p.pin&&filt!=='pinned');
  let msg='';
  if(!pins.length)msg=!products.length?'No products yet. Add your first product in Settings.':'No pinned items. Tap the pin on an item to keep it here.';
  $('#pinGrid').innerHTML=pins.length?pins.map(card).join(''):`<div class="col-span-2 text-sm p-4" style="border:1.5px dashed var(--line);border-radius:20px;color:var(--mute)">${msg}</div>`;
  $('#otherWrap').classList.toggle('hidden',!oth.length);
  $('#otherGrid').innerHTML=oth.map(card).join('');
  renderCart();
}
function renderCart(){
  const lines=allItems().filter(p=>cart[p.id]);
  $('#cartList').innerHTML=lines.length?lines.map(p=>`<div class="flex justify-between items-center py-1.5 text-sm"><span class="font-bold min-w-0 truncate pr-2">${esc(p.name)} <span class="mono font-medium" style="color:var(--mute)">× ${cart[p.id]}</span></span><span class="flex items-center gap-2 shrink-0"><span class="mono font-medium">${money(cart[p.id]*p.price)}</span>${customs[p.id]?`<button data-rm="${p.id}" aria-label="Remove ${esc(p.name)}" class="text-xl leading-none" style="color:#C2410C">×</button>`:''}</span></div>`).join(''):`<div class="text-sm" style="color:var(--mute)">Nothing added yet. Tap an item above.</div>`;
  $('#cartTotals').classList.toggle('hidden',!lines.length);
  $('#clearCart').classList.toggle('hidden',!lines.length);
  if(document.activeElement!==$('#discIn'))$('#discIn').value=disc||'';
  updateTotals();
}
function updateTotals(){
  const n=cartCount();
  $('#tSub').textContent=money(subtotal());$('#tTot').textContent=money(total());
  $('#barQty').textContent=n+(n===1?' item':' items');$('#barTot').textContent=money(total());
  $('#bar').classList.toggle('hidden',curTab()!=='bill'||!n);
}
$('#discIn').oninput=e=>{disc=parseFloat(e.target.value)||0;updateTotals()};
$('#clearCart').onclick=()=>{cart={};customs={};disc=0;editId=null;renderBill()};

document.addEventListener('click',e=>{
  const a=e.target.closest('[data-add]'),d=e.target.closest('[data-dec]');
  if(a){const id=a.dataset.add;cart[id]=(cart[id]||0)+1;renderBill();if(navigator.vibrate)navigator.vibrate(8)}
  else if(d){const id=d.dataset.dec;cart[id]=(cart[id]||0)-1;renderBill()}
});

/* ---------- Dialogs (replace blocked confirm/prompt) ---------- */
function dlg({title,msg='',fields=[],ok='OK',danger=false}){
  return new Promise(res=>{
    $('#dTitle').textContent=title;$('#dMsg').textContent=msg;$('#dMsg').classList.toggle('hidden',!msg);
    $('#dFields').innerHTML=fields.map((f,i)=>`<div><label class="text-sm font-medium" for="df${i}">${esc(f.label)}</label><input id="df${i}" class="fld mt-1" type="${f.type||'text'}" ${f.type==='number'?'inputmode="decimal" min="0"':''} value="${esc(f.value==null?'':f.value)}"></div>`).join('');
    const o=$('#dOk'),n=$('#dNo'),m=$('#dlg');
    o.textContent=ok;o.style.background=danger?'#C2410C':'var(--brand)';
    m.classList.remove('hidden');
    const done=v=>{m.classList.add('hidden');o.onclick=null;n.onclick=null;m.onclick=null;res(v)};
    o.onclick=()=>done(fields.length?fields.map((f,i)=>$('#df'+i).value):true);
    n.onclick=()=>done(null);
    m.onclick=e=>{if(e.target===m)done(null)};
    if(fields.length)setTimeout(()=>$('#df0').focus(),50);
  });
}
const ask=(title,msg,ok)=>dlg({title,msg,ok,danger:true}).then(v=>!!v);
$('#dFields').onkeydown=e=>{if(e.key==='Enter')$('#dOk').click()};

/* ---------- Receipt ---------- */
const sz=o=>new Blob([JSON.stringify(o)]).size;
const norm=h=>({id:h.id,no:h.no,ts:h.ts,items:(h.items||[]).map(i=>Array.isArray(i)?{n:i[0],p:i[1],q:i[2]}:i),sub:h.sub!=null?h.sub:h.total+(h.disc||0),disc:h.disc||0,total:h.total,sn:h.sn!=null?h.sn:settings.name,sa:h.sa!=null?h.sa:settings.addr,su:h.su!=null?h.su:settings.upi,pm:h.pm||'u'});
/* compact record, always under 10 KB */
function pack(b){
  for(const l of [60,30,15,8]){
    const r={id:b.id,no:b.no,ts:b.ts,items:b.items.map(i=>[String(i.n).slice(0,l),i.p,i.q]),sub:b.sub,disc:b.disc,total:b.total,sn:String(b.sn||'').slice(0,80),sa:String(b.sa||'').slice(0,120),su:String(b.su||'').slice(0,80),pm:b.pm||'u'};
    if(sz(r)<10000)return r;
  }
  return null;
}
$('#gen').onclick=()=>{
  if(!cartCount())return toast('Add at least one item');
  if(!settings.upi.trim()){toast('Add your UPI ID in Settings first');return setTab('set')}
  const r2=x=>Math.round(x*100)/100;
  const items=allItems().filter(p=>cart[p.id]).map(p=>({n:p.name,p:p.price,q:cart[p.id]}));
  const sub=r2(subtotal()), dsc=r2(Math.min(disc,sub)), tot=r2(sub+dsc);
  if(tot<=0)return toast('Total must be more than ₹0');
  const old=editId?history.find(h=>h.id===editId):null;
  const b={id:old?old.id:uid(),no:old?old.no:counter+1,ts:Date.now(),items,sub,disc:dsc,total:tot,sn:settings.name,sa:settings.addr,su:settings.upi,pm:'u'};
  const rec=pack(b);let saved=false;
  if(rec){
    const prev=history.slice(),pc=counter;
    if(old)history=history.map(h=>h.id===old.id?rec:h);else{history.unshift(rec);counter=b.no}
    if(sv('pos_history',history)){editId=rec.id;saved=true}
    else{history=prev;counter=pc}
  }else toast('Too many items to save this bill (10 KB limit)');
  showReceipt(b,'new');
  if(saved)toast('Saved to history');
};
function showReceipt(b,m){
  cur=b;mode=m;
  $('#rShop').textContent=b.sn||'Shop';
  $('#rAddr').textContent=b.sa||'';
  $('#rNo').textContent='Bill #'+String(b.no).padStart(4,'0');
  $('#rDate').textContent=new Date(b.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  $('#rItems').innerHTML=b.items.map(i=>`<div class="flex justify-between gap-2"><span class="min-w-0">${esc(i.n)}<span style="color:var(--mute)"> ${i.q} × ${Number(i.p).toFixed(2)}</span></span><span>${(i.q*i.p).toFixed(2)}</span></div>`).join('');
  $('#rSub').textContent=money(b.sub);
  $('#rDiscRow').classList.toggle('hidden',!b.disc);
  $('#rDisc').textContent='− '+money(b.disc);
  $('#rTot').textContent=money(b.total);
  $('#rUpi').textContent='Pay to: '+b.su;
  $$('#pm .chip').forEach(c=>c.classList.toggle('on',c.dataset.pm===(b.pm||'u')));
  const uri=`upi://pay?pa=${b.su}&pn=${encodeURIComponent(b.sn||'Shop')}&am=${Number(b.sub).toFixed(2)}&cu=INR`;
  const q=$('#qr');q.innerHTML='';
  try{new QRCode(q,{text:uri,width:200,height:200,colorDark:'#14212B',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})}
  catch(e){q.textContent='QR library failed to load. Check your internet connection.'}
  const L=$('#mL'),R=$('#mR');
  if(m==='new'){L.textContent='Edit bill';R.textContent='New bill';R.style.background='var(--brand)'}
  else{L.textContent='Close';R.textContent='Delete bill';R.style.background='#C2410C'}
  $('#modal').classList.remove('hidden');
  document.body.style.overflow='hidden';
}
/* ---------- Thermal print (58 / 80 mm) ---------- */
function printReceipt(){
  if(!cur)return;
  const b=cur,w=58,c=$('#qr canvas'),im=$('#qr img');
  const qsrc=c?c.toDataURL('image/png'):(im?im.src:'');
  const qs=w===80?'46mm':'36mm';
  const pa=$('#printArea');
  pa.style.width=w+'mm';pa.style.fontSize=(w===80?13:11)+'px';
  const d=new Date(b.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  pa.innerHTML=`<div class="pr-c pr-b" style="font-size:1.4em">${esc(b.sn||'Shop')}</div>
    ${b.sa?`<div class="pr-c">${esc(b.sa)}</div>`:''}
    <div class="pr-hr"></div>
    <div class="pr-row"><span>Bill #${String(b.no).padStart(4,'0')}</span><span>${esc(d)}</span></div>
    <div class="pr-hr"></div>
    ${b.items.map(i=>`<div class="pr-b">${esc(i.n)}</div><div class="pr-row"><span>${i.q} × ${Number(i.p).toFixed(2)}</span><span>${(i.q*i.p).toFixed(2)}</span></div>`).join('')}
    <div class="pr-hr"></div>
    <div class="pr-row"><span>Subtotal</span><span>${Number(b.sub).toFixed(2)}</span></div>
    ${b.disc?`<div class="pr-row"><span>Discount</span><span>- ${Number(b.disc).toFixed(2)}</span></div>`:''}
    <div class="pr-row pr-b" style="font-size:1.35em;margin-top:1mm"><span>TOTAL</span><span>₹${Number(b.total).toFixed(2)}</span></div>
    <div class="pr-row"><span>Paid by</span><span>${b.pm==='c'?'Cash':'UPI'}</span></div>
    <div class="pr-hr"></div>
    ${qsrc?`<img src="${qsrc}" alt="UPI QR" style="width:${qs};height:${qs}">`:''}
    <div class="pr-c">Scan to pay with any UPI app</div>
    <div class="pr-c pr-b">${esc(b.su)}</div>
    <div class="pr-c" style="margin-top:2mm">Thank you!</div>`;
  $('#pgStyle').textContent=`@page{size:${w}mm auto;margin:0}`;
  setTimeout(()=>window.print(),80);
}
$('#mP').onclick=printReceipt;
window.addEventListener('afterprint',()=>{$('#printArea').innerHTML=''});

function hideModal(){$('#modal').classList.add('hidden');document.body.style.overflow='';cur=null}
$('#mL').onclick=()=>{hideModal();if(curTab()==='bill')renderBill()};
$('#mR').onclick=async()=>{
  if(mode==='new'){cart={};customs={};disc=0;editId=null;hideModal();renderBill();return}
  const id=cur&&cur.id;
  if(await ask('Delete this bill?','It will be removed from history and cannot be restored.','Delete')){hideModal();delHist(id)}
};
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')$('#mL').click()});

/* ---------- History ---------- */
function delHist(id){
  history=history.filter(h=>h.id!==id);
  if(editId===id)editId=null;
  sv('pos_history',history);toast('Bill deleted');
}
function renderHist(){
  renderToday();
  $('#histCount').textContent=history.length?history.length+(history.length===1?' bill saved':' bills saved'):'No bills saved yet';
  $('#clearHist').classList.toggle('hidden',!history.length);
  $('#histList').innerHTML=history.length?history.map(h=>{
    const b=norm(h),[bg,bd]=pal(h.id);
    return `<div data-hopen="${h.id}" role="button" tabindex="0" class="p-4 cursor-pointer" style="background:${bg};border:1.5px solid ${bd};border-radius:28px">
      <div class="flex justify-between items-start gap-3"><div class="min-w-0"><div class="text-xs font-medium" style="color:var(--mute)">#${String(b.no).padStart(4,'0')} · ${new Date(b.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} · ${b.pm==='c'?'Cash':'UPI'}</div>
      <div class="serif text-[15px] font-semibold mt-1.5 line-clamp-2">${b.items.map(i=>i.q+' × '+esc(i.n)).join(', ')}</div></div>
      <div class="mono text-lg font-medium shrink-0">${money(b.total)}</div></div>
      <div class="flex items-center justify-between mt-3"><span class="text-xs font-medium" style="color:var(--brand-d)">Tap to open receipt</span>
      <button data-hdel="${h.id}" class="btn px-4 py-2 text-xs" style="background:rgba(255,255,255,.85);color:#C2410C">Delete</button></div></div>`}).join(''):`<div class="text-sm p-4" style="border:1.5px dashed var(--line);border-radius:20px;color:var(--mute)">Every bill you generate is saved here automatically.</div>`;
}
$('#histList').addEventListener('click',async e=>{
  const d=e.target.closest('[data-hdel]');
  if(d){if(await ask('Delete this bill?','It will be removed from history and cannot be restored.','Delete'))delHist(d.dataset.hdel);return}
  const o=e.target.closest('[data-hopen]');
  if(o){const h=history.find(x=>x.id===o.dataset.hopen);if(h)showReceipt(norm(h),'view')}
});
$('#histList').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.hopen)e.target.click()});
$('#clearHist').onclick=async()=>{
  if(await ask('Delete all bills?','Every saved receipt will be removed. This cannot be undone.','Delete all')){history=[];editId=null;sv('pos_history',history);renderHist();toast('History cleared')}
};

/* ---------- Settings ---------- */
function markPaper(){$$('#paper .chip').forEach(c=>c.classList.toggle('on',c.dataset.paper===(settings.paper||'58')))}
$('#paper').onclick=e=>{const c=e.target.closest('[data-paper]');if(c){settings.paper=c.dataset.paper;sv('pos_settings',settings);markPaper()}};
function loadSettings(){$('#sName').value=settings.name;$('#sUpi').value=settings.upi;$('#sAddr').value=settings.addr;markPaper()}
[['sName','name'],['sUpi','upi'],['sAddr','addr']].forEach(([id,k])=>{$('#'+id).oninput=e=>{settings[k]=e.target.value;sv('pos_settings',settings)}});
function renderProds(){
  const list=[...products].sort((a,b)=>(b.pin-a.pin)||a.name.localeCompare(b.name));
  $('#prodList').innerHTML=list.length?list.map(p=>`<div class="p-3 pl-4 flex items-center gap-3" style="background:${pal(p.id)[0]};border:1.5px solid ${pal(p.id)[1]};border-radius:24px">
    <div class="flex-1 min-w-0"><div class="font-extrabold truncate">${esc(p.name)}</div><div class="mono text-sm" style="color:var(--brand-d)">${money(p.price)}</div></div>
    <label class="flex items-center gap-1.5 text-xs font-bold"><input type="checkbox" class="chk" data-pin="${p.id}" ${p.pin?'checked':''}>Pin</label>
    <button data-edit="${p.id}" class="btn px-3 py-2 text-xs" style="background:rgba(255,255,255,.8)">Edit</button>
    <button data-del="${p.id}" class="btn px-3 py-2 text-xs" style="background:#FDE8E0;color:#C2410C">Delete</button></div>`).join(''):`<div class="text-sm rounded-2xl p-4" style="border:1.5px dashed var(--line);color:var(--mute)">No products yet. Add one above.</div>`;
}
function saveProds(){sv('pos_products',products);renderProds()}
$('#addProd').onclick=()=>{
  const n=$('#pName').value.trim(),pr=parseFloat($('#pPrice').value);
  if(!n)return toast('Enter a product name');
  
  products.push({id:uid(),name:n.slice(0,60),price:Math.round(pr*100)/100,pin:$('#pPin').checked});
  $('#pName').value='';$('#pPrice').value='';saveProds();toast('Product added');$('#pName').focus();
};
document.addEventListener('click',async e=>{
  const del=e.target.closest('[data-del]'),ed=e.target.closest('[data-edit]');
  if(del){const p=products.find(x=>x.id===del.dataset.del);
    if(p&&await ask('Delete '+p.name+'?','This removes the product from your list. Past bills stay unchanged.','Delete')){products=products.filter(x=>x.id!==p.id);delete cart[p.id];if(!cartCount())editId=null;saveProds()}}
  if(ed){const p=products.find(x=>x.id===ed.dataset.edit);if(!p)return;
    const v=await dlg({title:'Edit product',fields:[{label:'Product name',value:p.name},{label:'Price (₹)',value:p.price,type:'number'}],ok:'Save changes'});
    if(!v)return;const nm=v[0].trim(),pr=parseFloat(v[1]);
    if(!nm||!(pr>=0))return toast('Enter a valid name and price');
    p.name=nm.slice(0,60);p.price=Math.round(pr*100)/100;saveProds()}
});
document.addEventListener('change',e=>{const c=e.target.closest('[data-pin]');if(c){const p=products.find(x=>x.id===c.dataset.pin);if(p){p.pin=c.checked;saveProds()}}});

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-tp]');
  if(t){const p=products.find(x=>x.id===t.dataset.tp);if(p){p.pin=!p.pin;renderBill();renderProds()}return}
  const c=e.target.closest('[data-f]');
  if(c){filt=c.dataset.f;$$('#chips .chip').forEach(x=>x.classList.toggle('on',x===c));renderBill()}
});

/* ---------- Custom item, payment mode, daily total ---------- */
document.addEventListener('click',e=>{const r=e.target.closest('[data-rm]');if(r){delete cart[r.dataset.rm];delete customs[r.dataset.rm];if(!cartCount())editId=null;renderBill()}});
$('#chips').addEventListener('click',async e=>{
  if(!e.target.closest('[data-custom]'))return;
  const v=await dlg({title:'Custom item',fields:[{label:'Item name (optional)',value:''},{label:'Price (₹)',value:'',type:'number'},{label:'Quantity',value:1,type:'number'}],ok:'Add to bill'});
  if(!v)return;
  const pr=parseFloat(v[1]),q=Math.max(1,Math.round(parseFloat(v[2])||1));
  if(!(pr>0))return toast('Enter a valid price');
  const id='c'+uid();customs[id]={id,name:(v[0].trim()||'Item').slice(0,60),price:Math.round(pr*100)/100};cart[id]=q;renderBill();
});
$('#pm').onclick=e=>{
  const c=e.target.closest('[data-pm]');if(!c||!cur)return;
  cur.pm=c.dataset.pm;$$('#pm .chip').forEach(x=>x.classList.toggle('on',x===c));
  if(history.some(h=>h.id===cur.id)){history=history.map(h=>h.id===cur.id?{...h,pm:cur.pm}:h);sv('pos_history',history);if(curTab()==='hist')renderHist()}
};
function renderToday(){
  const t=new Date().toDateString();let c=0,u=0,n=0;
  history.forEach(h=>{{n++;if(h.pm==='c')c+=h.total;else u+=h.total}});
  const el=$('#histToday');el.classList.toggle('hidden',!history.length);
  el.innerHTML=`<div class="p-5" style="background:#E8F0FD;border:1.5px solid #CBDDF8;border-radius:28px"><div class="text-xs font-bold uppercase tracking-wider" style="color:var(--brand)">Today</div>
  <div class="flex items-end justify-between mt-1"><div class="serif text-3xl font-bold">${money(c+u)}</div><div class="text-sm font-medium" style="color:var(--mute)">${n} ${n===1?'bill':'bills'}</div></div>
  <div class="flex gap-5 mt-2 text-sm font-medium"><span>Cash <b class="mono">${money(c)}</b></span><span>UPI <b class="mono">${money(u)}</b></span></div></div>`;
}

/* ---------- Bluetooth ESC/POS printing (Android Chrome) ---------- */
const BT_SVC=['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb','0000fff0-0000-1000-8000-00805f9b34fb','e7810a71-73ae-499d-8c15-faa9aef0c3f2','49535343-fe7d-4ae5-8fa9-9fafd205e455'];
let bt=null;
if(navigator.bluetooth)$('#mB').classList.remove('hidden');
async function btChar(){
  if(bt&&bt.dev.gatt.connected)return bt.ch;
  const dev=bt?bt.dev:await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:BT_SVC});
  const srv=await dev.gatt.connect();
  for(const s of await srv.getPrimaryServices())for(const c of await s.getCharacteristics())if(c.properties.write||c.properties.writeWithoutResponse){bt={dev,ch:c};return c}
  throw new Error('No printer channel');
}
async function btSend(data){
  const ch=await btChar();let n=100;
  for(let i=0;i<data.length;){
    try{const p=data.slice(i,i+n);await(ch.properties.writeWithoutResponse?ch.writeValueWithoutResponse(p):ch.writeValue(p));i+=n;await new Promise(r=>setTimeout(r,12))}
    catch(e){if(n>20)n=20;else throw e}
  }
}
/* Draws the receipt as a 1-bit bitmap so any language, the ₹ sign and the QR print correctly */
function raster(b){
  const W=settings.paper==='80'?576:384,P=10,f=W>400?30:25,CH=1000+b.items.length*2*(f+10);
  const c=document.createElement('canvas');c.width=W;c.height=CH;
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,CH);x.fillStyle='#000';x.textBaseline='top';
  let y=8;const F=(s,w)=>{x.font=`${w||400} ${s}px Roboto,Arial,sans-serif`};
  const fit=(t,m)=>{t=String(t);while(t.length>1&&x.measureText(t).width>m)t=t.slice(0,-1);return t};
  const row=(l,r,s=f,w=400)=>{F(s,w);x.textAlign='left';x.fillText(fit(l,W-2*P-(r?x.measureText(r).width+12:0)),P,y);if(r){x.textAlign='right';x.fillText(r,W-P,y)}y+=s+8};
  const mid=(t,s=f,w=400)=>{F(s,w);x.textAlign='center';x.fillText(fit(t,W-2*P),W/2,y);y+=s+8};
  const hr=()=>{y+=2;for(let i=P;i<W-P;i+=12)x.fillRect(i,y,7,2);y+=12};
  mid(b.sn||'Shop',f+8,700);if(b.sa)mid(b.sa,f-4);hr();
  row('Bill #'+String(b.no).padStart(4,'0'),new Date(b.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}),f-3);hr();
  b.items.forEach(i=>{row(i.n,null,f,700);row(i.q+' x '+Number(i.p).toFixed(2),(i.q*i.p).toFixed(2))});hr();
  row('Subtotal',Number(b.sub).toFixed(2));if(b.disc)row('Discount','-'+Number(b.disc).toFixed(2));
  row('TOTAL','₹'+Number(b.total).toFixed(2),f+6,700);row('Paid by',b.pm==='c'?'Cash':'UPI',f-3);hr();
  const q=$('#qr canvas'),S=W>400?400:200;
  if(q){x.imageSmoothingEnabled=false;x.drawImage(q,(W-S)/2,y,S,S);y+=S+8}
  mid('Scan to pay with any UPI app',f-4);mid(b.su,f-4,700);y+=6;mid('Thank you!',f);y+=10;
  const H=Math.min(CH,Math.ceil(y)),d=x.getImageData(0,0,W,H).data,bpr=W/8,out=[0x1B,0x40];
  for(let r0=0;r0<H;r0+=200){
    const h=Math.min(200,H-r0);out.push(0x1D,0x76,0x30,0,bpr&255,bpr>>8,h&255,h>>8);
    for(let r=r0;r<r0+h;r++)for(let cb=0;cb<bpr;cb++){let v=0;for(let k=0;k<8;k++)if(d[(r*W+cb*8+k)*4]<140)v|=0x80>>k;out.push(v)}
  }
  out.push(0x1B,0x64,0x04);return new Uint8Array(out);
}
$('#mB').onclick=async()=>{
  if(!cur)return;
  try{toast('Connecting to printer…');await btSend(raster(cur));toast('Sent to printer')}
  catch(err){bt=null;toast(err&&err.name==='NotFoundError'?'No printer selected':'Bluetooth print failed. Try Print receipt.')}
};

/* ---------- Init ---------- */
loadSettings();renderProds();setTab('bill');
