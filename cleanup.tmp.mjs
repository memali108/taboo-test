import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const before = { attempts: await prisma.attempt.count(), events: await prisma.event.count(), contacts: await prisma.contact.count() };
console.log("before:", JSON.stringify(before));
const rows = await prisma.attempt.findMany({ select: { id: true, status: true, answers: true, startedAt: true }, orderBy: { startedAt: "asc" } });
console.log(rows.map(r => `${r.startedAt.toISOString()} ${r.status} ${r.answers || "(none)"}`).join("\n"));
