export interface UpgradePlan {
    recipes: string[];
    dependencyUpdates: DependencyUpdate[];
    javaVersion: string;
    springBootVersion?: string;
}

export interface DependencyUpdate {
    groupId: string;
    artifactId: string;
    fromVersion: string;
    toVersion: string;
}

export interface UpgradeResults {
    buildSuccess: boolean;
    testsPassing: boolean;
    cveIssues: any[]; // Replace with proper CVE issue type when available
    changes: string[];
}
