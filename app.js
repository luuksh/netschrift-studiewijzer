'use strict';
let currentDocument = null, currentRelease = '', checking = false, updatedAt = '';
const statusNode = document.getElementById('status');
function element(tag, value) { const el = document.createElement(tag); if(value) el.textContent=value; return el; }
function render() {
  const grades = currentDocument.grades;
  const selected = new URLSearchParams(location.search).get('leerjaar') || grades[0]?.grade;
  const grade = grades.find(g=>g.grade===selected);
  const nav = document.querySelector('nav'); nav.replaceChildren();
  for(const g of grades){const a=element('a','Leerjaar '+g.grade);a.href='?leerjaar='+g.grade;if(g===grade)a.setAttribute('aria-current','page');nav.append(a);}
  const content=document.getElementById('content');content.replaceChildren();
  if(!grade){content.append(element('p','Dit leerjaar is niet beschikbaar.'));return;}
  if(!grade.lessons.length){content.append(element('p','Er zijn nog geen opdrachten vrijgegeven voor dit leerjaar.'));return;}
  const projects=new Map();
  for(const lesson of grade.lessons){
    let section=projects.get(lesson.project);
    if(!section){section=element('section');section.append(element('h2',lesson.project));projects.set(lesson.project,section);content.append(section);}
    const card=element('article');card.append(element('h3',lesson.lesson));
    if(lesson.titles.length){const titles=element('p','Titels in je netschrift: '+lesson.titles.join(' · '));titles.className='titles';card.append(titles);}
    const list=element('ul');for(const item of lesson.items)list.append(element('li',item));card.append(list);section.append(card);
  }
}
async function refresh(){
  if(checking)return;checking=true;
  try {
    const response=await fetch('version.json?check='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw Error('manifest');const version=await response.json();
    if(!/^guide-[a-f0-9]{64}\.json$/.test(version.data))throw Error('bestand');
    if(version.release!==currentRelease){
      const result=await fetch(version.data,{cache:'no-store'});if(!result.ok)throw Error('gegevens');
      const bytes=await result.arrayBuffer();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
      if(digest!==version.hashes[version.data])throw Error('oude gegevens');
      const doc=JSON.parse(new TextDecoder().decode(bytes));if(doc.schema!==1||!Array.isArray(doc.grades))throw Error('formaat');
      currentDocument=doc;currentRelease=version.release;updatedAt=version.updatedAt;render();
    }
    statusNode.className='';statusNode.textContent='Bijgewerkt op '+new Intl.DateTimeFormat('nl-NL',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(updatedAt));
  }catch(error){statusNode.className='error';statusNode.textContent=currentDocument?'Verversen lukt niet. Het zichtbare overzicht kan verouderd zijn.':'Het overzicht kan niet worden opgehaald. We proberen het opnieuw.';}
  finally{checking=false;}
}
refresh();setInterval(refresh,30000);addEventListener('online',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
