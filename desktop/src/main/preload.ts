import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    compileDocument: (filePath: string) => ipcRenderer.invoke('compile-document', filePath),
    openDirectory: () => ipcRenderer.invoke("open-directory"),
    readDirectory: (dirPath: string) => ipcRenderer.invoke("read-directory", dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
    saveFile: (filePath: string | null, content: string) => ipcRenderer.invoke("save-file", filePath, content),
    createItem: (dirPath: string, name: string, isDir: boolean) => ipcRenderer.invoke("create-item", dirPath, name, isDir),
    renameItem: (oldPath: string, newName: string) => ipcRenderer.invoke("rename-item", oldPath, newName),
    deleteItem: (itemPath: string) => ipcRenderer.invoke("delete-item", itemPath),
    chatGemini: (prompt: string) => ipcRenderer.invoke("chat-gemini", prompt),
});
