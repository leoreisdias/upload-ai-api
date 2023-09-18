import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { createReadStream } from "node:fs";
import { openAI } from "../lib/openai";

export async function createTranscription(app: FastifyInstance) {
  app.post("/videos/:id/transcription", async (req, reply) => {
    const paramsSchema = z.object({
      id: z
        .string({
          required_error: "Video id is required",
        })
        .uuid("Invalid video id"),
    });

    const { id } = paramsSchema.parse(req.params);

    const bodySchema = z.object({
      prompt: z.string(),
    });

    const { prompt } = bodySchema.parse(req.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id,
      },
    });

    const videoPath = video.path;

    const audioStream = createReadStream(videoPath);

    const response = await openAI.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      language: "ko",
      response_format: "json",
      temperature: 0,
      prompt,
    });

    const transcription = response.text;

    await prisma.video.update({
      where: {
        id,
      },
      data: {
        transcription,
      },
    });

    return { transcription };
  });
}
