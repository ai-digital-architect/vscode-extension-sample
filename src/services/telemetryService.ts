import * as vscode from 'vscode';
import { LoggingService } from './loggingService';

/**
 * Custom implementation of TelemetrySender that uses VS Code's global state
 */
interface TelemetrySender {
    sendEventData(eventName: string, data?: Record<string, any>): void;
    sendErrorData(error: Error, data?: Record<string, any>): void;
}

class StateTelemetrySender implements TelemetrySender {
    constructor(private readonly state: vscode.Memento) {}

    sendEventData(eventName: string, data?: Record<string, any>): void {
        const events = this.state.get<any[]>('telemetry-events', []);
        events.push({ eventName, data, timestamp: new Date().toISOString() });
        this.state.update('telemetry-events', events);
    }

    sendErrorData(error: Error, data?: Record<string, any>): void {
        const errors = this.state.get<any[]>('telemetry-errors', []);
        errors.push({
            error: { 
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            data,
            timestamp: new Date().toISOString()
        });
        this.state.update('telemetry-errors', errors);
    }
}

/**
 * Service to handle telemetry events for the extension
 */
export class TelemetryService {
    private logger: LoggingService;
    private reporter: vscode.TelemetryLogger;
    private isEnabled: boolean;

    constructor(logger: LoggingService, context: vscode.ExtensionContext) {
        this.logger = logger;
        const sender = new StateTelemetrySender(context.globalState);
        this.reporter = vscode.env.createTelemetryLogger(sender);
        this.isEnabled = vscode.workspace.getConfiguration('telemetry').get('enableTelemetry', true);
    }

    /**
     * Records an upgrade start event
     */
    public recordUpgradeStart(projectInfo: ProjectStartInfo): void {
        if (!this.isEnabled) return;

        this.reporter.logUsage('upgrade.start', {
            javaVersion: projectInfo.currentJavaVersion,
            targetVersion: projectInfo.targetVersion,
            buildTool: projectInfo.buildTool,
            hasSpringBoot: String(!!projectInfo.springBootVersion),
            dependencies: String(projectInfo.dependencyCount)
        });
    }

    /**
     * Records an upgrade completion event
     */
    public recordUpgradeComplete(result: UpgradeResult): void {
        if (!this.isEnabled) return;

        this.reporter.logUsage('upgrade.complete', {
            success: String(result.success),
            duration: String(result.duration),
            filesChanged: String(result.filesChanged),
            testsRun: String(result.testsRun),
            testsPassed: String(result.testsPassed),
            vulnerabilitiesFixed: String(result.vulnerabilitiesFixed)
        });
    }

    /**
     * Records an upgrade error event
     */
    public recordError(errorInfo: ErrorInfo): void {
        if (!this.isEnabled) return;

        this.reporter.logError('upgrade.error', {
            phase: errorInfo.phase,
            errorType: errorInfo.errorType,
            message: errorInfo.message
        });
    }

    /**
     * Records feature usage
     */
    public recordFeatureUsage(feature: string, properties?: Record<string, string>): void {
        if (!this.isEnabled) return;

        this.reporter.logUsage(`feature.${feature}`, properties);
    }

    /**
     * Disposes of the telemetry reporter
     */
    public dispose(): void {
        this.reporter.dispose();
    }

    /**
     * Sends a custom event to the telemetry service.
     * @param eventName - The name of the event.
     * @param properties - Additional properties about the event.
     */
    public sendEvent(eventName: string, properties?: Record<string, string>): void {
        if (!this.isEnabled) {
            return;
        }

        try {
            this.reporter.logUsage(eventName, properties);
            this.logger.debug(`Telemetry event sent: ${eventName}`);
        } catch (error) {
            this.logger.error(
                'Failed to send telemetry event',
                error instanceof Error ? error : new Error('Unknown error')
            );
        }
    }

    /**
     * Sends an error to the telemetry service.
     * @param error - The error object.
     * @param properties - Additional properties about the error.
     */
    public sendError(error: Error, properties?: Record<string, string>): void {
        if (!this.isEnabled) {
            return;
        }

        try {
            this.reporter.logError(error);
            this.logger.debug(`Telemetry error sent: ${error.message}`);
        } catch (err) {
            this.logger.error(
                'Failed to send telemetry error',
                err instanceof Error ? err : new Error('Unknown error')
            );
        }
    }
}

interface ProjectStartInfo {
    currentJavaVersion: string;
    targetVersion: string;
    buildTool: 'maven' | 'gradle';
    springBootVersion?: string;
    dependencyCount: number;
}

interface UpgradeResult {
    success: boolean;
    duration: number;
    filesChanged: number;
    testsRun: number;
    testsPassed: number;
    vulnerabilitiesFixed: number;
}

interface ErrorInfo {
    phase: string;
    errorType: string;
    message: string;
}
