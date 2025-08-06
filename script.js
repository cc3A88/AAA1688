// **JS Panel (純 JS，勿含 <script> 標籤)**
const states = ['B','P','T'];
let transitions = { B:{}, P:{}, T:{} };
states.forEach(a=>states.forEach(b=>transitions[a][b]=0));
let historyArr = [];

// 大路坐標與 Markov 道路生成
function genBigRoad(arr) {
  const road=[]; let col=0,row=0;
  arr.forEach((v,i)=>{
    if(i===0) { road.push({v,col,row}); return; }
    const prev=road[road.length-1];
    if(v===prev.v) row++; else { col++; row=0; }
    road.push({v,col,row});
  });
  return road;
}
function genMarkov(arr,offset) {
  return arr.slice(offset).map((v,i)=>v===arr[i]?1:2);
}

// 繪製大路與 Markov 道路
function drawBigRoad(id) {
  const road=genBigRoad(historyArr);
  const c=document.getElementById(id),ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  road.forEach(cell=>{
    const x=cell.col*24+24, y=cell.row*24+12, r=8;
    ctx.beginPath(); ctx.arc(x,y,r,0,2*Math.PI);
    ctx.fillStyle = cell.v==='B'? '#00ffe7':'#0077ff'; ctx.fill();
    if(cell.v==='T'){ ctx.strokeStyle=ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(x-r,y-r); ctx.lineTo(x+r,y+r);
      ctx.moveTo(x+r,y-r); ctx.lineTo(x-r,y+r);
      ctx.stroke();
    }
  });
}
function drawMarkovRoad(id,offset) {
  const marks=genMarkov(historyArr,offset);
  const c=document.getElementById(id),ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  marks.forEach((m,i)=>{
    const x=i*20+10, y=c.height/2, r=6;
    ctx.beginPath(); ctx.arc(x,y,r,0,2*Math.PI);
    ctx.fillStyle = m===1? '#00ffe7':'#0077ff'; ctx.fill();
  });
}

// 渲染歷史、預測、模式與建議
function renderHistory() {
  document.getElementById('history').textContent = historyArr.join(' ') || '—';
}
function renderPrediction() {
  const ids={B:'prob-B',P:'prob-P',T:'prob-T'};
  if(!historyArr.length) {
    states.forEach(s=>document.getElementById(ids[s]).textContent=(100/3).toFixed(1));
    return;
  }
  const last=historyArr.slice(-1)[0],cnt=transitions[last],sum=cnt.B+cnt.P+cnt.T;
  states.forEach(s=>{
    document.getElementById(ids[s]).textContent = (sum? cnt[s]/sum*100 : 100/3).toFixed(1);
  });
}
function detectPatterns() {
  const lens=[]; let c=1;
  for(let i=1;i<historyArr.length;i++){
    if(historyArr[i]===historyArr[i-1]) c++;
    else { lens.push(c); c=1; }
  }
  if(historyArr.length) lens.push(c);
  return {
    single: lens.slice(-3).every(v=>v===1),
    double: lens.slice(-2).every(v=>v===2),
    oneTwo: lens.length>=2 && lens[lens.length-2]===1 && lens.slice(-1)[0]===2,
    dragon: lens.slice(-1)[0]>=5
  };
}
function renderPatterns() {
  const p=detectPatterns();
  document.getElementById('pattern-single').textContent = p.single?'是':'否';
  document.getElementById('pattern-double').textContent = p.double?'是':'否';
  document.getElementById('pattern-one-two').textContent = p.oneTwo?'是':'否';
  document.getElementById('pattern-dragon').textContent = p.dragon?'是':'否';
}
function renderSuggestion() {
  let sug;
  const pat=detectPatterns();
  const last=historyArr.slice(-1)[0],op=last==='B'?'P':last==='P'?'B':'T';
  if(pat.single) sug=op;
  else if(pat.double) sug=last;
  else if(pat.oneTwo){
    const lens=[]; let c=1;
    for(let i=1;i<historyArr.length;i++){
      if(historyArr[i]===historyArr[i-1]) c++; else { lens.push(c); c=1; }
    }
    lens.push(c);
    sug = (lens[lens.length-1]===1? last : op);
  } else if(pat.dragon) sug=last;
  else {
    const markov = states.map(s=>({s,p:parseFloat(document.getElementById('prob-'+s).textContent)}))
                        .sort((a,b)=>b.p-a.p)[0].s;
    sug = markov;
  }
  document.getElementById('suggestion').textContent = sug==='B'?'下注莊家':sug==='P'?'下注閒家':'下注和局';
}

function renderAll(){
  renderHistory();
  renderPrediction();
  renderPatterns();
  drawBigRoad('canvas-bigRoad');
  drawMarkovRoad('canvas-bigEye',1);
  drawMarkovRoad('canvas-smallRoad',2);
  drawMarkovRoad('canvas-cockroach',3);
  renderSuggestion();
}

// 綁定按鈕事件
['B','P','T'].forEach(s=>{
  document.getElementById('btn-'+s).onclick = ()=>{ 
    if(historyArr.length){
      const prev=historyArr[historyArr.length-1];
      transitions[prev][s] = (transitions[prev][s]||0)+1;
    }
    historyArr.push(s); renderAll();
  };
});
document.getElementById('btn-undo').onclick = ()=>{ 
  if(!historyArr.length) return;
  const r=historyArr.pop();
  if(historyArr.length){
    const p=historyArr[historyArr.length-1];
    transitions[p][r] = Math.max(0,(transitions[p][r]||0)-1);
  }
  renderAll();
};
document.getElementById('btn-reset').onclick = ()=>{
  states.forEach(a=>states.forEach(b=>transitions[a][b]=0));
  historyArr=[]; renderAll();
};

renderAll();
