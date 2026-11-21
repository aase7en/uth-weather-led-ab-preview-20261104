'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const puppeteer=require('puppeteer');
const root=path.resolve(__dirname,'..'),out=path.join(root,'water-bank-original-style-20261121','review');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.png':'image/png'};
const srv=http.createServer((req,res)=>{
 const pathPart=new URL(req.url,'http://127.0.0.1').pathname;
 let filename=path.resolve(root,'.'+pathPart);
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
 if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
 fs.readFile(filename,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream'});res.end(err?'missing':data)});
});
(async()=>{
 await new Promise(res=>srv.listen(0,'127.0.0.1',res));
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 const errors=[],responses=[];
 try{
 const page=await browser.newPage();
 await page.setViewport({width:1460,height:850,deviceScaleFactor:1});
 page.on('pageerror',x=>errors.push(x.message));
 page.on('response',r=>{if(r.status()>=400)responses.push(r.status()+' '+r.url())});
 const baseUrl='http://127.0.0.1:'+srv.address().port+'/water-bank-original-style-20261121/';
 await page.goto(baseUrl,{waitUntil:'networkidle0'});
 const getFrame=async()=>{const f=page.frames().find(f=>f.url().includes('/led.html?'));assert.ok(f);await f.waitForSelector('#stationA .big-level');return f};
 let fr=await getFrame();
 const metrics=await fr.evaluate(()=>{
  const station=id=>{const el=document.getElementById(id),reading=el.querySelector('.reading-row'),big=el.querySelector('.big-level'),
  graph=el.querySelector('.spark'),distance=el.querySelector('.distance-to-bank'),badge=el.querySelector('.badge'),
  can=el.querySelector('.water-canvas'),art=el.querySelector('.art-zone'),r=el.getBoundingClientRect(),a=reading.getBoundingClientRect(),g=graph?.getBoundingClientRect(),d=distance.getBoundingClientRect();
  return {pct:big.textContent,arrow:el.querySelector('.preview-trend').textContent,dist:distance.textContent,
   badge:badge.textContent,graph:!!graph,curve:!!el.querySelector('path[stroke="#9cf7ff"]'),
   canvasLoaded:can.dataset.frame!==undefined,art:art.getBoundingClientRect().width,
   fitsRead:reading.scrollWidth<=reading.clientWidth+1,
   distFits:d.right<=r.right&&d.bottom<=r.bottom,graphFits:!g||g.right<=r.right,
   textToStation:(()=>{const x=document.createRange();x.selectNodeContents(distance);return r.right-x.getBoundingClientRect().right})(),
   arrowToGraph:(()=>{const x=document.createRange();x.selectNodeContents(el.querySelector('.preview-trend'));return g?g.left-x.getBoundingClientRect().right:999})(),
   graphVsPct:g?g.left-a.right:999};
  };
  return {display:[station('stationA'),station('stationB')],native:[innerWidth,innerHeight],
   graphic:document.querySelector('canvas.foam-front')!==null,style:getComputedStyle(document.querySelector('.widget')).backgroundImage};
 });
 assert.deepEqual(metrics.native,[432,40]);
 assert.equal(metrics.display[0].pct,'76.1%');assert.equal(metrics.display[1].pct,'71.3%');
 assert.ok(metrics.display[0].dist.includes('0.67'));
 assert.ok(metrics.display[1].dist.includes('3.82'));
 assert.equal(metrics.display[0].arrow,'↑');
 assert.equal(metrics.display[1].arrow,'↓');
 assert.ok(metrics.display.every(x=>x.graph&&x.canvasLoaded&&x.art>0));
 assert.ok(metrics.display.every(x=>x.textToStation>4&&x.arrowToGraph>2&&x.graphFits),
  'actual text and arrow must remain inside native LED and not overlap historical graph');
 await page.$eval('[data-zoom="1"]',b=>b.click());
 await page.$('#stage').then(el=>el.screenshot({path:path.join(out,'water-original-percent-432x40.png')}));
 await page.$eval('[data-zoom="3"]',b=>b.click());
 await page.$('#stage').then(el=>el.screenshot({path:path.join(out,'water-original-percent-3x.png')}));
 for(const [scenario,expect] of [['near','94.0%'],['at','100.0%'],['above','103.5%'],['stale','—%'],['missing','—%']]){
  await page.select('#scenario',scenario);fr=await getFrame();
  assert.equal(await fr.$eval('#stationA .big-level',e=>e.textContent),expect,scenario);
  if(['stale','missing'].includes(scenario))assert.equal(await fr.$eval('#stationA .preview-trend',e=>e.textContent),'—');
  if(scenario==='above'){await page.$('#stage').then(el=>el.screenshot({path:path.join(out,'water-original-percent-above-3x.png')}))}
 }
 await page.select('#scenario','sample');
 await page.select('#focus','HDA004');fr=await getFrame();
 assert.equal(await fr.$eval('#stationB',e=>getComputedStyle(e).display),'none');
 await page.$('#stage').then(el=>el.screenshot({path:path.join(out,'water-original-percent-focus-3x.png')}));
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 assert.ok(await page.$eval('.viewport',e=>e.scrollWidth>e.clientWidth),'mobile horizontal scroll works');
 fr=await getFrame();
 await fr.emulateMediaFeatures?.([{name:'prefers-reduced-motion',value:'reduce'}]).catch(()=>{});
 const outside=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>!r.name.includes('127.0.0.1')).map(r=>r.name));
 assert.equal(outside.length,0,'isolated preview must not request external APIs');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(responses.length,0,responses.join('\n'));
 console.log(JSON.stringify({PASS:true,metrics,scenarios:'sample/near/at/above/stale/missing',focus:'PASS',mobile:'PASS',externalResources:outside.length,errors}));
 }finally{await browser.close();srv.close()}
})().catch(e=>{console.error(e.stack);srv.close();process.exitCode=1});