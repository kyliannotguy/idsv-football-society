export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const round=n=>Math.round(n*100)/100;
export const POSITIONS=['GK','DEF','MID','FWD'];
export const FORMATIONS={'4-3-3':[1,4,3,3],'4-4-2':[1,4,4,2],'3-5-2':[1,3,5,2]};
export function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const hashString=value=>[...String(value)].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,2166136261);
const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
const clubPower=(club)=>club.base+(club.revenue||0)/180+(club.actual?.rank?clamp(21-club.actual.rank,0,20)*.16:0);
export function newGame(data,clubId,seed=Date.now()>>>0){
 const club=data.clubs.find(c=>c.id===clubId&&c.playable);if(!club)throw Error('请选择可执教球队。');
 const state={version:1,snapshot:data.asOf,clubId,seed,day:0,cash:club.budget,players:structuredClone(data.players),deals:[],history:[],events:[],formation:'4-3-3',startingXI:[],watch:[],result:null};
 state.startingXI=autoLineup(state).flat().map(p=>p.id);
 return state;
}
export const roster=(state,id=state.clubId)=>state.players.filter(p=>p.club===id);
function autoLineup(state,id=state.clubId){
 const formation=id===state.clubId?state.formation:'4-3-3';
 return POSITIONS.map((pos,i)=>roster(state,id).filter(p=>p.pos===pos).sort((a,b)=>b.rating-a.rating).slice(0,FORMATIONS[formation][i]));
}
export function lineup(state,id=state.clubId){
 if(id!==state.clubId||!Array.isArray(state.startingXI)||!state.startingXI.length)return autoLineup(state,id);
 const formation=state.formation,selected=new Set(),manual=new Set(state.startingXI);
 return POSITIONS.map((pos,i)=>{
  const slots=FORMATIONS[formation][i],candidates=roster(state,id).filter(p=>p.pos===pos),chosen=candidates.filter(p=>manual.has(p.id)).sort((a,b)=>b.rating-a.rating).slice(0,slots);
  chosen.forEach(p=>selected.add(p.id));
  const fill=candidates.filter(p=>!selected.has(p.id)).sort((a,b)=>b.rating-a.rating).slice(0,Math.max(0,slots-chosen.length));
  fill.forEach(p=>selected.add(p.id));
  return [...chosen,...fill];
 });
}
export function resetLineup(state){state.startingXI=autoLineup(state).flat().map(p=>p.id);return state.startingXI;}
export function toggleStarter(state,playerId){
 if(state.result||state.day>=42)throw Error('转会窗关闭后不能调整首发。');
 const p=state.players.find(p=>p.id===playerId);if(!p||p.club!==state.clubId)throw Error('只能调整本队球员。');
 const current=lineup(state).flat(),ids=new Set(current.map(p=>p.id)),slots=FORMATIONS[state.formation][POSITIONS.indexOf(p.pos)];
 if(ids.has(playerId)){
  const replacement=roster(state).filter(x=>x.pos===p.pos&&!ids.has(x.id)).sort((a,b)=>b.rating-a.rating)[0];
  if(!replacement)throw Error(`${p.pos} 没有可替换的轮换球员。`);
  ids.delete(playerId);ids.add(replacement.id);
 }else{
  const same=current.filter(x=>x.pos===p.pos);
  if(same.length>=slots){const weakest=same.toSorted((a,b)=>a.rating-b.rating)[0];ids.delete(weakest.id);}
  ids.add(playerId);
 }
 state.startingXI=[...ids];
 return lineup(state).flat();
}
export function squadRating(state,id=state.clubId){
 const rows=lineup(state,id), selected=rows.flat();
 const sum=selected.reduce((n,p)=>n+p.rating,0)+(11-selected.length)*45;
 const bench=roster(state,id).filter(p=>!selected.includes(p)).sort((a,b)=>b.rating-a.rating).slice(0,7);
 return round(sum/11*.88+(bench.reduce((n,p)=>n+p.rating,0)+(7-bench.length)*45)/7*.12);
}
export function finances(state,data){
 const c=data.clubs.find(c=>c.id===state.clubId);
 const wage=round(roster(state).reduce((n,p)=>n+p.wage,0));
 const initialWage=data.players.filter(p=>p.club===c.id).reduce((n,p)=>n+p.wage,0);
 const revenue=round(c.revenue*(1+c.growth));
 const wageLimit=round(Math.max(initialWage*1.18,revenue*.34));
 const amortization=round(state.deals.filter(d=>d.type==='buy').reduce((n,d)=>n+d.fee/d.years,0));
 const oldAmortization=round(c.revenue*.16);
 const operations=round(c.revenue*.45);
 const surplus=round(revenue-wage-operations-oldAmortization-amortization);
 return {wage,wageLimit,revenue,low:round(revenue*.88),high:round(revenue*1.12),amortization,oldAmortization,operations,surplus,costRatio:round((wage+oldAmortization+amortization)/revenue*100)};
}
function sellerAsk(state,data,p,me,seller){
 const depth=roster(state,seller.id).filter(x=>x.pos===p.pos).length;
 const pressure=seller.actual?.rank>=16?.12:seller.actual?.rank<=4?-.08:0;
 const scarcity=depth<=2?.14:depth<=4?.04:-.03;
 const contract=finite(p.contractYears,3)<=1?.1:finite(p.contractYears,3)>=4?-.03:0;
 const rivalry=me.league===seller.league?.1:0;
 const ask=clamp(.97+pressure+scarcity+contract+rivalry+(seller.id===p.club&&p.rating>=88?.07:0),.88,1.42);
 return round(p.value*ask);
}
function playerWageAsk(state,data,p,me,seller){
 const ambition=finite(p.ambition,.55), buyerPower=clubPower(me), sellerPower=clubPower(seller);
 const moveUp=buyerPower-sellerPower;
 return round(p.wage*(1.03+ambition*.12+(moveUp<0?Math.min(.17,Math.abs(moveUp)*.012):0)+(p.preference===me.league?.04:0)));
}
export function quote(state,data,playerId){
 const p=state.players.find(p=>p.id===playerId);if(!p)throw Error('球员不存在。');
 const me=data.clubs.find(c=>c.id===state.clubId),seller=data.clubs.find(c=>c.id===p.club);
 const rival=me.league===seller.league;
 const fee=sellerAsk(state,data,p,me,seller),wage=playerWageAsk(state,data,p,me,seller);
 const releaseClause=finite(p.releaseClause,0)>0?round(p.releaseClause):null;
 return {fee,wage,releaseClause,rival,clubPower:round(clubPower(me)),sellerPower:round(clubPower(seller)),playerReason:p.preference===me.league?'球员偏好这个联赛':'球员会比较薪资、出场机会与球队竞争力'};
}
export function negotiationProbability(state,data,p,offer){
 const q=quote(state,data,p.id),me=data.clubs.find(c=>c.id===state.clubId),seller=data.clubs.find(c=>c.id===p.club);
 const feeRatio=offer.fee/Math.max(.1,q.fee),wageRatio=offer.wage/Math.max(.1,q.wage);
 let chance=.12+clamp((feeRatio-.68)*.70,0,.68)+clamp((wageRatio-.72)*.42,0,.43);
 if(offer.years>=4)chance+=.045;if(offer.years===2)chance-=.045;
 if(clubPower(me)>clubPower(seller)+3)chance+=.07;if(clubPower(me)<clubPower(seller)-3)chance-=.08;
 if(p.preference===me.league)chance+=.055;
 if(q.releaseClause&&offer.fee>=q.releaseClause)chance+=.12;
 chance-=finite(p.loyalty,.5)*.075;
 if(feeRatio<.35)chance=Math.min(chance,.04);
 return clamp(chance,.06,.96);
}
export function sellQuote(p,buyer,data,state){
 if(!buyer||!data||!state)return round(p.value*.85);
 const need=lineup(state,buyer.id).filter(row=>row.some(x=>x.pos===p.pos)).length?0:.08;
 const room=clamp((buyer.budget-(state.deals||[]).filter(d=>d.to===buyer.id).reduce((n,d)=>n+d.fee,0))/Math.max(1,buyer.budget),0,1);
 const random=rng((state.seed^hashString(`${p.id}:${buyer.id}:price`))>>>0)();
 return round(p.value*clamp(.70+need+room*.12+random*.18,.62,1.08));
}
export function readiness(state){
 const players=roster(state), counts=Object.fromEntries(POSITIONS.map(p=>[p,players.filter(x=>x.pos===p).length]));
 const errors=[];
 if(players.length<18)errors.push('至少需要 18 名球员');
 const needs=FORMATIONS[state.formation];
 POSITIONS.forEach((p,i)=>{const min=Math.max(needs[i],p==='GK'?2:0);if(counts[p]<min)errors.push(`${p} 至少需要 ${min} 人`);});
 return errors;
}
function available(state){if(state.result)throw Error('赛季已结算，请开启新档。');if(state.day>=42)throw Error('转会窗已关闭，请开始赛季。');}
export function buy(state,data,{playerId,fee,wage,years}){
 available(state);
 const p=state.players.find(p=>p.id===playerId);
 if(!p||p.club===state.clubId||!data.clubs.find(c=>c.id===p.club)?.playable)throw Error('该球员不在可交易市场。');
 if(!Number.isFinite(fee)||fee<=0||!Number.isFinite(wage)||wage<=0||!Number.isInteger(years)||years<2||years>5)throw Error('请输入有效报价、年薪和 2–5 年合同。');
 const fees=round(fee*1.03);
 if(state.cash<fees)throw Error('转会预算不足（包括 3% 经纪费用）。');
 if(roster(state).length>=40)throw Error('游戏阵容上限为 40 人，请先出售球员。');
 const fin=finances(state,data);if(fin.wage+wage>fin.wageLimit)throw Error('新合同将超过董事会工资上限。');
 const oldClub=p.club, remaining=roster(state,oldClub).filter(x=>x.id!==p.id);
 if(remaining.length<16||remaining.filter(x=>x.pos===p.pos).length<({GK:1,DEF:4,MID:3,FWD:1})[p.pos])throw Error('卖方阵容深度不足，拒绝出售。');
 const q=quote(state,data,p.id),probability=negotiationProbability(state,data,p,{fee,wage,years});
 const random=rng((state.seed^hashString(`${p.id}:${state.day}:${state.deals.length}`))>>>0)();
 state.day=Math.min(42,state.day+2);
 const clauseMet=q.releaseClause&&fee>=q.releaseClause;
 if(random>=probability){
  const seller=data.clubs.find(c=>c.id===p.club),playerOpen=fee>=q.fee*.8&&wage>=q.wage*.85;
  let event='';
  if(playerOpen&&random>probability+.12&&finite(p.loyalty,.5)<.62){p.striking=true;event=`${p.name} 不满留队安排，开始罢训。` ;state.events.unshift({type:'strike',playerId:p.id,day:state.day});}
  const counterFee=round(Math.max(q.fee,fee*1.08)),counterWage=round(Math.max(q.wage,wage*1.06));
  state.history.unshift({day:state.day,text:`${p.name} 的谈判未达成：${clauseMet?'球员本人没有接受个人条款':'卖方或球员要求更好的条件'}。${event}`});
  return {ok:false,kind:'counter',probability,message:`这次没有成交（成功率约 ${Math.round(probability*100)}%）。${event||`${seller.name} 与球员团队要求提高条件。`} 可尝试 €${counterFee}M / 年薪 €${counterWage}M。`,counter:{fee:counterFee,wage:counterWage},event};
 }
 const oldWage=p.wage;p.club=state.clubId;p.wage=round(wage);p.signed=true;
 p.striking=false;
 state.cash=round(state.cash-fees);
 state.deals.unshift({type:'buy',playerId:p.id,name:p.name,fee:round(fee),agentFee:round(fee*.03),wage:round(wage),oldWage,years,from:oldClub,to:state.clubId,day:state.day});
 state.history.unshift({day:state.day,text:`签下 ${p.name}，转会费 €${round(fee)}M，合同 ${years} 年。`});
 return {ok:true,message:`${p.name} 正式加盟！本次谈判成功率约 ${Math.round(probability*100)}%。`};
}
export function sell(state,data,playerId,buyerId){
 available(state);
 const p=state.players.find(p=>p.id===playerId);
 if(!p||p.club!==state.clubId)throw Error('该球员不属于你的球队。');
 if(p.signed)throw Error('本转会窗新签球员不能再次出售。');
 const buyer=data.clubs.find(c=>c.id===buyerId&&c.playable&&c.id!==state.clubId);
 if(!buyer)throw Error('请选择有效买家。');
 if(roster(state,buyer.id).length>=40)throw Error('买方阵容已满。');
 const proceeds=sellQuote(p,buyer,data,state), spent=state.deals.filter(d=>d.to===buyer.id).reduce((n,d)=>n+d.fee,0),received=state.deals.filter(d=>d.from===buyer.id).reduce((n,d)=>n+d.fee,0);
 if(spent+proceeds>buyer.budget+received)throw Error('买方剩余预算不足，请选择另一家俱乐部。');
 const candidate={...state,players:state.players.filter(x=>x.id!==p.id)};
 if(readiness(candidate).length)throw Error(`出售后阵容不完整：${readiness(candidate).join('；')}。`);
 const interest=clamp(.58+(p.rating>buyer.base?-.10:.05)+(roster(state,buyer.id).filter(x=>x.pos===p.pos).length<4?.14:0)+(buyer.league===data.clubs.find(c=>c.id===state.clubId).league?.04:0),.25,.9);
 const random=rng((state.seed^hashString(`${p.id}:${buyer.id}:${state.day}`))>>>0)();
 state.day=Math.min(42,state.day+1);
 if(random>=interest){state.history.unshift({day:state.day,text:`${buyer.name} 退出了对 ${p.name} 的谈判，报价约 €${proceeds}M。`});return {ok:false,message:`${buyer.name} 暂时不愿推进交易（兴趣度约 ${Math.round(interest*100)}%），你没有收到转会费。`};}
 p.club=buyer.id;state.cash=round(state.cash+proceeds); 
 state.deals.unshift({type:'sell',playerId:p.id,name:p.name,fee:proceeds,wage:p.wage,from:state.clubId,to:buyer.id,day:state.day});
 state.history.unshift({day:state.day,text:`${p.name} 加盟${buyer.name}，收到 €${proceeds}M。`});
 return {ok:true,message:`出售完成，${buyer.name} 支付 €${proceeds}M，买方兴趣度约 ${Math.round(interest*100)}%。`};
}
export function advance(state){available(state);state.day=Math.min(42,state.day+7);state.history.unshift({day:state.day,text:state.day===42?'转会截止日已到，等待赛季开启。':'一周过去，球探已更新候选名单。'});}
export function fixtures(ids){
 const ring=[...ids], first=[];
 for(let r=0;r<ring.length-1;r++){
  const games=[];for(let i=0;i<ring.length/2;i++){let a=ring[i],b=ring[ring.length-1-i];games.push(r%2?[b,a]:[a,b]);}first.push(games);ring.splice(1,0,ring.pop());
 }
 return [...first,...first.map(g=>g.map(([a,b])=>[b,a]))];
}
function poisson(lambda,u){let p=Math.exp(-lambda),sum=p,k=0;while(u>sum&&k<15){k++;p*=lambda/k;sum+=p;}return k;}
function playLeague(state,data,seed){
 const league=data.clubs.find(c=>c.id===state.clubId).league, clubs=data.clubs.filter(c=>c.league===league);
 const random=rng(seed), baseline=newGame(data,state.clubId,seed);
 const strengths=Object.fromEntries(clubs.map(c=>{
  const own=roster(state,c.id),original=data.players.filter(p=>p.club===c.id);
  const difference=original.length? squadRating(state,c.id)-squadRating(baseline,c.id):0;
  const arrivals=state.deals.filter(d=>d.to===c.id).length;
  const injuryLoss=own.filter(p=>p.injured).length*.16;
  const strikeLoss=own.filter(p=>p.striking).length*.38;
  return [c.id,c.base+c.formAdjustment+difference*1.25-Math.max(0,arrivals-3)*.35-injuryLoss-strikeLoss];
 }));
 const table=Object.fromEntries(clubs.map(c=>[c.id,{id:c.id,played:0,w:0,d:0,l:0,gf:0,ga:0,points:0,form:[]} ]));
 const rounds=[];
 for(const [index,pairs] of fixtures(clubs.map(c=>c.id)).entries()){
  const matches=[];
  for(const [home,away] of pairs){
   // Fixed draws per match keep counterfactual and actual seasons comparable.
   const diff=strengths[home]-strengths[away],shock=(random()-.5)*.3;
   const hg=poisson(clamp(1.48*Math.exp(diff/19+shock),.18,4.8),random());
   const ag=poisson(clamp(1.15*Math.exp(-diff/19-shock),.15,4.3),random());
   const h=table[home],a=table[away];h.played++;a.played++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;
   if(hg>ag){h.w++;a.l++;h.points+=3;h.form.push('W');a.form.push('L');}else if(hg<ag){a.w++;h.l++;a.points+=3;h.form.push('L');a.form.push('W');}else{h.d++;a.d++;h.points++;a.points++;h.form.push('D');a.form.push('D');}
   matches.push({home,away,hg,ag});
  }
  const standings=Object.values(table).toSorted((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.id.localeCompare(b.id));
  rounds.push({round:index+1,match:matches.find(m=>m.home===state.clubId||m.away===state.clubId),rank:standings.findIndex(t=>t.id===state.clubId)+1,points:table[state.clubId].points});
 }
 const standings=Object.values(table).toSorted((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.id.localeCompare(b.id));
 return {table:standings,rounds,rank:standings.findIndex(t=>t.id===state.clubId)+1,points:table[state.clubId].points};
}
export function simulate(state,data){
 if(state.result)return state.result;
 const errors=readiness(state);if(errors.length)throw Error(errors.join('；'));
 const original=newGame(data,state.clubId,state.seed);
 const actual=playLeague(state,data,state.seed),baseline=playLeague(original,data,state.seed);
 const samples=Array.from({length:60},(_,i)=>playLeague(state,data,(state.seed+i*7919+12345)>>>0));
 const ranks=samples.map(x=>x.rank).sort((a,b)=>a-b);
 const c=data.clubs.find(c=>c.id===state.clubId),f=finances(state,data);
 const sporting=Math.round(clamp(40+(c.target-actual.rank)*4,0,50));
 const financial=Math.round(clamp(15+10*state.cash/c.budget-Math.max(0,f.costRatio-65)*.8,0,25));
 const improvement=Math.round(clamp(7.5+(actual.points-baseline.points)*.6,0,15));
 const team=lineup(state).flat(),young=team.filter(p=>p.age!==null&&p.age<=23).length;
 const future=Math.round(clamp(young*1.7,0,10));
 const finalRevenue=round(f.revenue*(actual.rank<=4?1.08:actual.rank>=18?.8:1));
 const result={...actual,baseline:{rank:baseline.rank,points:baseline.points},forecast:{low:ranks[5],high:ranks[53],title:Math.round(samples.filter(x=>x.rank===1).length/60*100),top4:Math.round(samples.filter(x=>x.rank<=4).length/60*100),samples:60},score:{sporting,financial,improvement,future,total:sporting+financial+improvement+future},finance:{...f,finalRevenue,finalSurplus:round(f.surplus+finalRevenue-f.revenue)}};
 state.result=result;state.day=42;return result;
}
export function restore(saved,data){
 if(!saved||saved.version!==1||saved.snapshot!==data.asOf||!data.clubs.some(c=>c.id===saved.clubId&&c.playable)||!FORMATIONS[saved.formation]||!Array.isArray(saved.deals)||!Array.isArray(saved.players)||saved.players.length!==data.players.length||!Number.isFinite(saved.cash)||saved.cash<0||!Number.isFinite(saved.seed)||!Number.isInteger(saved.day)||saved.day<0||saved.day>42||!Array.isArray(saved.watch)||!Array.isArray(saved.history)||(saved.events!==undefined&&!Array.isArray(saved.events)))throw Error('存档与当前数据不兼容，请开启新档。');
 const ids=new Set();for(const p of saved.players){if(ids.has(p.id)||!data.players.some(x=>x.id===p.id)||!data.clubs.some(c=>c.id===p.club)||!POSITIONS.includes(p.pos)||!Number.isFinite(p.rating)||!Number.isFinite(p.wage))throw Error('存档球员数据损坏。');ids.add(p.id);}
 const validClub=id=>data.clubs.some(c=>c.id===id&&c.playable);
 for(const d of saved.deals)if(!['buy','sell'].includes(d.type)||!ids.has(d.playerId)||!validClub(d.from)||!validClub(d.to)||!Number.isFinite(d.fee)||d.fee<=0||!Number.isInteger(d.day)||d.day<0||d.day>42||(d.type==='buy'&&(!Number.isInteger(d.years)||d.years<2||d.years>5||!Number.isFinite(d.agentFee))))throw Error('转会账本损坏。');
 for(const h of saved.history)if(!Number.isInteger(h.day)||h.day<0||h.day>42||typeof h.text!=='string')throw Error('存档历史损坏。');
 if(saved.watch.some(id=>!ids.has(id)))throw Error('关注列表损坏。');
 const legacyState={...saved,players:saved.players.map(p=>({...data.players.find(x=>x.id===p.id),club:p.club,wage:p.wage,signed:!!p.signed})),startingXI:[]};
 const defaultXI=autoLineup(legacyState).flat().map(p=>p.id);
 const requestedXI=saved.startingXI===undefined?defaultXI:saved.startingXI;
 if(!Array.isArray(requestedXI)||new Set(requestedXI).size!==requestedXI.length||requestedXI.length!==11||requestedXI.some(id=>!ids.has(id)||saved.players.find(p=>p.id===id).club!==saved.clubId))throw Error('首发阵容数据损坏。');
 const clean={...saved,events:Array.isArray(saved.events)?saved.events:[],startingXI:requestedXI,players:saved.players.map(p=>({...data.players.find(x=>x.id===p.id),club:p.club,wage:p.wage,signed:!!p.signed,striking:!!p.striking})),deals:saved.deals.map(d=>({...d,name:data.players.find(p=>p.id===d.playerId).name,years:d.type==='buy'?d.years:undefined,agentFee:d.type==='buy'?d.agentFee:0})),result:null};
 // Recompute results from the validated state instead of trusting imported HTML-facing result fields.
 if(saved.result)simulate(clean,data);
 return clean;
}
