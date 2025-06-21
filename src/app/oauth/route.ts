import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // NextAuth handles OAuth automatically through its own routes
  // This route is no longer needed, but we'll redirect to sign-in
  return NextResponse.redirect(`${request.nextUrl.origin}/sign-in`);
}
