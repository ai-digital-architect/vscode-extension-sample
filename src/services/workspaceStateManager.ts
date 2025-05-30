import * as vscode from 'vscode';
import { LoggingService } from './loggingService';

/**
 * Service to manage workspace state and preferences during upgrade
 */
export class WorkspaceStateManager {
    private context: vscode.ExtensionContext;
    private logger: LoggingService;

    // State keys
    private static readonly LAST_UPGRADE_KEY = 'lastUpgradeTimestamp';
    private static readonly UPGRADE_HISTORY_KEY = 'upgradeHistory';
    private static readonly USER_PREFERENCES_KEY = 'userPreferences';
    private static readonly IGNORED_WARNINGS_KEY = 'ignoredWarnings';

    constructor(context: vscode.ExtensionContext, logger: LoggingService) {
        this.context = context;
        this.logger = logger;
    }

    /**
     * Records the start of an upgrade process
     */
    public async recordUpgradeStart(info: UpgradeInfo): Promise<void> {
        const timestamp = new Date().toISOString();
        await this.context.globalState.update(WorkspaceStateManager.LAST_UPGRADE_KEY, timestamp);

        const history = this.getUpgradeHistory();
        history.push({
            timestamp,
            ...info,
            status: 'in-progress'
        });

        await this.context.globalState.update(WorkspaceStateManager.UPGRADE_HISTORY_KEY, history);
        this.logger.debug('Recorded upgrade start: {0}', info);
    }

    /**
     * Updates the status of the current upgrade
     */
    public async updateUpgradeStatus(status: UpgradeStatus): Promise<void> {
        const history = this.getUpgradeHistory();
        const lastUpgrade = history[history.length - 1];
        
        if (lastUpgrade) {
            lastUpgrade.status = status;
            lastUpgrade.completedAt = new Date().toISOString();
            await this.context.globalState.update(WorkspaceStateManager.UPGRADE_HISTORY_KEY, history);
        }
    }

    /**
     * Gets the upgrade history
     */
    public getUpgradeHistory(): UpgradeHistoryEntry[] {
        return this.context.globalState.get<UpgradeHistoryEntry[]>(
            WorkspaceStateManager.UPGRADE_HISTORY_KEY,
            []
        );
    }

    /**
     * Saves user preferences
     */
    public async savePreference(key: string, value: any): Promise<void> {
        const preferences = this.getUserPreferences();
        preferences[key] = value;
        await this.context.globalState.update(WorkspaceStateManager.USER_PREFERENCES_KEY, preferences);
    }

    /**
     * Gets user preferences
     */
    public getUserPreferences(): { [key: string]: any } {
        return this.context.globalState.get<{ [key: string]: any }>(
            WorkspaceStateManager.USER_PREFERENCES_KEY,
            {}
        );
    }

    /**
     * Adds a warning to the ignored list
     */
    public async ignoreWarning(warningId: string): Promise<void> {
        const ignoredWarnings = this.getIgnoredWarnings();
        if (!ignoredWarnings.includes(warningId)) {
            ignoredWarnings.push(warningId);
            await this.context.globalState.update(
                WorkspaceStateManager.IGNORED_WARNINGS_KEY,
                ignoredWarnings
            );
        }
    }

    /**
     * Checks if a warning is ignored
     */
    public isWarningIgnored(warningId: string): boolean {
        return this.getIgnoredWarnings().includes(warningId);
    }

    /**
     * Gets the list of ignored warnings
     */
    public getIgnoredWarnings(): string[] {
        return this.context.globalState.get<string[]>(
            WorkspaceStateManager.IGNORED_WARNINGS_KEY,
            []
        );
    }

    /**
     * Clears all workspace state
     */
    public async clearState(): Promise<void> {
        await this.context.globalState.update(WorkspaceStateManager.LAST_UPGRADE_KEY, undefined);
        await this.context.globalState.update(WorkspaceStateManager.UPGRADE_HISTORY_KEY, undefined);
        await this.context.globalState.update(WorkspaceStateManager.USER_PREFERENCES_KEY, undefined);
        await this.context.globalState.update(WorkspaceStateManager.IGNORED_WARNINGS_KEY, undefined);
        this.logger.info('Workspace state cleared');
    }
}

interface UpgradeInfo {
    fromVersion: string;
    toVersion: string;
    buildTool: string;
    projectPath: string;
}

type UpgradeStatus = 'in-progress' | 'completed' | 'failed' | 'cancelled';

interface UpgradeHistoryEntry extends UpgradeInfo {
    timestamp: string;
    completedAt?: string;
    status: UpgradeStatus;
}
