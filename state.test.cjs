const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const elements=new Map();function el(k){if(!elements.has(k))elements.set(k,{innerHTML:'',textContent:'',value:k==='#status-filter'?'all':'',checked:false,classList:{add(){},remove(){}},addEventListener(){},scrollIntoView(){},setAttribute(){},showModal(){},close(){}});return elements.get(k);}
const doc={querySelector:el,querySelectorAll(){return[];}};const context=vm.createContext({document:doc,console,Date,String,clearTimeout,setTimeout:()=>0,FormData:class{}});vm.runInContext(fs.readFileSync('app.js','utf8'),context);let tests=0;function check(name,code){vm.runInContext(code,context);tests++;console.log('PASS',name);}
context.assert=assert;
check('initial four synthetic fixtures',`assert.equal(state.step,0);assert.equal(state.task,null);assert.ok($('#metrics').innerHTML.includes('<strong>4'));`);
check('draft preparation remains unconfirmed',`perform('draft');assert.equal(state.step,1);assert.equal(state.task,null);assert.equal(state.audit.length,1);`);
check('invalid step actions ignored',`perform('approve');perform('accept');assert.equal(state.step,1);assert.equal(state.task,null);`);
check('escaped user text prevents HTML injection',`assert.equal(esc('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');assert.equal(esc('"x"'),'&quot;x&quot;');`);
check('accept transitions pending to working',`state.task={id:'DEMO-001',title:'測試',area:'示範 A 區',team:'示範防水班',due:'示範日 +2 天',status:'pending'};state.step=2;perform('accept');assert.equal(state.task.status,'working');assert.equal(state.step,3);`);
check('approval requires explicit inspection confirmation',`state.task.status='review';state.step=4;state.reports=['示範回報'];$('#inspection-confirm').checked=false;perform('approve');assert.equal(state.step,4);assert.equal(state.task.status,'review');assert.ok($('#form-error').textContent.includes('請先勾選'));`);
check('reject returns to working with audit',`perform('reject');assert.equal(state.step,3);assert.equal(state.task.status,'working');assert.equal(state.returned,true);assert.ok(state.audit.at(-1).action.includes('退回補正'));`);
check('resubmitted work can be human approved',`state.step=4;state.task.status='review';$('#inspection-confirm').checked=true;perform('approve');assert.equal(state.step,5);assert.equal(state.task.status,'closed');assert.ok(state.audit.at(-1).action.includes('人工驗收通過'));`);
check('repeated approval cannot duplicate log',`const n=state.audit.length;perform('approve');assert.equal(state.audit.length,n);`);
check('search gives explicit empty state',`$('#search').value='不存在的示範工作';renderAdmin();assert.ok($('#task-table').innerHTML.includes('找不到符合條件'));`);
check('status filtering and totals stay independent',`$('#search').value='';$('#status-filter').value='review';renderAdmin();assert.ok($('#task-table').innerHTML.includes('DEMO-003'));assert.ok(!$('#task-table').innerHTML.includes('DEMO-001'));assert.ok($('#metrics').innerHTML.includes('<strong>5'));`);
check('fresh initial state clears all in-memory progress',`state=initialState();assert.equal(state.audit.length,0);assert.equal(state.reports.length,0);assert.equal(state.task,null);assert.equal(state.returned,false);`);
assert(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|https?:\/\//.test(fs.readFileSync('app.js','utf8')));
console.log(`PASS no network or persistent storage code\n${tests+1} checks passed`);
