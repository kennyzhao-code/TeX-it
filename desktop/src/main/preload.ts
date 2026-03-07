import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    compileDocument: (config: any) => ipcRenderer.invoke('compile-document', config),
    openDirectory: () => ipcRenderer.invoke('open-directory'),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    saveFile: (filePath: string, content: string) => ipcRenderer.invoke('save-file', filePath, content),
    createItem: (dirPath: string, name: string, isDir: boolean) => ipcRenderer.invoke('create-item', dirPath, name, isDir),
});
