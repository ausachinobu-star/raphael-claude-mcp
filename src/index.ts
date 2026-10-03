import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

function createServer() {
  const server = new McpServer({
    name: "Raphael Claude Bridge",
    version: "1.0.0",
  });

  server.registerTool(
    "ask_claude",
    {
      description:
        "Ask Claude a question and return Claude's response. Use this when the user explicitly asks to consult Claude or compare Claude's answer.",
      inputSchema: z.object({
        prompt: z.string().describe("The question or instruction to send to Claude"),
      }),
    },
    async ({ prompt }) => {
      const response = await fetch(
        "https://raphael-claude-bridge.ausachinobu.workers.dev/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: "text",
              text: `Claude bridge error: ${response.status} ${errorText}`,
            },
          ],
          isError: true,
        };
      }

      const data = (await response.json()) as {
        answer?: string;
        model?: string;
      };

      return {
        content: [
          {
            type: "text",
            text: data.answer ?? "Claude returned no answer.",
          },
        ],
      };
    }
  );

  return server;
}

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return createMcpHandler(createServer)(request, env, ctx);
    }

    return new Response("Raphael Claude MCP Server", { status: 200 });
  },
};
