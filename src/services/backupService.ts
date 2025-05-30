import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LoggingService } from './loggingService';

/**
 * Service to backup and restore project files during upgrade
 */
export class BackupService {
    private backupDir: string;
    private logger: LoggingService;

    constructor(logger: LoggingService) {
        this.logger = logger;
        this.backupDir = path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', '.java-upgrade-backup');
    }

    /**
     * Creates a backup of project files before upgrade
     */
    public async createBackup(): Promise<void> {
        this.logger.info('Creating project backup...');

        try {
            // Create unique backup directory with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, timestamp);
            
            // Ensure backup directory exists
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }

            // Copy project files
            await this.backupProjectFiles(backupPath);

            this.logger.info('Backup created successfully at: {0}', backupPath);
            return;
        } catch (error) {
            this.logger.error('Failed to create backup', error as Error);
            throw error;
        }
    }

    /**
     * Restores project from a specific backup
     */
    public async restoreBackup(backupTimestamp?: string): Promise<void> {
        try {
            const backupPath = await this.getBackupPath(backupTimestamp);
            if (!backupPath) {
                throw new Error('No backup found to restore');
            }

            this.logger.info('Restoring from backup: {0}', backupPath);
            await this.restoreProjectFiles(backupPath);
            
            this.logger.info('Project restored successfully');
        } catch (error) {
            this.logger.error('Failed to restore backup', error as Error);
            throw error;
        }
    }

    /**
     * Lists all available backups
     */
    public async listBackups(): Promise<BackupInfo[]> {
        if (!fs.existsSync(this.backupDir)) {
            return [];
        }

        const backups = fs.readdirSync(this.backupDir)
            .filter(name => {
                const stats = fs.statSync(path.join(this.backupDir, name));
                return stats.isDirectory();
            })
            .map(name => ({
                timestamp: name,
                path: path.join(this.backupDir, name),
                created: fs.statSync(path.join(this.backupDir, name)).birthtime
            }))
            .sort((a, b) => b.created.getTime() - a.created.getTime());

        return backups;
    }

    /**
     * Cleans up old backups
     */
    public async cleanupOldBackups(keepLast: number = 5): Promise<void> {
        const backups = await this.listBackups();
        
        if (backups.length <= keepLast) {
            return;
        }

        const toDelete = backups.slice(keepLast);
        for (const backup of toDelete) {
            this.logger.debug('Removing old backup: {0}', backup.timestamp);
            await this.deleteDirectory(backup.path);
        }
    }

    private async backupProjectFiles(backupPath: string): Promise<void> {
        if (!vscode.workspace.workspaceFolders?.[0]) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const filesToBackup = await this.getProjectFiles(workspaceRoot);

        for (const file of filesToBackup) {
            const relativePath = path.relative(workspaceRoot, file);
            const backupFilePath = path.join(backupPath, relativePath);

            // Create directory structure
            fs.mkdirSync(path.dirname(backupFilePath), { recursive: true });
            
            // Copy file
            fs.copyFileSync(file, backupFilePath);
        }
    }

    private async restoreProjectFiles(backupPath: string): Promise<void> {
        if (!vscode.workspace.workspaceFolders?.[0]) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const filesToRestore = await this.getProjectFiles(backupPath);

        for (const file of filesToRestore) {
            const relativePath = path.relative(backupPath, file);
            const restorePath = path.join(workspaceRoot, relativePath);

            // Create directory structure
            fs.mkdirSync(path.dirname(restorePath), { recursive: true });
            
            // Copy file back
            fs.copyFileSync(file, restorePath);
        }
    }

    private async getProjectFiles(root: string): Promise<string[]> {
        const files: string[] = [];
        
        const ignoredPatterns = [
            'node_modules',
            'target',
            'build',
            '.git',
            '.java-upgrade-backup'
        ];

        const walk = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (ignoredPatterns.some(pattern => fullPath.includes(pattern))) {
                    continue;
                }

                if (entry.isDirectory()) {
                    walk(fullPath);
                } else {
                    files.push(fullPath);
                }
            }
        };

        walk(root);
        return files;
    }

    private async getBackupPath(timestamp?: string): Promise<string | undefined> {
        const backups = await this.listBackups();
        
        if (timestamp) {
            const backup = backups.find(b => b.timestamp === timestamp);
            return backup?.path;
        }

        return backups[0]?.path; // Most recent backup
    }

    private async deleteDirectory(dir: string): Promise<void> {
        if (fs.existsSync(dir)) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await this.deleteDirectory(fullPath);
                } else {
                    fs.unlinkSync(fullPath);
                }
            }

            fs.rmdirSync(dir);
        }
    }
}

interface BackupInfo {
    timestamp: string;
    path: string;
    created: Date;
}
