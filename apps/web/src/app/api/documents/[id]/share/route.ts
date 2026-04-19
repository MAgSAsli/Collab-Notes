import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { email } = await req.json();

  const doc = await prisma.document.findFirst({ where: { id, ownerId: userId } });
  if (!doc) return NextResponse.json({ message: "Not found or not authorized" }, { status: 404 });

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return NextResponse.json({ message: "User not found" }, { status: 404 });
  if (targetUser.id === userId) return NextResponse.json({ message: "Cannot share with yourself" }, { status: 400 });

  await prisma.collaborator.upsert({
    where: { userId_documentId: { userId: targetUser.id, documentId: id } },
    update: {},
    create: { userId: targetUser.id, documentId: id },
  });

  return NextResponse.json({ message: `Shared with ${targetUser.name}` });
}
