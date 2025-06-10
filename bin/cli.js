#!/usr/bin/env node

import AppleIntelligence from '../index.js';

const args = process.argv.slice(2);
const port = parseInt(args[0], 10) || 3000;

const ai = AppleIntelligence(port);

ai.start?.().catch((err) => {
    console.error("Failed to start Apple Intelligence:", err);
    process.exit(1);
});