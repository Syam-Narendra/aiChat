import { AzureChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import Elysia from "elysia"
import logixlysia from "logixlysia"
import {v4} from "uuid"
import { historyKeys } from "./historyKeys";

const model = new AzureChatOpenAI({
  azureOpenAIApiKey: 
  azureOpenAIApiVersion:
  azureOpenAIApiDeploymentName:
  azureOpenAIApiInstanceName: 
});



const app = new Elysia()
  .use(logixlysia())
  .get('/add-new', async () => {
    const key: string = v4()
    const chain = new ConversationChain({
      llm: model,
      prompt:
        PromptTemplate.fromTemplate(`You are a nice chatbot having a conversation with a human.
                                        Previous conversation: {${key}}
                                        New human question: {question}
                                        Response:`),
      memory: new BufferMemory({ memoryKey: key }),
      verbose: true,
    });
    historyKeys[key] = chain;
    return { chatID: key };
  })
  .get('/get-history',async()=>{
    return Object.keys(historyKeys)
  })
  .post('/get-chat/:key',async({params:{key}, body})=>{
    const { question} = body as { question: string };
   const chain = historyKeys[key]
   const response = await chain.invoke({question: question})
   return response

  })
  .listen(3000);
