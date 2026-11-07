'use strict';
/* CCMS concept demo: synthetic fixtures only. No network, credentials or persistent storage. */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusNames = {draft:'待確認',pending:'待承接',working:'執行中',review:'待驗收',closed:'已結案'};
const statusColors = {draft:'amber-pill',pending:'gray-pill',working:'blue-pill',review:'amber-pill',closed:'teal-pill'};
const sourceMessage = '示範 A 區 3F 牆面發現滲水，請安排防水班檢查並改善，完成後提供改善紀錄。';
const steps = ['整理草稿','確認與指派','承接執行','回報待驗收','人工驗收'];
const stepInfo = [
 ['從一則回報開始','用預設虛構訊息，模擬 AI 整理出待確認草稿。重要內容仍由人決定。','這是預設規則模擬，沒有呼叫 AI 或連接 LINE。請勿輸入真實個資。'],
 ['把模糊訊息，變成清楚工作','確認工作內容、區位、負責人與期限，再建立一張可追蹤的工作卡。','示範欄位是預設值，不是從文字自動判斷。AI 不確定的內容，正式流程應交由人確認。'],
 ['責任，從承接開始','模擬防水班承接工作。手機和管理端會同步顯示「執行中」。','切換角色只為講解流程，不代表已實作身分驗證或資料權限。'],
 ['完成回報，還不是結案','附上示意證據並送交驗收，明確保留「等待驗收」這個交接點。','此頁不會開啟相簿或上傳檔案。圖形附件是預置的虛構示範證據。'],
 ['由人驗收，才能走到終點','檢視執行紀錄後，模擬驗收通過或退回補正。每個決定都有歷程。','示範的驗收不具正式效力。實際使用須有身分權限、證據查核與稽核保護。'],
 ['一件工作，完成協作閉環','從訊息來源到驗收結果，完整保留每一步的責任與決定。','這只是概念流程完成，不代表正式功能已完成、測試通過或上線。']
];
const fixtures = [
 {id:'DEMO-002',title:'樓梯扶手固定檢查',area:'示範 B 區 2F',team:'示範金屬班',status:'working',source:'現場巡檢（虛構）'},
 {id:'DEMO-003',title:'排水坡度複查',area:'示範 A 區 RF',team:'示範泥作班',status:'review',source:'工作回報（虛構）'},
 {id:'DEMO-004',title:'走道照明測試',area:'示範 B 區 1F',team:'示範機電班',status:'closed',source:'工作回報（虛構）'},
 {id:'DEMO-005',title:'施工動線整理',area:'示範 C 區 1F',team:'示範環境班',status:'pending',source:'現場巡檢（虛構）'}
];
let state, toastTimer;
function initialState(){return {step:0,task:null,audit:[],evidence:false,returned:false,reports:[]};}
function pill(status){return `<span class="pill ${statusColors[status]}">${statusNames[status]}</span>`;}
function log(role,action){state.audit.push({role,action,time:new Date().toLocaleTimeString('zh-TW',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})});}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function setTab(tab,scroll=false){document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});['field','admin','roadmap'].forEach(t=>{$(`#panel-${t}`).hidden=t!==tab;});if(scroll)$('#workspace').scrollIntoView({behavior:'smooth',block:'start'});}
function details(t){return `<dl class="detail-list"><div><dt>區位</dt><dd>${esc(t.area)}</dd></div><div><dt>負責單位</dt><dd>${esc(t.team)}</dd></div><div><dt>預定完成</dt><dd>${esc(t.due)}</dd></div><div><dt>來源</dt><dd>現場回報（虛構）</dd></div></dl>`;}
function taskCard(){const t=state.task;return `<div class="info-box"><div class="card-top"><span class="mono">${t.id}</span>${pill(t.status)}</div><h4>${esc(t.title)}</h4>${details(t)}</div>`;}
function evidenceMarkup(){return `<div class="evidence"><svg viewBox="0 0 100 75" role="img" aria-label="牆面改善示意圖，非真實照片"><rect width="100" height="75" fill="#d7e2ce"/><path d="M0 57L100 42V75H0Z" fill="#b4c2ad"/><path d="M12 12H70V54H12Z" fill="#ecede0"/><path d="M12 12L70 12L83 24L83 62L70 54V12" fill="#c5d1b8"/><path d="M25 26H56M25 34H56M25 42H46" stroke="#90aa8b" stroke-width="3"/><circle cx="77" cy="52" r="12" fill="#277258"/><path d="M71 52L75 56L83 47" fill="none" stroke="white" stroke-width="3"/></svg><span><strong>改善紀錄示意圖</strong><small>預設圖形 · 非真實照片</small></span></div>`;}
function renderPhone(){const s=state.step;const t=state.task;let html='';
 if(s===0) html=`<div class="phone-kicker"><span>現場人員 · 示範角色</span><span>STEP 01</span></div><h4>有件事，需要追蹤。</h4><p>使用預設回報，開始一張新工作卡。</p><div class="source-bubble">${sourceMessage}<small>示範現場人員 · 預設訊息</small></div><div class="callout">請勿輸入真實個資。本展示使用固定虛構回報，不會傳送至外部。</div><button class="button primary" data-action="draft">模擬整理為工作草稿 ↗</button><p class="tiny">示範為固定範例，不使用真正的 AI 判讀。</p>`;
 if(s===1) html=`<div class="phone-kicker"><span>管理人員 · 示範角色</span><span>STEP 02</span></div><h4>先確認，再建立。</h4><p>以下為預設建議值，可自行調整示範內容。</p><form id="confirm-form" class="phone-form"><label>工作內容<input name="title" value="牆面滲水檢查與改善" maxlength="60" required></label><label>區位<input name="area" value="示範 A 區 3F" maxlength="40" required></label><div class="two-fields"><label>負責單位<select name="team"><option>示範防水班</option><option>示範泥作班</option><option>示範機電班</option></select></label><label>預定完成<select name="due"><option>示範日 +2 天</option><option>示範日 +3 天</option><option>示範日 +7 天</option></select></label></div><label class="check-label"><input type="checkbox" name="confirmed" required><span>我已確認內容、責任與期限（僅示範）。</span></label><p class="error" id="form-error" role="alert"></p><button type="submit" class="button primary">確認建立工作卡 →</button></form><details><summary class="tiny">查看來源回報</summary><p class="source-trace">${sourceMessage}</p></details>`;
 if(s===2) html=`<div class="phone-kicker"><span>承包班組 · 示範角色</span><span>STEP 03</span></div><h4>接下來，換我處理。</h4><div class="role-banner">目前模擬角色：${esc(t.team)}</div>${taskCard()}<p>確認工作範圍後承接，讓管理端看見責任已接手。</p><button class="button primary" data-action="accept">承接工作，開始執行 →</button><details><summary class="tiny">查看來源回報</summary><p class="source-trace">${sourceMessage}</p></details>`;
 if(s===3) html=`<div class="phone-kicker"><span>承包班組 · 示範角色</span><span>STEP 04</span></div><h4>${state.returned?'補正後，再次回報。':'完成施工，回報成果。'}</h4>${state.returned?'<div class="callout">驗收退回：請補充改善範圍與確認紀錄。（預設示範理由）</div>':''}${taskCard()}<form id="report-form" class="phone-form"><label>執行說明<textarea name="report" maxlength="300" required>${state.returned?'已補充改善範圍與檢查紀錄，請重新驗收。':'已完成示範區域檢查與改善，請安排驗收。'}</textarea></label><label class="check-label"><input name="evidence" type="checkbox" required><span>加入預設示意證據（不會存取或上傳照片）。</span></label>${evidenceMarkup()}<p class="error" id="form-error" role="alert"></p><button type="submit" class="button primary">回報完成，送交驗收 →</button></form><p class="tiny">回報完成只會轉成「待驗收」，不會直接結案。</p>`;
 if(s===4) html=`<div class="phone-kicker"><span>驗收人員 · 示範角色</span><span>STEP 05</span></div><h4>由驗收，決定下一步。</h4>${taskCard()}<div class="info-box"><p class="tiny">最近執行說明</p><p>${esc(state.reports.at(-1))}</p></div>${evidenceMarkup()}<label class="check-label"><input id="inspection-confirm" type="checkbox"><span>我已查看示範回報與證據，確認可驗收通過。</span></label><p class="error" id="form-error" role="alert"></p><div class="split-buttons"><button class="button ghost" data-action="reject">退回補正</button><button class="button primary" data-action="approve">驗收通過 ✓</button></div><p class="tiny">退回會套用預設理由，並返回執行中。</p>`;
 if(s===5) html=`<div class="phone-kicker"><span>協作閉環 · 示範完成</span><span>COMPLETE</span></div><div class="success-panel"><div class="success-icon">✓</div><h4>從回報到結案，<br>每一步都有脈絡。</h4><p>你已完成這次虛構工作體驗。現在可以到管理端查看完整歷程。</p>${taskCard()}<button class="button primary" data-action="admin">查看管理總覽與歷程 →</button><button class="button ghost" data-action="reset">再試一次</button><p class="tiny">這不是正式驗收或正式上線紀錄。</p></div>`;
 $('#phone-content').innerHTML=html;
 $('#guide-title').textContent=stepInfo[s][0];$('#guide-description').textContent=stepInfo[s][1];$('#guide-note').textContent=stepInfo[s][2];
 $('#journey').innerHTML=steps.map((name,i)=>`<li class="${s>i?'done':s===i?'active':''}" ${s===i?'aria-current="step"':''} data-number="${s>i?'✓':i+1}">${name}</li>`).join('');
}
function renderAdmin(){let tasks=[...fixtures];if(state.task)tasks.unshift(state.task);const open=tasks.filter(t=>t.status!=='closed').length;const review=tasks.filter(t=>t.status==='review').length;const closed=tasks.filter(t=>t.status==='closed').length;$('#metrics').innerHTML=[[tasks.length,'示範工作','件'],[open,'尚未結案','件'],[review,'等待驗收','件'],[closed,'已結案','件']].map(([v,k,u])=>`<div class="metric"><span>${k}</span><strong>${v}<small>${u}</small></strong></div>`).join('');
 const search=$('#search').value.trim().toLowerCase();const filter=$('#status-filter').value;const shown=tasks.filter(t=>(filter==='all'||t.status===filter)&&[t.id,t.title,t.area,t.team,statusNames[t.status]].join(' ').toLowerCase().includes(search));$('#task-table').innerHTML=shown.length?shown.map(t=>`<tr><td><strong>${esc(t.title)}</strong><small>${t.id} · ${esc(t.source||'現場回報（虛構）')}</small></td><td>${esc(t.area)}</td><td>${esc(t.team)}</td><td>${pill(t.status)}</td><td><button class="table-btn" data-task="${t.id}">${t.id==='DEMO-001'?'開啟體驗':'查看樣本'} ↗</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty-row">找不到符合條件的示範工作。試試清除搜尋或選擇全部狀態。</td></tr>';
 $('#audit-list').innerHTML=state.audit.length?[...state.audit].reverse().map(a=>`<li>${esc(a.action)}<small>${esc(a.time)} · ${esc(a.role)} · 本分頁示範紀錄</small></li>`).join(''):'<li>尚未開始體驗<small>前往手機現場，從一則虛構回報開始。</small></li>';
}
function render(){renderPhone();renderAdmin();}
function perform(action){
 if(action==='draft'&&state.step===0){state.step=1;log('整理模擬','預設回報整理為待確認草稿');toast('草稿已整理，請由人確認內容。');}
 else if(action==='accept'&&state.step===2){state.task.status='working';state.step=3;log(state.task.team,'承接工作，狀態改為執行中');toast('已承接，管理總覽同步更新。');}
 else if(action==='approve'&&state.step===4){if(!$('#inspection-confirm').checked){$('#form-error').textContent='請先勾選已查看回報與證據，再驗收通過。';return;}state.task.status='closed';state.step=5;log('示範驗收人員','人工驗收通過，工作結案');toast('示範工作已通過人工驗收並結案。');}
 else if(action==='reject'&&state.step===4){state.task.status='working';state.step=3;state.returned=true;log('示範驗收人員','退回補正：請補充改善範圍與確認紀錄');toast('已退回補正，工作回到執行中。');}
 else if(action==='admin'){setTab('admin',true);return;}
 else if(action==='reset'){$('#reset-dialog').showModal();return;}
 else return;
 render();
}
const roadmap=[
 ['基礎整合與模組化','盤點既有功能，建立正式工作來源、身分、權限、紀錄與備份基礎。','一項工作有明確的正式紀錄來源，模組責任與資料範圍清楚。'],
 ['AI 輔助流程自動化','先聚焦一條高頻流程，協助整理草稿；不確定內容交由人工確認。','重送不重複、來源可追溯、失敗可接手，不讓 AI 自行驗收結案。'],
 ['核心專案管理閉環','接通建立、指派與承接、執行回報、待驗收、通過或退回與結案。','真實工作能走完流程，每一步都有責任人、狀態與紀錄。'],
 ['承包廠商協作','支援廠商承接、進度回報與補件，工作可關聯照片與文件。','共同完成一項工作，且工地、廠商與內部資訊的權限隔離經過驗證。'],
 ['跨工地管理','各案場獨立管理，主管依授權彙總，範本共用但保留案場差異。','至少兩個工地可獨立運作，彙總時資料與權限不混用。'],
 ['對上呈報與審查','分別處理業主、監造與政府需要的資料，先聚焦一類呈報。','來源、版本、核准與回覆可追溯；產出文件不等於正式送審成功。'],
 ['模組選配與產品化','依需求開關非核心模組，定義依賴、設定、升級與資料遷移。','選配或升級模組，不破壞既有流程、權限與歷史資料。'],
 ['跨平台應用程式','確認支援平台與優先順序，處理安裝、登入、更新、通知及斷線行為。','每個支援平台都可完成指定核心流程，不把能安裝當成可正常使用。']
];
$('#roadmap-list').innerHTML=roadmap.map(([title,description,gate],i)=>`<details class="roadmap-item" ${i===0?'open':''}><summary><span class="phase-num">0${i}</span>${title}</summary><div class="roadmap-body"><p>${description}</p><strong>規劃完成門檻</strong>${gate}</div></details>`).join('');
document.querySelectorAll('[data-tab]').forEach(b=>{b.addEventListener('click',()=>setTab(b.dataset.tab));b.addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-tab]')];let i=tabs.indexOf(b);if(e.key==='ArrowRight')i=(i+1)%tabs.length;else if(e.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();setTab(tabs[i].dataset.tab);tabs[i].focus();});});
$('#phone-content').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)perform(b.dataset.action);});
$('#phone-content').addEventListener('submit',e=>{e.preventDefault();const f=e.target;const data=new FormData(f);
 if(f.id==='confirm-form'&&state.step===1){const title=String(data.get('title')||'').trim();const area=String(data.get('area')||'').trim();if(!title||!area||!data.get('confirmed')){$('#form-error').textContent='請填妥工作與區位，並勾選確認。';return;}state.task={id:'DEMO-001',title,area,team:String(data.get('team')),due:String(data.get('due')),status:'pending'};state.step=2;log('示範管理人員','確認草稿，建立工作卡並指派負責單位');toast('工作卡已建立，等待班組承接。');}
 else if(f.id==='report-form'&&state.step===3){const report=String(data.get('report')||'').trim();if(!report||!data.get('evidence')){$('#form-error').textContent='請填寫執行說明，並加入預設示意證據。';return;}state.reports.push(report);state.evidence=true;state.task.status='review';state.step=4;log(state.task.team,state.returned?'補正回報完成，再次送交驗收':'回報完成並附示意證據，等待人工驗收');toast('已送交驗收。回報完成不等於結案。');}else return;render();});
$('#task-table').addEventListener('click',e=>{const b=e.target.closest('[data-task]');if(!b)return;if(b.dataset.task==='DEMO-001'){setTab('field',true);return;}const t=fixtures.find(t=>t.id===b.dataset.task);$('#sample-title').textContent=t.title;$('#sample-content').innerHTML=`<p class="mono">${t.id}</p><p>${esc(t.area)} · ${esc(t.team)}</p><p style="margin:15px 0">${pill(t.status)}</p><p>資料來源：${esc(t.source)}。此筆工作僅用於說明管理總覽。</p>`;$('#sample-dialog').showModal();});
$('#search').addEventListener('input',renderAdmin);$('#status-filter').addEventListener('change',renderAdmin);
$('#show-admin').addEventListener('click',()=>setTab('admin',true));$('#manage-demo').addEventListener('click',()=>setTab('field',true));$('#roadmap-link').addEventListener('click',()=>setTab('roadmap',true));
for(const id of ['about-open','footer-about'])$('#'+id).addEventListener('click',()=>$('#about-dialog').showModal());
$('#reset-open').addEventListener('click',()=>$('#reset-dialog').showModal());
$('#reset-confirm').addEventListener('click',()=>{$('#reset-dialog').close();state=initialState();$('#search').value='';$('#status-filter').value='all';render();setTab('field');toast('已重設這次示範體驗。');});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
state=initialState();render();
