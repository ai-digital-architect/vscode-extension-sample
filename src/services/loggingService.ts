import * as vscode from 'vscode';
import { LogLevel } from '../types/logLevel';

/**
 * Service for consistent logging across the extension
 */
export class LoggingService {
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Java Upgrade');
        this.logLevel = LogLevel.INFO;
    }

    /**
     * Sets the logging level
     */
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /**
     * Logs debug information
     */
    public debug(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            this.log('DEBUG', message, ...args);
        }
    }

    /**
     * Logs general information
     */
    public info(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.INFO) {
            this.log('INFO', message, ...args);
        }
    }

    /**
     * Logs warnings
     */
    public warn(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.WARN) {
            this.log('WARN', message, ...args);
            vscode.window.showWarningMessage(this.formatMessage(message, args));
        }
    }

    /**
     * Logs errors
     */
    public error(message: string, error?: Error, ...args: any[]): void {
        if (this.logLevel <= LogLevel.ERROR) {
            this.log('ERROR', message, ...args);
            if (error) {
                this.log('ERROR', error.stack || error.message);
            }
            vscode.window.showErrorMessage(this.formatMessage(message, args));
        }
    }

    /**
     * Logs upgrade progress
     */
    public logUpgradeStep(step: string, details?: string): void {
        this.info(`=== ${step} ===`);
        if (details) {
            this.info(details);
        }
    }

    /**
     * Shows the log output panel
     */
    public show(): void {
        this.outputChannel.show();
    }

    /**
     * Clears the log output
     */
    public clear(): void {
        this.outputChannel.clear();
    }

    /**
     * Disposes of the output channel
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }

    private log(level: string, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = this.formatMessage(message, args);
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${formattedMessage}`);
    }

    private formatMessage(message: string, args: any[]): string {
        if (args.length === 0) {
            return message;
        }

        try {
            return message.replace(/{(\d+)}/g, (match, index) => {
                const arg = args[index];
                return arg !== undefined ? 
                    (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)) 
                    : match;
            });
        } catch (error) {
            return `${message} ${args.map(arg => JSON.stringify(arg)).join(' ')}`;
        }
    }
}
