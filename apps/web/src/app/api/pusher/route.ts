import { NextRequest, NextResponse } from "next/server";
import pusher from "@/lib/pusher-server";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { documentId, event, data } = await req.json();

  await pusher.trigger(`document-${documentId}`, event, { ...data, senderId: userId });

  return NextResponse.json({ ok: true });
}
