'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('capfor',{
  list:()=>ipcRenderer.invoke('dashboard:list'),
  saveTeacher:data=>ipcRenderer.invoke('teachers:save',data),
  importDocument:data=>ipcRenderer.invoke('documents:import',data),
  setState:(id,estado)=>ipcRenderer.invoke('documents:state',{id,estado}),
  downloadOne:id=>ipcRenderer.invoke('documents:download-one',id),
  downloadZip:request=>ipcRenderer.invoke('documents:download-zip',request)
});
