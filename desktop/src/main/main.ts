import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
const latex = require('node-latex');

let mainWindow: BrowserWindow | null = null;
let goProcess: ChildProcess | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // In development, Vite runs on port 5173 by default
    // In production, load the built HTML bundle
    mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
    // Spawn the Go backend
    // For dev, we will run `go run cmd/server/main.go`. 
    // In prod, this should point to a built binary.
    const backendPath = path.join(__dirname, '../../backend');
    goProcess = spawn('go', ['run', 'cmd/server/main.go'], { cwd: backendPath });

    if (goProcess.stdout && goProcess.stderr) {
        goProcess.stdout.on('data', (data: any) => console.log(`[Go]: ${data}`));
        goProcess.stderr.on('data', (data: any) => console.error(`[Go Error]: ${data}`));
    }

    createWindow();

    ipcMain.handle('compile-document', async (event, config) => {
        return new Promise((resolve) => {
            try {
                const pdfStream = latex(config.code);
                const chunks: Buffer[] = [];
                let errorMsg = '';

                pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
                pdfStream.on('error', (err: any) => {
                    errorMsg = err.message || String(err);
                });
                pdfStream.on('finish', () => {
                    if (errorMsg) {
                        resolve({ error: errorMsg });
                    } else {
                        const buffer = Buffer.concat(chunks);
                        resolve({ data: buffer.toString('base64') });
                    }
                });
            } catch (err: any) {
                resolve({ error: err.message || String(err) });
            }
        });
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    if (goProcess) goProcess.kill();
});
