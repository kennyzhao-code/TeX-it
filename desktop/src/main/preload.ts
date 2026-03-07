import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    compileDocument: (config: any) => ipcRenderer.invoke('compile-document', config),
    openDirectory: () => ipcRenderer.invoke('open-directory'),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    saveFile: (filePath: string, content: string) => ipcRenderer.invoke('save-file', filePath, content),
    createItem: (dirPath: string, name: string, isDir: boolean) => ipcRenderer.invoke('create-item', dirPath, name, isDir),
    openAskBox: (currentCode: string) => ipcRenderer.invoke('open-ask-box', currentCode),
    askGeminiEdit: (payload: { prompt: string, content: string }) => ipcRenderer.invoke('ask-gemini-edit', payload),
    sendProposal: (newCode: string) => ipcRenderer.invoke('send-proposal', newCode),
    getDeepgramKey: () => ipcRenderer.invoke('get-deepgram-key'),
    onInitAskBox: (callback: (code: string) => void) => {
        ipcRenderer.removeAllListeners('init-ask-box');
        ipcRenderer.on('init-ask-box', (_event, code) => callback(code));
    },
    onProposalReceived: (callback: (newCode: string) => void) => {
        ipcRenderer.removeAllListeners('proposal-received');
        ipcRenderer.on('proposal-received', (_event, newCode) => callback(newCode));
    }
});
