interface RunnerConstructor {
  new (enableStdOut?: boolean, forwardParentArgs?: boolean): RunnerInterface;
}

export interface RunnerInterface {
  setup(rootDir: string, setupFiles?: string[], options?: { create?: boolean }): Promise<void>;
  runCommand(binPath: string, args?: string | string[]): Promise<void>;
  stopCommand(): Promise<void>;
  teardown(additionalFiles?: string[]): Promise<void>;
}

declare module "gallinago" {
  export const Runner: RunnerConstructor;
}
