/* Prototype only. No API requests, no live water readings, no side effects. */
(()=>{'use strict';
const stationSpec=[
  {id:'HDA004',name:'ช่องสะเดา',ground:0.227,bank:3.03,sample:2.36,previous:2.31,observed:'14:40'},
  {id:'S5',name:'สะพานปรีดี',ground:-8.59,bank:4.70,sample:0.88,previous:0.91,observed:'12:00'}
];
const $=id=>document.getElementById(id);
const state={scenario:'sample',view:'dual',station:'HDA004',zoom:3};
const sourceName='ThaiWater / HII (ค่าตัวอย่างเพื่อการออกแบบเท่านั้น)';
function displayPercent(level,ground,bank){
  // Explicit domain validation matches the currently reviewed widget's
  // ground-to-minimum-bank interval; neither flood probability nor capacity.
  if(![level,ground,bank].every(Number.isFinite)||bank<=ground||level<ground)return null;
  return (level-ground)/(bank-ground)*100;
}
function inputs(spec,scenario){
  if(scenario==='missing')return {level:null,old:true,observed:'—'};
  if(scenario==='stale')return {level:spec.sample,old:true,observed:spec.observed};
  const target={
    near:.94,at:1,above:spec.id==='HDA004'?1.035:1.025
  }[scenario];
  const level=scenario==='sample'?spec.sample:spec.ground+(spec.bank-spec.ground)*target;
  const previous=scenario==='sample'?spec.previous:level-.05;
  return {level,previous,observed:spec.observed,old:false};
}
const number=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'—';
function derive(spec,scenario){
 const val=inputs(spec,scenario);
 if(!Number.isFinite(val.level)){
  return {percent:null,label:'ไม่มีข้อมูลตรวจวัด',marker:'—',level:null,bankDiff:null,observed:val.observed,stale:true,kind:'missing'};
 }
 const pct=displayPercent(val.level,spec.ground,spec.bank);
 if(val.old)return {percent:null,label:'ข้อมูลเก่า · ไม่ใช่ปัจจุบัน',marker:'—',level:val.level,bankDiff:spec.bank-val.level,observed:val.observed,stale:true,kind:'stale'};
 if(pct===null)return {percent:null,label:'ไม่สามารถคำนวณสัดส่วน',marker:'—',level:val.level,bankDiff:null,observed:val.observed,stale:false,kind:'missing'};
 const diff=spec.bank-val.level,EPS=.000001;
 const kind=diff<-EPS?'above-bank':Math.abs(diff)<EPS?'at-bank':'below-bank';
 const label=kind==='above-bank'?'สูงกว่าตลิ่ง '+number(-diff)+' ม.':kind==='at-bank'?'ถึงระดับตลิ่งอ้างอิง':'ต่ำกว่าตลิ่ง '+number(diff)+' ม.';
 const change=val.level-val.previous;
 const marker=Number.isFinite(change)?change>.015?'↑':change<-.015?'↓':'→':'—';
 return {percent:pct,label,marker,level:val.level,bankDiff:diff,observed:val.observed,stale:false,kind};
}
function updateStation(spec){
 const v=derive(spec,state.scenario),card=$('st-'+spec.id);
 card.className='led-station '+v.kind+(state.station===spec.id?' focus-selected':'');
 card.querySelector('.big-pct').innerHTML=(v.percent===null?'—':number(v.percent,1))+'<small>%</small>';
 card.querySelector('.arrow').textContent=v.marker;
 card.querySelector('.station-bottom').textContent=v.label;
 card.querySelector('.stamp').textContent=v.stale?'ไม่สด':'วัด* '+v.observed;
 card.setAttribute('aria-label',spec.name+' ตัวอย่างจำลอง '+(v.percent===null?'ไม่มีเปอร์เซ็นต์ที่ใช้ได้':number(v.percent,1)+' เปอร์เซ็นต์ช่วงพื้นอ้างอิงถึงตลิ่ง')+' '+v.label);
 const readableLevel=Number.isFinite(v.level)?number(v.level)+' m MSL':'ไม่มีข้อมูล';
 const percentLabel=v.percent===null?'—':number(v.percent,1)+'%';
 return '<section class="detail-card"><h3>'+spec.name+' · '+spec.id+'</h3>'+
   '<p><strong>สัดส่วนช่วงพื้น–ตลิ่ง:</strong> '+percentLabel+' (ตัวอย่าง)</p>'+
   '<p><strong>ระยะจากตลิ่งต่ำสุด:</strong> '+(Number.isFinite(v.bankDiff)?number(Math.abs(v.bankDiff))+' ม. '+(v.bankDiff<0?'สูงกว่า':'ต่ำกว่า'):'ไม่พร้อมใช้งาน')+'</p>'+
   '<p>ระดับน้ำอ้างอิง: '+readableLevel+' · ระดับตลิ่ง MSL: '+number(spec.bank)+' ม. · ระดับพื้น MSL: '+number(spec.ground,3)+' ม.</p>'+
   '<p>สถานะตัวอย่าง: '+v.label+' · เวลาวัดตัวอย่าง: '+v.observed+'</p></section>';
}
function render(){
 $('led-board').classList.toggle('focus',state.view==='focus');
 $('led-board').setAttribute('aria-label','ตัวอย่างจำลอง ไม่ใช่ข้อมูลสด: สถานีอ้างอิง HDA004 และ S5 แสดงเปอร์เซ็นต์ช่วงพื้นอ้างอิงถึงตลิ่งและระยะที่ต่ำกว่าตลิ่ง');
 $('led-stage').style.setProperty('--zoom',String(state.zoom));
 $('details').innerHTML=stationSpec.map(updateStation).join('');
 document.querySelectorAll('[data-view]').forEach(b=>{const a=b.dataset.view===state.view;b.classList.toggle('selected',a);b.setAttribute('aria-pressed',String(a))});
 document.querySelectorAll('[data-zoom]').forEach(b=>{const a=Number(b.dataset.zoom)===state.zoom;b.classList.toggle('selected',a);b.setAttribute('aria-pressed',String(a))});
 $('station').disabled=state.view!=='focus';
 const now=new Date(),time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
 document.querySelector('.clock-time').textContent=time;
}
$('scenario').addEventListener('change',e=>{state.scenario=e.target.value;render()});
$('station').addEventListener('change',e=>{state.station=e.target.value;render()});
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{state.view=btn.dataset.view;render()}));
document.querySelectorAll('[data-zoom]').forEach(btn=>btn.addEventListener('click',()=>{state.zoom=Number(btn.dataset.zoom);render()}));
render();
setInterval(()=>{document.querySelector('.clock-time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())},60000);
window.WaterBankPreview={derive,displayPercent,stationSpec,sourceName};
})();
