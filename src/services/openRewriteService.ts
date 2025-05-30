import { exec, ExecException } from 'child_process';
import * as vscode from 'vscode';

/**
 * Service to handle OpenRewrite integration for code transformation
 */
export class OpenRewriteService {
    /**
     * Applies the specified OpenRewrite recipes to the project
     * @param recipes List of OpenRewrite recipes to apply
     */
    public async applyRecipes(recipes: string[]): Promise<void> {
        for (const recipe of recipes) {
            try {
                // Execute OpenRewrite via Maven/Gradle plugin
                await this.executeRecipe(recipe);
            } catch (error) {
                if (error instanceof Error) {
                    throw new Error(`Failed to apply recipe ${recipe}: ${error.message}`);
                }
                throw new Error(`Failed to apply recipe ${recipe}: Unknown error`);
            }
        }
    }

    /**
     * Executes a single OpenRewrite recipe
     */
    private async executeRecipe(recipe: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const command = `./mvnw org.openrewrite.maven:rewrite-maven-plugin:run -Drewrite.recipeArtifactCoordinates=${recipe}`;
            
            exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
}
