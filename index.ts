import { AzureChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import Elysia from "elysia";
import logixlysia from "logixlysia";
import { redisClient } from "./redis";
import { RedisChatMessageHistory } from "@langchain/redis";
import cors from "@elysiajs/cors";

redisClient.connect();

if (
  !Bun.env["azureOpenAIApiKey"] ||
  !Bun.env["azureOpenAIApiVersion"] ||
  !Bun.env["azureOpenAIApiDeploymentName"] ||
  !Bun.env["azureOpenAIApiInstanceName"]
) {
  throw new Error("Azure OpenAI API key is not set");
}

const model = new AzureChatOpenAI({
  azureOpenAIApiKey: Bun.env["azureOpenAIApiKey"],
  azureOpenAIApiVersion: Bun.env["azureOpenAIApiVersion"],
  azureOpenAIApiDeploymentName: Bun.env["azureOpenAIApiDeploymentName"],
  azureOpenAIApiInstanceName: Bun.env["azureOpenAIApiInstanceName"],
});

const app = new Elysia()
  .use(logixlysia())
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .get("/get-chat-ids", async () => {
    const historyKeys = await redisClient.keys("*");
    return { chatIds: historyKeys };
  })
  .get("/new-chat", async()=>{
    const chatId = crypto.randomUUID();
    return  { chatId };
  })
  .get("/get-chat/:key", async ({ params: { key } }) => {
    const memory = new BufferMemory({
      chatHistory: new RedisChatMessageHistory({
        sessionId: key,
        client: redisClient,
      }),
    });
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
      verbose: true,
    });
    return chain.memory?.loadMemoryVariables({});
  })
  .post("/continue-chat/:key", async ({ params: { key }, body }) => {
    const { code, user_command } = body as { code: string, user_command: string };
    console.log(code, user_command);
    const memory = new BufferMemory({
      chatHistory: new RedisChatMessageHistory({
        sessionId: key,
        client: redisClient,
      }),
    });
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
      verbose: true,
    });

    const response = await chain.invoke({ input: `Make neccassary changes to this code as user commands and give user full code without any code the code is: ${code} and the useer command is: ${user_command}` });
    return response;
  })
  .listen(3002);
