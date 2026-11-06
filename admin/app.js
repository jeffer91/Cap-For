'use strict';
const el=id=>document.getElementById(id);
let data={documents:[],teachers:[],types:[],states:[]},shown=[];
function toast(message){const n=el('toast');n.textContent=message;n.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.classList.remove('show'),5000);}
async function load(){
  data=await window.capfor.list();
  for(const [target,all] of [['imp-tipo',false],['kind',true]]){
    const node=el(target),old=node.value;node.replaceChildren();
    if(all)node.add(new Option('Todos los tipos',''));
    for(const type of data.types)node.add(new Option(type,type));
    if([...node.options].some(x=>x.value===old))node.value=old;
  }
  const known=el('imp-ci').value&&data.teachers.find(x=>x.cedula===el('imp-ci').value);
  if(known)el('imp-nombre').value=known.nombre;
  render();
}
function cell(row,value,cls){const td=row.insertCell();td.textContent=String(value??'');if(cls)td.className=cls;return td;}
function btn(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);return b;}
async function execute(promise,success){
  try{const result=await promise;if(result?.canceled)return;if(success)toast(typeof success==='function'?success(result):success);await load();}
  catch(e){toast('Error: '+e.message);}
}
function render(){
  const text=el('q').value.trim().toLowerCase(),type=el('kind').value,month=el('month').value;
  shown=data.documents.filter(x=>(!text||[x.docente,x.cedula,x.nombre,x.codigo,x.carrera].join(' ').toLowerCase().includes(text))&&(!type||type===x.tipo)&&(!month||month===x.periodo));
  el('stat-total').textContent=data.documents.length;
  el('stat-filtered').textContent=shown.length;
  el('stat-signed').textContent=data.documents.filter(x=>x.estado==='Recibido firmado').length;
  el('stat-active').textContent=data.teachers.filter(x=>x.activo).length;
  el('down-filtered').disabled=!shown.length;
  el('down-everything').disabled=!data.documents.length;
  const body=el('doc-rows');body.replaceChildren();
  if(!shown.length){const row=body.insertRow();const c=cell(row,'No hay documentos registrados para estos filtros.','empty');c.colSpan=6;}
  for(const doc of shown){
    const row=body.insertRow();
    const teacher=cell(row,doc.docente);const info=document.createElement('div');info.className='muted';info.textContent=doc.cedula||'Sin cédula';teacher.append(info);
    cell(row,doc.tipo);cell(row,doc.periodo);
    const st=row.insertCell(),select=document.createElement('select');
    for(const v of data.states)select.add(new Option(v,v));select.value=doc.estado;
    select.addEventListener('change',()=>execute(window.capfor.setState(doc.id,select.value),'Estado documental actualizado.'));
    st.append(select);
    const file=cell(row,doc.nombre);if(doc.codigo){const line=document.createElement('div');line.className='muted';line.textContent=doc.codigo;file.append(line);}
    const actions=row.insertCell(),wrap=document.createElement('div');wrap.className='row-actions';
    wrap.append(btn('PDF',()=>execute(window.capfor.downloadOne(doc.id),'Archivo PDF guardado.')));
    wrap.append(btn('ZIP docente',()=>execute(window.capfor.downloadZip({scope:'docente',cedula:doc.cedula,docente:doc.docente}),r=>r.count+' documentos del docente exportados.')));
    actions.append(wrap);
  }
  const tb=el('teacher-rows');tb.replaceChildren();
  if(!data.teachers.length){const row=tb.insertRow(),c=cell(row,'No hay docentes registrados.','empty');c.colSpan=7;}
  for(const t of data.teachers.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'))){
    const row=tb.insertRow();cell(row,t.cedula);cell(row,t.nombre);cell(row,t.carrera);cell(row,t.sede);cell(row,t.coordinador?'Sí':'No');
    cell(row,t.activo?'Activo':'Inactivo',t.activo?'status-active':'status-inactive');
    row.insertCell().append(btn('Editar',()=>{
      el('t-ci').value=t.cedula;el('t-nombre').value=t.nombre;el('t-carrera').value=t.carrera;el('t-sede').value=t.sede;
      el('t-coord').value=t.coordinador?'si':'no';el('t-active').value=t.activo?'si':'no';el('t-nombre').focus();
    }));
  }
}
for(const nav of document.querySelectorAll('[data-view]'))nav.addEventListener('click',()=>{
  for(const x of document.querySelectorAll('[data-view]'))x.classList.toggle('active',x===nav);
  const teachers=nav.dataset.view==='teachers';
  el('documents-view').hidden=teachers;el('teachers-view').hidden=!teachers;
  el('page-title').textContent=teachers?'Administración de docentes':'Gestor documental';
  el('page-desc').textContent=teachers?'Nómina manual, estado institucional y coordinadores.':'Descarga individual y masiva de PDF de capacitación y formación.';
});
el('imp-ci').addEventListener('input',()=>{
  const t=data.teachers.find(x=>x.cedula===el('imp-ci').value);
  if(t)el('imp-nombre').value=t.nombre;
});
el('import-form').addEventListener('submit',e=>{
  e.preventDefault();
  const p={cedula:el('imp-ci').value,docente:el('imp-nombre').value,tipo:el('imp-tipo').value,periodo:el('imp-periodo').value,codigo:el('imp-codigo').value};
  execute(window.capfor.importDocument(p),r=>'Se importaron '+r.added+' PDF. Omitidos: '+r.skipped+'.');
});
el('teacher-form').addEventListener('submit',e=>{
  e.preventDefault();
  const p={cedula:el('t-ci').value,nombre:el('t-nombre').value,carrera:el('t-carrera').value,sede:el('t-sede').value,coordinador:el('t-coord').value==='si',activo:el('t-active').value==='si'};
  execute(window.capfor.saveTeacher(p),'Docente guardado.');
});
for(const id of ['q','kind','month'])el(id).addEventListener('input',render);
el('down-filtered').addEventListener('click',()=>execute(window.capfor.downloadZip({scope:'filtrados',ids:shown.map(x=>x.id)}),r=>r.count+' documentos exportados.'));
el('down-everything').addEventListener('click',()=>execute(window.capfor.downloadZip({scope:'todos'}),r=>r.count+' documentos exportados en ZIP.'));
load().catch(e=>toast('Error al cargar los registros: '+e.message));
