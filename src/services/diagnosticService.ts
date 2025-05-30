import * as vscode from 'vscode';
import { LoggingService } from './loggingService';

/**
 * Service to manage and report diagnostics during the upgrade process
 */
export class DiagnosticService {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private logger: LoggingService;

    constructor(logger: LoggingService) {
        this.logger = logger;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('java-upgrade');
    }

    /**
     * Reports build errors as diagnostics
     */
    public reportBuildErrors(errors: BuildError[]): void {
        errors.forEach(error => {
            const diagnostics = this.getDiagnosticsForFile(error.file) || [];
            
            diagnostics.push(new vscode.Diagnostic(
                this.getErrorRange(error),
                error.message,
                this.getDiagnosticSeverity(error.severity)
            ));

            this.diagnosticCollection.set(vscode.Uri.file(error.file), diagnostics);
        });

        this.logger.info('Reported {0} build errors as diagnostics', errors.length);
    }

    /**
     * Reports compatibility issues as diagnostics
     */
    public reportCompatibilityIssues(issues: CompatibilityIssue[]): void {
        issues.forEach(issue => {
            const diagnostics = this.getDiagnosticsForFile(issue.file) || [];
            
            const diagnostic = new vscode.Diagnostic(
                this.getErrorRange(issue),
                `Compatibility Issue: ${issue.message}`,
                vscode.DiagnosticSeverity.Warning
            );

            diagnostic.code = issue.ruleId;
            diagnostic.source = 'Java Upgrade';
            diagnostic.relatedInformation = this.getRelatedInformation(issue);

            diagnostics.push(diagnostic);
            this.diagnosticCollection.set(vscode.Uri.file(issue.file), diagnostics);
        });
    }

    /**
     * Reports deprecated API usage
     */
    public reportDeprecatedApis(apis: DeprecatedApiUsage[]): void {
        apis.forEach(api => {
            const diagnostics = this.getDiagnosticsForFile(api.file) || [];
            
            const diagnostic = new vscode.Diagnostic(
                this.getErrorRange(api),
                `Deprecated API: ${api.message}`,
                vscode.DiagnosticSeverity.Information
            );

            diagnostic.tags = [vscode.DiagnosticTag.Deprecated];
            diagnostic.source = 'Java Upgrade';
            
            diagnostics.push(diagnostic);
            this.diagnosticCollection.set(vscode.Uri.file(api.file), diagnostics);
        });
    }

    /**
     * Clears all diagnostics
     */
    public clearDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    private getDiagnosticsForFile(file: string): vscode.Diagnostic[] {
        return this.diagnosticCollection.get(vscode.Uri.file(file)) || [];
    }

    private getErrorRange(error: BuildError | CompatibilityIssue | DeprecatedApiUsage): vscode.Range {
        const line = Math.max((error.line || 1) - 1, 0);
        const column = Math.max((error.column || 1) - 1, 0);
        
        return new vscode.Range(
            new vscode.Position(line, column),
            new vscode.Position(line, column + 1)
        );
    }

    private getDiagnosticSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity?.toLowerCase()) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Error;
        }
    }

    private getRelatedInformation(issue: CompatibilityIssue): vscode.DiagnosticRelatedInformation[] {
        const related: vscode.DiagnosticRelatedInformation[] = [];

        if (issue.suggestion) {
            related.push(new vscode.DiagnosticRelatedInformation(
                new vscode.Location(
                    vscode.Uri.file(issue.file),
                    this.getErrorRange(issue)
                ),
                `Suggestion: ${issue.suggestion}`
            ));
        }

        return related;
    }

    /**
     * Disposes of the diagnostic collection
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

interface BuildError {
    file: string;
    line?: number;
    column?: number;
    message: string;
    severity: string;
}

interface CompatibilityIssue {
    file: string;
    line?: number;
    column?: number;
    message: string;
    ruleId: string;
    suggestion?: string;
}

interface DeprecatedApiUsage {
    file: string;
    line?: number;
    column?: number;
    message: string;
    replacementApi?: string;
}
