import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.API_URL || "https://calmly-1-0.onrender.com";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            }
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const error = await response.json();
                console.error("Failed to create chat session:", error);
                return NextResponse.json(
                    { error: error.error || error.message || "Failed to create chat session" }, 
                    { status: response.status }
                );
            } else {
                const text = await response.text();
                console.error("Failed to create chat session - non-JSON response:", text.substring(0, 100));
                return NextResponse.json(
                    { error: `Failed to create chat session: ${response.status} ${response.statusText}` }, 
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        console.log("Chat session created:", data);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error creating chat session:", error);
        return NextResponse.json(
            { error: "Failed to create chat session" }, 
            { status: 500 }
        );
    }
}