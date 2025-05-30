---
title: Project Architecture & Workflows
icon: 🛠️
description: Structure, patterns, and best practices for the Java upgrade VS Code extension.
---

# 🛠️ Project Structure & Key Workflows

This is a clean, well-structured version of how the extension works. Here's what each part does:

- **`src/extension.ts`** – Main entry point that:
  - 🟢 Registers VS Code commands
  - 🔄 Orchestrates the upgrade process
  - 👤 Handles user interaction
  - 🧩 Manages the overall workflow
- **`src/services/openRewriteService.ts`** – Handles code transformations:
  - 🧬 Integrates with OpenRewrite
  - 📝 Applies transformation recipes
  - ⚙️ Manages the execution of code changes
- **`src/services/projectAnalyzer.ts`** – Analyzes the project:
  - 🏗️ Detects build system (Maven/Gradle)
  - 📦 Analyzes dependencies
  - 🏷️ Determines Java and Spring versions
  - 🗂️ Provides project structure information
- **`src/services/cveValidator.ts`** – Handles security validation:
  - 🛡️ Checks for known vulnerabilities
  - 🌐 Integrates with NVD database
  - 🚨 Reports security issues
  - 🛠️ Suggests fixes

## 🔄 Key Workflows

### 1. Analysis & Planning
- Scans project structure
- Determines current versions
- Creates upgrade plan

### 2. Transformation
- Applies OpenRewrite recipes
- Updates dependencies
- Transforms code

### 3. Validation
- Runs builds
- Executes tests
- Checks for CVEs
- Reports issues

### 4. Reporting
- Generates summary
- Shows changes
- Reports errors

---

## 🤖 GitHub Copilot & TypeScript Best Practices
- Use dependency injection for all services (`src/services/*.ts`)
- Use custom error types for domain-specific errors
- Use async/await and handle errors with try/catch
- Dispose of all VS Code resources
- Document all public classes and methods
- Use globs in documentation for code references (e.g., `src/services/*.ts`)

---

For more, see [`github-copilot-instructions.md`](./github-copilot-instructions.md) and [`README.md`](./README.md).