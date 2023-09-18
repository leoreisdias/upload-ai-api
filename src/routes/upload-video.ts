import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { prisma } from "../lib/prisma";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const pump = promisify(pipeline);

export async function uploadVideo(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 100, // 100MB
    },
  });

  app.post("/videos", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        error: "No file uploaded",
      });
    }

    const extension = path.extname(data.filename);

    if (extension !== ".mp3") {
      return reply.status(400).send({
        error: "Only mp3 files are allowed",
      });
    }

    const fileBaseName = path.basename(data.filename, extension);

    const fileUploadName = `${fileBaseName}-${Date.now()}${extension}`;

    const filePath = path.resolve(__dirname, "../../uploads", fileUploadName);

    await pump(data.file, fs.createWriteStream(filePath));

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: filePath,
      },
    });

    return reply.status(201).send({
      message: "File uploaded successfully",
      data: video,
    });
  });
}
