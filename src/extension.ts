// Import required VS Code and Node.js modules
import * as vscode from 'vscode';
import { OpenRewriteService } from './services/openRewriteService';
import { ProjectAnalyzer } from './services/projectAnalyzer';
import { UpgradePlanGenerator } from './services/upgradePlanGenerator';
import { DependencyManager } from './services/dependencyManager';
import { TestGenerator } from './services/testGenerator';
import { CVEValidator } from './services/cveValidator';

/**
 * This is the main activation event for the extension
 * @param context The extension context provided by VS Code
 */
export async function activate(context: vscode.ExtensionContext) {
    // Initialize core services
    const projectAnalyzer = new ProjectAnalyzer();
    const planGenerator = new UpgradePlanGenerator();
    const openRewrite = new OpenRewriteService();
    const dependencyManager = new DependencyManager();
    const testGenerator = new TestGenerator();
    const cveValidator = new CVEValidator();

    // Register commands that implement the extension's functionality
    let disposable = vscode.commands.registerCommand('java.upgrade.start', async () => {
        try {
            // 1. Analyze project structure and dependencies
            const projectInfo = await projectAnalyzer.analyzeProject();
            
            // 2. Generate upgrade plan
            const upgradePlan = await planGenerator.generatePlan(projectInfo);
            
            // 3. Show plan to user and get confirmation
            const userApproved = await showUpgradePlan(upgradePlan);
            if (!userApproved) {
                return;
            }

            // 4. Execute the upgrade process
            await executeUpgrade(upgradePlan);

            // 5. Validate and show results
            await validateResults();

        } catch (error) {
            vscode.window.showErrorMessage(`Upgrade failed: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);

    // Register other commands
    context.subscriptions.push(
        vscode.commands.registerCommand('java.upgrade.generateTests', async () => {
            await testGenerator.generateTests();
        })
    );
}

/**
 * Executes the upgrade process according to the approved plan
 * @param plan The upgrade plan to execute
 */
async function executeUpgrade(plan: UpgradePlan): Promise<void> {
    // Show progress UI
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Upgrading Java Project",
        cancellable: true
    }, async (progress, token) => {
        // 1. Apply OpenRewrite recipes
        progress.report({ message: 'Applying code transformations...' });
        await openRewrite.applyRecipes(plan.recipes);

        // 2. Update dependencies
        progress.report({ message: 'Updating dependencies...' });
        await dependencyManager.updateDependencies(plan.dependencyUpdates);

        // 3. Fix build issues
        progress.report({ message: 'Fixing build issues...' });
        await fixBuildIssues();

        // 4. Run tests
        progress.report({ message: 'Running tests...' });
        await runTests();

        // 5. Check for CVEs
        progress.report({ message: 'Checking for vulnerabilities...' });
        await cveValidator.validate();
    });
}

/**
 * Validates the results of the upgrade
 */
async function validateResults(): Promise<void> {
    const results = {
        buildSuccess: await checkBuild(),
        testsPassing: await checkTests(),
        cveIssues: await cveValidator.getIssues(),
        changes: await getChangeSummary()
    };

    // Show summary to user
    await showUpgradeSummary(results);
}

/**
 * Shows the upgrade plan to the user and gets confirmation
 */
async function showUpgradePlan(plan: UpgradePlan): Promise<boolean> {
    // Create webview to show the plan
    const panel = vscode.window.createWebviewPanel(
        'upgradeplan',
        'Java Upgrade Plan',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = generatePlanHtml(plan);

    // Wait for user confirmation
    return new Promise((resolve) => {
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'approve') {
                    resolve(true);
                } else if (message.command === 'cancel') {
                    resolve(false);
                }
            }
        );
    });
}

// Export deactivate function
export function deactivate() {}

// Types and interfaces
interface UpgradePlan {
    recipes: string[];
    dependencyUpdates: DependencyUpdate[];
    javaVersion: string;
    springBootVersion?: string;
}

interface DependencyUpdate {
    groupId: string;
    artifactId: string;
    fromVersion: string;
    toVersion: string;
}
