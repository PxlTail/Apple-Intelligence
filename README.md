# @pxltail/apple-intelligence
**Version 1.0.4-beta**

This is a basic library that lets you access Apple's new [FoundationModels] API(https://developer.apple.com/documentation/foundationmodels) via REST.

As of writing, it's the only library that does so.

## Install
Installing this works like any other Node.js library.
```bash
npm install @pxltail/apple-intelligence
```
This will install it in the project you are currently in.

If you want to install this system wide to use the CLI tool anywhere:
```bash
npm install @pxltail/apple-intelligence -g
```
### Requirements To Use
- macOS 26 Tahoe or later
- A Mac with an Apple Silicon processor (M1 or later)
- Apple Intelligence enabled, downloaded and installed
- Game mode disabled

## Setting Up
Starting the server is very simple. There are two options, depending on how you're using the library.

- If you're using this in a Node.js script:
```js
import AppleIntelligence from '@pxltail/apple-intelligence';
const PORT = 8080;

const ai = AppleIntelligence(PORT);
ai.start(); // Server started at localhost:8080
```
- If you're using this outside of JS in a terminal, there's also a CLI tool:
```bash
apple-intelligence 8080 # Server started at localhost:8080
```

Both of these start an HTTP server at the port provided.

## Usage
The server you started has OpenAI API compatible endpoints. Here's what is and isn't supported.

**Feature**|**Supported**|**Reasoning**
:-----:|:-----:|:-----:
Chat Completions|✅| 
Responses|❓|This endpoint could possibly be supported in the future, though I don’t see much of a use because this is being run locally.
Streaming|✅| 
Model Selection|🔜|The documentation related to choosing between models was difficult to understand, but if I find a way to implement this I will… in fact, the code is already set up for this.
Media and File Uploads|❌|Apple’s models don’t natively support this.
Tool Calling|🔜|This is a feature that I will add in the next update to this library.
Web Search|❌|Apple doesn’t provide an API for the models to directly do this.
Reasoning|❓|Apple infamously [dunked on](https://machinelearning.apple.com/research/illusion-of-thinking) reasoning models so this won't happen officially, but I’ll see if I can use prompting to convert the AFM models into reasoning models in the near future.
Modifying guardrails|❓|This was confusing. The documentation was unclear on how to use the guardrails parameter, but if I can find more info I'll implement this.
Image Generation|🔜|Coming soon! Apple does provide an API for this and it will be implemented here.
|||
|||
Maximum Completion Tokens|✅| 
temperature|✅| 
Presence Penalty, Top P|❌|Apple's models don't natively support this.

If you know how to use the OpenAI API, this is a simple drop-in. If not, there are tools like [Msty](https://msty.app/) you can use that make interacting with local models very easy.

*This server also strips /v1/ prefixes, so if you place it into a system that does that, it will still work.*

### Example Request
```bash
curl -X POST http://localhost:8080/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "afm",
        "messages": [
            { "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": "What is the capital of France?" }
        ],
        "temperature": 0.7,
        "max_completion_tokens": 100,
        "stream": false
    }'
```
Expected response:
```json
{
    "object": "chat.completion",
    "created": 1720632342342,
    "model": "afm",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "The capital of France is Paris."
            },
            "finish_reason": "stop"
        }
    ]
}
```
## Issues
This project is still in beta, just like the AI itself. If you find any issues with this project, let me know by @ing me on Twitter. ([@pxltail](https://twitter.com/@pxltail))

This is my first project using Swift, so it *may* be buggy.. but any major errors have been fixed. If you do get an error, let me know how to reproduce it and I'll try my best to fix it.

The code for this project...isn't great. If you have any suggestions or help related to that, also let me know.

PRs are also welcome! https://github.com/PxlTail/Apple-Intelligence/pulls