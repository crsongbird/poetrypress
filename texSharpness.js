/**
 * texSharpness.js — √ Sharpness. Value: off-white against blue-black.
 *
 * Waking; metal at the edges. Lotus, 90s dots, still rain, the painter's
 * frustration, silverpoint hatch, metal leaf, waking grain.
 */
import { makeNoiseGrid, sampleNoiseGrid, parseHex, withSeed, CPU, canonArea, cpx, lightVec, scaleNow, canonDiv, lightHeights, litK } from './texCore.js';

// The flower's FORM, as keyframes of a few numbers. The Form knob (0–1)
// blends continuously between neighbours, so every position in between is a
// real flower too — including ones that don't exist.
//   n       petals in the outer ring        rings    rings of petals
//   len     petal length (of the radius)    wide     petal width
//   round   tip roundness (0 pointed)       notch    a split tip, like cherry
//   spread  how much of the circle the petals fan across (bell buds fan narrow)
//   heart   centre size                     seeds    a seeded centre (sunflower)
//   stamens count, and stamLen their length rib      a pale midrib (day lily)
//   sepals  share of the outer ring that is green    spiral  rings turn by the golden angle
//   cluster breaks the bloom into many small florets (hydrangea)
//   pod     a lotus's seed pod: a flat-topped cone pitted with seed cells,
//           ringed by its stamens
const FORMS = [
  { at:0.00, n:5,  rings:1, len:0.82, wide:0.66, round:1.3, notch:0, spread:0.30, heart:0.05, seeds:0, stamens:0,  stamLen:0.20, rib:0, sepals:0.5, spiral:0, cluster:0, pod:0 }, // bell bud
  { at:0.25, n:5,  rings:1, len:0.95, wide:0.62, round:1.6, notch:1, spread:1,    heart:0.07, seeds:0, stamens:26, stamLen:0.46, rib:0, sepals:0,   spiral:0, cluster:0, pod:0 }, // cherry blossom
  { at:0.38, n:6,  rings:1, len:1.00, wide:0.30, round:0.1, notch:0, spread:1,    heart:0.06, seeds:0, stamens:6,  stamLen:0.72, rib:1, sepals:0,   spiral:0, cluster:0, pod:0 }, // day lily
  { at:0.50, n:11, rings:3, len:1.00, wide:0.44, round:0.55,notch:0, spread:1,    heart:0.20, seeds:0, stamens:44, stamLen:0.26, rib:0, sepals:0.6, spiral:0, cluster:0, pod:1 }, // lotus
  { at:0.65, n:26, rings:1, len:1.00, wide:0.12, round:0.4, notch:0, spread:1,    heart:0.36, seeds:1, stamens:0,  stamLen:0.20, rib:0, sepals:0,   spiral:0, cluster:0, pod:0 }, // daisy / sunflower
  { at:0.82, n:7,  rings:6, len:0.92, wide:0.52, round:1.8, notch:0, spread:1,    heart:0.05, seeds:0, stamens:0,  stamLen:0.20, rib:0, sepals:0,   spiral:1, cluster:0, pod:0 }, // rosette
  { at:1.00, n:4,  rings:1, len:0.90, wide:0.62, round:1.4, notch:0, spread:1,    heart:0.08, seeds:0, stamens:0,  stamLen:0.20, rib:0, sepals:0,   spiral:0, cluster:1, pod:0 }, // hydrangea
];
function formAt(f){
  f = Math.max(0, Math.min(1, f));
  let i = 0; while(i < FORMS.length - 2 && f > FORMS[i+1].at) i++;
  const a = FORMS[i], b = FORMS[i+1], t = (f - a.at) / (b.at - a.at);
  const s = t*t*(3 - 2*t);                                   // eased, so species hold their shape a little
  const out = {};
  for(const k of Object.keys(a)) out[k] = a[k] + (b[k] - a[k])*s;
  out.n = Math.max(3, Math.round(out.n)); out.rings = Math.max(1, Math.round(out.rings));
  out.stamens = Math.round(out.stamens);
  return out;
}

export function genFlowers(w,h,amt,zoom,tint1,tint2,form,light,GL){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  // THE LIGHT comes from where the dial points (upper left by default): each
  // petal's fold turns its far half into shade, the bloom brightens on its
  // lit side, every bloom throws its shadow on the water away from the light,
  // and each ring of petals shades the ring beneath it. A lower light throws
  // longer shadows (lightVec's length is how low it is).
  const lv=lightVec(light==null?315:light), tilt=Math.min(1, Math.hypot(lv.lx, lv.ly));
  const la=((light==null?315:light)-90)*Math.PI/180, SX=Math.cos(la), SY=Math.sin(la);   // toward the light
  const shadowLen=0.08+0.16*tilt;
  const F=formAt(form==null?0.5:form);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);                              // transparent ground
  const unit=Math.min(w,h);
  const A=parseHex(tint1||'#E8739E'), B=parseHex(tint2||'#F2B33D');
  const L=o=>(o.r*0.299+o.g*0.587+o.b*0.114)/255;
  const mix=(a,b,t)=>({r:a.r+(b.r-a.r)*t, g:a.g+(b.g-a.g)*t, b:a.b+(b.b-a.b)*t});
  const WHITE={r:255,g:255,b:255};
  // Where a colour fades to, by its lightness: a light colour to white, a
  // midtone to a deeper shade of itself, a dark one to a near-black complement.
  // The RULE is chosen once, from the Petal Hue itself — not per bloom — so a
  // small variation can never tip one bloom across the light/midtone line
  // and fade it toward dark.
  const fadeRule = L(A)>0.6 ? 'light' : L(A)>0.28 ? 'mid' : 'dark';
  const fadeOf=o=> fadeRule==='light' ? mix(o,WHITE,0.9)
                 : fadeRule==='mid' ? mix(o,{r:0,g:0,b:0},0.62)
                 : {r:(255-o.r)*0.11, g:(255-o.g)*0.11, b:(255-o.b)*0.11};
  // the bright version of a colour, by the same rules
  const brightOf=o=> L(o)>0.6 ? mix(o,WHITE,0.66) : L(o)>0.28 ? mix(o,WHITE,0.5) : mix({r:255-o.r,g:255-o.g,b:255-o.b},WHITE,0.34);
  // a small nudge of hue, saturation and value, so no two blooms are identical
  const vary=(o,amt)=>{
    const r=o.r/255,g=o.g/255,b=o.b/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
    let hh=0; if(d){ hh = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; hh/=6; }
    let ss = mx ? d/mx : 0, vv = mx;
    // hue moves a few degrees (6% of a hue is ~6°, not 6% of the whole wheel)
    hh=(hh+(Math.random()-0.5)*2*(11/360)+1)%1; ss=Math.max(0,Math.min(1,ss*(1+(Math.random()-0.5)*2*amt)));
    vv=Math.max(0,Math.min(1,vv*(1+(Math.random()-0.5)*2*amt)));
    const i=Math.floor(hh*6), f=hh*6-i, P=vv*(1-ss), Q=vv*(1-f*ss), T=vv*(1-(1-f)*ss);
    const [rr,gg,bb]=[[vv,T,P],[Q,vv,P],[P,vv,T],[P,Q,vv],[T,P,vv],[vv,P,Q]][i%6];
    return {r:rr*255,g:gg*255,b:bb*255};
  };
  const css=(o,a=1)=>`rgba(${o.r|0},${o.g|0},${o.b|0},${a})`;
  // The sepals' green: the Petal Hue's complement, pulled into the band of
  // greens (85°–160°), so it always sits opposite the flower and still reads
  // as leaf. A pink lotus gets a cool green; a yellow one a blue-green.
  const hueOf=o=>{ const r=o.r/255,g=o.g/255,b=o.b/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
    if(!d) return 0; let hh = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; return ((hh*60)+360)%360; };
  const fromHSL=(hh,ss,ll)=>{ const c=(1-Math.abs(2*ll-1))*ss, x=c*(1-Math.abs((hh/60)%2-1)), m=ll-c/2;
    const [r,g,b]=hh<60?[c,x,0]:hh<120?[x,c,0]:hh<180?[0,c,x]:hh<240?[0,x,c]:hh<300?[x,0,c]:[c,0,x];
    return {r:(r+m)*255, g:(g+m)*255, b:(b+m)*255}; };
  const greenHue=Math.max(85, Math.min(160, (hueOf(A)+180)%360));
  const SEPAL=fromHSL(greenHue, 0.42, 0.36), SEPAL_TIP=fromHSL(greenHue, 0.38, 0.55);
  const WHITE_TIP=o=>mix(o,WHITE,0.9);
  // Ruby's rule for where Petal Hue fades, by how light it is: a LIGHT colour
  // to white; a MIDTONE to a nearby, lighter, more saturated version of
  // itself; a DARK colour to a saturated near-black of its own hue.
  const toHSL=o=>{ const r=o.r/255, g=o.g/255, b=o.b/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
    if(mx===mn) return {h:0,s:0,l}; const d=mx-mn, s2=l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
    const h=(mx===r ? (g-b)/d + (g<b?6:0) : mx===g ? (b-r)/d + 2 : (r-g)/d + 4)/6; return {h:h*360,s:s2,l}; };
  const tipOf=o=>{
    if(fadeRule==='light') return mix(o,WHITE,0.9);
    const c=toHSL(o);
    return fadeRule==='mid' ? fromHSL(c.h, Math.min(1, c.s + 0.25), Math.min(0.88, c.l + 0.2))
                            : fromHSL(c.h, Math.min(1, Math.max(0.6, c.s + 0.3)), 0.07);
  };

  // The pond: a few very soft, very wide bands of light lying flat. Not
  // waves, not ripples — just the sense of a still surface.
  for(let i=0;i<4;i++){
    const y=h*(0.1+Math.random()*0.8), band=h*(0.08+Math.random()*0.14);
    const g=ctx.createLinearGradient(0,y-band,0,y+band);
    g.addColorStop(0,'rgba(236,236,236,0)'); g.addColorStop(0.5,'rgba(236,236,236,0.06)'); g.addColorStop(1,'rgba(236,236,236,0)');
    ctx.fillStyle=g; ctx.fillRect(0,y-band,w,band*2);
  }

  // Size is the LARGEST bloom; each is 10–100% of it. Collision is circular
  // and tight (blooms may brush petal tips), largest placed first so small
  // ones fall into the gaps.
  const maxR=unit*0.085*zoom;
  // 18 blooms per 100%, at ANY canvas size: bloom size already scales with
  // the page, so a tile, the preview and the export hold the same flowers.
  // The Bloom Count readout's base (textureGenerators.js) is the same 18, so
  // the number shown is the number drawn.
  const target=Math.max(2,Math.round(18*amt));
  const radii=[]; for(let i=0;i<target;i++) radii.push(maxR*(0.2+Math.pow(Math.random(),1.6)*0.8));
  radii.sort((a,b)=>b-a);
  const placed=[];
  for(const r of radii){
    for(let tries=0;tries<60;tries++){
      const x=Math.random()*w, y=Math.random()*h;
      if(placed.some(p=>Math.hypot(p.x-x,p.y-y) < (p.r+r)*0.85)) continue;
      placed.push({x,y,r}); break;
    }
  }

  const petal=(cx,cy,a,len,wide,round,base,tip,alpha)=>{
    const dx=Math.cos(a), dy=Math.sin(a), px=Math.cos(a+Math.PI/2), py=Math.sin(a+Math.PI/2);
    const at=(al,ac)=>[cx+dx*len*al+px*wide*ac, cy+dy*len*al+py*wide*ac];
    const [x1,y1]=at(0.18,1.0), [x2,y2]=at(0.72+round*0.12,0.92+round*0.18), [tx,ty]=at(1,0);
    const [x3,y3]=at(0.72+round*0.12,-(0.92+round*0.18)), [x4,y4]=at(0.18,-1.0);
    // coloured at its base, fading to its tip — the water lily's blush
    const shape=()=>{ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.bezierCurveTo(x1,y1,x2,y2,tx,ty); ctx.bezierCurveTo(x3,y3,x4,y4,cx,cy); ctx.closePath(); };
    const g=ctx.createLinearGradient(cx,cy,tx,ty);
    g.addColorStop(0,css(base,alpha)); g.addColorStop(0.3,css(base,alpha)); g.addColorStop(1,css(tip,alpha));
    ctx.fillStyle=g; shape(); ctx.fill();
    // the fold: a crease down the petal's centre. The half turned away from
    // the light (from the upper left) falls into gentle shade; the crease
    // catches a thin highlight on its lit side.
    const away = (-(px*SX + py*SY)) > 0 ? 1 : -1;
    ctx.save(); shape(); ctx.clip();
    const [h0x,h0y]=at(0,0), [h1x,h1y]=at(1.05,0), [h2x,h2y]=at(1.05,away*1.6), [h3x,h3y]=at(0,away*1.6);
    ctx.fillStyle=`rgba(0,0,0,${0.13*alpha})`; ctx.beginPath(); ctx.moveTo(h0x,h0y); ctx.lineTo(h1x,h1y); ctx.lineTo(h2x,h2y); ctx.lineTo(h3x,h3y); ctx.closePath(); ctx.fill();
    const [c0x,c0y]=at(0.12,-away*0.035), [c1x,c1y]=at(0.86,-away*0.02);
    ctx.strokeStyle=`rgba(255,255,255,${0.32*alpha})`; ctx.lineWidth=Math.max(cpx(0.5),len*0.014);
    ctx.beginPath(); ctx.moveTo(c0x,c0y); ctx.lineTo(c1x,c1y); ctx.stroke();
    ctx.restore();
    shape(); ctx.strokeStyle=css(mix(base,{r:0,g:0,b:0},0.35),alpha*0.35); ctx.lineWidth=Math.max(cpx(0.5),len*0.012); ctx.stroke();
  };

  // one flower of form F, centred at (cx, cy) with radius R
  const flower=(cx,cy,R,base,tip,F)=>{
    const rot=Math.random()*Math.PI*2;
    // bell buds fan upward from a base below the centre; open flowers radiate
    const fan=F.spread<0.999, baseY=cy+R*0.45*(1-F.spread);
    for(let ri=0; ri<F.rings; ri++){
      const rt=F.rings>1 ? ri/(F.rings-1) : 0;
      const scale=1 - ri*(F.rings>3 ? 0.13 : 0.2);
      const b2=mix(base, mix(base,{r:base.r*0.76,g:base.g*0.5,b:base.b*0.66},0.7), rt);   // deeper inward
      const n=Math.max(3, Math.round(F.n*(1 - ri*0.1)*(0.8+Math.random()*0.2)));
      const off=F.spiral ? ri*2.39996*F.spiral : (ri%2)*0.5/n*Math.PI*2;
      // this ring shades the ring beneath it: a soft shadow, cast away from the light
      if(ri>0){
        const sr=R*F.len*scale*0.95, ox2=(fan?cx:cx)-SX*R*shadowLen*0.6, oy2=(fan?baseY:cy)-SY*R*shadowLen*0.6;
        const sg=ctx.createRadialGradient(ox2,oy2,sr*0.35,ox2,oy2,sr*1.08);
        sg.addColorStop(0,'rgba(20,10,20,0.22)'); sg.addColorStop(1,'rgba(20,10,20,0)');
        ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(ox2,oy2,sr*1.08,0,Math.PI*2); ctx.fill();
      }
      for(let k=0;k<n;k++){
        // a bud fans upward across `spread` of the circle; as it opens the fan
        // widens to the full circle, petals evenly round it (it used to stop at
        // a half circle, so half-open blooms had every petal pointing up)
        const a = fan ? -Math.PI/2 + ((k+0.5)/n - 0.5)*Math.PI*2*F.spread + (Math.random()-0.5)*0.08
                      : rot + off + (k/n)*Math.PI*2 + (Math.random()-0.5)*0.12;
        const len=R*F.len*scale*(0.92+Math.random()*0.16), wide=R*F.wide*scale*(0.9+Math.random()*0.2);
        const ox=cx, oy=fan ? baseY : cy;
        const sepal = ri===0 && Math.random()<F.sepals;
        const pb=sepal ? SEPAL : vary(b2,0.04), pt=sepal ? SEPAL_TIP : tipOf(pb);
        if(F.notch>0.05){
          // a notched tip: two lobes, slightly apart
          const d=F.notch*0.13;
          petal(ox,oy,a-d,len,wide*0.62,F.round,pb,pt,0.96);
          petal(ox,oy,a+d,len,wide*0.62,F.round,pb,pt,0.96);
        } else petal(ox,oy,a,len*(sepal?0.94:1),wide*(sepal?0.85:1),F.round,pb,pt,0.96);
        if(F.rib>0.05 && !sepal){
          ctx.strokeStyle=css(WHITE_TIP(pb),0.55*F.rib); ctx.lineWidth=Math.max(cpx(0.6),R*0.012);
          ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(a)*len*0.82, oy+Math.sin(a)*len*0.82); ctx.stroke();
        }
      }
    }
    // light falling on the bloom from the upper left
    const lit=ctx.createRadialGradient(cx+SX/0.7071*R*0.35,cy+SY/0.7071*R*0.4,R*0.05,cx+SX/0.7071*R*0.2,cy+SY/0.7071*R*0.25,R*1.05);
    lit.addColorStop(0,'rgba(255,255,255,0.22)'); lit.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lit; ctx.beginPath(); ctx.arc(cx,cy,R*1.02,0,Math.PI*2); ctx.fill();
    if(fan && F.spread<0.6) return;                              // a closed bud shows no heart
    const hr=R*F.heart, bright=brightOf(B);
    const stamens=()=>{
      ctx.strokeStyle=css(bright,0.95); ctx.lineCap='round';
      for(let k=0;k<F.stamens;k++){
        const a=rot+(k/F.stamens)*Math.PI*2+(Math.random()-0.5)*0.08;
        // around a pod they stand at its rim, not under it
        const r0=hr*(0.5 + 0.5*F.pod), r1=Math.max(r0*1.05, R*(F.stamLen*(0.9+Math.random()*0.2))*(1 + 0.35*F.pod));
        ctx.lineWidth=Math.max(cpx(0.6),R*0.012);
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0); ctx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1); ctx.stroke();
        ctx.fillStyle=css(bright); ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1,Math.max(0.6,R*0.013),0,Math.PI*2); ctx.fill();
      }
    };
    // a lotus's pod stands on its stamens: they go down first
    if(F.pod>0.02) stamens();
    // the heart
    const heart=ctx.createRadialGradient(cx,cy,0,cx,cy,hr);
    heart.addColorStop(0,css(mix(B,{r:0,g:0,b:0},0.25))); heart.addColorStop(1,css(B));
    ctx.fillStyle=heart; ctx.beginPath(); ctx.arc(cx,cy,hr,0,Math.PI*2); ctx.fill();
    if(F.pod>0.02){
      // THE SEED POD: a flat-topped cone. Its side shows on the side away from
      // the light, in shade; its top is lit; its rim catches a line of light;
      // seed cells pit the top in rings, each a hollow lit on its far wall
      const P=F.pod, sideCol=mix(B,{r:0,g:0,b:0},0.45), topCol=mix(B,{r:255,g:255,b:255},0.12);
      ctx.fillStyle=css(sideCol,0.9*P); ctx.beginPath(); ctx.arc(cx-SX*hr*0.14, cy-SY*hr*0.14, hr*1.02, 0, Math.PI*2); ctx.fill();
      const tg=ctx.createLinearGradient(cx+SX*hr, cy+SY*hr, cx-SX*hr, cy-SY*hr);
      tg.addColorStop(0, css(mix(topCol,{r:255,g:255,b:255},0.25), P)); tg.addColorStop(1, css(mix(topCol,{r:0,g:0,b:0},0.15), P));
      ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(cx, cy, hr*0.94, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle=css(mix(topCol,{r:255,g:255,b:255},0.5), 0.55*P); ctx.lineWidth=Math.max(cpx(0.6), hr*0.05);
      ctx.beginPath(); ctx.arc(cx, cy, hr*0.94, la-1.1, la+1.1); ctx.stroke();
      // seed cells: one at the centre, then rings of 6, 11, 16…
      const cr=hr*0.12, cells=[[0,0]];
      for(let ring=1; ring*cr*2.5<hr*0.8; ring++){ const m=1+ring*5, rr=ring*cr*2.5, ph=Math.random()*6.283;
        for(let k=0;k<m;k++){ const aa=ph+k/m*Math.PI*2; cells.push([Math.cos(aa)*rr, Math.sin(aa)*rr]); } }
      for(const [ux,uy] of cells){
        const x=cx+ux, y=cy+uy;
        ctx.fillStyle=css(mix(B,{r:0,g:0,b:0},0.6), 0.85*P); ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI*2); ctx.fill();
        // the far wall of the hollow is the lit one
        ctx.strokeStyle=css(mix(topCol,{r:255,g:255,b:255},0.35), 0.6*P); ctx.lineWidth=Math.max(cpx(0.4), cr*0.28);
        ctx.beginPath(); ctx.arc(x, y, cr*0.8, la+Math.PI-1.0, la+Math.PI+1.0); ctx.stroke();
        // a seed in most cells, catching the light on its near side
        if(Math.random()<0.7){ ctx.fillStyle=css(mix(B,{r:60,g:90,b:30},0.35), 0.9*P); ctx.beginPath(); ctx.arc(x-SX*cr*0.12, y-SY*cr*0.12, cr*0.55, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle=`rgba(255,255,255,${0.35*P})`; ctx.beginPath(); ctx.arc(x+SX*cr*0.22, y+SY*cr*0.22, cr*0.18, 0, Math.PI*2); ctx.fill(); }
        // GLOW: the seeds light up, like lanterns
        if(GL){ const g3=`${GL.r*255|0},${GL.g*255|0},${GL.b*255|0}`, gr=ctx.createRadialGradient(x,y,0,x,y,cr*2.4);
          gr.addColorStop(0,`rgba(255,255,255,${0.9*P})`); gr.addColorStop(0.25,`rgba(${g3},${0.9*P})`); gr.addColorStop(1,`rgba(${g3},0)`);
          ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,cr*2.4,0,Math.PI*2); ctx.fill(); ctx.restore(); }
      }
    }
    // a seeded centre: florets in the golden-angle spiral a sunflower uses
    if(F.seeds>0.05){
      const seeds=Math.round(60+hr*0.6), dark=mix(B,{r:0,g:0,b:0},0.55);
      ctx.fillStyle=css(dark,0.8*F.seeds);
      for(let k=1;k<seeds;k++){ const rr=hr*0.92*Math.sqrt(k/seeds), aa=k*2.39996;
        ctx.beginPath(); ctx.arc(cx+Math.cos(aa)*rr, cy+Math.sin(aa)*rr, Math.max(0.5,hr*0.045), 0, Math.PI*2); ctx.fill(); }
    }
    // stamens (around a pod they are already down)
    if(F.pod<=0.02) stamens();
    // GLOW in a flower without a pod: its heart lights up
    if(GL && F.pod<=0.02){ const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,hr*1.8); gr.addColorStop(0,`rgba(${GL.r*255|0},${GL.g*255|0},${GL.b*255|0},0.8)`); gr.addColorStop(1,`rgba(${GL.r*255|0},${GL.g*255|0},${GL.b*255|0},0)`);
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(cx,cy,hr*1.8,0,Math.PI*2); ctx.fill(); }
  };

  for(const {x:cx,y:cy,r:R} of placed){
    const base=vary(A,0.16);
    const tip=fadeOf(base);
    // its shadow on the water
    const shx=cx-SX*R*shadowLen*1.4, shy=cy-SY*R*shadowLen*1.4;
    const sh=ctx.createRadialGradient(shx,shy,R*0.2,shx,shy,R*1.25);
    sh.addColorStop(0,'rgba(10,10,14,0.34)'); sh.addColorStop(1,'rgba(10,10,14,0)');
    ctx.fillStyle=sh; ctx.beginPath(); ctx.arc(shx,shy,R*1.25,0,Math.PI*2); ctx.fill();
    if(F.cluster>0.02){
      // the bloom breaks into florets: one at the start, a dome of many at the end
      const count=Math.round(1+F.cluster*13), fr=R/(1+F.cluster*2.3);
      for(let k=0;k<count;k++){
        const rr=(R-fr)*Math.sqrt((k+0.5)/count), aa=k*2.39996;
        flower(cx+Math.cos(aa)*rr, cy+Math.sin(aa)*rr, fr*(0.85+Math.random()*0.3), vary(base,0.06), tip, F);
      }
    } else flower(cx,cy,R,base,tip,F);
  }
  return c;
}

// Hidebound: a high-intensity paper-like grain base, plus a much-more-tiled,
// much-lower-intensity crackle layer generated at a vertically squished working
// resolution then stretched back to full height — elongating every cell so the
// grain reads as vertically stretched, like natural leather.
// Dotwork: a regular dot grid (classic print halftone) where each dot's radius is
// modulated by a coarse noise field — genuinely geometric (fixed grid spacing)
// but with organic size variation, distinct from Squares' flat-shaded triangles.
// (Halftone is a chain now: Value Noise → stepsSharpness.js 'screen' → Surface; chains.js 'halftone')

// (Harsh Rain is a chain of steps now: chains.js, steps.js 'streaks')

// (Painter's Frustration is a chain of steps now: stepsLight.js paintAngryStrokes → canvas weave → Light Engine; chains.js 'brushstrokes')

// (Silverpoint Hatch is a chain of steps now: chains.js, steps.js 'forms' and 'hatching')

// Gold beaten so thin
// it forgets it was ever
// heavier than light.
// SCATTERED POLYGONS is a chain now: flakes (stepsTouch.js drawFlakes, chains.js 'metalleaf').

// Most windows are dark.
// The few that are lit are why
// the city looks awake.
export function genCityscape(w,h,amt,zoom,tint1,tint2,GL){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  // the seed's FIRST draw decides the Needle, so which seeds show it is
  // predictable: withSeed(seed, () => Math.random() < 0.1)
  const hasNeedle = Math.random() < 0.1;
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);
  const unit=Math.min(w,h);
  const win=parseHex(tint1||'#FFE3A8'), wat=parseHex(tint2||'#2E4F6E');
  const rgb=(o,a=1)=>`rgba(${o.r},${o.g},${o.b},${a})`;
  const grey=(v,a=1)=>`rgba(${v|0},${v|0},${v|0},${a})`;
  // A night city, and what lies at its feet. The waterfront always carries
  // the Needle when it appears; otherwise the city may sit on farmland, or
  // behind an elevated highway and railway.
  const roll=Math.random();
  const scene = hasNeedle ? 'water' : roll<0.45 ? 'water' : roll<0.72 ? 'fields' : 'rail';
  const ground = h*(0.64 + Math.random()*0.08);
  const H = unit*0.34*zoom;                               // tallest towers

  // stars
  for(let i=0;i<Math.round(canonArea(w,h)/16000);i++){
    ctx.globalAlpha=0.25+Math.random()*0.6; ctx.fillStyle=grey(230);
    ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*ground*0.85, unit*0.0012*(0.4+Math.random()), 0, Math.PI*2); ctx.fill();
  }

  const windows=(x,top,bw,bh,density)=>{
    const cw=Math.max(3,unit*0.006), ch=Math.max(3,unit*0.008), gap=cw*0.9;
    for(let yy=top+ch; yy<ground-ch*1.5; yy+=ch+gap*1.1)
      for(let xx=x+gap; xx<x+bw-cw-gap*0.3; xx+=cw+gap)
        if(Math.random()<density){ ctx.globalAlpha=0.55+Math.random()*0.45; ctx.fillStyle=rgb(win); ctx.fillRect(xx,yy,cw,ch); }
  };
  // a downtown: buildings rise toward one point along the skyline
  const peakX=w*(0.2+Math.random()*0.6), peakW=w*(0.18+Math.random()*0.22);
  // a contiguous row of buildings: no gaps, each type with its own silhouette;
  // returns its tallest building, so the Needle can stay shorter than its layer
  const row=(scale, tone, alpha, density, types)=>{
    let x=-unit*0.02, tallest=0;
    while(x<w){
      const type=types[Math.floor(Math.random()*types.length)];
      let bw=unit*(0.035+Math.random()*0.06)*scale, bh=H*scale*(0.25+Math.random()*0.75)*(0.55+0.85*Math.exp(-(((x-peakX)/peakW)**2)));
      if(type==='block'||type==='warehouse') { bw*=1.8; bh*=0.45; }
      if(type==='house'){ bw=unit*0.022*scale; bh=unit*0.02*scale; }
      const top=ground-bh;
      ctx.globalAlpha=alpha; ctx.fillStyle=grey(tone);
      ctx.beginPath();
      if(type==='setback'){                               // stepped, like an old tower
        const s1=bw*0.18, s2=bw*0.34;
        ctx.moveTo(x,ground); ctx.lineTo(x,top+bh*0.35); ctx.lineTo(x+s1,top+bh*0.35); ctx.lineTo(x+s1,top+bh*0.12);
        ctx.lineTo(x+s2,top+bh*0.12); ctx.lineTo(x+s2,top); ctx.lineTo(x+bw-s2,top); ctx.lineTo(x+bw-s2,top+bh*0.12);
        ctx.lineTo(x+bw-s1,top+bh*0.12); ctx.lineTo(x+bw-s1,top+bh*0.35); ctx.lineTo(x+bw,top+bh*0.35); ctx.lineTo(x+bw,ground);
      } else if(type==='dome'){
        ctx.rect(x,top+bw*0.3,bw,bh-bw*0.3); ctx.moveTo(x+bw,top+bw*0.3); ctx.arc(x+bw/2,top+bw*0.3,bw/2,0,Math.PI,true);
      } else if(type==='house'){
        ctx.moveTo(x,ground); ctx.lineTo(x,top+bh*0.4); ctx.lineTo(x+bw/2,top-bh*0.2); ctx.lineTo(x+bw,top+bh*0.4); ctx.lineTo(x+bw,ground);
      } else if(type==='warehouse'){
        ctx.moveTo(x,ground); ctx.lineTo(x,top+bh*0.3); ctx.quadraticCurveTo(x+bw/2,top-bh*0.1,x+bw,top+bh*0.3); ctx.lineTo(x+bw,ground);
      } else {
        ctx.rect(x,top,bw,bh);
      }
      ctx.fill();
      if(type==='spire'){ ctx.fillRect(x+bw/2-unit*0.0015, top-bh*0.18, unit*0.003, bh*0.18);
        ctx.beginPath(); ctx.moveTo(x+bw*0.2,top); ctx.lineTo(x+bw/2,top-bh*0.1); ctx.lineTo(x+bw*0.8,top); ctx.fill(); }
      if(density>0 && type!=='warehouse') windows(x, top+(type==='dome'?bw*0.3:0), bw, bh, density*(type==='house'?0.5:1));
      if(type!=='house') tallest=Math.max(tallest, bh);
      x+=bw;                                              // flush: no gaps
    }
    return tallest;
  };

  const types = scene==='fields' ? ['tower','block','setback'] : ['tower','tower','setback','spire','block','dome'];
  const f = scene==='fields' ? 0.7 : 1;
  // four layers, each nearer one darker, larger and more lit
  const layers=[
    { scale:0.6*f,  tone:96, alpha:0.32, density:0 },             // distant haze
    { scale:0.82*f, tone:70, alpha:0.55, density:0.04*amt },      // far
    { scale:0.95*f, tone:46, alpha:0.82, density:0.12*amt },      // middle
    { scale:1.05*f, tone:28, alpha:0.97, density:0.22*amt },      // near
  ];
  // the Needle stands in one of the layers behind the nearest, in that layer's
  // tone, and shorter than the layer's tallest building
  const needleLayer = hasNeedle ? 1 + Math.floor(Math.random()*2) : -1;
  // CITY GLOW (the Glow Hue): the sky above the lights, lit from below — the
  // skyglow over every city at night — strongest at the skyline, fading
  // upward; the buildings stand dark against it. Screened, so black is none.
  if(GL && GL.r + GL.g + GL.b > 0.004){
    const up = Math.max(1, ground - unit*0.6), g = ctx.createLinearGradient(0, ground, 0, up), c = (a) => `rgba(${GL.r*255|0},${GL.g*255|0},${GL.b*255|0},${a})`;
    g.addColorStop(0, c(0.85)); g.addColorStop(0.25, c(0.5)); g.addColorStop(0.6, c(0.16)); g.addColorStop(1, c(0));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, up, w, ground - up); ctx.restore();
  }
  layers.forEach((L, i) => {
    const tallest = row(L.scale, L.tone, L.alpha, L.density, types);
    // beside downtown, not in it — where the nearer buildings are lower, so it
    // stays findable in whichever layer it stands (as at Seattle's own skyline)
    if(i === needleLayer){
      // on the side of downtown with room (a random side could push it off the
      // edge and get it clamped back into the towers)
      const side = peakX > w/2 ? -1 : 1, nx = Math.max(w*0.08, Math.min(w*0.92, peakX + side*peakW*(1.4 + Math.random()*0.8)));
      // tall enough for its saucer to clear the near roofs beside downtown
      // (they top out near 0.58 of the skyline), shorter than the towers
      // at least the middle layer's contrast: a far-layer Needle drawn in the
      // haze's own pale tone vanished into the sky
      drawNeedle(nx, Math.max(tallest*0.8, H*f*0.68), Math.min(L.tone, 50), Math.max(L.alpha, 0.82));
    }
  });
  // the Space Needle, to its real proportions: three legs pinched to a waist a
  // third of the way up, flaring out to hold the saucer at ~0.87 of its
  // height, a spire above
  function drawNeedle(nx, NH, tone, alpha){
    const base=ground, y=f=>base-NH*f, spread=NH*0.11, waist=NH*0.035, top=NH*0.075;
    ctx.globalAlpha=alpha; ctx.strokeStyle=grey(tone); ctx.fillStyle=grey(tone); ctx.lineWidth=Math.max(cpx(1.5),NH*0.012);
    for(const s of [-1,0,1]){
      ctx.beginPath(); ctx.moveTo(nx+s*spread, base);
      ctx.bezierCurveTo(nx+s*waist*1.2, y(0.25), nx+s*waist, y(0.4), nx+s*waist*1.1, y(0.5));
      ctx.bezierCurveTo(nx+s*waist*1.4, y(0.66), nx+s*top*0.8, y(0.8), nx+s*top, y(0.86));
      ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(nx, y(0.87), NH*0.125, NH*0.018, 0, 0, Math.PI*2); ctx.fill();   // the halo
    ctx.beginPath(); ctx.ellipse(nx, y(0.895), NH*0.085, NH*0.022, 0, 0, Math.PI*2); ctx.fill();  // the top house
    ctx.fillRect(nx-NH*0.004, y(1), NH*0.008, NH*0.09);                                           // the spire
    ctx.fillStyle=rgb(win);
    const dot=Math.max(cpx(1.5), NH*0.006);
    for(let k=0;k<14;k++){ const a=(k/14)*Math.PI*2; if(Math.cos(a)<0) continue;
      ctx.globalAlpha=0.85*alpha; ctx.fillRect(nx+Math.sin(a)*NH*0.1-dot/2, y(0.872)-dot/2, dot, dot); }
  }

  if(scene==='water'){
    const walk=unit*0.008, treesH=unit*0.02;
    ctx.globalAlpha=1; ctx.fillStyle=grey(64); ctx.fillRect(0,ground,w,walk);                // the sidewalk
    ctx.fillStyle=grey(34); ctx.beginPath(); ctx.moveTo(0,ground+walk+treesH);               // the treeline
    for(let x=0;x<=w;x+=unit*0.012) ctx.lineTo(x, ground+walk+treesH*(0.2+Math.random()*0.55));
    ctx.lineTo(w,ground+walk+treesH); ctx.closePath(); ctx.fill();
    const wy=ground+walk+treesH;
    const g=ctx.createLinearGradient(0,wy,0,h);                                              // the water
    g.addColorStop(0,rgb(wat,0.85)); g.addColorStop(1,rgb({r:wat.r*0.5,g:wat.g*0.5,b:wat.b*0.5},0.95));
    ctx.fillStyle=g; ctx.fillRect(0,wy,w,h-wy);
    // reflections: broken streaks of window light, rippling as they go down
    for(let i=0;i<Math.round(w/(unit*0.004)*amt);i++){
      const x=Math.random()*w, depth=Math.random();
      const ry=wy+depth*(h-wy)*0.8, len=unit*(0.004+Math.random()*0.012)*(1+depth);
      ctx.globalAlpha=(1-depth)*0.55; ctx.fillStyle=rgb(win);
      ctx.fillRect(x+Math.sin(ry*0.08)*unit*0.004, ry, len, Math.max(1,unit*0.0016));
    }
    ctx.globalAlpha=0.18; ctx.strokeStyle=grey(200); ctx.lineWidth=cpx(1);
    for(let y=wy+unit*0.01;y<h;y+=unit*(0.012+Math.random()*0.02)){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y+Math.random()*2); ctx.stroke(); }
  } else if(scene==='fields'){
    ctx.globalAlpha=1; ctx.fillStyle=grey(92); ctx.fillRect(0,ground,w,h-ground);
    // grain elevators: a cluster of tall silos and a gantry
    const ex=w*(0.1+Math.random()*0.7), sil=unit*0.018;
    ctx.fillStyle=grey(38);
    for(let k=0;k<4;k++) ctx.fillRect(ex+k*sil, ground-H*0.4, sil*0.9, H*0.4);
    ctx.fillRect(ex+sil*4, ground-H*0.52, sil*1.2, H*0.52);
    ctx.fillRect(ex-sil*0.3, ground-H*0.42, sil*4.6, sil*0.35);
    // small houses along the road
    for(let x=0;x<w;x+=unit*(0.05+Math.random()*0.08)){
      const bw=unit*0.02, bh=unit*0.016, top=ground-bh;
      ctx.fillStyle=grey(40); ctx.beginPath(); ctx.moveTo(x,ground); ctx.lineTo(x,top); ctx.lineTo(x+bw/2,top-bh*0.6); ctx.lineTo(x+bw,top); ctx.lineTo(x+bw,ground); ctx.fill();
      if(Math.random()<0.6*amt){ ctx.fillStyle=rgb(win); ctx.globalAlpha=0.8; ctx.fillRect(x+bw*0.35,top+bh*0.35,bw*0.25,bh*0.3); ctx.globalAlpha=1; }
    }
    // wheat: rows running away to the horizon, pale and stroked
    const vx=w*(0.3+Math.random()*0.4);
    for(let i=0;i<60;i++){
      const bx=(i/59)*w*2-w*0.5;
      ctx.globalAlpha=0.28; ctx.strokeStyle=grey(i%2?168:118); ctx.lineWidth=unit*0.006;
      ctx.beginPath(); ctx.moveTo(vx+(bx-vx)*0.02, ground+unit*0.004); ctx.lineTo(bx, h); ctx.stroke();
    }
  } else {
    ctx.globalAlpha=1; ctx.fillStyle=grey(40); ctx.fillRect(0,ground,w,h-ground);
    // an elevated deck on pillars
    const deck=ground+unit*0.035, dh=unit*0.012;
    ctx.fillStyle=grey(24); ctx.fillRect(0,deck,w,dh);
    for(let x=unit*0.02;x<w;x+=unit*0.07) ctx.fillRect(x,deck+dh,unit*0.008,h-deck);
    if(Math.random()<0.5){
      // traffic: streaks of headlights and tail lights
      for(let i=0;i<Math.round(24*amt)+4;i++){
        const x=Math.random()*w, len=unit*(0.02+Math.random()*0.05), red=Math.random()<0.5;
        ctx.globalAlpha=0.75; ctx.fillStyle=red?'rgb(255,70,70)':rgb(win);
        ctx.fillRect(x, deck-unit*(red?0.004:0.007), len, Math.max(1.5,unit*0.0018));
      }
    } else {
      // a train crossing on the deck, windows lit
      const tx=Math.random()*w*0.4, tl=w*(0.35+Math.random()*0.3), th=unit*0.016;
      ctx.fillStyle=grey(30); ctx.fillRect(tx,deck-th,tl,th);
      ctx.fillStyle=rgb(win);
      for(let x=tx+th*0.4;x<tx+tl-th*0.4;x+=th*0.9){ ctx.globalAlpha=0.8; ctx.fillRect(x,deck-th*0.72,th*0.55,th*0.35); }
    }
  }
  ctx.globalAlpha=1;
  return c;
}


/**
 * Waking Grain. GRAIN SIZE is the cell (5 canonical pixels × zoom, at any
 * size drawn); CONTRAST how strong it is; GRAIN the kind, blended between
 * neighbours:
 *   Silver   black-and-white film: crisp silver grains, clumped
 *   Film     soft, even dye grain — the original look, drawn exactly as before
 *   Paper    a sheet's own grain: cloudy formation, short fibres
 *   Digital  a sensor's noise: square pixels, colour speckle, faint row banding
 */
// (Film Grain is a chain now: stepsSharpness.js 'grain' → Surface; chains.js 'grain')

