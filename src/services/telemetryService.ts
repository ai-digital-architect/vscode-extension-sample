import * as vscode from 'vscode';
import { LoggingService } from './loggingService';

/**
 * Service to handle telemetry events for the extension
 */
export class TelemetryService {
    private reporter: vscode.TelemetryLogger;
    private logger: LoggingService;
    private isEnabled: boolean;

    constructor(logger: LoggingService, context: vscode.ExtensionContext) {
        this.logger = logger;
        this.reporter = vscode.env.createTelemetryLogger(context.globalState);
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
