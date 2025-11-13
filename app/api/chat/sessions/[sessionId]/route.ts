import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.API_URL || "https://calmly-1-0.onrender.com";

export async function GET(req: NextRequest, 
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
        }

        const response = await fetch(
            `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader,
                }
            }
        );

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const error = await response.json();
                return NextResponse.json(
                    { error: error.error || error.message || "Failed to fetch chat history" }, 
                    { status: response.status }
                );
            } else {
                return NextResponse.json(
                    { error: `Failed to fetch chat history: ${response.status} ${response.statusText}` }, 
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error in chat history API:", error);
        return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, 
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
        }

        const messageData = await req.json();
        const message = messageData.message || messageData;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const response = await fetch(
            `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader,
                },
                body: JSON.stringify({ message }),
            }
        );

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const error = await response.json();
                return NextResponse.json(
                    { error: error.error || error.message || "Failed to send chat message" }, 
                    { status: response.status }
                );
            } else {
                return NextResponse.json(
                    { error: `Failed to send chat message: ${response.status} ${response.statusText}` }, 
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json({ error: "Failed to send chat message" }, { status: 500 });
    }
}