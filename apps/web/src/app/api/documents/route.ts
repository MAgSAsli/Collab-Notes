import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const docs = await prisma.document.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { collaborators: { some: { userId } } },
      ],
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.create({
    data: { title: "Untitled", content: "", ownerId: userId },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(doc, { status: 201 });
}
