import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {load} from '../search.mjs';
const read=async path=>Uint8Array.from(await fs.readFile(path)).buffer;
const {docs,search}=await load(read);
const rows=[];
for(const line of (await fs.readFile('data/questions.tsv','utf8')).trim().split('\n')){
  const [label,query]=line.split('\t');
  assert(docs.some(d=>d.id===label),label);
  const results=search(query);
  const rank=key=>results[key].findIndex(d=>d.id===label)+1;
  rows.push({query,label,lexical:rank('lexical'),semantic:rank('semantic')});
}
assert.equal(search('').semantic.length,0);
console.log('Passages:',docs.length,'Queries:',rows.length);
for(const key of ['lexical','semantic'])console.log(key,'top 1',rows.filter(r=>r[key]===1).length,'top 3',rows.filter(r=>r[key]>0).length);
await fs.writeFile('data/results.json',JSON.stringify(rows,null,2)+'\n');
