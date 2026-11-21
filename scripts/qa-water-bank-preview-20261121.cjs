'use strict';
// Read-only prototype QA. Simulated fixtures; no calls to widget API.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const puppeteer=require('puppeteer');
const root=path.resolve(__dirname,'..'),out=path.join(root,'water-bank-clarity-20261121','review');
const types={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.png':'image/png'};
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const dest=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
 fs.readFile(dest,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(dest)]||'application/octet-stream'});res.end(err?'missing':body)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await puppeteer.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errs=[];
  await page.setViewport({width:1440,height:820,deviceScaleFactor:1});
  page.on('pageerror',e=>errs.push(e.message));
  const url='http://127.0.0.1:'+server.address().port+'/water-bank-clarity-20261121/';
  await page.goto(url,{waitUntil:'networkidle0'});
  const percents=await page.evaluate(()=>{
   const w=window.WaterBankPreview;
   return [w.displayPercent(2.36,.227,3.03),w.displayPercent(.88,-8.59,4.7)];
  });
  assert.ok(Math.abs(percents[0]-76.1)<.1);
  assert.ok(Math.abs(percents[1]-71.3)<.1);
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.big-pct')].map(x=>x.textContent)),['76.1%','71.3%']);
  assert.ok((await page.$eval('#st-HDA004 .station-bottom',x=>x.textContent)).includes('0.67'));
  assert.ok((await page.$eval('#st-S5 .station-bottom',x=>x.textContent)).includes('3.82'));
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>!r.name.includes('127.0.0.1')).length),0,'demo must not fetch external services');
  await page.$eval('[data-zoom="1"]',b=>b.click());
  await page.screenshot({path:path.join(out,'water-bank-dual-overview.png')});
  await page.$('#led-board').then(x=>x.screenshot({path:path.join(out,'water-bank-dual-native-432x40.png')}));
  for(const [mode,expect] of [['near','ต่ำกว่าตลิ่ง'],['at','ถึงระดับตลิ่ง'],['above','สูงกว่าตลิ่ง'],['stale','ข้อมูลเก่า'],['missing','ไม่มีข้อมูล']]){
   await page.select('#scenario',mode);
   assert.ok((await page.$eval('#st-HDA004 .station-bottom',e=>e.textContent)).includes(expect),mode);
   if(mode==='at')assert.equal(await page.$eval('#st-HDA004 .big-pct',e=>e.textContent),'100.0%');
   if(mode==='above')assert.ok(parseFloat(await page.$eval('#st-HDA004 .big-pct',e=>e.textContent))>100);
   if(mode==='stale'||mode==='missing')assert.equal(await page.$eval('#st-HDA004 .big-pct',e=>e.textContent),'—%');
  }
  await page.select('#scenario','sample');
  await page.$eval('[data-view="focus"]',b=>b.click());
  assert.equal(await page.$eval('#st-S5',e=>getComputedStyle(e).display),'none');
  await page.select('#station','S5');
  assert.equal(await page.$eval('#st-HDA004',e=>getComputedStyle(e).display),'none');
  await page.$('#led-board').then(x=>x.screenshot({path:path.join(out,'water-bank-focus-native-432x40.png')}));
  await page.$eval('[data-view="dual"]',b=>b.click());
  await page.$eval('[data-zoom="3"]',b=>b.click());
  await page.$('#led-board').then(x=>x.screenshot({path:path.join(out,'water-bank-dual-3x.png')}));
  const geometry=await page.evaluate(()=>{
   const b=document.querySelector('.led-board').getBoundingClientRect();
   const cards=[...document.querySelectorAll('.led-station')].map(c=>{const x=c.getBoundingClientRect(),p=c.querySelector('.big-pct').getBoundingClientRect();return {cardWidth:x.width,pctWidth:p.width,inside:p.left>=x.left&&p.right<=x.right,visible:y(c)}});
   function y(e){return getComputedStyle(e).display!=='none'}
   return {boardWidth:b.width,boardHeight:b.height,cards}
  });
  assert.equal(geometry.boardWidth,1296);assert.equal(geometry.boardHeight,120);
  assert.ok(geometry.cards.every(c=>c.inside));
  const readable=await page.evaluate(()=>[...document.querySelectorAll('.led-station')].map(el=>{
    const parent=el.getBoundingClientRect(),label=el.querySelector('.station-bottom').getBoundingClientRect();
    return {insideTop:label.top>=parent.top,insideBottom:label.bottom<=parent.bottom-.1,top:label.top,bottom:label.bottom,cardBottom:parent.bottom};
  }));
  assert.ok(readable.every(x=>x.insideTop&&x.insideBottom),'bottom description must fit physical 40px LED, '+JSON.stringify(readable));

  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  assert.equal(await page.$eval('.wave-one',e=>getComputedStyle(e).animationName),'none');
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  assert.ok(await page.$eval('.scroller',e=>e.scrollWidth>e.clientWidth),'mobile must scroll horizontally, not clip to viewport');
  assert.equal(errs.length,0,JSON.stringify(errs));
  console.log(JSON.stringify({result:'PASS',mockPercent:percents.map(x=>x.toFixed(1)),modes:6,focus:'PASS',native:'432x40',board3x:geometry,errors:errs}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack);server.close();process.exitCode=1});
