import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Service to generate and manage unit tests
 */
export class TestGenerator {
    /**
     * Generates test cases for the project
     */
    public async generateTests(): Promise<void> {
        try {
            const javaFiles = await this.findJavaSourceFiles();
            const generatedTests = await this.createTestsForFiles(javaFiles);
            await this.writeTestFiles(generatedTests);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to generate tests: ${error.message}`);
            } else {
                throw new Error('Failed to generate tests: Unknown error');
            }
        }
    }

    /**
     * Finds all Java source files in the project
     */
    private async findJavaSourceFiles(): Promise<string[]> {
        const srcPath = this.findSourceDirectory();
        return this.findJavaFiles(srcPath);
    }

    /**
     * Creates test cases for the given source files
     */
    private async createTestsForFiles(sourceFiles: string[]): Promise<TestFile[]> {
        const tests: TestFile[] = [];

        for (const sourceFile of sourceFiles) {
            const testFile = await this.generateTestForFile(sourceFile);
            if (testFile) {
                tests.push(testFile);
            }
        }

        return tests;
    }

    /**
     * Generates a test file for a single source file
     */
    private async generateTestForFile(sourceFile: string): Promise<TestFile | null> {
        try {
            const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
            const className = this.extractClassName(sourceContent);
            if (!className) {
                return null;
            }

            const testContent = await this.generateTestContent(className, sourceContent);
            const testPath = this.getTestFilePath(sourceFile);

            return {
                path: testPath,
                content: testContent
            };
        } catch (error) {
            console.error(`Error generating test for ${sourceFile}:`, error);
            return null;
        }
    }

    /**
     * Writes generated test files to disk
     */
    private async writeTestFiles(tests: TestFile[]): Promise<void> {
        for (const test of tests) {
            const dir = path.dirname(test.path);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(test.path, test.content);
        }
    }

    /**
     * Finds the source directory of the project
     */
    private findSourceDirectory(): string {
        const mavenSrc = 'src/main/java';
        const gradleSrc = 'src/main/java';
        
        if (fs.existsSync(mavenSrc)) {
            return mavenSrc;
        }
        if (fs.existsSync(gradleSrc)) {
            return gradleSrc;
        }
        
        throw new Error('Source directory not found');
    }

    /**
     * Recursively finds all Java files in a directory
     */
    private findJavaFiles(dir: string): string[] {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.findJavaFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.java')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Extracts the class name from Java source code
     */
    private extractClassName(sourceContent: string): string | null {
        const classMatch = sourceContent.match(/public\s+class\s+(\w+)/);
        return classMatch ? classMatch[1] : null;
    }

    /**
     * Generates test content for a Java class
     */
    private async generateTestContent(className: string, sourceContent: string): Promise<string> {
        // Basic test class structure
        return `
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ${className}Test {
    @Test
    public void testBasicFunctionality() {
        // TODO: Generate actual test cases
        ${className} instance = new ${className}();
        assertNotNull(instance);
    }
}`;
    }

    /**
     * Converts a source file path to its corresponding test file path
     */
    private getTestFilePath(sourceFile: string): string {
        const basePath = sourceFile.replace('src/main', 'src/test');
        const dir = path.dirname(basePath);
        const fileName = path.basename(sourceFile, '.java');
        return path.join(dir, `${fileName}Test.java`);
    }
}

interface TestFile {
    path: string;
    content: string;
}
