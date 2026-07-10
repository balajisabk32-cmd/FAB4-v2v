import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      "SELECT id, email, name, image, age, bmi FROM users WHERE email = $1",
      [session.user.email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error("Error fetching profile:", err.message);
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { age, bmi } = await req.json();

    // Update user profile in PostgreSQL
    const { rows } = await query(
      "UPDATE users SET age = $1, bmi = $2 WHERE email = $3 RETURNING *",
      [age || null, bmi || null, session.user.email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: rows[0] });
  } catch (err: any) {
    console.error("Error updating profile:", err.message);
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 });
  }
}
