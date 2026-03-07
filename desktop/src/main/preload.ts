import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    compileDocument: (config: any) => ipcRenderer.invoke('compile-document', config),
});
