import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, name, password } = await req.json();
  if (!email || !name || !password)
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ message: "Email already registered" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, password: hashed } });
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
}
