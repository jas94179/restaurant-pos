const page = await figma.getNodeByIdAsync('1:3'); await figma.setCurrentPageAsync(page);
const vars = await figma.variables.getLocalVariablesAsync();
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const CL = cols.find(c=>c.name==='Color · Light').id, CDIM = cols.find(c=>c.name==='Dimension').id;
const V=(n)=>{const v=vars.find(v=>v.name===n&&v.variableCollectionId===CL); if(!v) throw new Error('no var '+n); return v;};
const D=(n)=>{const v=vars.find(v=>v.name===n&&v.variableCollectionId===CDIM); if(!v) throw new Error('no dim '+n); return v;};
const paint=(n)=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',V(n));
const fill=(node,n)=>{node.fills=n?[paint(n)]:[];};
const stroke=(node,n,w)=>{node.strokes=[paint(n)]; node.setBoundVariable('strokeWeight',D(w||'stroke/hairline')); if('strokeAlign' in node) node.strokeAlign='INSIDE';};
const pad=(node,h,v)=>{node.setBoundVariable('paddingLeft',D('space/'+h));node.setBoundVariable('paddingRight',D('space/'+h));node.setBoundVariable('paddingTop',D('space/'+v));node.setBoundVariable('paddingBottom',D('space/'+v));};
const rad=(node,n)=>{for(const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) node.setBoundVariable(k,D('radius/'+n));};
const gap=(node,n)=>node.setBoundVariable('itemSpacing',D('space/'+n));
const TS = await figma.getLocalTextStylesAsync();
const EFF = await figma.getLocalEffectStylesAsync();
const loadedF=new Set();
async function txt(chars, style, color, name){ const s=TS.find(x=>x.name===style); if(!s) throw new Error('no style '+style); const k=s.fontName.family+'|'+s.fontName.style; if(!loadedF.has(k)){await figma.loadFontAsync(s.fontName); loadedF.add(k);} const t=figma.createText(); t.fontName=s.fontName; t.characters=chars; if(typeof t.setTextStyleIdAsync==='function') await t.setTextStyleIdAsync(s.id); else t.textStyleId=s.id; fill(t,color); t.name=name||'Label'; return t; }
function al(dir, props){ const f=figma.createAutoLayout(dir||'HORIZONTAL'); if(props) f.set(props); f.fills=[]; return f; }
function comp(name, dir){ const c=figma.createComponent(); c.name=name; c.layoutMode=dir||'HORIZONTAL'; c.primaryAxisSizingMode='AUTO'; c.counterAxisSizingMode='AUTO'; c.fills=[]; return c; }
function vec(d, color, w, size){ const v=figma.createVector(); v.vectorPaths=[{windingRule:'NONE',data:d}]; v.strokes=[paint(color)]; v.strokeWeight=w||2; v.strokeCap='ROUND'; v.strokeJoin='ROUND'; v.fills=[]; const s=size||24; v.resize(Math.max(1,v.width),Math.max(1,v.height)); return v; }
function icon(d, color, size){ const f=figma.createFrame(); f.name='Icon'; const s=size||24; f.resize(s,s); f.fills=[]; f.clipsContent=false; const v=figma.createVector(); v.vectorPaths=[{windingRule:'NONE',data:d}]; v.strokes=[paint(color)]; v.strokeWeight=2; v.strokeCap='ROUND'; v.strokeJoin='ROUND'; v.fills=[]; f.appendChild(v); const sc=s/24; v.rescale(sc); v.x=(s-v.width)/2; v.y=(s-v.height)/2; return f; }
async function group(name, title, note){ const old=page.children.find(n=>n.type==='FRAME'&&n.name===name); const oy=old?old.y:null; if(old) old.remove(); let y=-1; for(const n of page.children){ y=Math.max(y,n.y+n.height); } const g=al('VERTICAL',{name}); g.x=0; g.y=oy!==null?oy:(y<0?0:y+120); fill(g,'bg/app'); pad(g,40,40); gap(g,24); rad(g,'2xl'); const h=await txt(title,'App/title-lg','text/primary','Title'); g.appendChild(h); if(note){ const s=await txt(note,'App/body-sm','text/secondary','Note'); g.appendChild(s); s.resize(1200,s.height); s.textAutoResize='HEIGHT'; } const row=al('HORIZONTAL',{name:'Items'}); row.layoutWrap='WRAP'; row.itemSpacing=48; row.counterAxisSpacing=48; g.appendChild(row); row.resize(1520,10); row.layoutSizingHorizontal='FIXED'; row.primaryAxisSizingMode='FIXED'; row.counterAxisSizingMode='AUTO'; return {g,row}; }
function setLayout(set, w){ set.layoutMode='HORIZONTAL'; set.layoutWrap='WRAP'; set.itemSpacing=16; set.counterAxisSpacing=16; set.paddingLeft=set.paddingRight=set.paddingTop=set.paddingBottom=24; set.primaryAxisSizingMode='FIXED'; set.counterAxisSizingMode='AUTO'; set.resize(w||700, set.height); fill(set,'bg/surface'); set.strokes=[paint('border/default')]; set.dashPattern=[6,4]; set.strokeWeight=1; for(const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) set[k]=16; }
function textProp(set, prop, def, nodeName){ const key=set.addComponentProperty(prop,'TEXT',def); for(const v of set.children){ const t=v.findOne(n=>n.type==='TEXT'&&n.name===(nodeName||'Label')); if(t) t.componentPropertyReferences={characters:key}; } return key; }
const created=[];
