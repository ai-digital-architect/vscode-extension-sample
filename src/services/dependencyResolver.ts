import * as vscode from 'vscode';
import axios from 'axios';
import { LoggingService } from './loggingService';

interface DependencyCoordinate {
    groupId: string;
    artifactId: string;
    version: string;
}

export class DependencyResolver {
    private logger: LoggingService;
    private mavenCentralUrl = 'https://search.maven.org/solr/select';

    constructor(logger: LoggingService) {
        this.logger = logger;
    }

    public async validateDependency(dependency: DependencyCoordinate): Promise<boolean> {
        try {
            const versions = await this.getAvailableVersions(
                dependency.groupId,
                dependency.artifactId
            );
            return versions.includes(dependency.version);
        } catch (error) {
            this.logger.error(
                'Failed to validate dependency',
                error instanceof Error ? error : new Error('Unknown error')
            );
            return false;
        }
    }

    public async findLatestVersion(dep: DependencyCoordinate): Promise<string | null> {
        try {
            const versions = await this.getAvailableVersions(dep.groupId, dep.artifactId);
            return versions.length > 0 ? versions[versions.length - 1] : null;
        } catch (error) {
            this.logger.error(
                'Failed to find latest version',
                error instanceof Error ? error : new Error('Unknown error')
            );
            return null;
        }
    }

    private async resolveVersionConflicts(dependencies: Map<string, Set<string>>): Promise<Map<string, string>> {
        const resolvedVersions = new Map<string, string>();
        
        try {
            // Convert Map entries to array for safe iteration
            const entries = Array.from(dependencies.entries());
            for (const [key, versions] of entries) {
                const versionArray = Array.from(versions);
                if (versionArray.length > 1) {
                    const highestVersion = versionArray.sort((a, b) => this.compareVersions(b, a))[0];
                    resolvedVersions.set(key, highestVersion);
                } else if (versionArray.length === 1) {
                    resolvedVersions.set(key, versionArray[0]);
                }
            }
        } catch (error) {
            this.logger.error(
                'Failed to resolve version conflicts',
                error instanceof Error ? error : new Error('Unknown error')
            );
        }

        return resolvedVersions;
    }

    private async getAvailableVersions(groupId: string, artifactId: string): Promise<string[]> {
        try {
            const response = await axios.get(this.mavenCentralUrl, {
                params: {
                    q: `g:"${groupId}" AND a:"${artifactId}"`,
                    core: 'gav',
                    rows: '100',
                    wt: 'json'
                }
            });

            const data = response.data as { response?: { docs?: Array<{ v: string }> } };
            return data.response?.docs?.map(doc => doc.v) || [];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to fetch versions: ${errorMessage}`);
        }
    }

    private compareVersions(a: string, b: string): number {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA !== numB) {
                return numA - numB;
            }
        }
        
        return 0;
    }
}
