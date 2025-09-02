# Gemini Telegram Bot

A Telegram bot powered by Google Gemini, built with Deno + grammY.

## Features
- Memory per user (up to 50 turns)
- /reset to clear memory
- /stats (owner-only)
- Optional force-channel join
- Works on Deno Deploy or local

## Setup
1. Get a Telegram bot token from @BotFather.
2. Get a Gemini API key from Google AI Studio.
3. Fork/clone this repo.
4. Add environment variables in Deno Deploy (BOT_TOKEN, DEFAULT_API_KEY, OWNERS).
5. Deploy project from GitHub → Deno Deploy.
6. Set webhook:
