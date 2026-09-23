import {writeFile} from 'node:fs/promises';
const points = [
 {id:'kocaeli',label:'Marmara · Kocaeli',latitude:40.765,longitude:29.94},
 {id:'istanbul',label:'Marmara · İstanbul',latitude:41.01,longitude:28.98},
 {id:'izmir',label:'Ege · İzmir',latitude:38.42,longitude:27.14},
 {id:'ankara',label:'İç Anadolu · Ankara',latitude:39.93,longitude:32.86},
 {id:'antalya',label:'Akdeniz · Antalya',latitude:36.90,longitude:30.70},
 {id:'samsun',label:'Karadeniz · Samsun',latitude:41.29,longitude:36.33},
 {id:'erzurum',label:'Doğu Anadolu · Erzurum',latitude:39.90,longitude:41.27},
 {id:'diyarbakir',label:'Güneydoğu Anadolu · Diyarbakır',latitude:37.92,longitude:40.23},
];
const locations=[];
for(const point of points){
 const url=new URL('https://re.jrc.ec.europa.eu/api/v5_3/PVcalc');
 url.search=new URLSearchParams({lat:String(point.latitude),lon:String(point.longitude),peakpower:'1',loss:'14',angle:'30',aspect:'0',mountingplace:'building',pvtechchoice:'crystSi',raddatabase:'PVGIS-SARAH3',outputformat:'json'}).toString();
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error(`PVGIS ${point.id}: HTTP ${response.status}`);
 const data=await response.json();const yieldKwhPerKwp=data.outputs?.totals?.fixed?.E_y;
 if(!Number.isFinite(yieldKwhPerKwp)||yieldKwhPerKwp<500||yieldKwhPerKwp>2500)throw new Error('Unexpected PVGIS yield');
 locations.push({...point,yieldKwhPerKwp,source:url.href,period:[data.inputs.meteo_data.year_min,data.inputs.meteo_data.year_max]});
 console.log(`${point.id}: ${yieldKwhPerKwp} kWh/kWp/year`);
}
await writeFile('data/solar-baselines.json',JSON.stringify({retrievedAt:new Date().toISOString(),model:'PVGIS 5.3 / SARAH3',slope:30,azimuth:0,systemLossPercent:14,mounting:'building',locations},null,2)+'\n');
