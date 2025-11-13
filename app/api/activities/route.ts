import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const API_URL =
    process.env.BACKEND_API_URL || "https://calmly-1-0.onrender.com";
    
  const token = req.headers.get("Authorization");
  const userId = req.nextUrl.searchParams.get("user"); // optional user query param

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${API_URL}/api/activities${userId ? `?user=${userId}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch activities" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
