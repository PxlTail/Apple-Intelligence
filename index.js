import { spawn } from "child_process"
import express, { response } from "express"
import bodyParser from "body-parser";

const getSwiftResponse = (data, endpoint) => {
    return new Promise((resolve, reject) => {
        let process = spawn("swift", ["swift/" + endpoint + ".swift", JSON.stringify(data)]);

        let output = "";
        let error = "";
        let printedLength;

        process.stdout.on("data", (chunk) => {
            let text = chunk.toString();
            let newText = text.substring(printedLength);
            output += newText;
            printedLength = text.length;
        });

        process.stderr.on("data", (chunk) => {
            error += chunk.toString();
        });

        process.on("close", (code) => {
            if (code == 0) {
                resolve(output.trim());
            } else {
                reject(new Error(error));
            }
        });
    });
}

export default function AppleIntelligence(port) {
    const app = express();
    app.use(bodyParser.json());
    app.use((req, res, next) => {
        if (req.url.startsWith("/v1/")) {
            req.url = req.url.substring(3);
        }
        next();
    });

    app.post("/chat/completions", async (req, res) => {
        const {
            model,
            messages,
            temperature,
            max_completion_tokens,
            stream
        } = req.body;

        let instructions;
        let prompt = "";
        let transcript = [...messages];

        const lastMsg = transcript[transcript.length - 1];
        if (lastMsg?.role === "user") {
            prompt = lastMsg.content;
            transcript.pop();
        } else {
            prompt = "";
        }

        transcript = transcript.flatMap((msg) => {
            if (msg.role === "system") {
                instructions = msg.content;
                return [];
            }

            let newmsg = {};
            switch (msg.role) {
                case "user": newmsg.type = "prompt"; break;
                case "assistant": newmsg.type = "response"; break;
                default: return [];
            }
            newmsg.content = msg.content;
            return [newmsg];
        });

        const swiftData = {
            prompt,
            generationOptions: {
                temperature,
                maximumResponseTokens: max_completion_tokens
            },
            transcript,
            instructions
        };

        if (stream) {
            // --- Streaming mode ---
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();

            const swiftProc = spawn("swift", ["swift/completions.swift", JSON.stringify({ ...swiftData, stream: true })]);

            let accumulatedText = "";

            swiftProc.stdout.on("data", (chunk) => {
                const text = chunk.toString().trim();
                if (!text) return;

                const newContent = text.startsWith(accumulatedText)
                    ? text.slice(accumulatedText.length)
                    : text;

                accumulatedText = text;

                if (!newContent) return;

                const envelope = {
                    choices: [{
                        delta: { content: newContent },
                        index: 0,
                        finish_reason: null
                    }]
                };

                res.write(`data: ${JSON.stringify(envelope)}\n\n`);
            });

            swiftProc.on("close", () => {
                res.write(`data: ${JSON.stringify({
                    choices: [{
                        delta: {},
                        index: 0,
                        finish_reason: "stop"
                    }]
                })}\n\n`);
                res.write("data: [DONE]\n\n");
                res.end();
            });
            swiftProc.stderr.on("data", (chunk) => {
                const errorText = chunk.toString();
                if (errorText.includes("Safety guardrail was triggered.")) {
                    res.writeHead(403, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Safety guardrail was triggered." }));
                    swiftProc.kill();
                } else {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: errorText }));
                    swiftProc.kill();
                }
            });
        } else {
            // --- Non-streaming mode ---
            res.setHeader("Content-Type", "application/json");

            try {
                const responseText = await getSwiftResponse(swiftData, "completions");

                const responsePayload = {
                    object: "chat.completion",
                    created: Date.now(),
                    model: "afm",
                    choices: [{
                        index: 0,
                        message: {
                            role: "assistant",
                            content: responseText
                        },
                        finish_reason: "stop"
                    }]
                };

                res.json(responsePayload);
            } catch (err) {
                if (err.message.includes("Safety guardrail was triggered.")) {
                    res.status(403).json({ error: "Safety guardrail was triggered." });
                } else {
                    console.error(err);
                    res.status(500).json({ error: err.message });
                }
            }
        }
    });

    return {
        async start() {
            return new Promise((resolve) => {
                app.listen(port, () => {
                    console.log(`AppleIntelligence server running on port ${port}`);
                    resolve();
                });
            });
        }
    };
}