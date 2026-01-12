// main.js (Electron Main Process)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./server'); // Import the Node.js server
const constants = require('./constants');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Trios Retail-POS - v1.0.0',
     
    icon: path.join(__dirname, '/images/shortcut.ico'),
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false,// If you need Node.js access in the frontend
      webSecurity: false
    },
  });

  // Load the React app from the build folder
  // mainWindow.loadURL('http://localhost:8091'); // Backend serves the React app

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start the server before opening the Electron window
app.on('ready', () => {
  server(); // Start the backend server
  createWindow();
});

// Close app when all windows are closed (except for macOS)
app.on('window-all-closed', () => {
  if (constants.ENV.platform !== 'darwin') app.quit();
});

// Reopen window when app is activated (macOS)
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
