import {load} from './search.mjs';
const form=document.querySelector('form'), input=document.querySelector('#q'), status=document.querySelector('#status');
try {
  const {search}=await load(async path=>{
    const response=await fetch(path);
    if(!response.ok) throw Error(path);
    return response.arrayBuffer();
  });
  function render(){
    const query=input.value.trim();
    const result=search(query);
    for(const key of ['lexical','semantic']){
      const container=document.getElementById(key);
      container.replaceChildren();
      for(const [i,hit] of result[key].entries()){
        const item=document.createElement('article'), title=document.createElement('strong'), body=document.createElement('p'), source=document.createElement('a');
        title.textContent=(i+1)+'. '+hit.title;
        body.textContent=hit.body.replace(/\|/g,' ').replace(/---/g,'').replace(/ +/g,' ');
        source.href=hit.source;source.textContent='Source passage file';
        item.append(title,body,source);container.append(item);
      }
      if(!container.childElementCount) container.textContent='No matching passage.';
    }
    status.textContent=query?'Results for “'+query+'”':'Enter a support question.';
  }
  form.querySelector('button').disabled=false;
  form.addEventListener('submit',e=>{e.preventDefault();render()});
  render();
} catch {status.textContent='The search files could not load. Refresh to retry.'}
