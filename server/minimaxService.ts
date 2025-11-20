/**
 * MiniMax Service
 * 
 * Wrapper for MiniMax MCP server tools
 * Provides easy-to-use functions for AI generation tasks
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

const MCP_SERVER = "minimax";
const OUTPUT_DIR = process.env.MINIMAX_OUTPUT_DIR || "/tmp/minimax-outputs";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface MCPResult {
  success: boolean;
  data?: any;
  error?: string;
  outputPath?: string;
}

/**
 * Call MCP tool and parse result
 */
async function callMCPTool(toolName: string, args: Record<string, any>): Promise<MCPResult> {
  try {
    const argsJson = JSON.stringify(args);
    const command = `manus-mcp-cli tool call ${toolName} --server ${MCP_SERVER} --input '${argsJson}'`;
    
    console.log(`[MiniMax] Calling tool: ${toolName}`);
    console.log(`[MiniMax] Args:`, args);
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });

    if (stderr) {
      console.error(`[MiniMax] Warning:`, stderr);
    }

    // Parse the output to extract file path or result
    const output = stdout.trim();
    console.log(`[MiniMax] Result:`, output.substring(0, 500)); // Log first 500 chars

    // Try to extract file path from output
    const filePathMatch = output.match(/saved to: (.+?)(?:\n|$)/i) || 
                         output.match(/output file: (.+?)(?:\n|$)/i) ||
                         output.match(/path: (.+?)(?:\n|$)/i);
    
    const outputPath = filePathMatch ? filePathMatch[1].trim() : undefined;

    return {
      success: true,
      data: output,
      outputPath,
    };
  } catch (error: any) {
    console.error(`[MiniMax] Error calling ${toolName}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
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
  return callMCPTool("text_to_image", {
    prompt: params.prompt,
    aspect_ratio: params.aspectRatio || "1:1",
    n: params.n || 1,
    prompt_optimizer: params.promptOptimizer !== false,
    output_directory: OUTPUT_DIR,
  });
}

/**
 * Generate video from text prompt
 */
export async function generateVideoFromText(params: {
  prompt: string;
  model?: "T2V-01" | "T2V-01-Director" | "MiniMax-Hailuo-02" | "MiniMax-Hailuo-2.3";
  duration?: 6 | 10;
  resolution?: "720P" | "768P" | "1080P";
  promptOptimizer?: boolean;
}): Promise<MCPResult> {
  return callMCPTool("generate_video", {
    prompt: params.prompt,
    model: params.model || "MiniMax-Hailuo-02",
    duration: params.duration || 6,
    resolution: params.resolution || "768P",
    output_directory: OUTPUT_DIR,
    async_mode: false, // Synchronous for now
  });
}

/**
 * Generate video from image
 */
export async function generateVideoFromImage(params: {
  prompt: string;
  firstFrameImage: string; // Path or URL to image
  model?: "I2V-01" | "I2V-01-Director" | "I2V-01-live";
  duration?: 6 | 10;
  resolution?: "720P" | "768P" | "1080P";
}): Promise<MCPResult> {
  return callMCPTool("generate_video", {
    prompt: params.prompt,
    first_frame_image: params.firstFrameImage,
    model: params.model || "I2V-01",
    duration: params.duration || 6,
    resolution: params.resolution || "768P",
    output_directory: OUTPUT_DIR,
    async_mode: false,
  });
}

/**
 * Generate music from prompt and lyrics
 */
export async function generateMusic(params: {
  prompt: string;
  lyrics: string;
  sampleRate?: 16000 | 24000 | 32000 | 44100;
  bitrate?: 32000 | 64000 | 128000 | 256000;
  format?: "mp3" | "wav" | "pcm";
}): Promise<MCPResult> {
  return callMCPTool("music_generation", {
    prompt: params.prompt,
    lyrics: params.lyrics,
    sample_rate: params.sampleRate || 32000,
    bitrate: params.bitrate || 128000,
    format: params.format || "mp3",
    output_directory: OUTPUT_DIR,
  });
}

/**
 * Convert text to speech
 */
export async function textToAudio(params: {
  text: string;
  voiceId?: string;
  speed?: number;
  emotion?: "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";
}): Promise<MCPResult> {
  return callMCPTool("text_to_audio", {
    text: params.text,
    voice_id: params.voiceId,
    speed: params.speed || 1.0,
    emotion: params.emotion || "neutral",
    output_directory: OUTPUT_DIR,
  });
}

/**
 * Clone a voice from audio file
 */
export async function cloneVoice(params: {
  voiceId: string;
  audioFile: string; // Path or URL
  text: string;
  isUrl?: boolean;
}): Promise<MCPResult> {
  return callMCPTool("voice_clone", {
    voice_id: params.voiceId,
    file: params.audioFile,
    text: params.text,
    is_url: params.isUrl || false,
    output_directory: OUTPUT_DIR,
  });
}

/**
 * List available voices
 */
export async function listVoices(voiceType?: "all" | "system" | "voice_cloning"): Promise<MCPResult> {
  return callMCPTool("list_voices", {
    voice_type: voiceType || "all",
  });
}

/**
 * Design a custom voice from description
 */
export async function designVoice(params: {
  prompt: string;
  previewText: string;
  voiceId?: string;
}): Promise<MCPResult> {
  return callMCPTool("voice_design", {
    prompt: params.prompt,
    preview_text: params.previewText,
    voice_id: params.voiceId,
    output_directory: OUTPUT_DIR,
  });
}
