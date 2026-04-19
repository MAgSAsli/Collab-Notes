import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  const docs = await prisma.document.findMany({
    where: {
      OR: [
        { ownerId: req.userId },
        { collaborators: { some: { userId: req.userId } } },
      ],
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(docs);
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.create({
    data: { title: "Untitled", content: "", ownerId: req.userId! },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
  res.status(201).json(doc);
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const doc = await prisma.document.findFirst({
    where: {
      id,
      OR: [
        { ownerId: req.userId },
        { collaborators: { some: { userId: req.userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!doc) {
    res.status(404).json({ message: "Document not found" });
    return;
  }
  res.json(doc);
});

router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { title, content } = req.body;
  const doc = await prisma.document.findFirst({
    where: {
      id,
      OR: [
        { ownerId: req.userId },
        { collaborators: { some: { userId: req.userId } } },
      ],
    },
  });
  if (!doc) {
    res.status(404).json({ message: "Document not found" });
    return;
  }
  const updated = await prisma.document.update({
    where: { id },
    data: { ...(title !== undefined && { title }), ...(content !== undefined && { content }) },
  });
  res.json(updated);
});

router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const doc = await prisma.document.findFirst({
    where: { id, ownerId: req.userId },
  });
  if (!doc) {
    res.status(404).json({ message: "Not found or not authorized" });
    return;
  }
  await prisma.document.delete({ where: { id } });
  res.json({ message: "Deleted" });
});

router.post("/:id/share", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { email } = req.body;
  const doc = await prisma.document.findFirst({
    where: { id, ownerId: req.userId },
  });
  if (!doc) {
    res.status(404).json({ message: "Not found or not authorized" });
    return;
  }
  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  if (targetUser.id === req.userId) {
    res.status(400).json({ message: "Cannot share with yourself" });
    return;
  }
  await prisma.collaborator.upsert({
    where: { userId_documentId: { userId: targetUser.id, documentId: id } },
    update: {},
    create: { userId: targetUser.id, documentId: id },
  });
  res.json({ message: `Shared with ${targetUser.name}` });
});

export default router;
