import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("hello", {
    description: "Print a greeting (no LLM)",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello, ${args.trim() || "world"}!`, "info");
    },
  });
}
