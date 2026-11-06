'use strict';
const {app,BrowserWindow,ipcMain,dialog}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const JSZip=require('jszip');
let win;
const TYPES=[
  'Acuerdo de patrocinio de capacitación',
  'Acuerdo de formación institucional',
  'Plan individual de formación y capacitación',
  'Reporte individual de resultados',
  'Certificado de capacitación',
  'Certificado de formación',
  'Planificación de capacitación',
  'Informe final de capacitación',
  'Instrumento de evaluación',
  'Informe de impacto',
  'Reporte de seguimiento de formación'
];
const STATES=['Pendiente de validación','Validado','Pendiente de firma','Recibido firmado'];
function dir(){return path.join(app.getPath('userData'),'pdf');}
function database(name){return path.join(app.getPath('userData'),name+'.json');}
function safe(value){return String(value||'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().slice(0,120)||'sin_dato';}
function month(value){return /^20\d\d-(0[1-9]|1[0-2])$/.test(String(value||''));}
function cedula(value){return /^\d{10}$/.test(String(value||''));}
function trim(value,n=160){return String(value||'').trim().slice(0,n);}
async function read(name){
  try {const rows=JSON.parse(await fs.readFile(database(name),'utf8'));if(!Array.isArray(rows))throw new Error('Registro inválido: '+name);return rows;}
  catch(e){if(e.code==='ENOENT')return [];throw e;}
}
async function write(name,rows){
  const target=database(name),temp=target+'.'+crypto.randomUUID()+'.tmp';
  await fs.writeFile(temp,JSON.stringify(rows,null,2),{encoding:'utf8',mode:0o600});
  await fs.rename(temp,target);
}
async function pdfHeader(filename){
  const fh=await fs.open(filename,'r');try{const b=Buffer.alloc(5);await fh.read(b,0,5,0);return b.toString()==='%PDF-';}finally{await fh.close();}
}
async function pickSave(defaultPath,ext){
  const res=await dialog.showSaveDialog(win,{defaultPath,filters:[{name:ext.toUpperCase(),extensions:[ext]}]});
  return res.canceled?null:res.filePath;
}
async function createWindow(){
  win=new BrowserWindow({width:1350,height:860,minWidth:970,minHeight:620,title:'Cap-For | UGPA',
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  await win.loadFile(path.join(__dirname,'admin','index.html'));
}
app.whenReady().then(async()=>{await fs.mkdir(dir(),{recursive:true});await createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
ipcMain.handle('dashboard:list',async()=>({documents:await read('documentos'),teachers:await read('docentes'),types:TYPES,states:STATES}));
ipcMain.handle('teachers:save',async(_e,p)=>{
  if(!p||!cedula(p.cedula)||trim(p.nombre).length<3)throw new Error('Se requiere cédula de 10 dígitos y nombre.');
  const records=await read('docentes');
  const item={cedula:trim(p.cedula),nombre:trim(p.nombre),carrera:trim(p.carrera),sede:trim(p.sede),coordinador:!!p.coordinador,activo:p.activo!==false,actualizado:new Date().toISOString()};
  const pos=records.findIndex(row=>row.cedula===item.cedula);
  if(pos<0)records.push(item);else records[pos]=item;
  await write('docentes',records);
  return {ok:true};
});
ipcMain.handle('documents:import',async(_e,p)=>{
  if(!p||!TYPES.includes(p.tipo)||!month(p.periodo))throw new Error('Seleccione tipo documental y mes de emisión.');
  const teachers=await read('docentes');
  const ci=trim(p.cedula);
  if(ci&&!cedula(ci))throw new Error('La cédula debe contener 10 dígitos.');
  const teacher=ci?teachers.find(t=>t.cedula===ci):null;
  const nombre=trim(teacher?.nombre||p.docente);
  if(nombre.length<3)throw new Error('Ingrese el nombre del docente.');
  const selection=await dialog.showOpenDialog(win,{properties:['openFile','multiSelections'],filters:[{name:'Archivos PDF',extensions:['pdf']}]});
  if(selection.canceled)return {added:0,skipped:0};
  const docs=await read('documentos');let added=0,skipped=0;
  for(const source of selection.filePaths){
    const st=await fs.stat(source);
    if(!st.isFile()||st.size>30*1024*1024||path.extname(source).toLowerCase()!=='.pdf'||!(await pdfHeader(source))){skipped++;continue;}
    const id=crypto.randomUUID();
    await fs.copyFile(source,path.join(dir(),id+'.pdf'));
    docs.push({id,cedula:ci,docente:nombre,carrera:trim(teacher?.carrera||p.carrera),
      sede:trim(teacher?.sede||p.sede),periodo:p.periodo,tipo:p.tipo,codigo:trim(p.codigo),
      nombre:path.basename(source),estado:'Pendiente de validación',creado:new Date().toISOString(),bytes:st.size});
    added++;
  }
  await write('documentos',docs);return {added,skipped};
});
ipcMain.handle('documents:state',async(_e,p)=>{
  if(!p||typeof p.id!=='string'||!STATES.includes(p.estado))throw new Error('Estado inválido.');
  const docs=await read('documentos'),doc=docs.find(x=>x.id===p.id);
  if(!doc)throw new Error('No se encontró el documento.');
  doc.estado=p.estado;doc.actualizado=new Date().toISOString();
  await write('documentos',docs);return {ok:true};
});
ipcMain.handle('documents:download-one',async(_e,id)=>{
  if(typeof id!=='string')throw new Error('ID inválido');
  const doc=(await read('documentos')).find(d=>d.id===id);
  if(!doc)throw new Error('El documento no existe.');
  const dest=await pickSave(safe(doc.codigo?doc.codigo+'_'+doc.nombre:doc.nombre).replace(/\.pdf$/i,'')+'.pdf','pdf');
  if(!dest)return {canceled:true};
  await fs.copyFile(path.join(dir(),doc.id+'.pdf'),dest);return {canceled:false,count:1};
});
ipcMain.handle('documents:download-zip',async(_e,request)=>{
  if(!request||!['todos','filtrados','docente'].includes(request.scope))throw new Error('Selección inválida');
  const all=await read('documentos');let docs;
  if(request.scope==='todos')docs=all;
  else if(request.scope==='filtrados'){
    if(!Array.isArray(request.ids)||request.ids.length>20000||request.ids.some(x=>typeof x!=='string'))throw new Error('Filtro inválido');
    const ids=new Set(request.ids);docs=all.filter(x=>ids.has(x.id));
  }else{
    const id=trim(request.cedula),name=trim(request.docente).toLowerCase();
    if(!id&&!name)throw new Error('Seleccione un docente');
    docs=all.filter(x=>id?x.cedula===id:!x.cedula&&x.docente.toLowerCase()===name);
  }
  if(!docs.length)throw new Error('No hay PDF para descargar.');
  const dest=await pickSave('Cap-For_'+request.scope+'.zip','zip');
  if(!dest)return {canceled:true};
  const zip=new JSZip();
  for(const doc of docs){
    const folder=[safe(doc.periodo),safe(doc.tipo),safe(doc.cedula||doc.docente)].join('/');
    const filename=safe(doc.codigo||doc.id.slice(0,8))+'_'+safe(doc.nombre);
    zip.file(folder+'/'+filename,await fs.readFile(path.join(dir(),doc.id+'.pdf')));
  }
  zip.file('indice.json',JSON.stringify(docs.map(({id,cedula,docente,carrera,sede,periodo,tipo,codigo,nombre,estado})=>({id,cedula,docente,carrera,sede,periodo,tipo,codigo,nombre,estado})),null,2));
  await fs.writeFile(dest,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:5}}));
  return {canceled:false,count:docs.length};
});
