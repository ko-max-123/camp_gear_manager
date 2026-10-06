
(()=>{
const KEY="campGearShelf_v7";
const DB_NAME="campGearShelfImages";
const DB_STORE="photos";
const OWNED_PEG_IMPORT_KEY=KEY+"_owned_titanmania_pegs_v1";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

const categories=["テント・タープ","寝具","ファニチャー","焚き火・火器","調理・食器","照明・電源","クーラー・保冷","衣類","衛生・救急","工具・ロープ","その他"];
const emoji={"テント・タープ":"⛺","寝具":"🛏️","ファニチャー":"🪑","焚き火・火器":"🔥","調理・食器":"🍳","照明・電源":"🔦","クーラー・保冷":"🧊","衣類":"🧥","衛生・救急":"🩹","工具・ロープ":"🪢","その他":"🎒"};
const statusText={good:"使用OK",check:"要確認",repair:"修理・交換"};
const esc=(s="")=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

const sceneDefs={
  backpack:{label:"リュック類",desc:"リュック・バッグ・持ち運び用品",filter:g=>/リュック|バッグ|バックパック/.test(g.name)||/玄関収納/.test(g.storage||"")},
  cookware:{label:"クッカー",desc:"鍋・フライパン・バーナーなど",filter:g=>g.category==="焚き火・火器"||/クッカー|鍋|フライパン|バーナー/.test(g.name)},
  lantern:{label:"ランタン",desc:"照明・電源まわり",filter:g=>g.category==="照明・電源"||/ランタン/.test(g.name)},
  tools:{label:"工具・ロープ",desc:"設営用のロープや工具",filter:g=>g.category==="工具・ロープ"||/ペグ|ロープ|ハンマー/.test(g.name)},
  clothes:{label:"衣類",desc:"上着や身につけるもの",filter:g=>g.category==="衣類"||/ジャケット|上着|ウェア/.test(g.name)},
  coolers:{label:"クーラー",desc:"保冷系の道具",filter:g=>g.category==="クーラー・保冷"||/クーラー/.test(g.name)},
  boxes:{label:"収納BOX",desc:"収納BOXに入っている道具",filter:g=>/収納BOX/.test(g.storage||"")},
  sleeping:{label:"寝具・テント",desc:"テント・寝具まわり",filter:g=>g.category==="寝具"||g.category==="テント・タープ"},
  tableware:{label:"食器",desc:"マグ・皿・カップなど",filter:g=>g.category==="調理・食器"||/マグ|カップ|皿|食器/.test(g.name)},
};

const ownedPeg={
  id:"owned-b08xldyzc5",
  name:"V字型チタンペグ 16cm",
  category:"工具・ロープ",
  brand:"TITAN MANIA",
  qty:6,qtyUnit:"本",weight:.012,status:"check",default:false,
  storage:"",purchased:"",
  url:"https://www.amazon.co.jp/dp/B08XLDYZC5",
  photoSrc:"assets/owned-gear/titanmania-v-pegs.jpg",
  note:"添付写真をもとに試し登録。穴ありのV字型・オレンジ色のロープ付き。\n商品仕様はTITAN MANIA公式の16cmタイプを参照：チタン製、約15×160mm、1本約12g、6本セット・収納袋付き。Amazonページとの照合は未確認。\n所持本数は写真の6本で仮登録。購入日・保管場所・現在の状態は未確認。",
  updated:Date.now()
};

const sample={
  theme:"light",
  trip:{name:"次回キャンプ",selected:["g1","g2","g4","g6","g8","g12"]},
  gear:[
    ownedPeg,
    {id:"g1",name:"LEDランタン",category:"照明・電源",brand:"Goal Zero",qty:2,weight:.35,status:"check",default:true,storage:"収納BOX A",purchased:"2025-08-22",url:"",note:"出発前に充電確認",updated:19},
    {id:"g2",name:"マグカップ",category:"調理・食器",brand:"Snow Peak",qty:2,weight:.18,status:"good",default:true,storage:"収納BOX A",purchased:"2025-02-10",url:"",note:"お気に入りのカップ",updated:18},
    {id:"g3",name:"クッカーセット",category:"調理・食器",brand:"UNIFLAME",qty:1,weight:1.1,status:"good",default:true,storage:"収納BOX C",purchased:"2024-11-02",url:"",note:"フライパン・鍋のセット",updated:17},
    {id:"g4",name:"テント 2ルーム",category:"テント・タープ",brand:"Coleman",qty:1,weight:16,status:"good",default:true,storage:"物置 / 大型棚",purchased:"2024-05-11",url:"",note:"インナー含む",updated:16},
    {id:"g5",name:"シュラフ",category:"寝具",brand:"mont-bell",qty:2,weight:1.2,status:"good",default:true,storage:"収納BOX B",purchased:"2024-10-01",url:"",note:"",updated:15},
    {id:"g6",name:"クーラーボックス",category:"クーラー・保冷",brand:"Coleman",qty:1,weight:4.6,status:"good",default:true,storage:"物置 / 下段",purchased:"2023-06-10",url:"",note:"保冷剤も確認",updated:14},
    {id:"g7",name:"ロープセット",category:"工具・ロープ",brand:"",qty:1,weight:.8,status:"good",default:true,storage:"収納BOX C",purchased:"",url:"",note:"自在金具入り",updated:13},
    {id:"g8",name:"キャンプリュック",category:"その他",brand:"",qty:1,weight:1.8,status:"good",default:false,storage:"玄関収納",purchased:"",url:"",note:"小物の運搬用",updated:12},
    {id:"g9",name:"ペグハンマー",category:"工具・ロープ",brand:"Snow Peak",qty:1,weight:.67,status:"good",default:true,storage:"ペグケース",purchased:"2025-03-13",url:"",note:"",updated:11},
    {id:"g10",name:"鍛造ペグ 30cm",category:"工具・ロープ",brand:"",qty:20,weight:.16,status:"check",default:true,storage:"ペグケース",purchased:"",url:"",note:"本数確認",updated:10},
    {id:"g11",name:"救急セット",category:"衛生・救急",brand:"",qty:1,weight:.45,status:"good",default:true,storage:"車載BOX",purchased:"",url:"",note:"",updated:9},
    {id:"g12",name:"ガスバーナー",category:"焚き火・火器",brand:"SOTO",qty:1,weight:.35,status:"good",default:true,storage:"調理BOX",purchased:"2024-07-09",url:"",note:"",updated:8},
    {id:"g13",name:"ポータブル電源",category:"照明・電源",brand:"EcoFlow",qty:1,weight:7.8,status:"repair",default:false,storage:"室内保管",purchased:"2024-01-16",url:"",note:"DC出力確認",updated:7},
    {id:"g14",name:"インフレーターマット",category:"寝具",brand:"WAQ",qty:2,weight:2.8,status:"good",default:true,storage:"収納BOX B",purchased:"2025-04-20",url:"",note:"",updated:6},
    {id:"g15",name:"ジャケット",category:"衣類",brand:"",qty:1,weight:.9,status:"good",default:false,storage:"衣類ラック",purchased:"",url:"",note:"寒い時用",updated:5}
  ]
};

function clone(v){return JSON.parse(JSON.stringify(v))}
function normalize(o){
  return {
    theme:o?.theme==="dark"?"dark":"light",
    trip:{name:o?.trip?.name||"次回キャンプ",selected:Array.isArray(o?.trip?.selected)?o.trip.selected:[]},
    gear:Array.isArray(o?.gear)?o.gear.map(g=>({...g,default:g.default??g.essential??false,url:g.url||""})):clone(sample.gear)
  };
}
function load(){
  try{
    const now=localStorage.getItem(KEY); if(now) return normalize(JSON.parse(now));
    const old=localStorage.getItem("campGearShelf_v6")||localStorage.getItem("campGearShelf_v5")||localStorage.getItem("campGearShelf_v4");
    if(old) return normalize(JSON.parse(old));
  }catch(e){}
  return clone(sample);
}
let state=load();
let tempPhoto=null,tempPhotoRemoved=false,draggedId=null,currentSceneKey=null;
let sceneRenderVersion=0,sceneTransitionVersion=0;
let shelfScrollTop=0;
let activeView="home",editorOrigin=null,editorHasBack=false,editorVersion=0,photoRequest=0;
let editorPhoto=null,editorLoading=false,photoBusy=false,savingGear=false;
let detailOrigin=null,detailHasBack=false,detailGearId=null,detailVersion=0;
const scenePhotos=new Map();
const sceneMotion=()=>!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sceneAssetsReady=Promise.all(["assets/unpack-ground.png","assets/unpack-gear-atlas.png"].map(src=>new Promise(resolve=>{
  const img=new Image();img.onload=img.onerror=resolve;img.src=src;
})));

const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
function importOwnedPeg(){
  try{
    if(localStorage.getItem(OWNED_PEG_IMPORT_KEY)==="1")return;
    if(!state.gear.some(g=>g.id===ownedPeg.id))state.gear.unshift(clone(ownedPeg));
    save();localStorage.setItem(OWNED_PEG_IMPORT_KEY,"1");
  }catch(e){}
}
const selectedGear=()=>state.gear.filter(g=>state.trip.selected.includes(g.id));
const weight=list=>list.reduce((s,g)=>s+(Number(g.weight)||0)*(Number(g.qty)||1),0);
const fmtWeight=v=>{v=Number(v)||0;return v?(v<.1?`${Number((v*1000).toFixed(1))} g`:`${v.toFixed(v<10?2:1).replace(/\.?0+$/,"")} kg`):"—";};
const makeId=()=>`g${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}`;
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),1600);}
function stat(label,value,unit){return `<div class="stat-card"><small>${label}</small><strong>${value}<span>${unit}</span></strong></div>`;}

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE);};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function photoPut(id,dataUrl){const db=await openDb();await new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(dataUrl,id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});db.close();}
async function photoGet(id){
  const bundledPhoto=state.gear.find(g=>g.id===id)?.photoSrc||null;
  try{
    const db=await openDb();
    const result=await new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,"readonly");const req=tx.objectStore(DB_STORE).get(id);req.onsuccess=()=>res(req.result||null);req.onerror=()=>rej(req.error);});
    db.close();return result||bundledPhoto;
  }catch(e){return bundledPhoto}
}
async function photoDelete(id){try{const db=await openDb();await new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});db.close();}catch(e){}}
async function compressImage(file){
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();
    await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url;});
    const max=1280; let w=img.naturalWidth,h=img.naturalHeight; const scale=Math.min(1,max/Math.max(w,h)); w=Math.round(w*scale); h=Math.round(h*scale);
    const c=document.createElement("canvas"); c.width=w; c.height=h; const ctx=c.getContext("2d",{alpha:false}); ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h);
    let data=c.toDataURL("image/webp",.74); if(!data.startsWith("data:image/webp")) data=c.toDataURL("image/jpeg",.76);
    return {data,width:w,height:h,size:Math.round(data.length*.75)};
  }finally{URL.revokeObjectURL(url)}
}
async function init(){
  importOwnedPeg();
  document.body.classList.toggle("dark",state.theme==="dark");
  $("#gearCategory").innerHTML=categories.map(c=>`<option>${esc(c)}</option>`).join("");
  $("#gearCategoryFilter").innerHTML='<option value="">すべてのカテゴリ</option>'+categories.map(c=>`<option>${esc(c)}</option>`).join("");
  bind();
  observeStorageCards();
  const route=readRoute();
  if(route.view==="maintenance")openGearEditor(route.id,{fromHistory:true,returnInfo:history.state?.returnInfo});
  else if(route.view==="detail")openGearDetails(route.id,{fromHistory:true,returnInfo:history.state?.returnInfo,hasBack:history.state?.hasBack});
  else switchView(route.view);
  await renderAll();
}
function bind(){
  $$(".nav").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  $$("[data-go]").forEach(b=>b.onclick=()=>switchView(b.dataset.go));
  $$("[data-addgear]").forEach(b=>b.onclick=()=>openGearEditor());
  $("#addGearQuickBtn").onclick=()=>{$("#toolsMenu").open=false;openGearEditor();};
  $("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";document.body.classList.toggle("dark",state.theme==="dark");save();};
  document.addEventListener("click",e=>{if(!$("#toolsMenu").contains(e.target))$("#toolsMenu").open=false;});
  $("#globalSearchForm").onsubmit=e=>{
    e.preventDefault();
    const q=$("#globalSearch").value.trim().toLowerCase();
    if(q){
      switchView("inventory");
      $("#gearSearch").value=$("#globalSearch").value;
      renderInventory();
    }
  };
  ["tripNameMenu","tripNameMain"].forEach(id=>$("#"+id).oninput=e=>{state.trip.name=e.target.value;save();syncTrip();});
  $("#gearSearch").oninput=renderInventory;
  $("#gearCategoryFilter").onchange=renderInventory;
  $("#gearStatusFilter").onchange=renderInventory;
  $("#addDefaultsBtn").onclick=()=>{state.gear.filter(g=>g.default).forEach(g=>{if(!state.trip.selected.includes(g.id))state.trip.selected.push(g.id)});save();renderAll();toast("定番装備を追加しました");};
  $("#clearLoadoutBtn").onclick=()=>{if(confirm("今回持っていく道具をすべて戻しますか？")){state.trip.selected=[];save();renderAll();}};
  $$('#storageScene [data-scene]').forEach(btn=>btn.onclick=()=>openScene(btn.dataset.scene));
  $("#backToShelfBtn").onclick=closeScene;
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&$("#toolsMenu").open){
      e.preventDefault();$("#toolsMenu").open=false;$("#toolsMenu summary").focus();return;
    }
    if(e.key==="Escape"&&currentSceneKey&&$("#homeView").classList.contains("active")){e.preventDefault();closeScene();}
  });
  $("#spreadGrid").addEventListener("click",e=>{
    const pick=e.target.closest("[data-scene-add]");
    if(pick)toggleTrip(pick.dataset.sceneAdd);
  });
  document.addEventListener("click",e=>{
    const detail=e.target.closest("a[data-gear-detail]");
    if(detail&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0){
      e.preventDefault();openGearDetails(detail.dataset.gearDetail);return;
    }
    const edit=e.target.closest("[data-gear-edit]");
    if(edit)openGearEditor(edit.dataset.gearEdit);
  });
  $("#detailBackBtn").onclick=leaveDetails;
  $("#detailMaintenanceBtn").onclick=()=>openGearEditor(detailGearId);
  $("#detailPackBtn").onclick=()=>{if(detailGearId)toggleTrip(detailGearId);};
  $("#gearForm").onsubmit=e=>{e.preventDefault();saveGearFromForm();};
  $("#maintenanceBackBtn").onclick=$("#cancelGearBtn").onclick=leaveMaintenance;
  $("#deleteGearBtn").onclick=deleteCurrentGear;
  $("#choosePhotoBtn").onclick=()=>$("#gearPhoto").click();
  $("#gearPhoto").onchange=onPhotoSelected;
  $("#removePhotoBtn").onclick=()=>{
    ++photoRequest;photoBusy=false;tempPhoto=null;tempPhotoRemoved=true;$("#gearPhoto").value="";
    renderPhotoPreview(null);updateEditorBusy();$("#photoInfo").textContent="記録すると写真を削除します";
  };
  $$('[name="gearStatus"]').forEach(input=>input.onchange=updateMaintenanceMeta);
  ["gearName","gearCategory"].forEach(id=>$("#"+id).oninput=()=>{if(!editorPhoto)renderPhotoPreview(null);updateMaintenanceMeta();});
  $("#gearBrand").oninput=updateMaintenanceMeta;
  window.addEventListener("popstate",e=>{
    const route=readRoute();
    if(route.view==="maintenance")openGearEditor(route.id,{fromHistory:true,returnInfo:e.state?.returnInfo});
    else if(route.view==="detail"){
      const origin=editorOrigin;
      openGearDetails(route.id,{fromHistory:true,returnInfo:e.state?.returnInfo,hasBack:e.state?.hasBack,scroll:origin?.view==="detail"?origin.scroll:0,fromMaintenance:origin?.view==="detail"});
    }
    else {
      const origin=editorOrigin||detailOrigin;
      discardEditor();discardDetail();
      restoreViewContext({...origin,...e.state,view:route.view});
    }
  });
  $("#exportBtn").onclick=exportJson;
  $("#importBtn").onclick=()=>$("#importInput").click();
  $("#importInput").onchange=importJson;
  $("#resetBtn").onclick=()=>{if(confirm("現在のデータを消してサンプルに戻しますか？")){state=clone(sample);save();if(activeView==="maintenance"||activeView==="detail")switchView("inventory");renderAll();toast("サンプルに戻しました");}};
  $$(".drop-zone").forEach(zone=>{
    zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("drag-over");});
    zone.addEventListener("dragleave",()=>zone.classList.remove("drag-over"));
    zone.addEventListener("drop",e=>{
      e.preventDefault();zone.classList.remove("drag-over");
      const id=e.dataTransfer.getData("text/plain")||draggedId;if(!id)return;
      if(zone.dataset.drop==="camp")moveToCamp(id);else moveToStorage(id);
      draggedId=null;
    });
  });
}
function readRoute(){
  let hash="";try{hash=decodeURIComponent(location.hash.slice(1));}catch(e){}
  if(hash.startsWith("maintenance/"))return {view:"maintenance",id:hash.slice(12)==="new"?undefined:hash.slice(12)};
  if(hash.startsWith("gear/"))return {view:"detail",id:hash.slice(5)};
  return {view:["home","inventory","loadout","care"].includes(hash)?hash:"home"};
}
function viewHash(context){return context.view==="detail"?`#gear/${encodeURIComponent(context.gearId)}`:`#${context.view}`;}
function currentViewContext(id){
  const context={view:activeView,scene:currentSceneKey,scroll:window.scrollY,focus:document.activeElement,gearId:id};
  if(activeView==="detail"){
    context.gearId=detailGearId;context.returnInfo=historyContext(detailOrigin);context.hasBack=detailHasBack;
  }
  return context;
}
function historyContext(context){const {focus,...info}=context||{view:"inventory"};return info;}
function backLabel(context){
  if(context.view==="home"&&context.scene)return "広げた道具に戻る";
  return {home:"収納棚に戻る",inventory:"道具一覧に戻る",loadout:"今回の荷物に戻る",care:"状態確認に戻る",detail:"道具の詳細に戻る"}[context.view]||"道具一覧に戻る";
}
function activateView(name){
  activeView=name;
  $$(".view").forEach(v=>v.classList.remove("active"));
  $("#"+name+"View")?.classList.add("active");
  $$(".nav").forEach(b=>{
    const active=b.dataset.view===name;b.classList.toggle("active",active);
    if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
  });
  $("#toolsMenu").open=false;
}
function discardEditor(){
  ++editorVersion;++photoRequest;editorOrigin=null;editorHasBack=false;
  editorPhoto=null;editorLoading=false;photoBusy=false;savingGear=false;tempPhoto=null;tempPhotoRemoved=false;
}
function discardDetail(){++detailVersion;detailGearId=null;detailOrigin=null;detailHasBack=false;}
function switchView(name){
  discardEditor();discardDetail();closeScene(false);activateView(name);
  history.replaceState({view:name},"",`#${name}`);
  window.scrollTo({top:0,behavior:"smooth"});
}
function restoreViewContext(origin={}){
  if(origin.view==="detail"){
    openGearDetails(origin.gearId,{fromHistory:true,returnInfo:origin.returnInfo,hasBack:origin.hasBack,scroll:origin.scroll,fromMaintenance:true});return;
  }
  const view=["home","inventory","loadout","care"].includes(origin.view)?origin.view:"inventory";
  closeScene(false);activateView(view);
  if(view==="home"&&sceneDefs[origin.scene]){
    currentSceneKey=origin.scene;$("#storageScene").hidden=true;$("#unpackScene").hidden=false;
    $$('#storageScene [data-scene]').forEach(b=>b.classList.toggle("active",b.dataset.scene===origin.scene));
    renderScene();
  }
  window.scrollTo({top:origin.scroll||0,behavior:"instant"});
  const id=origin.gearId&&CSS.escape(origin.gearId);
  const fallback=id?$(`#${view}View [data-gear-detail="${id}"]`):null;
  const focus=origin.focus?.isConnected&&origin.focus.closest(".view.active")?origin.focus:fallback||$("#"+view+"View h1")||$("#backToShelfBtn");
  if(focus){if(!focus.matches("button,input,a,select,textarea"))focus.tabIndex=-1;focus.focus({preventScroll:true});}
}
function leaveMaintenance(){
  if(savingGear)return;
  if(editorHasBack){history.back();return;}
  const origin=editorOrigin||{view:"inventory"};
  discardEditor();history.replaceState(historyContext(origin),"",viewHash(origin));restoreViewContext(origin);
}
function syncTrip(){
  const name=state.trip.name||"次回キャンプ";
  $("#tripNameMenu").value=name;$("#tripNameMain").value=name;
  const sel=selectedGear();
  $("#tripMiniMeta").textContent=`${sel.length}点 / ${weight(sel).toFixed(1)} kg`;
  $("#headerTripCount").textContent=sel.length;
  $(".trip-link").setAttribute("aria-label",`今回の荷物 ${sel.length}点を確認`);
  $("#unpackTripCount").textContent=sel.length;
}

async function renderAll(){
  state.trip.selected=state.trip.selected.filter(id=>state.gear.some(g=>g.id===id));
  syncTrip();
  if(activeView==="detail")await renderGearDetails();
  await renderHome();
  await renderInventory();
  await renderLoadout();
  renderCare();
}
async function renderHome(){
  $$('#storageScene [data-scene]').forEach(b=>{
    const def=sceneDefs[b.dataset.scene];
    const count=state.gear.filter(g=>def.filter(g)&&state.trip.selected.includes(g.id)).length;
    b.classList.toggle("has-packed",count>0);
    b.setAttribute("aria-label",`${def.label}を広げる${count?`（${count}点選択済み）`:""}`);
  });
  if(currentSceneKey)await renderScene();
}
function observeStorageCards(){
  const observer=new ResizeObserver(entries=>{
    entries.forEach(({target:frame})=>{
      const width=frame.clientWidth,height=frame.clientHeight;
      if(!width||!height)return;
      const fullWidth=width*4,fullHeight=fullWidth*992/1586;
      const crop=frame.querySelector(".storage-card-crop");
      crop.style.left=Math.min(0,Math.max(width-fullWidth,width/2-fullWidth*Number(frame.dataset.cropX)))+"px";
      crop.style.top=Math.min(0,Math.max(height-fullHeight,height/2-fullHeight*Number(frame.dataset.cropY)))+"px";
    });
  });
  $$(".storage-card-photo").forEach(frame=>observer.observe(frame));
}
function visibleSceneTrigger(sceneKey){
  return $$('#storageScene [data-scene]').find(b=>b.dataset.scene===sceneKey&&b.getClientRects().length);
}
async function openScene(sceneKey){
  const def=sceneDefs[sceneKey];
  if(!def||currentSceneKey)return;
  const transitionVersion=++sceneTransitionVersion;
  shelfScrollTop=window.scrollY;
  currentSceneKey=sceneKey;
  $$('#storageScene [data-scene]').forEach(b=>b.classList.toggle("active",b.dataset.scene===sceneKey));
  const shelf=$("#storageScene"),spread=$("#unpackScene");
  const origin=visibleSceneTrigger(sceneKey);
  const shelfRect=shelf.getBoundingClientRect(),originRect=origin?.getBoundingClientRect();
  const render=renderScene();
  await sceneAssetsReady;
  if(transitionVersion!==sceneTransitionVersion)return;
  if(sceneMotion()&&!shelf.hidden){
    const transformOrigin=originRect?`${originRect.left-shelfRect.left+originRect.width/2}px ${originRect.top-shelfRect.top+originRect.height/2}px`:"center";
    await shelf.animate([
      {opacity:1,transform:"scale(1)",transformOrigin},
      {opacity:0,transform:"scale(1.08)",filter:"blur(3px)",transformOrigin}
    ],{duration:230,easing:"ease-in"}).finished;
  }
  if(transitionVersion!==sceneTransitionVersion)return;
  shelf.hidden=true;spread.hidden=false;
  window.scrollTo({top:0,behavior:"instant"});
  $("#backToShelfBtn").focus({preventScroll:true});
  if(sceneMotion()){
    spread.animate([{opacity:0,transform:"scale(.98)"},{opacity:1,transform:"scale(1)"}],{duration:400,easing:"ease-out"});
    $$(".spread-item").forEach((item,i)=>item.animate([
      {opacity:0,transform:"translate(-35px,-45px) scale(.8) rotate(-7deg)"},
      {opacity:1,transform:"translate(0,0) scale(1) rotate(0deg)"}
    ],{duration:550,delay:Math.min(i,8)*55,fill:"backwards",easing:"cubic-bezier(.2,.7,.2,1)"}));
  }
  await render;
}
function closeScene(restoreFocus=true){
  const previous=currentSceneKey;
  ++sceneTransitionVersion;++sceneRenderVersion;
  currentSceneKey=null;
  $("#unpackScene").hidden=true;$("#storageScene").hidden=false;
  $$('#storageScene [data-scene]').forEach(b=>b.classList.remove("active"));
  if(restoreFocus&&previous){
    window.scrollTo({top:shelfScrollTop,behavior:"instant"});
    visibleSceneTrigger(previous)?.focus({preventScroll:true});
    if(sceneMotion())$("#storageScene").animate([{opacity:0,transform:"scale(1.025)"},{opacity:1,transform:"scale(1)"}],{duration:320,easing:"ease-out"});
  }
}
async function renderScene(){
  const version=++sceneRenderVersion,def=sceneDefs[currentSceneKey];
  if(!def)return;
  const items=state.gear.filter(def.filter).sort((a,b)=>(b.updated||0)-(a.updated||0));
  const grid=$("#spreadGrid");
  $("#unpackTitle").textContent=def.label;
  $("#unpackDescription").textContent=def.desc;
  $("#unpackMeta").textContent=`${items.length}点を広げています / ${items.filter(g=>state.trip.selected.includes(g.id)).length}点選択済み`;
  $("#spreadEmpty").hidden=items.length>0;
  grid.hidden=items.length===0;
  const focusedId=document.activeElement?.dataset.sceneAdd||document.activeElement?.dataset.gearDetail||document.activeElement?.dataset.gearEdit;
  const focusedAction=document.activeElement?.hasAttribute("data-gear-detail")?"data-gear-detail":document.activeElement?.hasAttribute("data-gear-edit")?"data-gear-edit":"data-scene-add";
  grid.dataset.count=items.length;
  grid.innerHTML=items.map((item,index)=>sceneItemHtml(item,index)).join("");
  if(focusedId)grid.querySelector(`[${focusedAction}="${CSS.escape(focusedId)}"]`)?.focus({preventScroll:true});
  await Promise.all(items.map(async item=>{
    const photo=await photoGet(item.id);
    if(version!==sceneRenderVersion)return;
    if(photo)scenePhotos.set(item.id,photo);else scenePhotos.delete(item.id);
    const art=grid.querySelector(`[data-gear-detail="${CSS.escape(item.id)}"] .spread-art`);
    if(art){
      if(photo){
        art.className="spread-art personal-photo";art.style.cssText="";
        const img=document.createElement("img");img.src=photo;img.alt="";art.replaceChildren(img);
      }else{
        const sprite=sceneSprite(item);
        art.className="spread-art gear-sprite";art.replaceChildren();
        art.style.backgroundPosition=`${sprite%4*100/3}% ${Math.floor(sprite/4)*100/3}%`;
      }
    }
  }));
}
function sceneSprite(item){
  const name=item.name;
  const rules=[[/ランタン|ライト/,0],[/マグ|カップ|食器|皿/,1],[/クッカー|鍋|フライパン/,2],[/テント|タープ/,3],[/シュラフ|寝袋/,4],[/クーラー|保冷/,5],[/ロープ/,6],[/リュック|バッグ|バックパック/,7],[/ハンマー/,8],[/ペグ/,9],[/救急/,10],[/バーナー|コンロ/,11],[/電源|バッテリー/,12],[/マット/,13],[/ジャケット|上着|ウェア/,14]];
  const match=rules.find(([pattern])=>pattern.test(name));
  if(match)return match[1];
  return {"テント・タープ":3,"寝具":4,"焚き火・火器":11,"調理・食器":2,"照明・電源":0,"クーラー・保冷":5,"衣類":14,"衛生・救急":10,"工具・ロープ":6}[item.category]??15;
}
function sceneItemHtml(item,index){
  const chosen=state.trip.selected.includes(item.id);
  const sprite=sceneSprite(item),photo=scenePhotos.get(item.id),tilt=[-5,4,-2,6,-4,3][index%6];
  const art=photo?`<span class="spread-art personal-photo"><img src="${esc(photo)}" alt=""></span>`:`<span class="spread-art gear-sprite" style="background-position:${sprite%4*100/3}% ${Math.floor(sprite/4)*100/3}%" aria-hidden="true"></span>`;
  return `<article class="spread-item ${chosen?"is-packed":""}" style="--gear-tilt:${tilt}deg">
    <a class="spread-pick" href="#gear/${encodeURIComponent(item.id)}" data-gear-detail="${esc(item.id)}" aria-label="${esc(item.name)}の詳細">
      <span class="spread-object">${art}<span class="packed-stamp" aria-hidden="true">✓ PACKED</span></span>
      <span class="gear-tag"><strong>${esc(item.name)}</strong><span>${esc(item.qty||1)}${esc(item.qtyUnit||"個")} · ${fmtWeight((Number(item.weight)||0)*(Number(item.qty)||1))}</span><b>詳細を見る ↗</b></span>
    </a>
    <div class="spread-detail">
      <span class="spread-condition ${esc(item.status)}">${esc(statusText[item.status]||"状態未設定")}</span>
      <button type="button" data-scene-add="${esc(item.id)}" aria-pressed="${chosen}" aria-label="${esc(item.name)}を${chosen?"今回の荷物から戻す":"今回持っていく"}">${chosen?"✓ 荷物から戻す":"＋ 今回持っていく"}</button>
      <button type="button" data-gear-edit="${esc(item.id)}" aria-label="${esc(item.name)}の手入れ">手入れする ↗</button>
    </div>
  </article>`;
}
function toggleTrip(id){
  if(state.trip.selected.includes(id)){state.trip.selected=state.trip.selected.filter(x=>x!==id);toast("選択を解除しました");}
  else {state.trip.selected.push(id);toast("今回持っていくに追加しました");}
  save();renderAll();
}

function filteredGear(){
  const q=$("#gearSearch").value.trim().toLowerCase(),cat=$("#gearCategoryFilter").value,st=$("#gearStatusFilter").value;
  return [...state.gear].filter(g=>{
    const hay=[g.name,g.brand,g.storage,g.note].join(" ").toLowerCase();
    return (!q||hay.includes(q))&&(!cat||g.category===cat)&&(!st||g.status===st);
  }).sort((a,b)=>(b.updated||0)-(a.updated||0));
}
async function renderInventory(){
  const list=filteredGear();
  $("#inventoryMeta").textContent=`${list.length}点 / 約 ${weight(list).toFixed(1)} kg / ${new Set(list.map(g=>g.category)).size}カテゴリ`;
  $("#inventoryEmpty").classList.toggle("hidden",list.length!==0);
  await renderGearCards($("#gearGrid"),list);
}
async function renderGearCards(root,list){
  root.innerHTML=list.map((g,index)=>gearCardHtml(g,index)).join("");
  for(const g of list){
    const img=await photoGet(g.id);
    const wrap=root.querySelector(`[data-id="${CSS.escape(g.id)}"] .gear-photo`);
    if(img&&wrap){
      const art=wrap.querySelector(".inventory-art");
      art.className="inventory-art inventory-personal-photo";art.style.cssText="";
      art.innerHTML=`<img src="${esc(img)}" alt="${esc(g.name)}の写真">`;
    }
  }
}
function gearCardHtml(g,index){
  const sprite=sceneSprite(g),tilt=[-4,3,-2,4,-3,2][index%6],tagTilt=[-.7,.6,-.4,.8,-.6,.4][index%6];
  const chosen=state.trip.selected.includes(g.id);
  const url=g.url?`<a class="buy-link" href="${esc(g.url)}" target="_blank" rel="noopener">購入サイト ↗</a>`:"";
  return `<article class="gear-card" data-id="${esc(g.id)}" style="--gear-tilt:${tilt}deg;--tag-tilt:${tagTilt}deg">
    <div class="gear-photo">
      <span class="inventory-art gear-sprite" style="background-position:${sprite%4*100/3}% ${Math.floor(sprite/4)*100/3}%" aria-hidden="true"></span>
      ${chosen?'<span class="inventory-packed">✓ 今回の荷物</span>':""}
    </div>
    <div class="gear-body">
      <div class="gear-top"><span class="inventory-category">${esc(g.category)}</span><span class="inventory-number" aria-hidden="true">${String(index+1).padStart(2,"0")}</span></div>
      <h3><a class="gear-detail-link" href="#gear/${encodeURIComponent(g.id)}" data-gear-detail="${esc(g.id)}" aria-label="${esc(g.name)}の詳細">${esc(g.name)}</a></h3>
      ${g.brand?`<p class="brand-text">${esc(g.brand)}</p>`:""}
      <div class="inventory-location"><span>しまう場所</span><b>${esc(g.storage||"保管場所未設定")}</b></div>
      <div class="gear-meta">
        <span class="inventory-measure">${esc(g.qty||1)}${esc(g.qtyUnit||"個")} / ${fmtWeight((Number(g.weight)||0)*(Number(g.qty)||1))}</span>
        <span class="inventory-condition ${esc(g.status)}">${esc(statusText[g.status]||"状態未設定")}</span>
      </div>
      <div class="gear-actions"><span class="inventory-open" aria-hidden="true">詳細を見る ↗</span><button class="edit-btn" type="button" data-gear-edit="${esc(g.id)}" aria-label="${esc(g.name)}の手入れ">手入れする ↗</button></div>
      ${url}
    </div>
  </article>`;
}

async function renderLoadout(){
  const selected=selectedGear(),storage=state.gear.filter(g=>!state.trip.selected.includes(g.id));
  $("#loadoutStats").innerHTML=
    stat("収納側",storage.length,"点")+
    stat("持っていく",selected.length,"点")+
    stat("総重量",weight(selected).toFixed(1),"kg")+
    stat("カテゴリ",new Set(selected.map(g=>g.category)).size,"種");
  await renderMoveCards($("#storageGearList"),storage,false);
  await renderMoveCards($("#campGearList"),selected,true);
}
async function renderMoveCards(root,list,inCamp){
  if(!list.length){
    root.innerHTML=`<div class="empty-zone"><span>${inCamp?"🏕️":"🧰"}</span><b>${inCamp?"まだ選んでいません":"こちらにはありません"}</b><small>${inCamp?"トップページか左側から道具を追加してください":"右側へ移動できます"}</small></div>`;
    return;
  }
  root.innerHTML=list.map(g=>`<article class="move-card" draggable="true" data-move-id="${esc(g.id)}">
    <div class="move-photo" data-photo-for="${esc(g.id)}"><span>${emoji[g.category]||"🎒"}</span></div>
    <div class="move-body"><strong><a class="gear-detail-link" href="#gear/${encodeURIComponent(g.id)}" data-gear-detail="${esc(g.id)}" draggable="false" aria-label="${esc(g.name)}の詳細">${esc(g.name)}</a></strong><small>${esc(g.category)} / ${fmtWeight((Number(g.weight)||0)*(Number(g.qty)||1))}</small>
      <div class="move-actions"><button class="main-move">${inCamp?"戻す":"持っていく"}</button><button class="move-edit" data-gear-edit="${esc(g.id)}" aria-label="${esc(g.name)}の手入れ">手入れ</button></div>
    </div>
  </article>`).join("");
  for(const g of list){
    const img=await photoGet(g.id);
    const wrap=root.querySelector(`[data-photo-for="${CSS.escape(g.id)}"]`);
    if(img&&wrap)wrap.innerHTML=`<img src="${img}" alt="${esc(g.name)}">`;
  }
  root.querySelectorAll(".move-card").forEach(card=>{
    card.addEventListener("dragstart",e=>{draggedId=card.dataset.moveId;card.classList.add("dragging");e.dataTransfer.setData("text/plain",draggedId);});
    card.addEventListener("dragend",()=>{card.classList.remove("dragging");$$(".drop-zone").forEach(z=>z.classList.remove("drag-over"));draggedId=null;});
    card.querySelector(".main-move").onclick=()=>inCamp?moveToStorage(card.dataset.moveId):moveToCamp(card.dataset.moveId);
  });
}
function moveToCamp(id){if(!state.trip.selected.includes(id))state.trip.selected.push(id);save();renderAll();toast("今回持っていくに追加しました");}
function moveToStorage(id){state.trip.selected=state.trip.selected.filter(x=>x!==id);save();renderAll();toast("収納側に戻しました");}

function renderCare(){
  const good=state.gear.filter(g=>g.status==="good"),check=state.gear.filter(g=>g.status==="check"),repair=state.gear.filter(g=>g.status==="repair");
  $("#careStats").innerHTML=stat("使用OK",good.length,"点")+stat("要確認",check.length,"点")+stat("修理・交換",repair.length,"点")+stat("合計",state.gear.length,"点");
  const list=[...repair,...check];
  $("#careList").innerHTML=list.length?list.map(g=>`<div class="care-row"><span>${g.status==="repair"?"🛠️":"👀"}</span><div><h3><a class="gear-detail-link" href="#gear/${encodeURIComponent(g.id)}" data-gear-detail="${esc(g.id)}" aria-label="${esc(g.name)}の詳細">${esc(g.name)}</a></h3><p>${esc(g.note||g.storage||"メモなし")}</p></div><button class="small-btn care-edit" data-id="${esc(g.id)}" data-gear-edit="${esc(g.id)}" aria-label="${esc(g.name)}の手入れ">手入れ</button></div>`).join(""):`<div class="empty"><span>🌿</span><b>状態確認が必要な道具はありません</b></div>`;
}

async function openGearDetails(id,options={}){
  const g=state.gear.find(x=>x.id===id);
  const origin=options.fromHistory?(options.returnInfo||{view:"inventory",scroll:0,gearId:id}):activeView==="detail"?detailOrigin:currentViewContext(id);
  if(!g){
    discardEditor();discardDetail();
    history.replaceState(historyContext(origin),"",viewHash(origin));restoreViewContext(origin);
    toast("この道具は見つかりませんでした");return;
  }
  if(!options.fromHistory&&activeView!=="detail"){
    history.replaceState(historyContext(origin),"",viewHash(origin));
    history.pushState({view:"detail",gearId:id,returnInfo:historyContext(origin),hasBack:true},"",`#gear/${encodeURIComponent(id)}`);
    detailHasBack=true;
  }else if(options.fromHistory)detailHasBack=options.hasBack??!!options.returnInfo;
  discardEditor();detailOrigin=origin;detailGearId=id;
  history.replaceState({view:"detail",gearId:id,returnInfo:historyContext(origin),hasBack:detailHasBack},"",`#gear/${encodeURIComponent(id)}`);
  $("#detailBackBtn").textContent="← "+backLabel(origin);
  activateView("detail");
  const rendering=renderGearDetails();
  window.scrollTo({top:options.scroll||0,behavior:"instant"});
  $(options.fromMaintenance?"#detailMaintenanceBtn":"#detailTitle").focus({preventScroll:true});
  await rendering;
}
function leaveDetails(){
  if(detailHasBack){history.back();return;}
  const origin=detailOrigin||{view:"inventory"};
  discardDetail();history.replaceState(historyContext(origin),"",viewHash(origin));restoreViewContext(origin);
}
async function renderGearDetails(){
  const g=state.gear.find(x=>x.id===detailGearId);if(!g)return;
  const version=++detailVersion,chosen=state.trip.selected.includes(g.id);
  $("#detailTitle").textContent=g.name;
  $("#detailCategory").textContent=g.category||"";
  $("#detailName").textContent=g.name;
  $("#detailBrand").textContent=g.brand||"いつもの道具";
  $("#detailStatus").className="maintenance-stamp "+g.status;
  $("#detailStatus").textContent=statusText[g.status]||"状態未設定";
  $("#detailPacked").textContent=chosen?"✓ 今回の荷物に入っています":"収納棚で待機中";
  $("#detailNote").textContent=g.note||"まだ手入れのメモはありません。";
  $("#detailStorage").textContent=g.storage||"保管場所はまだ決まっていません";
  $("#detailPackBtn").textContent=chosen?"今回の荷物から戻す":"今回持っていく";
  $("#detailPackBtn").setAttribute("aria-pressed",String(chosen));
  const specs=[
    ["数量",`${g.qty||1}${g.qtyUnit||"個"}`],[`重量 / 1${g.qtyUnit||"個"}`,fmtWeight(g.weight)],
    ["合計重量",fmtWeight((Number(g.weight)||0)*(Number(g.qty)||1))],
    ["購入日",g.purchased?String(g.purchased).replaceAll("-","/"):"未記録"],
    ["メーカー",g.brand||"未記録"],["いつもの装備",g.default?"いつも持っていく道具":"キャンプに合わせて選ぶ道具"]
  ];
  $("#detailSpecs").innerHTML=specs.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
  const purchase=$("#detailPurchaseLink");purchase.hidden=true;purchase.removeAttribute("href");
  try{const url=new URL(g.url);if(url.protocol==="http:"||url.protocol==="https:"){purchase.href=url.href;purchase.hidden=false;}}catch(e){}
  renderDetailPhoto(g,scenePhotos.get(g.id));
  const photo=await photoGet(g.id);
  if(version===detailVersion&&detailGearId===g.id)renderDetailPhoto(g,photo);
}
function renderDetailPhoto(g,photo){
  const root=$("#detailPhoto");root.replaceChildren();
  if(photo){const img=new Image();img.src=photo;img.alt=g.name+"の写真";root.append(img);}
  else{
    const sprite=sceneSprite(g),art=document.createElement("div");art.className="maintenance-sprite gear-sprite";
    art.style.backgroundPosition=`${sprite%4*100/3}% ${Math.floor(sprite/4)*100/3}%`;
    art.setAttribute("role","img");art.setAttribute("aria-label",g.name+"のイメージ");root.append(art);
  }
}

async function openGearEditor(id,options={}){
  const g=state.gear.find(x=>x.id===id);
  if(id&&!g){switchView("inventory");toast("この道具は見つかりませんでした");return;}
  if(!editorOrigin){
    editorOrigin=options.returnInfo||currentViewContext(id);
    if(options.fromHistory&&!options.returnInfo)editorOrigin={view:"inventory",scroll:0,gearId:id};
  }
  const {focus,...returnInfo}=editorOrigin;
  if(!options.fromHistory){
    if(activeView!=="maintenance"){
      history.replaceState(returnInfo,"",viewHash(returnInfo));
      history.pushState({view:"maintenance",returnInfo},"",`#maintenance/${encodeURIComponent(id||"new")}`);
      editorHasBack=true;
    }else history.replaceState({view:"maintenance",returnInfo},"",`#maintenance/${encodeURIComponent(id||"new")}`);
  }else editorHasBack=!!options.returnInfo;
  const version=++editorVersion;++photoRequest;
  editorLoading=!!g;photoBusy=false;savingGear=false;editorPhoto=null;
  tempPhoto=null;tempPhotoRemoved=false;
  $("#maintenanceTitle").textContent=g?"道具の手入れ":"道具を迎える";
  $("#maintenanceDescription").textContent=g?"状態を確かめて、気づいたことを残しておきましょう。":"写真と名前を添えて、いつもの道具に加えましょう。";
  $("#maintenanceBackBtn").textContent="← "+backLabel(returnInfo);
  $("#saveGearBtn").textContent=g?"記録して戻る":"棚に追加する";
  $("#gearId").value=g?.id||"";
  $("#gearName").value=g?.name||"";
  $("#gearCategory").value=g?.category||categories[0];
  $$('[name="gearStatus"]').forEach(input=>input.checked=input.value===(g?.status||"good"));
  $("#gearBrand").value=g?.brand||"";
  $("#gearQty").value=g?.qty||1;
  $("#gearWeight").value=g?.weight??"";
  $("#gearPurchased").value=g?.purchased||"";
  $("#gearStorage").value=g?.storage||"";
  $("#gearUrl").value=g?.url||"";
  $("#gearDefault").checked=!!g?.default;
  $("#gearNote").value=g?.note||"";
  $("#gearRemoveOptions").hidden=!g;$("#gearRemoveOptions").open=false;
  $("#gearSpecs").open=!g;
  $("#photoInfo").textContent="";
  $("#gearPhoto").value="";
  renderPhotoPreview(null);updateMaintenanceMeta();updateEditorBusy();activateView("maintenance");
  window.scrollTo({top:0,behavior:"instant"});$("#maintenanceTitle").focus({preventScroll:true});
  const existing=g?await photoGet(g.id):null;
  if(version!==editorVersion)return;
  editorLoading=false;renderPhotoPreview(existing);updateEditorBusy();
}
function updateMaintenanceMeta(){
  const status=$('[name="gearStatus"]:checked')?.value||"good";
  $("#maintenanceStamp").className="maintenance-stamp "+status;
  $("#maintenanceStamp").textContent={good:"次のキャンプへ",check:"出発前に点検",repair:"手入れ中"}[status];
  $("#maintenanceGearMeta").textContent=[$("#gearBrand").value.trim(),$("#gearCategory").value].filter(Boolean).join(" / ");
}
function updateEditorBusy(){
  $("#saveGearBtn").disabled=editorLoading||photoBusy||savingGear;
  $("#choosePhotoBtn").disabled=editorLoading||savingGear;
  $("#removePhotoBtn").disabled=editorLoading||savingGear||(!editorPhoto&&!photoBusy);
  ["maintenanceBackBtn","cancelGearBtn","deleteGearBtn"].forEach(id=>$("#"+id).disabled=savingGear);
}
function renderPhotoPreview(dataUrl){
  editorPhoto=dataUrl;
  const preview=$("#photoPreview");preview.replaceChildren();
  if(dataUrl){const img=new Image();img.src=dataUrl;img.alt=($("#gearName").value||"道具")+"の写真";preview.append(img);}
  else if($("#gearId").value){
    const sprite=sceneSprite({name:$("#gearName").value,category:$("#gearCategory").value});
    const art=document.createElement("div");art.className="maintenance-sprite gear-sprite";
    art.style.backgroundPosition=`${sprite%4*100/3}% ${Math.floor(sprite/4)*100/3}%`;
    art.setAttribute("role","img");art.setAttribute("aria-label","道具のイメージ");preview.append(art);
  }else preview.innerHTML='<div class="photo-placeholder"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h4l2-3h4l2 3h4v14H4V6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="12.5" r="4" stroke="currentColor" stroke-width="1.3"/></svg><b>道具の写真</b><small>お気に入りの一枚を添える</small></div>';
}
async function onPhotoSelected(e){
  const file=e.target.files?.[0];e.target.value="";if(!file)return;
  if(!file.type.startsWith("image/"))return alert("画像ファイルを選択してください。");
  const version=editorVersion,request=++photoRequest;photoBusy=true;updateEditorBusy();
  try{
    $("#photoInfo").textContent="写真を読み込んでいます…";
    const result=await compressImage(file);
    if(version!==editorVersion||request!==photoRequest)return;
    tempPhoto=result.data;tempPhotoRemoved=false;
    renderPhotoPreview(result.data);
    $("#photoInfo").textContent="記録すると写真を更新します";
  }catch(err){if(version===editorVersion&&request===photoRequest){$("#photoInfo").textContent="写真を読み込めませんでした。別の写真を選んでください。";}}
  finally{if(version===editorVersion&&request===photoRequest){photoBusy=false;updateEditorBusy();}}
}
async function saveGearFromForm(){
  if(editorLoading||photoBusy||savingGear)return;
  const id=$("#gearId").value||makeId();
  const item={
    ...state.gear.find(g=>g.id===id),
    id,
    name:$("#gearName").value.trim(),
    category:$("#gearCategory").value,
    status:$('[name="gearStatus"]:checked')?.value||"good",
    brand:$("#gearBrand").value.trim(),
    qty:Math.max(1,Number($("#gearQty").value)||1),
    weight:Math.max(0,Number($("#gearWeight").value)||0),
    purchased:$("#gearPurchased").value,
    storage:$("#gearStorage").value.trim(),
    url:$("#gearUrl").value.trim(),
    default:$("#gearDefault").checked,
    note:$("#gearNote").value.trim(),
    updated:Date.now()
  };
  if(!item.name)return toast("道具名を入力してください");
  savingGear=true;updateEditorBusy();
  const version=editorVersion,previous=clone(state);
  const idx=state.gear.findIndex(g=>g.id===id);
  try{
    if(tempPhoto)await photoPut(id,tempPhoto);else if(tempPhotoRemoved)await photoDelete(id);
    if(tempPhoto||tempPhotoRemoved)delete item.photoSrc;
    if(idx>=0)state.gear[idx]=item;else state.gear.unshift(item);
    save();await renderAll();
    if(version===editorVersion){savingGear=false;leaveMaintenance();}
    toast(idx>=0?"手入れの記録を保存しました":"道具を棚に追加しました");
  }catch(err){
    state=previous;
    if(version===editorVersion){savingGear=false;updateEditorBusy();toast("記録を保存できませんでした。もう一度お試しください");}
  }
}
async function deleteCurrentGear(){
  if(savingGear)return;
  const id=$("#gearId").value,g=state.gear.find(x=>x.id===id);if(!g)return;
  if(!confirm(`「${g.name}」を削除しますか？`))return;
  savingGear=true;updateEditorBusy();
  const version=editorVersion,previous=clone(state);
  try{
    state.gear=state.gear.filter(x=>x.id!==id);state.trip.selected=state.trip.selected.filter(x=>x!==id);save();
    await photoDelete(id);await renderAll();
    if(version===editorVersion){savingGear=false;leaveMaintenance();}
    toast("道具を棚から外しました");
  }catch(err){state=previous;if(version===editorVersion){savingGear=false;updateEditorBusy();toast("削除できませんでした。もう一度お試しください");}}
}

function exportJson(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`camp-gear-${new Date().toISOString().slice(0,10)}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("JSONを書き出しました");
}
async function importJson(e){
  const f=e.target.files?.[0];e.target.value="";if(!f)return;
  try{
    const parsed=JSON.parse(await f.text());if(!Array.isArray(parsed.gear))throw new Error();
    if(!confirm("現在の道具データを、読み込んだJSONで置き換えますか？"))return;
    state=normalize(parsed);save();if(activeView==="maintenance"||activeView==="detail")switchView("inventory");renderAll();toast("JSONを読み込みました");
  }catch(err){alert("JSONを読み込めませんでした。");}
}

init();
})();
