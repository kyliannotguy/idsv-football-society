import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newGame,roster,lineup,readiness,finances,quote,negotiationProbability,buy,sell,sellQuote,fixtures,simulate,restore,advance,toggleStarter,resetLineup} from '../engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../data/snapshot.json',import.meta.url)));
test('snapshot has exact requested 11 playable teams and complete leagues',()=>{
 assert.equal(data.clubs.filter(c=>c.playable).length,11);
 for(const league of ['eng','esp'])assert.equal(data.clubs.filter(c=>c.league===league).length,20);
 assert.equal(new Set(data.players.map(p=>p.id)).size,data.players.length);
 for(const c of data.clubs.filter(c=>c.playable))assert.deepEqual(readiness(newGame(data,c.id)),[],c.id);
});
test('double round robin covers every ordered pair once and 38 rounds',()=>{
 const ids=data.clubs.filter(c=>c.league==='eng').map(c=>c.id),schedule=fixtures(ids);
 assert.equal(schedule.length,38);assert.equal(schedule.flat().length,380);
 assert.equal(new Set(schedule.flat().map(p=>p.join(':'))).size,380);
 for(const round of schedule){assert.equal(new Set(round.flat()).size,20);assert.equal(round.length,10);}
});
test('manager can manually adjust the starting XI within formation slots',()=>{
 const s=newGame(data,'arsenal',12),before=lineup(s).flat(),bench=roster(s).filter(p=>p.pos==='MID'&&!before.some(x=>x.id===p.id)).sort((a,b)=>b.rating-a.rating)[0];
 assert.ok(bench);toggleStarter(s,bench.id);const after=lineup(s).flat();
 assert.equal(after.length,11);assert.ok(after.some(p=>p.id===bench.id));assert.notDeepEqual(after.map(p=>p.id).sort(),before.map(p=>p.id).sort());
 const currentMid=after.find(p=>p.pos==='MID');toggleStarter(s,currentMid.id);assert.equal(lineup(s).flat().length,11);assert.ok(!lineup(s).flat().some(p=>p.id===currentMid.id));
 s.formation='4-4-2';resetLineup(s);assert.equal(lineup(s).filter((_,i)=>i===2)[0].length,4);assert.equal(lineup(s).flat().length,11);
});
test('transfer and sale conserve ownership, apply cash costs and yearly amortization',()=>{
 const s=newGame(data,'arsenal',42),p=s.players.find(p=>p.club==='chelsea'&&p.pos==='MID'&&p.value<40),q=quote(s,data,p.id),before=s.cash;
 const f=finances(s,data);assert.ok(buy(s,data,{playerId:p.id,...q,years:5}).ok);
 assert.equal(p.club,'arsenal');assert.equal(s.players.filter(x=>x.id===p.id).length,1);
 assert.ok(Math.abs(before-s.cash-q.fee*1.03)<.011);
 assert.ok(Math.abs(finances(s,data).amortization-q.fee/5)<.011);
 assert.ok(Math.abs(finances(s,data).wage-f.wage-q.wage)<.011);
 assert.throws(()=>buy(s,data,{playerId:p.id,...q,years:5}),/不在可交易/);
 assert.throws(()=>sell(s,data,p.id,'chelsea'),/不能再次出售/);
 const outgoing=roster(s).filter(p=>p.pos==='DEF'&&!p.signed).sort((a,b)=>a.value-b.value)[0];
 const buyer=data.clubs.find(c=>c.id==='liverpool'),old=s.cash,amount=sellQuote(outgoing,buyer,data,s);sell(s,data,outgoing.id,'liverpool');
 assert.equal(outgoing.club,'liverpool');assert.ok(Math.abs(s.cash-old-amount)<.001);
 assert.equal(s.day,3);assert.equal(s.deals.length,2);
});
test('negotiations use player and club factors, release clauses and seeded randomness',()=>{
 const target=data.players.find(p=>p.club==='barcelona'&&p.releaseClause);
 assert.ok(target,'snapshot should include some release clauses');
 const arsenal=newGame(data,'arsenal',77),madrid=newGame(data,'real-madrid',77);
 const aq=quote(arsenal,data,target.id),mq=quote(madrid,data,target.id);
 assert.notEqual(aq.fee,mq.fee,'league rivalry / buyer context should change the ask');
 assert.ok(aq.releaseClause>0);
 assert.ok(negotiationProbability(arsenal,data,target,{fee:aq.releaseClause,wage:aq.wage,years:5})>negotiationProbability(arsenal,data,target,{fee:aq.fee*.55,wage:aq.wage*.7,years:2}));
 const sameA=newGame(data,'arsenal',123),sameB=newGame(data,'arsenal',123),pA=sameA.players.find(p=>p.club==='chelsea'&&p.pos==='MID'),pB=sameB.players.find(p=>p.id===pA.id),q=quote(sameA,data,pA.id),offer={fee:q.fee,wage:q.wage,years:5};
 assert.deepEqual(buy(sameA,data,{playerId:pA.id,...offer}),buy(sameB,data,{playerId:pB.id,...offer}));
 const outcomes=new Set();for(let seed=1;seed<=24;seed++){const s=newGame(data,'arsenal',seed),p=s.players.find(p=>p.club==='chelsea'&&p.pos==='MID'),q=quote(s,data,p.id);outcomes.add(buy(s,data,{playerId:p.id,fee:q.fee,wage:q.wage,years:5}).ok?'accepted':'rejected');}
 assert.equal(outcomes.size,2,'the same terms should not always resolve the same way across new games');
 let strike=false;for(let seed=1;seed<=500&&!strike;seed++){const s=newGame(data,'arsenal',seed),p=s.players.find(p=>p.club==='chelsea'&&p.loyalty<.62&&p.pos==='MID');if(!p)continue;const q=quote(s,data,p.id);buy(s,data,{playerId:p.id,fee:q.fee*.85,wage:q.wage,years:5});strike=Boolean(p.striking);}
 assert.ok(strike,'some failed negotiations should create a player unrest / training strike event');
 const seller=newGame(data,'arsenal',9),out=roster(seller).find(p=>p.pos==='DEF'&&!p.signed),b1=data.clubs.find(c=>c.id==='liverpool'),b2=data.clubs.find(c=>c.id==='real-madrid');
 assert.notEqual(sellQuote(out,b1,data,seller),sellQuote(out,b2,data,seller),'different buyers should submit different indicative bids');
});
test('rejected bid consumes time but never money or player ownership',()=>{
 const s=newGame(data,'arsenal',1),p=s.players.find(p=>p.club==='chelsea'&&p.pos==='MID'),q=quote(s,data,p.id),before=s.cash;
 const r=buy(s,data,{playerId:p.id,fee:1,wage:q.wage,years:5});
 assert.equal(r.ok,false);assert.equal(s.day,2);assert.equal(s.cash,before);assert.equal(p.club,'chelsea');assert.equal(s.deals.length,0);
});
test('invalid fees, contracts, excess wages, budget and closed windows are rejected atomically',()=>{
 const s=newGame(data,'arsenal',1),p=s.players.find(p=>p.club==='chelsea'&&p.pos==='MID'),q=quote(s,data,p.id);
 for(const [fee,wage,years] of [[NaN,1,5],[-1,1,5],[1,Infinity,5],[1,1,0],[99999,1,5],[1,99999,5]]){
  const before=JSON.stringify(s);assert.throws(()=>buy(s,data,{playerId:p.id,fee,wage,years}));assert.equal(JSON.stringify(s),before);
 }
 s.day=42;assert.throws(()=>buy(s,data,{playerId:p.id,...q,years:5}),/关闭/);
});
test('cannot sell below formation or goalkeeper minimum',()=>{
 const s=newGame(data,'chelsea',1),gk=roster(s).find(p=>p.pos==='GK');assert.throws(()=>sell(s,data,gk.id,'man-city'),/阵容不完整/);assert.equal(gk.club,'chelsea');
});
test('simulation invariants, scoring bounds, same-seed baseline and deterministic reload',()=>{
 for(const id of ['arsenal','barcelona']){
  const s=newGame(data,id,8675309),r=simulate(s,data);
  assert.equal(r.table.length,20);assert.equal(r.rounds.length,38);
  assert.equal(r.rank,r.baseline.rank);assert.equal(r.points,r.baseline.points);
  assert.equal(r.table.reduce((a,t)=>a+t.gf,0),r.table.reduce((a,t)=>a+t.ga,0));
  assert.equal(r.table.reduce((a,t)=>a+t.w,0),r.table.reduce((a,t)=>a+t.l,0));
  for(const t of r.table){assert.equal(t.played,38);assert.equal(t.w+t.d+t.l,38);assert.equal(t.points,3*t.w+t.d);}
  assert.ok(r.score.total>=0&&r.score.total<=100);assert.ok(r.forecast.low<=r.forecast.high);
  assert.deepEqual(simulate(newGame(data,id,8675309),data),r);
  assert.deepEqual(restore(JSON.parse(JSON.stringify(s)),data).result,r);
  assert.equal(simulate(s,data),r);assert.throws(()=>advance(s),/结算/);
 }
});
test('all 11 clubs finish a complete playable season',()=>{
 for(const c of data.clubs.filter(c=>c.playable))assert.ok(simulate(newGame(data,c.id,7),data).rank>=1,c.id);
});
test('save validation rejects corruption and restores authoritative player information',()=>{
 const s=newGame(data,'arsenal',1);assert.deepEqual(restore(JSON.parse(JSON.stringify(s)),data).clubId,s.clubId);
 const legacy={...s};delete legacy.events;assert.deepEqual(restore(legacy,data).events,[]);
 assert.throws(()=>restore({...s,snapshot:'old'},data));assert.throws(()=>restore({...s,day:Infinity},data));
 assert.throws(()=>restore({...s,history:[{day:'<img>',text:'x'}]},data));
 assert.throws(()=>restore({...s,players:[s.players[0],...s.players.slice(0,-1)]},data));
});
