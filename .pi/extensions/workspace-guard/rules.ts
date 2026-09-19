// Single source of truth: index.ts enforces these lists and prompt.ts describes them to the model.
export const READ_ONLY_TOOLS = new Set(["read", "ls", "grep", "find"]);
export const WRITE_TOOLS = new Set(["write", "edit"]);
// Runs arbitrary commands, so a path check cannot confine it. It is only allowed inside the container
// that scripts/launch.sh starts, where the workspace is the only writable folder.
export const SHELL_TOOLS = new Set(["bash"]);
