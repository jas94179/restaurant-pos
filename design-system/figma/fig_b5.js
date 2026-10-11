(await figma.getNodeByIdAsync('12:97')).resize(1000,(await figma.getNodeByIdAsync('12:97')).height);
const {g,row} = await group('Group · Web','Web components','For the owner dashboard and the marketing site, 1024px and up. Same tokens as mobile; denser rows (Small and Medium controls), tables instead of lists, one top nav instead of the tab bar.');
// NavBar
const nav=comp('NavBar'); nav.counterAxisAlignItems='CENTER'; nav.primaryAxisSizingMode='FIXED'; nav.resize(1200,64); nav.counterAxisSizingMode='FIXED'; pad(nav,32,0); gap(nav,32); fill(nav,'bg/brand');
nav.appendChild(await txt('galla','App/title-md','text/on-brand','Brand'));
const links=al('HORIZONTAL',{name:'Links'}); gap(links,8); links.counterAxisAlignItems='CENTER'; nav.appendChild(links); links.layoutGrow=1;
for(const [l,sel] of [['Today',true],['Bills',false],['Menu',false],['Staff',false],['Reports',false]]){ const it=al('HORIZONTAL',{name:'Link'}); pad(it,12,8); rad(it,'md'); fill(it, sel?'bg/raised':null); if(sel) it.opacity=1; const t=await txt(l,'App/label-md', sel?'text/primary':'text/on-brand-muted'); it.appendChild(t); links.appendChild(it); }
const ow=al('HORIZONTAL',{name:'Account'}); ow.counterAxisAlignItems='CENTER'; gap(ow,10); ow.appendChild(await txt('Singh Sweets','App/body-sm','text/on-brand-muted','Outlet')); const av=al('HORIZONTAL',{name:'Avatar'}); av.resize(36,36); av.primaryAxisSizingMode='FIXED'; av.counterAxisSizingMode='FIXED'; av.primaryAxisAlignItems='CENTER'; av.counterAxisAlignItems='CENTER'; rad(av,'full'); fill(av,'action/accent'); av.appendChild(await txt('J','App/label-md','action/accent-text','Initial')); ow.appendChild(av); nav.appendChild(ow);
nav.description='Top navigation for the owner dashboard on web. Brand green bar, current page shown as a raised pill. Five items at most; account and outlet on the right. Replaces the TabBar above 1024px.'; row.appendChild(nav); created.push(nav.id);
// StatTile
const stats=[];
for(const [tr,col,delta] of [['Up','status/success','▲ 12% vs last Friday'],['Down','status/danger','▼ 8% vs last Friday'],['Neutral','text/secondary','Same as last Friday']]){
  const c=comp(`Trend=${tr}`,'VERTICAL'); c.primaryAxisSizingMode='AUTO'; c.counterAxisSizingMode='FIXED'; c.resize(260,10); pad(c,20,20); gap(c,8); rad(c,'xl'); fill(c,'bg/surface'); stroke(c,'border/default');
  c.appendChild(await txt('Sales today','App/body-sm','text/secondary','Label')); c.appendChild(await txt('₹18,420','App/amount','text/primary','Value')); c.appendChild(await txt(delta,'App/body-sm-strong',col,'Delta')); stats.push(c);
}
const stset=figma.combineAsVariants(stats,row); stset.name='StatTile'; setLayout(stset,900); textProp(stset,'Label','Sales today','Label'); textProp(stset,'Value','₹18,420','Value');
stset.description='One headline number on the dashboard. Label above, amount in App/amount, comparison below. Arrow plus words for the trend, never colour alone. Compare like with like ("vs last Friday").'; created.push(stset.id);
// DataTable
const dt=comp('DataTable','VERTICAL'); dt.counterAxisSizingMode='FIXED'; dt.resize(760,10); rad(dt,'xl'); fill(dt,'bg/surface'); stroke(dt,'border/default'); dt.clipsContent=true;
const COLS=[['Bill',140,'LEFT'],['Time',110,'LEFT'],['Table',110,'LEFT'],['Payment',150,'LEFT'],['Amount',150,'RIGHT']];
const ROWS=[['INV-000123','13:42','T4','UPI','₹231.00'],['INV-000122','13:30','Takeaway','Cash','₹120.00'],['INV-000121','13:18','T2','Card','₹1,045.00'],['INV-000120','13:02','T7','UPI','₹468.00']];
async function trow(vals, head, i){ const r=al('HORIZONTAL',{name:head?'Header':'Row'}); r.counterAxisAlignItems='CENTER'; pad(r,20,head?10:14); fill(r, head?'bg/app':(i%2?'bg/surface':'bg/surface')); r.strokes=[paint('border/default')]; r.strokeTopWeight=0; r.strokeLeftWeight=0; r.strokeRightWeight=0; r.strokeBottomWeight=1;
  for(let k=0;k<COLS.length;k++){ const cell=al('HORIZONTAL',{name:'Cell'}); cell.primaryAxisSizingMode='FIXED'; cell.resize(COLS[k][1],20); cell.counterAxisSizingMode='AUTO'; cell.primaryAxisAlignItems=COLS[k][2]==='RIGHT'?'MAX':'MIN'; const st=head?'App/caption':(k===0||k===4?'App/body-sm-strong':'App/body-sm'); cell.appendChild(await txt(vals[k],st,head?'text/secondary':'text/primary')); r.appendChild(cell); }
  return r; }
dt.appendChild(await trow(COLS.map(c=>c[0].toUpperCase()),true,0)); for(let i=0;i<ROWS.length;i++){ const r=await trow(ROWS[i],false,i); dt.appendChild(r); r.layoutSizingHorizontal='FILL'; }
dt.children[0].layoutSizingHorizontal='FILL'; dt.children[dt.children.length-1].strokeBottomWeight=0;
dt.description='Rows of records on web: bills, staff, menu items. Caption-style header on bg/app, hairline rows, amounts right-aligned in tabular figures. Bill numbers are bold so the eye can scan them. Keep to 5–7 columns; on phones use ListRow instead.'; row.appendChild(dt); created.push(dt.id);
// PlanCard
const plans=[];
for(const f of [false,true]){
  const c=comp(`Featured=${f?'True':'False'}`,'VERTICAL'); c.counterAxisSizingMode='FIXED'; c.resize(320,10); pad(c,28,28); gap(c,16); rad(c,'2xl');
  fill(c, f?'bg/brand':'bg/surface'); stroke(c, f?'bg/brand':'border/default');
  if(f){ const b=al('HORIZONTAL',{name:'Badge'}); pad(b,10,4); rad(b,'full'); fill(b,'action/accent'); b.appendChild(await txt('Most picked','App/label-sm','action/accent-text')); c.appendChild(b); }
  c.appendChild(await txt(f?'Restaurant':'Counter','App/title-md',f?'text/on-brand':'text/primary','Name'));
  const pr=al('HORIZONTAL',{name:'Price'}); pr.counterAxisAlignItems='BASELINE'; gap(pr,6); pr.appendChild(await txt(f?'₹499':'₹0','App/display',f?'text/on-brand':'text/primary','Amount')); pr.appendChild(await txt('/ month','App/body-sm',f?'text/on-brand-muted':'text/secondary','Period')); c.appendChild(pr);
  const fl=al('VERTICAL',{name:'Features'}); gap(fl,10);
  for(const ft of (f?['Unlimited bills and tables','Kitchen tickets and day close','Staff PINs and approvals','Owner reports on web']:['One counter, unlimited bills','UPI QR and printed bills','Works offline'])){ const li=al('HORIZONTAL',{name:'Feature'}); gap(li,8); li.counterAxisAlignItems='CENTER'; li.appendChild(icon('M 5 12 L 9.5 16.5 L 19 7', f?'action/accent':'status/success',18)); li.appendChild(await txt(ft,'App/body-sm',f?'text/on-brand':'text/primary')); fl.appendChild(li); }
  c.appendChild(fl);
  const btn=al('HORIZONTAL',{name:'Button'}); btn.primaryAxisAlignItems='CENTER'; btn.counterAxisAlignItems='CENTER'; btn.counterAxisSizingMode='FIXED'; btn.resize(264,44); rad(btn,'lg'); fill(btn,f?'action/accent':'bg/surface'); if(!f) stroke(btn,'border/input','stroke/default');
  btn.appendChild(await txt(f?'Start 30-day trial':'Start free','App/label-md',f?'action/accent-text':'text/primary')); c.appendChild(btn); btn.layoutSizingHorizontal='FILL'; plans.push(c);
}
const pset=figma.combineAsVariants(plans,row); pset.name='PlanCard'; setLayout(pset,760); pset.counterAxisAlignItems='MAX';
pset.description='Pricing on the marketing site. One Featured card in brand green with the turmeric button; others on surface. Price in rupees per month, 3–5 plain features with ticks, one button each.'; created.push(pset.id);
// ApprovalRow
const aps=[];
for(const st of ['Pending','Approved','Declined']){
  const c=comp(`Status=${st}`); c.counterAxisAlignItems='CENTER'; c.counterAxisSizingMode='AUTO'; c.primaryAxisSizingMode='FIXED'; c.resize(720,10); pad(c,20,16); gap(c,16); rad(c,'lg'); fill(c,'bg/surface'); stroke(c,'border/default');
  const tx=al('VERTICAL',{name:'Text'}); gap(tx,4); tx.appendChild(await txt('10% discount on Bill #42 · ₹231','App/body-md-strong','text/primary','Title')); tx.appendChild(await txt('Asked by Ravi · Table 4 · 13:42 · "Regular customer"','App/body-sm','text/secondary','Meta')); c.appendChild(tx); tx.layoutGrow=1;
  if(st==='Pending'){ for(const [l,bg,fg,bd] of [['Decline','bg/surface','text/primary','border/input'],['Approve','action/primary','action/primary-text',null]]){ const b=al('HORIZONTAL',{name:l}); b.primaryAxisAlignItems='CENTER'; b.counterAxisAlignItems='CENTER'; b.counterAxisSizingMode='FIXED'; b.resize(10,36); b.setBoundVariable('height',D('size/control-sm')); pad(b,14,0); rad(b,'sm'); fill(b,bg); if(bd) stroke(b,bd,'stroke/default'); b.appendChild(await txt(l,'App/label-sm',fg)); c.appendChild(b); } }
  else { const ok=st==='Approved'; const b=al('HORIZONTAL',{name:'Badge'}); pad(b,10,4); rad(b,'full'); fill(b,ok?'status/success-bg':'status/danger-bg'); b.appendChild(await txt(ok?'✓ Approved by Owner':'✕ Declined by Owner','App/label-sm',ok?'status/success':'status/danger')); c.appendChild(b); }
  aps.push(c);
}
const aset=figma.combineAsVariants(aps,row); aset.name='ApprovalRow'; setLayout(aset,770);
aset.description='A staff request the owner must decide on: discounts, voids, refunds, paid-outs. Says what, how much, who asked and why. Pending shows Decline and Approve; decided rows show who decided, in words and colour.'; created.push(aset.id);
// SalesChart
const ch=comp('SalesChart','VERTICAL'); ch.counterAxisSizingMode='FIXED'; ch.resize(560,10); pad(ch,24,24); gap(ch,16); rad(ch,'xl'); fill(ch,'bg/surface'); stroke(ch,'border/default');
const hd=al('HORIZONTAL',{name:'Header'}); hd.counterAxisAlignItems='CENTER'; ch.appendChild(hd); hd.layoutSizingHorizontal='FILL'; const ht=await txt('Sales by hour','App/title-sm','text/primary','Title'); hd.appendChild(ht); ht.layoutGrow=1; hd.appendChild(await txt('Today · ₹18,420','App/body-sm','text/secondary','Total'));
const bars=al('HORIZONTAL',{name:'Bars'}); bars.counterAxisAlignItems='MAX'; gap(bars,10); bars.counterAxisSizingMode='FIXED'; bars.resize(512,170); ch.appendChild(bars);
const DATA=[[11,20],[12,55],[13,100],[14,80],[15,30],[16,25],[17,40],[18,60],[19,90],[20,95],[21,70],[22,35]];
for(const [h,v] of DATA){ const col=al('VERTICAL',{name:'Bar '+h}); col.counterAxisAlignItems='CENTER'; gap(col,6); const b=figma.createRectangle(); b.name='Value'; b.resize(28,Math.round(v*1.3)); fill(b, v===100?'action/accent':'action/primary'); b.topLeftRadius=b.topRightRadius=4; col.appendChild(b); col.appendChild(await txt(String(h),'App/caption','text/secondary','Hour')); bars.appendChild(col); }
ch.appendChild(await txt('Busiest hour 1 pm (turmeric). Bars in brand green; one highlight at most.','App/caption','text/secondary','Note'));
ch.description='Simple bar chart for the dashboard: sales by hour or day. Brand green bars, turmeric for the single highlight, hour labels below, the total in words in the header. No 3D, no pies, no gridline clutter.'; row.appendChild(ch); created.push(ch.id);
return {group:g.id, created, size:[g.width,g.height]};
