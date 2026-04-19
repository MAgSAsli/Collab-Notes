import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}
