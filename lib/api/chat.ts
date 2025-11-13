export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    metadata?: {
      technique: string;
      goal: string;
      progress: any[];
      analysis?: {
        emotionalState: string;
        themes: string[];
        riskLevel: number;
        recommendedApproach: string;
        progressIndicators: string[];
      };
    };
  }
  
  export interface ChatSession {
    sessionId: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ApiResponse {
    message: string;
    response?: string;
    analysis?: {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
    };
    metadata?: {
      technique: string;
      goal: string;
      progress: any[];
    };
  }
  
  // Use Next.js API routes instead of calling backend directly
  const API_BASE = "/api";
  
  // Helper function to get auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.warn("No token found in localStorage");
        throw new Error("No authentication token available");
      }

      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };
  
  export const createChatSession = async (): Promise<string> => {
    try {
      console.log("Creating new chat session...");
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          console.error("Failed to create chat session:", error);
          throw new Error(error.error || error.message || "Failed to create chat session");
        } else {
          const text = await response.text();
          console.error("Failed to create chat session - non-JSON response:", text.substring(0, 100));
          throw new Error(`Failed to create chat session: ${response.status} ${response.statusText}`);
        }
      }
  
      const data = await response.json();
      console.log("Chat session created:", data);
      return data.sessionId;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  };
  
  export const sendChatMessage = async (
    sessionId: string,
    message: string
  ): Promise<ApiResponse> => {
    try {
      console.log(`Sending message to session ${sessionId}:`, message);
      const response = await fetch(
        `${API_BASE}/chat/sessions/${sessionId}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ message }),
        }
      );
  
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          console.error("Failed to send message:", error);
          throw new Error(error.error || error.message || "Failed to send message");
        } else {
          const text = await response.text();
          console.error("Failed to send message - non-JSON response:", text.substring(0, 100));
          throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }
      }
  
      const data = await response.json();
      console.log("Message sent successfully:", data);
      return data;
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  };
  
  export const getChatHistory = async (
    sessionId: string
  ): Promise<ChatMessage[]> => {
    try {
      console.log(`Fetching chat history for session ${sessionId}`);
      const response = await fetch(
        `${API_BASE}/chat/sessions/${sessionId}/history`,
        {
          headers: getAuthHeaders(),
        }
      );
  
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          console.error("Failed to fetch chat history:", error);
          throw new Error(error.error || error.message || "Failed to fetch chat history");
        } else {
          const text = await response.text();
          console.error("Failed to fetch chat history - non-JSON response:", text.substring(0, 100));
          throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
        }
      }
  
      const data = await response.json();
      console.log("Received chat history:", data);
  
      if (!Array.isArray(data)) {
        console.error("Invalid chat history format:", data);
        throw new Error("Invalid chat history format");
      }
  
      // Ensure each message has the correct format
      return data.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.metadata,
      }));
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
  };
  
  export const getAllChatSessions = async (): Promise<ChatSession[]> => {
    try {
      // Check if token exists before making request
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("Cannot fetch chat sessions: No token available");
          return [];
        }
      }

      console.log("Fetching all chat sessions...");
      const headers = getAuthHeaders();
      console.log("Request headers:", { ...headers, Authorization: headers.Authorization ? "Bearer ***" : "missing" });
      
      const response = await fetch(`${API_BASE}/chat/sessions`, {
        headers,
      });

      if (!response.ok) {
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          console.error("Failed to fetch chat sessions:", error);
          throw new Error(error.error || error.message || "Failed to fetch chat sessions");
        } else {
          // Handle HTML error pages or other non-JSON responses
          const text = await response.text();
          console.error("Failed to fetch chat sessions - non-JSON response:", text.substring(0, 100));
          throw new Error(`Failed to fetch chat sessions: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log("Received chat sessions:", data);

      // Handle empty array or single object
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((session: any) => {
        // Ensure dates are valid
        const createdAt = new Date(session.createdAt || Date.now());
        const updatedAt = new Date(session.updatedAt || Date.now());

        return {
          ...session,
          createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
          updatedAt: isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
          messages: (session.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp || Date.now()),
          })),
        };
      });
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      throw error;
    }
  };
  

  