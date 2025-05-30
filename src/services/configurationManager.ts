import * as vscode from 'vscode';

/**
 * Service to manage extension configuration and settings
 */
export class ConfigurationManager {
    private readonly configSection = 'javaUpgrade';

    /**
     * Gets a configuration value
     */
    public get<T>(key: string, defaultValue?: T): T {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<T>(key, defaultValue as T);
    }

    /**
     * Updates a configuration value
     */
    public async update(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update(key, value, target);
    }

    /**
     * Gets all Java-related settings
     */
    public getJavaSettings(): JavaSettings {
        return {
            targetVersion: this.get<string>('targetJavaVersion', '17'),
            enablePreviewFeatures: this.get<boolean>('enablePreviewFeatures', false),
            springBootTarget: this.get<string>('targetSpringBootVersion'),
            buildTool: this.get<'maven' | 'gradle'>('buildTool', 'maven'),
            customRecipes: this.get<string[]>('customOpenRewriteRecipes', []),
            skipTests: this.get<boolean>('skipTests', false),
            backupFiles: this.get<boolean>('backupBeforeUpgrade', true)
        };
    }

    /**
     * Gets Maven/Gradle specific settings
     */
    public getBuildSettings(): BuildSettings {
        return {
            mavenHome: this.get<string>('maven.home'),
            gradleHome: this.get<string>('gradle.home'),
            buildFile: this.get<string>('buildFile'),
            additionalArgs: this.get<string[]>('buildArgs', []),
            offlineMode: this.get<boolean>('offlineMode', false)
        };
    }

    /**
     * Gets security scanning settings
     */
    public getSecuritySettings(): SecuritySettings {
        return {
            enableCVECheck: this.get<boolean>('security.enableCVECheck', true),
            minSeverity: this.get<string>('security.minSeverityLevel', 'MEDIUM'),
            ignoreVulnerabilities: this.get<string[]>('security.ignoreVulnerabilities', []),
            customNvdApiKey: this.get<string>('security.nvdApiKey')
        };
    }
}

interface JavaSettings {
    targetVersion: string;
    enablePreviewFeatures: boolean;
    springBootTarget?: string;
    buildTool: 'maven' | 'gradle';
    customRecipes: string[];
    skipTests: boolean;
    backupFiles: boolean;
}

interface BuildSettings {
    mavenHome?: string;
    gradleHome?: string;
    buildFile?: string;
    additionalArgs: string[];
    offlineMode: boolean;
}

interface SecuritySettings {
    enableCVECheck: boolean;
    minSeverity: string;
    ignoreVulnerabilities: string[];
    customNvdApiKey?: string;
}
