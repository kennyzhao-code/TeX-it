import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
const latex = require('node-latex');

let mainWindow: BrowserWindow | null = null;
let askBoxWindow: BrowserWindow | null = null;
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

    ipcMain.handle('compile-document', async (event, filePath: string) => {
        return new Promise((resolve) => {
            try {
                if (!fs.existsSync(filePath)) {
                    resolve({ error: `File not found: ${filePath}` });
                    return;
                }
                
                const dirPath = path.dirname(filePath);
                const fileName = path.basename(filePath);
                
                // Use a temporary directory for build artifacts to avoid polluting the workspace
                const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ltexch-'));
                
                // Combine TEXINPUTS with the document directory so includes work
                const env = Object.assign({}, process.env, {
                    TEXINPUTS: `${dirPath}:${process.env.TEXINPUTS || ''}`
                });

                // Spawn pdflatex directly to bypass buggy node-latex wrapper
                const texProcess = spawn('pdflatex', [
                    '-halt-on-error',
                    '-interaction=nonstopmode',
                    `-output-directory=${tempDir}`,
                    fileName
                ], { cwd: dirPath, env });

                let errorLog = '';
                
                texProcess.stdout.on('data', (data) => {
                    errorLog += data.toString();
                });
                
                texProcess.stderr.on('data', (data) => {
                    errorLog += data.toString();
                });

                texProcess.on('close', (code) => {
                    if (code !== 0) {
                        // Extract just the error message if possible
                        const match = errorLog.match(/! .*/g);
                        const cleanError = match ? match.join('\n') : errorLog;
                        fs.rmSync(tempDir, { recursive: true, force: true });
                        resolve({ error: `LaTeX Error:\n${cleanError}` });
                    } else {
                        // Success! Read the PDF and return as base64
                        const pdfPath = path.join(tempDir, fileName.replace('.tex', '.pdf'));
                        if (fs.existsSync(pdfPath)) {
                            const buffer = fs.readFileSync(pdfPath);
                            fs.rmSync(tempDir, { recursive: true, force: true });
                            resolve({ data: buffer.toString('base64') });
                        } else {
                            fs.rmSync(tempDir, { recursive: true, force: true });
                            resolve({ error: 'PDF file was not generated.' });
                        }
                    }
                });
            } catch (err: any) {
                resolve({ error: err.message || String(err) });
            }
        });
    });

    ipcMain.handle('open-ask-box', async (event, currentCode) => {
        if (askBoxWindow) {
            askBoxWindow.focus();
            askBoxWindow.webContents.send('init-ask-box', currentCode);
            return;
        }

        askBoxWindow = new BrowserWindow({
            width: 500,
            height: 400,
            alwaysOnTop: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        askBoxWindow.loadURL('http://localhost:5173/ask-box');

        askBoxWindow.webContents.once('did-finish-load', () => {
            askBoxWindow!.webContents.send('init-ask-box', currentCode);
        });

        askBoxWindow.on('closed', () => {
            askBoxWindow = null;
        });
    });

    ipcMain.handle('ask-gemini-edit', async (event, payload: { prompt: string, content: string }) => {
        try {
            const response = await fetch('http://localhost:8080/api/ai/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return data;
        } catch (err: any) {
            return { error: err.message };
        }
    });

    ipcMain.handle('send-proposal', async (event, newCode) => {
        if (mainWindow) {
            mainWindow.webContents.send('proposal-received', newCode);
        }
        if (askBoxWindow) {
            askBoxWindow.close();
        }
        return { success: true };
    });

    ipcMain.handle('get-deepgram-key', async () => {
        // Read the Deepgram API key from the backend .env file
        try {
            const envPath = path.join(__dirname, '../../backend/.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf-8');
                const match = envContent.match(/^DEEPGRAM_API_KEY\s*=\s*(.+)$/m);
                if (match) return { key: match[1].trim() };
            }
            return { error: 'DEEPGRAM_API_KEY not found in backend/.env' };
        } catch (err: any) {
            return { error: err.message };
        }
    });


    ipcMain.handle('open-directory', async () => {
        if (!mainWindow) return { error: 'No main window' };
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Open Project Folder'
        });

        if (canceled || filePaths.length === 0) return { canceled: true };

        const dirPath = filePaths[0];
        try {
            const items = fs.readdirSync(dirPath, { withFileTypes: true });
            const files = items.map(item => ({
                name: item.name,
                isDir: item.isDirectory(),
                path: path.join(dirPath, item.name)
            })).sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
            });
            return { canceled: false, path: dirPath, files };
        } catch (err: any) {
            return { error: err.message };
        }
    });

    ipcMain.handle('read-file', async (event, filePath) => {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return { content };
        } catch (err: any) {
            return { error: err.message };
        }
    });

    ipcMain.handle('save-file', async (event, filePath, content) => {
        try {
            fs.writeFileSync(filePath, content, 'utf-8');
            return { success: true };
        } catch (err: any) {
            return { error: err.message };
        }
    });

    ipcMain.handle('create-item', async (event, dirPath, name, isDir) => {
        try {
            const fullPath = path.join(dirPath, name);
            if (isDir) {
                fs.mkdirSync(fullPath);
            } else {
                fs.writeFileSync(fullPath, '', 'utf-8');
            }
            return { success: true, path: fullPath };
        } catch (err: any) {
            return { error: err.message };
        }
    });

    ipcMain.handle('read-directory', async (event, dirPath) => {
        try {
            const items = fs.readdirSync(dirPath, { withFileTypes: true });
            const files = items.map(item => ({
                name: item.name,
                isDir: item.isDirectory(),
                path: path.join(dirPath, item.name)
            })).sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
            });
            return { files };
        } catch (err: any) {
            return { error: err.message };
        }
    });

    ipcMain.handle('rename-item', async (event, oldPath, newName) => {
        try {
            const dirPath = path.dirname(oldPath);
            const newPath = path.join(dirPath, newName);
            fs.renameSync(oldPath, newPath);
            return { success: true, newPath };
        } catch (err: any) {
            return { error: err.message };
        }
    });

    ipcMain.handle('delete-item', async (event, itemPath) => {
        try {
            await shell.trashItem(itemPath);
            return { success: true };
        } catch (err: any) {
            return { error: err.message };
        }
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
