import { NextResponse } from "next/server";
import { getDbStatus } from "@/lib/db";

export async function GET() {
  const status = await getDbStatus();
  return NextResponse.json(status);
}
