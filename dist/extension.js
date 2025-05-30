"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const openRewriteService_1 = require("./services/openRewriteService");
const projectAnalyzer_1 = require("./services/projectAnalyzer");
const upgradePlanGenerator_1 = require("./services/upgradePlanGenerator");
const dependencyManager_1 = require("./services/dependencyManager");
const testGenerator_1 = require("./services/testGenerator");
const cveValidator_1 = require("./services/cveValidator");
// Service instances
let openRewriteService;
let dependencyManagerService;
let cveValidatorService;
/**
 * This is the main activation event for the extension
 * @param context The extension context provided by VS Code
 */
async function activate(context) {
    // Initialize core services
    const projectAnalyzer = new projectAnalyzer_1.ProjectAnalyzer();
    const planGenerator = new upgradePlanGenerator_1.UpgradePlanGenerator();
    openRewriteService = new openRewriteService_1.OpenRewriteService();
    dependencyManagerService = new dependencyManager_1.DependencyManager();
    const testGenerator = new testGenerator_1.TestGenerator();
    cveValidatorService = new cveValidator_1.CVEValidator();
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Upgrade failed: ${errorMessage}`);
        }
    });
    context.subscriptions.push(disposable);
    // Register other commands
    context.subscriptions.push(vscode.commands.registerCommand('java.upgrade.generateTests', async () => {
        await testGenerator.generateTests();
    }));
}
/**
 * Executes the upgrade process according to the approved plan
 * @param plan The upgrade plan to execute
 */
async function executeUpgrade(plan) {
    // Show progress UI
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Upgrading Java Project",
        cancellable: true
    }, async (progress) => {
        // 1. Apply OpenRewrite recipes
        progress.report({ message: 'Applying code transformations...' });
        await openRewriteService.applyRecipes(plan.recipes);
        // 2. Update dependencies
        progress.report({ message: 'Updating dependencies...' });
        await dependencyManagerService.updateDependencies(plan.dependencyUpdates);
        // 3. Fix build issues
        progress.report({ message: 'Fixing build issues...' });
        await fixBuildIssues();
        // 4. Run tests
        progress.report({ message: 'Running tests...' });
        await runTests();
        // 5. Check for CVEs
        progress.report({ message: 'Checking for vulnerabilities...' });
        await cveValidatorService.validate();
    });
}
/**
 * Validates the results of the upgrade
 */
async function validateResults() {
    const results = {
        buildSuccess: await checkBuild(),
        testsPassing: await checkTests(),
        cveIssues: await cveValidatorService.getIssues(),
        changes: await getChangeSummary()
    };
    // Show summary to user
    await showUpgradeSummary(results);
}
/**
 * Shows the upgrade plan to the user and gets confirmation
 */
async function showUpgradePlan(plan) {
    // Create webview to show the plan
    const panel = vscode.window.createWebviewPanel('upgradeplan', 'Java Upgrade Plan', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = await generatePlanHtml(plan);
    // Wait for user confirmation
    return new Promise((resolve) => {
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'approve') {
                resolve(true);
            }
            else if (message.command === 'cancel') {
                resolve(false);
            }
        });
    });
}
// Export deactivate function
function deactivate() { }
// Helper functions
async function fixBuildIssues() {
    // Implementation will be added
}
async function runTests() {
    // Implementation will be added
}
async function checkBuild() {
    // Implementation will be added
    return true;
}
async function checkTests() {
    // Implementation will be added
    return true;
}
async function getChangeSummary() {
    // Implementation will be added
    return [];
}
async function generatePlanHtml(plan) {
    // Implementation will be added
    return `
        <!DOCTYPE html>
        <html>
            <body>
                <h1>Java Upgrade Plan</h1>
                <pre>${JSON.stringify(plan, null, 2)}</pre>
                <button onclick="approve()">Approve</button>
                <button onclick="cancel()">Cancel</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    function approve() {
                        vscode.postMessage({ command: 'approve' });
                    }
                    function cancel() {
                        vscode.postMessage({ command: 'cancel' });
                    }
                </script>
            </body>
        </html>
    `;
}
async function showUpgradeSummary(results) {
    const message = `Upgrade Results:
        Build: ${results.buildSuccess ? 'Success' : 'Failed'}
        Tests: ${results.testsPassing ? 'Passing' : 'Failed'}
        CVE Issues: ${results.cveIssues.length}
        Changes: ${results.changes.length}`;
    await vscode.window.showInformationMessage(message);
}
//# sourceMappingURL=extension.js.map