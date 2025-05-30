# GitHub Copilot App Modernization - Java Upgrade Extension

## User Guide

### Overview
The GitHub Copilot app modernization - upgrade for Java is a powerful VS Code extension that helps you modernize and upgrade your Java applications with minimal effort. It provides automated analysis, planning, and execution of Java version upgrades and dependency updates.

### Key Features

#### 1. Intelligent Analysis and Planning
- Automatic project structure analysis
- Dependency version assessment
- Customizable upgrade planning
- Build system detection (Maven/Gradle)

#### 2. Automated Upgrades
- Java version upgrades (8 → 11 → 17 → 21)
- Spring Boot version updates
- Dependency modernization
- Code transformations using OpenRewrite

#### 3. Security and Compliance
- CVE vulnerability scanning
- Automated security fixes
- Dependency conflict resolution
- Compliance validation

#### 4. Test Coverage
- Automated test generation
- Test execution and validation
- Coverage reporting
- Test case suggestions

### Getting Started

1. **Installation**
   ```
   ext install github.copilot.appmodernization.javaupgrade
   ```

2. **Initial Setup**
   - Open your Java project in VS Code
   - Command Palette (Ctrl/Cmd + Shift + P)
   - Search for "Java Upgrade: Start Project Analysis"

3. **Upgrade Process**

   a. **Analysis Phase**
   - Project structure scanning
   - Dependency analysis
   - Version compatibility checks
   - Initial report generation

   b. **Planning Phase**
   - Review upgrade recommendations
   - Customize upgrade options
   - Configure target versions
   - Review potential impacts

   c. **Execution Phase**
   - Automated code transformations
   - Dependency updates
   - Build validation
   - Test execution

   d. **Validation Phase**
   - Security scans
   - Compatibility checks
   - Performance validation
   - Test coverage review

### Command Reference

| Command | Description |
|---------|-------------|
| `Java Upgrade: Start Project Analysis` | Begins the upgrade process |
| `Java Upgrade: Show Upgrade Plan` | Displays the current upgrade plan |
| `Java Upgrade: Generate Tests` | Creates unit tests for your code |
| `Java Upgrade: Validate Changes` | Runs validation checks |
| `Java Upgrade: Show Diagnostics` | Displays current issues |
| `Java Upgrade: Scan Dependencies` | Checks for vulnerable dependencies |

### Configuration Options

```json
{
  "javaUpgrade.targetJavaVersion": "17",
  "javaUpgrade.enablePreviewFeatures": false,
  "javaUpgrade.buildTool": "maven",
  "javaUpgrade.security.enableCVECheck": true,
  "javaUpgrade.backup.enabled": true
}
```

### Best Practices

1. **Before Upgrade**
   - Commit all pending changes
   - Run existing tests
   - Back up your project
   - Review current dependencies

2. **During Upgrade**
   - Review each transformation
   - Monitor build status
   - Check test results
   - Validate functionality

3. **After Upgrade**
   - Review security scan results
   - Check dependency conflicts
   - Validate application behavior
   - Review generated tests

### Troubleshooting

Common Issues and Solutions:

1. **Build Failures**
   - Check build tool configuration
   - Verify dependency compatibility
   - Review transformation logs
   - Check Java version settings

2. **Test Failures**
   - Review test logs
   - Check for deprecated API usage
   - Verify test environment
   - Update test dependencies

3. **Dependency Conflicts**
   - Check version constraints
   - Review transitive dependencies
   - Use dependency resolution features
   - Update dependency versions

4. **Security Issues**
   - Review CVE reports
   - Apply suggested fixes
   - Update vulnerable dependencies
   - Check security configurations

### Support and Feedback

- Report issues: [GitHub Issues](https://github.com/microsoft/vscode-java-pack/issues)
- Submit feedback: [Feedback Form](https://aka.ms/AM4JFeedback)
- Documentation: [Online Docs](https://aka.ms/java-upgrade-docs)
- FAQ: [FAQ Page](https://aka.ms/ghcp-appmod/java-upgrade-faq)
