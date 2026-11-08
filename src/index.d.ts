interface RunnerConstructor {
  new (options?: { enableStdOut?: boolean; forwardParentArgs?: boolean; runtimeArgs?: string[] }): RunnerInterface;
}

export interface RunnerInterface {
  setup(rootDir: string, options?: { setupFiles?: { source: string; destination: string }[]; create?: boolean }): Promise<void>;
  
  runCommand(binPath: string, options?: { args?: string | string[]; onStdOut?: ((message: string) => void) | null }): Promise<void>;
  
  stopCommand(): Promise<void>;
  
  teardown(additionalFiles?: string[]): Promise<void>;
}

declare module "gallinago" {
  export const Runner: RunnerConstructor;
}
