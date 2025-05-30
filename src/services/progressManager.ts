import * as vscode from 'vscode';
import { LoggingService } from './loggingService';

/**
 * Service to track and report upgrade progress
 */
export class ProgressManager {
    private currentProgress?: vscode.Progress<{ message?: string; increment?: number }>;
    private currentToken?: vscode.CancellationToken;
    private logger: LoggingService;
    private steps: UpgradeStep[] = [];
    private currentStepIndex: number = -1;

    constructor(logger: LoggingService) {
        this.logger = logger;
    }

    /**
     * Initializes the upgrade process with defined steps
     */
    public initializeUpgrade(steps: UpgradeStep[]): void {
        this.steps = steps;
        this.currentStepIndex = -1;
        this.logger.info('Initializing upgrade process with {0} steps', steps.length);
    }

    /**
     * Starts the progress tracking UI
     */
    public async begin(): Promise<void> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Java Upgrade',
            cancellable: true
        }, async (progress, token) => {
            this.currentProgress = progress;
            this.currentToken = token;

            token.onCancellationRequested(() => {
                this.logger.info('Upgrade process cancelled by user');
            });

            await this.runAllSteps();
        });
    }

    /**
     * Moves to the next step in the upgrade process
     */
    public async nextStep(): Promise<void> {
        this.currentStepIndex++;
        if (this.currentStepIndex >= this.steps.length) {
            return;
        }

        const step = this.steps[this.currentStepIndex];
        const increment = 100 / this.steps.length;

        this.logger.logUpgradeStep(step.title, step.description);
        this.currentProgress?.report({
            message: step.title,
            increment
        });

        // Create status bar item for current step
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = `$(loading~spin) ${step.title}`;
        statusBarItem.show();

        try {
            await step.task();
            statusBarItem.text = `$(check) ${step.title}`;
        } catch (error) {
            statusBarItem.text = `$(error) ${step.title}`;
            throw error;
        } finally {
            setTimeout(() => statusBarItem.dispose(), 3000);
        }
    }

    /**
     * Reports progress within the current step
     */
    public reportStepProgress(message: string, increment?: number): void {
        if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
            const step = this.steps[this.currentStepIndex];
            const fullMessage = `${step.title}: ${message}`;
            
            this.logger.debug(fullMessage);
            this.currentProgress?.report({
                message: fullMessage,
                increment
            });
        }
    }

    /**
     * Checks if the upgrade process was cancelled
     */
    public isCancelled(): boolean {
        return this.currentToken?.isCancellationRequested || false;
    }

    /**
     * Reports an error in the current step
     */
    public reportError(error: Error): void {
        const step = this.steps[this.currentStepIndex];
        this.logger.error(`Error in step "${step.title}": ${error.message}`, error);
    }

    private async runAllSteps(): Promise<void> {
        for (let i = 0; i < this.steps.length; i++) {
            if (this.isCancelled()) {
                break;
            }
            await this.nextStep();
        }
    }
}

interface UpgradeStep {
    title: string;
    description?: string;
    task: () => Promise<void>;
}
