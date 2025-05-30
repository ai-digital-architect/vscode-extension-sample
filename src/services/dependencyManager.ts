import * as vscode from 'vscode';
import * as fs from 'fs';
import * as xml2js from 'xml2js';

/**
 * Service to manage project dependencies and their updates
 */
export class DependencyManager {
    /**
     * Updates project dependencies based on the upgrade plan
     * @param updates List of dependency updates to apply
     */
    public async updateDependencies(updates: DependencyUpdate[]): Promise<void> {
        const buildSystem = await this.detectBuildSystem();
        
        if (buildSystem === 'maven') {
            await this.updateMavenDependencies(updates);
        } else {
            await this.updateGradleDependencies(updates);
        }
    }

    /**
     * Updates dependencies in pom.xml
     */
    private async updateMavenDependencies(updates: DependencyUpdate[]): Promise<void> {
        const pomPath = 'pom.xml';
        if (!fs.existsSync(pomPath)) {
            throw new Error('pom.xml not found');
        }

        try {
            // Parse pom.xml
            const pomContent = fs.readFileSync(pomPath, 'utf-8');
            const parser = new xml2js.Parser();
            const pom = await parser.parseStringPromise(pomContent);

            // Update each dependency
            for (const update of updates) {
                this.updateMavenDependency(pom, update);
            }

            // Write back to pom.xml
            const builder = new xml2js.Builder();
            const updatedPom = builder.buildObject(pom);
            fs.writeFileSync(pomPath, updatedPom);

        } catch (error) {
            throw new Error(`Failed to update Maven dependencies: ${error.message}`);
        }
    }

    /**
     * Updates dependencies in build.gradle
     */
    private async updateGradleDependencies(updates: DependencyUpdate[]): Promise<void> {
        const gradlePath = fs.existsSync('build.gradle.kts') ? 'build.gradle.kts' : 'build.gradle';
        if (!fs.existsSync(gradlePath)) {
            throw new Error('Gradle build file not found');
        }

        try {
            let content = fs.readFileSync(gradlePath, 'utf-8');
            
            // Update each dependency in the Gradle file
            for (const update of updates) {
                const dependencyPattern = new RegExp(
                    `implementation ['"]${update.groupId}:${update.artifactId}:${update.fromVersion}['"]`
                );
                content = content.replace(
                    dependencyPattern,
                    `implementation '${update.groupId}:${update.artifactId}:${update.toVersion}'`
                );
            }

            fs.writeFileSync(gradlePath, content);

        } catch (error) {
            throw new Error(`Failed to update Gradle dependencies: ${error.message}`);
        }
    }

    /**
     * Updates a single Maven dependency in the POM object
     */
    private updateMavenDependency(pom: any, update: DependencyUpdate): void {
        const dependencies = pom.project.dependencies[0].dependency;
        
        for (const dep of dependencies) {
            if (dep.groupId[0] === update.groupId && 
                dep.artifactId[0] === update.artifactId) {
                dep.version[0] = update.toVersion;
                break;
            }
        }
    }

    /**
     * Detects the build system used in the project
     */
    private async detectBuildSystem(): Promise<'maven' | 'gradle'> {
        const pomExists = fs.existsSync('pom.xml');
        const gradleExists = fs.existsSync('build.gradle') || fs.existsSync('build.gradle.kts');
        
        if (pomExists) return 'maven';
        if (gradleExists) return 'gradle';
        throw new Error('No supported build system detected');
    }
}

interface DependencyUpdate {
    groupId: string;
    artifactId: string;
    fromVersion: string;
    toVersion: string;
}
