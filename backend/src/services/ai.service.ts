import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { AppError } from '../middlewares/errorHandler';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const AI_RATE_PREFIX = 'ai_rate:';
const AI_RATE_MAX = 20;      // 20 requests
const AI_RATE_WINDOW = 60;   // per 60 seconds

// ─── Rate Limiter ─────────────────────────────────────────
export const checkAIRateLimit = async (userId: string): Promise<void> => {
  const key = `${AI_RATE_PREFIX}${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, AI_RATE_WINDOW);
  if (count > AI_RATE_MAX) {
    throw new AppError(`AI rate limit exceeded. Max ${AI_RATE_MAX} requests per minute.`, 429, 'RATE_LIMITED');
  }
};

// ─── Non-streaming query ──────────────────────────────────
export const askClaude = async (
  materialTitle: string,
  materialContent: string,
  userQuestion: string,
): Promise<string> => {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: buildSystemPrompt(materialTitle),
    messages: [
      {
        role: 'user',
        content: buildUserMessage(materialContent, userQuestion),
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new AppError('AI returned an empty response', 502, 'AI_EMPTY_RESPONSE');
  }
  return textBlock.text;
};

// ─── Streaming query (SSE) ────────────────────────────────
export const streamClaude = async (
  materialTitle: string,
  materialContent: string,
  userQuestion: string,
  onChunk: (text: string) => void,
  onDone: () => void,
): Promise<void> => {
  const stream = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    stream: true,
    system: buildSystemPrompt(materialTitle),
    messages: [
      {
        role: 'user',
        content: buildUserMessage(materialContent, userQuestion),
      },
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
  onDone();
};

// ─── Prompt builders ──────────────────────────────────────
const buildSystemPrompt = (materialTitle: string): string =>
  `You are an expert academic tutor specialising in the subject covered by "${materialTitle}".

Your responsibilities:
1. Answer questions directly related to the provided study material.
2. Explain difficult concepts with clear examples and analogies.
3. Summarise sections when asked.
4. Generate quiz questions and answers when requested.
5. Keep responses structured, concise, and educationally valuable.

Always ground your responses in the provided material. If a question is outside the material's scope, say so politely and redirect.`;

const buildUserMessage = (materialContent: string, question: string): string =>
  `Study Material:\n---\n${materialContent.slice(0, 15000)}\n---\n\nStudent Question: ${question}`;
