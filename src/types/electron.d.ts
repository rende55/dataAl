interface ElectronAPI {
  saveFile: (data: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    content: string;
  }) => Promise<{ success: boolean; filePath?: string; message?: string }>;
  
  openFile: (data: {
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ success: boolean; filePath?: string; content?: string; message?: string }>;
  
  openExcelFile: (data: {
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ success: boolean; filePath?: string; buffer?: string; fileName?: string; message?: string }>;
  
  getAppVersion: () => string;
  getPlatform: () => string;
}

interface Window {
  electronAPI: ElectronAPI;
}
