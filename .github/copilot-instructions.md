# GitHub Copilot Instructions for VS Code Extension Development

## TypeScript Best Practices & Patterns

### 1. Service Architecture
- Follow dependency injection pattern for services
- Use interface segregation principle (ISP)
- Implement singleton pattern for core services
```typescript
@injectable()
export class CoreService implements ICoreService {
    private static instance: CoreService;
    
    public static getInstance(): CoreService {
        if (!CoreService.instance) {
            CoreService.instance = new CoreService();
        }
        return CoreService.instance;
    }
}
```

### 2. Error Handling
- Use custom error types for domain-specific errors
- Implement error boundaries at service layer
```typescript
export class UpgradeError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'UpgradeError';
    }
}
```

### 3. Async Operations
- Use async/await consistently
- Implement proper error handling with try/catch
- Add timeout handlers for long-running operations
```typescript
async function withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number
): Promise<T> {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    );
    return Promise.race([promise, timeout]);
}
```

### 4. VS Code Integration
- Use VS Code API types strictly
- Implement proper disposal of resources
- Follow VS Code UX patterns
```typescript
export class ExtensionContext {
    private disposables: vscode.Disposable[] = [];

    public registerCommand(command: string, callback: (...args: any[]) => any): void {
        const disposable = vscode.commands.registerCommand(command, callback);
        this.disposables.push(disposable);
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
```

## Code Generation Patterns

### 1. Service Generation
```typescript
// Template for new services
export interface IServiceName {
    methodName(): Promise<void>;
}

@injectable()
export class ServiceName implements IServiceName {
    constructor(
        @inject(TYPES.Logger) private logger: ILogger,
        @inject(TYPES.Config) private config: IConfig
    ) {}

    public async methodName(): Promise<void> {
        // Implementation
    }
}
```

### 2. Command Handler Pattern
```typescript
export interface ICommandHandler<T> {
    execute(params: T): Promise<void>;
}

export abstract class BaseCommandHandler<T> implements ICommandHandler<T> {
    public async execute(params: T): Promise<void> {
        try {
            await this.handleCommand(params);
        } catch (error) {
            this.handleError(error);
        }
    }

    protected abstract handleCommand(params: T): Promise<void>;
    protected abstract handleError(error: unknown): void;
}
```

## Design Patterns to Follow

### 1. Observer Pattern
- Use for progress updates
- Implement for status changes
```typescript
export interface IUpgradeObserver {
    onProgressUpdate(progress: number): void;
    onStatusChange(status: UpgradeStatus): void;
}
```

### 2. Strategy Pattern
- Use for different upgrade strategies
- Implement for various transformation recipes
```typescript
export interface IUpgradeStrategy {
    execute(context: UpgradeContext): Promise<void>;
}
```

### 3. Factory Pattern
- Use for creating service instances
- Implement for upgrade plan generation
```typescript
export class UpgradeServiceFactory {
    public static createService(type: UpgradeType): IUpgradeService {
        switch (type) {
            case UpgradeType.Spring:
                return new SpringUpgradeService();
            case UpgradeType.Maven:
                return new MavenUpgradeService();
            default:
                throw new Error(`Unknown upgrade type: ${type}`);
        }
    }
}
```

## Testing Guidelines

### 1. Unit Test Structure
```typescript
describe('ServiceName', () => {
    let service: ServiceName;
    let mockDependency: jest.Mocked<IDependency>;

    beforeEach(() => {
        mockDependency = {
            method: jest.fn()
        };
        service = new ServiceName(mockDependency);
    });

    it('should handle specific scenario', async () => {
        // Arrange
        mockDependency.method.mockResolvedValueOnce(result);
        
        // Act
        await service.method();
        
        // Assert
        expect(mockDependency.method).toHaveBeenCalled();
    });
});
```

### 2. Integration Test Pattern
```typescript
describe('Integration', () => {
    let extension: vscode.Extension<any>;
    
    beforeAll(async () => {
        extension = await activateExtension();
    });

    it('should handle end-to-end flow', async () => {
        // Test complete workflow
    });
});
```

## Security Best Practices

1. Input Validation
2. Secure File Operations
3. Safe Command Execution
4. Proper Error Handling
5. API Security

## Performance Guidelines

1. Lazy Loading
2. Proper Disposal
3. Resource Management
4. Caching Strategies
5. Async Operations

Remember to update these instructions as new patterns and best practices emerge.