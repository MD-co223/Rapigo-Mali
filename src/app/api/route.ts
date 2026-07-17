import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Bienvenue sur l'API Rapigo Mali" });
}