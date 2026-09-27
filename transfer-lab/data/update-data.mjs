import {readFile, writeFile, rename} from 'node:fs/promises';
const dir = new URL('./', import.meta.url);
const round=n=>Math.round(n*100)/100;
const endpoints = {
  fpl:'https://fantasy.premierleague.com/api/bootstrap-static/',
  laliga:'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams',
  real:'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/roster',
  barca:'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/83/roster',
  atletico:'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/1068/roster',
  'eng-standings':'https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings',
  'esp-standings':'https://site.web.api.espn.com/apis/v2/sports/soccer/esp.1/standings'
};
for(const [id,n] of [['arsenal',359],['man-city',382],['liverpool',364],['chelsea',363],['man-united',360],['tottenham',367],['newcastle',361],['aston-villa',362]])endpoints[id]=`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/${n}/roster`;
const raw={};
for (const [key,url] of Object.entries(endpoints)) {
  if (process.argv.includes('--offline')) raw[key]=JSON.parse(await readFile(new URL(`raw/${key}.json`,dir),'utf8'));
  else { const res=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!res.ok)throw Error(`${key}: HTTP ${res.status}`);raw[key]=await res.json(); }
}
const seasonYear=Number(raw.fpl.events[0].deadline_time.slice(0,4));
for(const [key,value] of Object.entries(raw)) if(value.athletes&&value.season.year!==seasonYear)throw Error(`数据赛季不一致：${key}；保留原有快照。`);
for(const key of ['eng','esp']) if(raw[`${key}-standings`].children[0].standings.season!==seasonYear)throw Error('积分榜赛季不一致；保留原有快照。');
// Revenue is historical, in €m: Deloitte Money League 2026 (2024/25 accounts),
// verified from the cited secondary table. Budgets, growth and objectives are game assumptions.
const configs=[
 ['arsenal','阿森纳','Arsenal','eng',359,150,821.7,88,2,.06,'争冠拼图','高强度争冠阵容，补强应优先提升首发质量。'],
 ['man-city','曼城','Man City','eng',382,180,829.3,88,1,.04,'重塑王朝','营收规模领先，合理更新阵容比囤积球星更重要。'],
 ['liverpool','利物浦','Liverpool','eng',364,130,836.1,87,2,.05,'延续荣耀','平衡进攻效率与后场深度，争取持续竞争力。'],
 ['chelsea','切尔西','Chelsea','eng',363,110,584.1,83,4,.08,'兑现天赋','年轻球员储备充足，留意工资与阵容结构。'],
 ['man-united','曼联','Man Utd','eng',360,100,793.1,81,4,.02,'重建之路','商业体量可观，把投入转化为稳定的联赛成绩。'],
 ['tottenham','热刺','Spurs','eng',367,100,672.6,79,6,.04,'北伦敦新章','补齐阵容短板，控制大幅换血带来的磨合成本。'],
 ['newcastle','纽卡斯尔','Newcastle','eng',361,75,398.4,82,5,.06,'向上突破','营收规模较小，通过精准引援缩小竞争差距。'],
 ['aston-villa','阿斯顿维拉','Aston Villa','eng',362,65,450.2,82,6,.03,'挑战秩序','有限预算下兼顾欧战目标和替补深度。'],
 ['real-madrid','皇家马德里','Real Madrid','esp',86,180,1161,90,1,.06,'银河的下一章','豪华阵容与高期待并存，冠军是董事会的目标。'],
 ['barcelona','巴塞罗那','Barcelona','esp',83,80,974.8,89,1,.06,'拉玛西亚之后','优秀的年轻核心，继续投资未来并控制新增支出。'],
 ['atletico','马德里竞技','Atlético Madrid','esp',1068,85,454.5,85,3,.04,'红白的野心','提升进攻效率，在两强之间寻找突破口。']
];
const zh={'Bournemouth':'伯恩茅斯','Brentford':'布伦特福德','Brighton':'布莱顿','Coventry City':'考文垂','Crystal Palace':'水晶宫','Everton':'埃弗顿','Fulham':'富勒姆','Hull City':'赫尔城','Ipswich Town':'伊普斯维奇','Leeds':'利兹联',"Nott'm Forest":'诺丁汉森林','Sunderland':'桑德兰','Alavés':'阿拉维斯','Athletic Club':'毕尔巴鄂竞技','Celta Vigo':'塞尔塔','Deportivo':'拉科鲁尼亚','Elche':'埃尔切','Espanyol':'西班牙人','Getafe':'赫塔费','Levante':'莱万特','Málaga':'马拉加','Osasuna':'奥萨苏纳','Racing Santander':'桑坦德竞技','Rayo Vallecano':'巴列卡诺','Real Betis':'皇家贝蒂斯','Real Sociedad':'皇家社会','Sevilla':'塞维利亚','Valencia':'瓦伦西亚','Villarreal':'比利亚雷亚尔'};
const clubs=configs.map(([id,name,en,league,espn,budget,revenue,base,target,growth,tag,brief])=>({id,name,en,league,espn:String(espn),budget,revenue,base,target,growth,tag,brief,playable:true,badge:`../assets/teams/${id}.png`}));
const standings={};
for(const l of ['eng','esp']) standings[l]=raw[`${l}-standings`].children[0].standings.entries;
for(const t of raw.fpl.teams){
 let c=clubs.find(c=>c.en===t.name);
 if(!c){c={id:`eng-${t.id}`,name:zh[t.name]||t.name,en:t.name,league:'eng',base:72+(Number(t.strength_overall_home)||3)*1.4,playable:false};clubs.push(c);}
 c.fpl=t.id;c.short=t.short_name;
 const row=standings.eng.find(r=>r.team.shortDisplayName===t.name||r.team.displayName===t.name||r.team.id===c.espn||(t.short_name==='NFO'&&r.team.id==='393'));
 if(row)c.espn=row.team.id;
}
for(const {team:t} of raw.laliga.sports[0].leagues[0].teams){
 if(!clubs.find(c=>c.espn===t.id))clubs.push({id:`esp-${t.id}`,name:zh[t.displayName]||t.displayName,en:t.displayName,league:'esp',espn:t.id,short:t.abbreviation,base:['93','102','244'].includes(t.id)?81:75,playable:false});
}
for(const c of clubs){
 const row=standings[c.league].find(r=>r.team.id===c.espn);
 if(!row)throw Error(`Missing standings: ${c.en}`);
 const stat=n=>row.stats.find(s=>s.name===n)?.value??0;
 c.actual={rank:stat('rank'),played:stat('gamesPlayed'),points:stat('points'),gf:stat('pointsFor'),ga:stat('pointsAgainst')};
 c.formAdjustment=Math.max(-2.5,Math.min(2.5,(c.actual.points/Math.max(1,c.actual.played)-1.5)*1.8));
 c.short ||= row.team.abbreviation;
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const asOf=process.argv.includes('--offline')?JSON.parse(await readFile(new URL('raw/metadata.json',dir),'utf8')).asOf:new Date().toISOString().slice(0,10);
const ageOf=b=>b?Math.floor((new Date(asOf)-new Date(b))/(365.25*86400000)):null;
const players=[];
for(const p of raw.fpl.elements.filter(p=>!p.removed&&p.can_select!==false&&p.status!=='u')){
 const c=clubs.find(c=>c.fpl===p.team);if(!c)continue;
 const startsRatio=p.starts/Math.max(1,c.actual.played);
 const rating=Math.round(clamp(65+(p.now_cost/10-4)*2.4+startsRatio*9+Number(p.form)*.45+(c.base-78)*.45,60,94));
 const matches=raw[c.id]?.athletes.filter(a=>a.dateOfBirth?.slice(0,10)===p.birth_date)||[];
 const conventionalPosition=matches.length===1?({G:'GK',D:'DEF',M:'MID',F:'FWD'})[matches[0].position.abbreviation]:null;
 players.push({id:`fpl-${p.id}`,name:p.web_name,fullName:`${p.first_name} ${p.second_name}`,club:c.id,pos:conventionalPosition||['','GK','DEF','MID','FWD'][p.element_type],positionSource:conventionalPosition?'espn':'fpl',age:ageOf(p.birth_date),rating,minutes:p.minutes,goals:p.goals_scored,assists:p.assists,appearances:p.starts,injured:p.status==='i',news:p.news,source:'fpl',fplPrice:p.now_cost/10});
}
const starRatings={'Kylian Mbappé':94,'Vinícius Júnior':91,'Jude Bellingham':90,'Federico Valverde':89,'Thibaut Courtois':89,'Trent Alexander-Arnold':86,'Antonio Rüdiger':85,'Ibrahima Konaté':85,'Marc Cucurella':85,'Dean Huijsen':84,'Aurélien Tchouaméni':85,'Eduardo Camavinga':84,'Arda Güler':84,'Rodrygo':86,'Bernardo Silva':85,'Lamine Yamal':93,'Raphinha':89,'Pedri':91,'Rodri':89,'Jules Koundé':86,'Pau Cubarsí':85,'Frenkie de Jong':86,'Dani Olmo':85,'Gavi':83,'Joan García':84,'Anthony Gordon':84,'Alejandro Balde':84,'Fermín López':84,'Julián Álvarez':89,'Jan Oblak':88,'Cristian Romero':86,'Álex Baena':85,'Pablo Barrios':84,'Marcos Llorente':84,'Ademola Lookman':84,'Jonathan David':84,'Johnny Cardoso':82,'Dávid Hancko':83,'Robin Le Normand':83,'Alexander Sørloth':83,'Alejandro Grimaldo':85,'Morten Hjulmand':83};
for(const [key,id] of [['real','real-madrid'],['barca','barcelona'],['atletico','atletico']]){
 for(const p of raw[key].athletes){
  const stats=p.statistics?.splits?.categories.flatMap(c=>c.stats)||[];
  const value=n=>stats.find(s=>s.name===n)?.value??null;
  const apps=value('appearances')||0;
  const rating=starRatings[p.displayName]||Math.round(clamp(68+Math.min(7,apps)*1.4+((p.age||20)>22?3:0),65,83));
  players.push({id:`espn-${p.id}`,name:p.displayName,fullName:p.fullName,club:id,pos:({G:'GK',D:'DEF',M:'MID',F:'FWD'})[p.position.abbreviation]||'MID',age:ageOf(p.dateOfBirth),rating,minutes:value('minutesPlayed'),goals:value('totalGoals'),assists:value('goalAssists'),appearances:value('appearances'),injured:!!p.injuries?.length,news:p.injuries?.length?'来源列有伤病记录':'',source:'espn'});
 }
}
for(const p of players){
 p.value=Math.round(clamp(Math.pow(Math.max(4,p.rating-58),2)*.15*(p.age==null?1:p.age<=23?1.25:p.age>30?.62:1)*(p.pos==='GK'?.65:1),3,210)*10)/10;
 p.wage=Math.round(Math.max(.35,Math.pow(p.rating-58,2)*.012)*100)/100;
 p.potential=clamp(p.rating+(p.age!==null&&p.age<=23?Math.round((25-p.age)*.8):0),p.rating,96);
 const hash=[...p.id].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,2166136261);
 p.ambition=round(0.35+(hash%55)/100);
 p.loyalty=round(0.25+((hash>>>8)%60)/100);
 p.preference=hash%5===0?['eng','esp'][hash%2]:null;
 p.contractYears=1+(hash%5);
 p.releaseClause=(p.rating>=83&&hash%7===0)?round(p.value*(1.08+(hash%28)/100)):null;
}
if(clubs.filter(c=>c.league==='eng').length!==20||clubs.filter(c=>c.league==='esp').length!==20)throw Error('Each league must have 20 clubs');
for(const c of clubs.filter(c=>c.playable))if(players.filter(p=>p.club===c.id).length<18)throw Error(`Incomplete roster: ${c.id}`);
const data={version:1,season:`${seasonYear}/${String(seasonYear+1).slice(-2)}`,asOf,financeYear:'2024/25',financePublication:'Deloitte Football Money League 2026',financeSource:'https://en.wikipedia.org/wiki/Deloitte_Football_Money_League#2024–25',sources:endpoints,clubs,players};
await writeFile(new URL('snapshot.json.tmp',dir),JSON.stringify(data));
await rename(new URL('snapshot.json.tmp',dir),new URL('snapshot.json',dir));
if(!process.argv.includes('--offline'))for(const [k,v] of Object.entries(raw))await writeFile(new URL(`raw/${k}.json`,dir),JSON.stringify(v));
if(!process.argv.includes('--offline'))await writeFile(new URL('raw/metadata.json',dir),JSON.stringify({asOf,season:data.season}));
console.log(`Saved ${data.season}: ${clubs.length} teams, ${players.length} players, ${players.filter(p=>clubs.find(c=>c.id===p.club).playable).length} transferable players (${asOf}).`);
