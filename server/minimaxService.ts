/**
 * MiniMax Service
 * 
 * Direct API integration with MiniMax
 * Uses MiniMax REST API for AI generation tasks
 */

interface MCPResult {
  success: boolean;
  data?: any;
  error?: string;
  outputPath?: string;
  taskId?: string;
}

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || "1894088139123724547";
const MINIMAX_BASE_URL = "https://api.minimax.chat/v1";

/**
 * Make API request to MiniMax
 */
async function callMinimaxAPI(
  endpoint: string,
  method: string = "POST",
  body?: any
): Promise<any> {
  if (!MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY not configured");
  }

  const url = `${MINIMAX_BASE_URL}${endpoint}`;
  
  console.log(`[MiniMax API] ${method} ${url}`);
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MiniMax API] Error:`, errorText);
    throw new Error(`MiniMax API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Generate an image from text prompt
 */
export async function generateImage(params: {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "3:4" | "9:16" | "21:9";
  n?: number;
  promptOptimizer?: boolean;
}): Promise<MCPResult> {
  try {
    const result = await callMinimaxAPI("/text_to_image", "POST", {
      model: "image-01",
      prompt: params.prompt,
      aspect_ratio: params.aspectRatio || "1:1",
      n: params.n || 1,
    });

    console.log("[MiniMax API] Image generation result:", result);

    // Extract image URL from result
    const imageUrl = result.images?.[0]?.url || result.data?.[0]?.url;

    return {
      success: true,
      data: result,
      outputPath: imageUrl,
    };
  } catch (error: any) {
    console.error("[MiniMax API] Image generation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate video from text prompt
 */
export async function generateVideoFromText(params: {
  prompt: string;
  model?: string;
  duration?: number;
  resolution?: string;
  promptOptimizer?: boolean;
}): Promise<MCPResult> {
  try {
    // MiniMax video generation endpoint
    const result = await callMinimaxAPI("/video_generation", "POST", {
      model: params.model || "video-01",
      prompt: params.prompt,
    });

    console.log("[MiniMax API] Video generation result:", result);

    // MiniMax returns task_id for async processing
    const taskId = result.task_id || result.id;
    const videoUrl = result.file_url || result.url;

    return {
      success: true,
      data: result,
      taskId,
      outputPath: videoUrl,
    };
  } catch (error: any) {
    console.error("[MiniMax API] Video generation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate video from image
 */
export async function generateVideoFromImage(params: {
  prompt: string;
  firstFrameImage: string;
  model?: string;
  duration?: number;
  resolution?: string;
}): Promise<MCPResult> {
  try {
    const result = await callMinimaxAPI("/video_generation", "POST", {
      model: params.model || "video-01",
      prompt: params.prompt,
      first_frame_image: params.firstFrameImage,
    });

    console.log("[MiniMax API] I2V generation result:", result);

    const taskId = result.task_id || result.id;
    const videoUrl = result.file_url || result.url;

    return {
      success: true,
      data: result,
      taskId,
      outputPath: videoUrl,
    };
  } catch (error: any) {
    console.error("[MiniMax API] I2V generation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate music from prompt and lyrics
 */
export async function generateMusic(params: {
  prompt: string;
  lyrics: string;
  sampleRate?: number;
  bitrate?: number;
  format?: string;
}): Promise<MCPResult> {
  try {
    const result = await callMinimaxAPI("/music_generation", "POST", {
      model: "music-01",
      text: params.prompt,
      lyrics: params.lyrics,
    });

    console.log("[MiniMax API] Music generation result:", result);

    const taskId = result.task_id || result.id;
    const audioUrl = result.file_url || result.url || result.audio_file;

    return {
      success: true,
      data: result,
      taskId,
      outputPath: audioUrl,
    };
  } catch (error: any) {
    console.error("[MiniMax API] Music generation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Convert text to speech
 */
export async function textToAudio(params: {
  text: string;
  voiceId?: string;
  speed?: number;
  emotion?: string;
}): Promise<MCPResult> {
  try {
    const result = await callMinimaxAPI("/text_to_speech", "POST", {
      model: "speech-01",
      text: params.text,
      voice_id: params.voiceId || "male-qn-qingse",
      speed: params.speed || 1.0,
    });

    console.log("[MiniMax API] TTS result:", result);

    const audioUrl = result.audio_file || result.file_url || result.url;

    return {
      success: true,
      data: result,
      outputPath: audioUrl,
    };
  } catch (error: any) {
    console.error("[MiniMax API] TTS error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clone a voice from audio file
 */
export async function cloneVoice(params: {
  voiceId: string;
  audioFile: string;
  text: string;
  isUrl?: boolean;
}): Promise<MCPResult> {
  return {
    success: false,
    error: "Voice cloning not yet implemented for direct API",
  };
}

/**
 * List available voices
 */
export async function listVoices(voiceType?: string): Promise<MCPResult> {
  return {
    success: false,
    error: "List voices not yet implemented for direct API",
  };
}

/**
 * Design a custom voice from description
 */
export async function designVoice(params: {
  prompt: string;
  previewText: string;
  voiceId?: string;
}): Promise<MCPResult> {
  return {
    success: false,
    error: "Voice design not yet implemented for direct API",
  };
}

/**
 * Check if MiniMax API is configured
 */
export function isMinimaxConfigured(): boolean {
  return !!MINIMAX_API_KEY;
}
