import * as vscode from 'vscode';
import { LoggingService } from './loggingService';

/**
 * Service to monitor workspace file changes during upgrade
 */
export class FileWatcherService {
    private watchers: vscode.FileSystemWatcher[] = [];
    private logger: LoggingService;
    private changeLog: FileChange[] = [];

    constructor(logger: LoggingService) {
        this.logger = logger;
    }

    /**
     * Starts monitoring workspace files
     */
    public startWatching(): void {
        // Watch Java source files
        this.watchPattern('**/*.java');
        
        // Watch build files
        this.watchPattern('**/pom.xml');
        this.watchPattern('**/build.gradle');
        this.watchPattern('**/build.gradle.kts');
        
        // Watch configuration files
        this.watchPattern('**/application.properties');
        this.watchPattern('**/application.yml');
        this.watchPattern('**/application.yaml');

        this.logger.info('File watching started');
    }

    /**
     * Gets the log of file changes
     */
    public getChangeLog(): FileChange[] {
        return [...this.changeLog];
    }

    /**
     * Stops monitoring workspace files
     */
    public stopWatching(): void {
        this.watchers.forEach(watcher => watcher.dispose());
        this.watchers = [];
        this.logger.info('File watching stopped');
    }

    /**
     * Clears the change log
     */
    public clearChangeLog(): void {
        this.changeLog = [];
    }

    /**
     * Gets a summary of changes
     */
    public getChangeSummary(): ChangeSummary {
        const summary: ChangeSummary = {
            totalChanges: this.changeLog.length,
            fileTypes: {},
            changeTypes: {
                created: 0,
                modified: 0,
                deleted: 0
            }
        };

        for (const change of this.changeLog) {
            // Count by file type
            const fileType = this.getFileType(change.file);
            summary.fileTypes[fileType] = (summary.fileTypes[fileType] || 0) + 1;

            // Count by change type
            summary.changeTypes[change.type]++;
        }

        return summary;
    }

    private watchPattern(glob: string): void {
        const watcher = vscode.workspace.createFileSystemWatcher(glob);

        watcher.onDidCreate(uri => {
            this.logChange({
                file: uri.fsPath,
                type: 'created',
                timestamp: new Date()
            });
        });

        watcher.onDidChange(uri => {
            this.logChange({
                file: uri.fsPath,
                type: 'modified',
                timestamp: new Date()
            });
        });

        watcher.onDidDelete(uri => {
            this.logChange({
                file: uri.fsPath,
                type: 'deleted',
                timestamp: new Date()
            });
        });

        this.watchers.push(watcher);
    }

    private logChange(change: FileChange): void {
        this.changeLog.push(change);
        this.logger.debug('File change detected: {0} {1}', change.type, change.file);
    }

    private getFileType(filePath: string): string {
        if (filePath.endsWith('.java')) return 'java';
        if (filePath.endsWith('.xml')) return 'xml';
        if (filePath.endsWith('.gradle') || filePath.endsWith('.gradle.kts')) return 'gradle';
        if (filePath.endsWith('.properties')) return 'properties';
        if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) return 'yaml';
        return 'other';
    }

    /**
     * Disposes of all watchers
     */
    public dispose(): void {
        this.stopWatching();
    }
}

interface FileChange {
    file: string;
    type: 'created' | 'modified' | 'deleted';
    timestamp: Date;
}

interface ChangeSummary {
    totalChanges: number;
    fileTypes: { [key: string]: number };
    changeTypes: {
        created: number;
        modified: number;
        deleted: number;
    };
}
