const words = text => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').match(/[a-z0-9]+/g) ?? [];
const sources = ['faq','products','shipping-and-returns'];
export async function load(read) {
  const decode = bytes => new TextDecoder().decode(bytes);
  const [vec, scale, vocabulary, ...files] = await Promise.all(
    ['model/vectors.bin','model/scales.bin','model/vocab.json', ...sources.map(s=>'data/'+s+'.md')].map(read));
  const weights = new Int8Array(vec), scales = new Float32Array(scale);
  const vocab = JSON.parse(decode(vocabulary));
  function embed(text) {
    const v = new Float32Array(256);
    for (const word of text.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').match(/[a-z0-9]+|[^\s\w]/g) ?? []) {
      const ids = [];
      for (let i=0; i<word.length;) {
        let j=word.length;
        while (j>i && !Object.hasOwn(vocab,(i?'##':'')+word.slice(i,j))) j--;
        if (i===j) { ids.length=0; break; }
        ids.push(vocab[(i?'##':'')+word.slice(i,j)]); i=j;
      }
      for (const id of ids) for (let k=0;k<v.length;k++) v[k]+=weights[id*256+k]*scales[id];
    }
    const norm=Math.hypot(...v);
    return norm?v.map(x=>x/norm):v;
  }
  const docs=files.flatMap((bytes,i)=>decode(bytes).split(/^## /m).slice(1).map(section=>{
    const [title,...lines]=section.trim().split('\n');
    const body=lines.join(' ').trim();
    const id=words(title.split(' — ')[0].replace(/\s*\(4\)/,'')).join('-');
    const tokens=words(title+' '+body);
    const freq=new Map();
    for(const t of tokens) freq.set(t,(freq.get(t)??0)+1);
    return {id,title,body,source:'data/'+sources[i]+'.md',freq,length:tokens.length,vector:embed(title+' '+body)};
  }));
  const avg=docs.reduce((s,d)=>s+d.length,0)/docs.length;
  function search(query) {
    const vector=embed(query), terms=new Set(words(query));
    const results=docs.map(d=>{
      let lexical=0;
      for (const term of terms) {
        const tf=d.freq.get(term)??0;
        if(!tf) continue;
        const df=docs.filter(other=>other.freq.has(term)).length;
        lexical+=Math.log(1+(docs.length-df+.5)/(df+.5))*tf*2.2/(tf+1.2*(.25+.75*d.length/avg));
      }
      const semantic=d.vector.reduce((sum,x,i)=>sum+x*vector[i],0);
      return {id:d.id,title:d.title,body:d.body,source:d.source,lexical,semantic};
    });
    const rank=key=>results.filter(r=>r[key]>0).sort((a,b)=>b[key]-a[key]||a.id.localeCompare(b.id)).slice(0,3);
    return {lexical:rank('lexical'),semantic:rank('semantic')};
  }
  return {docs,search};
}
