import { fastify } from "fastify";
import { getAllPrompts } from "./routes/get-all-prompts";
import { uploadVideo } from "./routes/upload-video";
import { createTranscription } from "./routes/create-transcription";
import { generateAICompletion } from "./routes/generate-ai-completion";
import { fastifyCors } from "@fastify/cors";

const app = fastify();

app.register(fastifyCors, {
  origin: "*",
});

app.register(getAllPrompts);
app.register(uploadVideo);
app.register(createTranscription);
app.register(generateAICompletion);

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log("HTTP SERVER RUNNING!");
  });
