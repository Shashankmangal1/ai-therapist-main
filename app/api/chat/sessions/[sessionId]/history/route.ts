import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.API_URL || "https://calmly-1-0.onrender.com";

export async function GET(req: NextRequest, 
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        console.log(`Fetching chat history for session: ${sessionId}`);

        const authHeader = req.headers.get("Authorization");

        const response = await fetch(
            `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(authHeader ? { "Authorization": authHeader } : {}),
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to fetch chat history:", error);
            return NextResponse.json({ error: error.error || "Failed to fetch chat history" }, { status: response.status });
        }

        const data = await response.json();
        
        const formattedMessages = data.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            metadata: msg.metadata,
        }));


        return NextResponse.json(formattedMessages);
    } catch (error) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}