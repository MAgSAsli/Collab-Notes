import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: {
      id,
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!doc) return NextResponse.json({ message: "Document not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, content } = await req.json();

  const doc = await prisma.document.findFirst({
    where: { id, OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }] },
  });
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const updated = await prisma.document.update({
    where: { id },
    data: { ...(title !== undefined && { title }), ...(content !== undefined && { content }) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findFirst({ where: { id, ownerId: userId } });
  if (!doc) return NextResponse.json({ message: "Not found or not authorized" }, { status: 404 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
