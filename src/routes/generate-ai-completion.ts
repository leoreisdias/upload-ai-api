import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { createReadStream } from "node:fs";
import { openAI } from "../lib/openai";

export async function generateAICompletion(app: FastifyInstance) {
  app.post("/ai/generate", async (req, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      template: z.string(),
      temperature: z.number().min(0).max(1).default(0.5),
    });

    const { temperature, template, videoId } = bodySchema.parse(req.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    });

    if (!video.transcription) {
      return reply.status(400).send({
        error: "Video has no transcription",
      });
    }

    const transcription = video.transcription;

    const promptMessage = template.replace("{transcription}", transcription);
    console.log(promptMessage);
    const response = await openAI.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature,
      messages: [
        {
          role: "user",
          content: promptMessage,
        },
      ],
    });

    const completion = response.choices[0].message;

    return {
      completion,
    };
  });
}
