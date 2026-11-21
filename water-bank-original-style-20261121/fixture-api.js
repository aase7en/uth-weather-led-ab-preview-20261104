/* DEMO ONLY: 100% local mock. Never calls API, Sheet or remote sensor. */
(()=>{'use strict';
const params=new URLSearchParams(location.search);
const scenario=params.get('scenario')||'sample',focus=params.get('focus')||'dual';
const now=Date.now();
const stations={
 HDA004:{ground:.227,bank:3.03,level:2.36,previous:2.31},
 S5:{ground:-8.59,bank:4.70,level:.88,previous:.91}
};
function fixture(code){
 const st=stations[code];
 if(scenario==='missing')return {status:'unavailable',levelMsl:null,groundMsl:null,bankM:null,observedAt:null,trendPoints:[],trendObservedAt:[]};
 const fraction={near:.94,at:1,above:code==='HDA004'?1.035:1.025}[scenario];
 const level=fraction===undefined?st.level:st.ground+(st.bank-st.ground)*fraction;
 const previous=fraction===undefined?st.previous:level-.05;
 const end=now-(scenario==='stale'?4*3600000:8*60000);
 const times=[4,3,2,1,0].map(h=>new Date(end-h*3600000).toISOString());
 const values=[previous-.12,previous-.06,previous+.02,previous,level];
 return {status:scenario==='stale'?'historical':'ok',levelMsl:level,groundMsl:st.ground,bankM:st.bank,
  observedAt:new Date(end).toISOString(),trendPoints:values,trendObservedAt:times};
}
window.UthApiClient={getWater:async()=>({kind:'SIMULATED',stations:{HDA004:fixture('HDA004'),S5:fixture('S5')}})};
if(focus==='HDA004'||focus==='S5'){
 document.querySelector('.widget.v3')?.classList.add('layout-focus');
 const other=document.querySelector(focus==='HDA004'?'#stationB':'#stationA');
 other?.classList.add('is-not-focus');
}
window.__DEMO_FIXTURE={scenario,focus,stations};
})();