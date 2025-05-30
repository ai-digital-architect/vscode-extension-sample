import * as vscode from 'vscode';
import * as path from 'path';
import { LoggingService } from './loggingService';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Service to handle Git operations during the upgrade process
 */
export class GitService {
    private logger: LoggingService;
    private workspaceRoot: string;

    constructor(logger: LoggingService) {
        this.logger = logger;
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    /**
     * Creates a new branch for the upgrade
     */
    public async createUpgradeBranch(version: string): Promise<void> {
        const branchName = `java-upgrade/java-${version}-${Date.now()}`;
        
        await this.executeGitCommand('checkout -b ' + branchName);
        this.logger.info('Created upgrade branch: {0}', branchName);
    }

    /**
     * Commits changes made during the upgrade
     */
    public async commitChanges(message: string, files?: string[]): Promise<void> {
        // Add files to staging
        if (files && files.length > 0) {
            const filePaths = files.map(f => this.getRelativePath(f)).join(' ');
            await this.executeGitCommand('add ' + filePaths);
        } else {
            await this.executeGitCommand('add .');
        }

        // Create commit
        await this.executeGitCommand(['commit', '-m', message]);
        this.logger.info('Committed changes: {0}', message);
    }

    /**
     * Creates upgrade checkpoints for easy rollback
     */
    public async createCheckpoint(phase: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const tag = `upgrade-checkpoint-${phase}-${timestamp}`;
        
        await this.executeGitCommand(['tag', '-a', tag, '-m', `Upgrade checkpoint: ${phase}`]);
        this.logger.info('Created checkpoint: {0}', tag);
        
        return tag;
    }

    /**
     * Rolls back to a specific checkpoint
     */
    public async rollbackToCheckpoint(tag: string): Promise<void> {
        await this.executeGitCommand(['reset', '--hard', tag]);
        this.logger.info('Rolled back to checkpoint: {0}', tag);
    }

    /**
     * Gets the list of files changed during upgrade
     */
    public async getChangedFiles(): Promise<GitFileChange[]> {
        const { stdout } = await this.executeGitCommand('status --porcelain');
        return this.parseGitStatus(stdout);
    }

    /**
     * Gets the diff for specific files
     */
    public async getDiff(files?: string[]): Promise<string> {
        const command = ['diff', '--unified=3'];
        if (files && files.length > 0) {
            command.push(...files.map(f => this.getRelativePath(f)));
        }
        
        const { stdout } = await this.executeGitCommand(command);
        return stdout;
    }

    /**
     * Checks if the workspace is clean
     */
    public async isWorkspaceClean(): Promise<boolean> {
        const { stdout } = await this.executeGitCommand('status --porcelain');
        return stdout.trim() === '';
    }

    /**
     * Stashes any existing changes
     */
    public async stashChanges(message?: string): Promise<void> {
        const command = ['stash', 'push'];
        if (message) {
            command.push('-m', message);
        }
        
        await this.executeGitCommand(command);
        this.logger.info('Stashed workspace changes');
    }

    /**
     * Applies stashed changes
     */
    public async applyStash(): Promise<void> {
        await this.executeGitCommand('stash pop');
        this.logger.info('Applied stashed changes');
    }

    private async executeGitCommand(command: string | string[]): Promise<{ stdout: string; stderr: string }> {
        const cmd = Array.isArray(command) ? command.join(' ') : command;
        try {
            const result = await execAsync(`git ${cmd}`, { cwd: this.workspaceRoot });
            return result;
        } catch (error: any) {
            this.logger.error('Git command failed: git {0}', cmd, error);
            throw new Error(`Git operation failed: ${error.message}`);
        }
    }

    private getRelativePath(filePath: string): string {
        return path.relative(this.workspaceRoot, filePath);
    }

    private parseGitStatus(status: string): GitFileChange[] {
        return status.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const state = line.substring(0, 2);
                const file = line.substring(3);
                
                return {
                    file,
                    state: this.parseGitFileState(state)
                };
            });
    }

    private parseGitFileState(state: string): GitFileState {
        const [index, working] = state;
        
        if (index === '?' && working === '?') return 'untracked';
        if (index === 'A') return 'added';
        if (index === 'M' || working === 'M') return 'modified';
        if (index === 'D' || working === 'D') return 'deleted';
        if (index === 'R') return 'renamed';
        if (index === 'C') return 'copied';
        
        return 'unknown';
    }
}

type GitFileState = 'untracked' | 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unknown';

interface GitFileChange {
    file: string;
    state: GitFileState;
}
