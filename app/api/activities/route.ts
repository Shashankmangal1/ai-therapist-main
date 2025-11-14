import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  // Use the correct frontend environment variable name
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://calmly-1-0.onrender.com";

  // Read JWT cookie, not Authorization header
  const token = req.cookies.get("token")?.value;

  const userId = req.nextUrl.searchParams.get("user");

  if (!token) {
    return NextResponse.json(
      { message: "Not authenticated (missing token cookie)" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/activity${userId ? `?user=${userId}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,   // backend expects Bearer tokens
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.message || "Failed to fetch activity" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("Error fetching activities:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
