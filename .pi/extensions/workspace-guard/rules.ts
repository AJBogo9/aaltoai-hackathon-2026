// Single source of truth: index.ts enforces these lists and prompt.ts describes them to the model.
export const READ_ONLY_TOOLS = new Set(["read", "ls", "grep", "find"]);
export const WRITE_TOOLS = new Set(["write", "edit"]);
export const BLOCKED_TOOLS = new Set(["bash"]);
