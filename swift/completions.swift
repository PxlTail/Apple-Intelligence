import Foundation
import FoundationModels

struct TranscriptParse: Codable {
    let type: String
    let content: String
}
struct TranscriptEntry: Codable {
    let sender: String
    let content: String
}
struct ParseInput: Decodable {
    let prompt: String
    let instructions: String?
    let model: String?
    let generationOptions: GenerationOptionsInput?
    let transcript: [TranscriptParse]
}
struct GenerationOptionsInput: Decodable {
    let temperature: Double?
    let maximumResponseTokens: Int?
}


let jsonData = CommandLine.arguments[1].data(using: .utf8)!
let data = try JSONDecoder().decode(ParseInput.self, from: jsonData)

var parsedEntries = data.transcript.map { entry in
    switch entry.type {
    case "prompt":
        return Transcript.Entry.prompt(
            Transcript.Prompt(segments: [Transcript.Segment.text(Transcript.TextSegment(content: entry.content))])
        )
    case "response":
        return Transcript.Entry.response(
            Transcript.Response(
                assetIDs: [],
                segments: [Transcript.Segment.text(Transcript.TextSegment(content: entry.content))]
            )
        )
    default:
        fatalError("Unknown transcript entry type: \(entry.type)")
    }
}
if let instructionsContent = data.instructions {
    parsedEntries.insert(
        Transcript.Entry.instructions(
            Transcript.Instructions(
                segments: [Transcript.Segment.text(Transcript.TextSegment(content: instructionsContent))],
                toolDefinitions: []
            )
        ),
        at: 0  // insert as first entry
    )
}

let transcript = Transcript(entries: parsedEntries)

let params = GenerationOptions(
    temperature: data.generationOptions?.temperature ?? nil,
    maximumResponseTokens: data.generationOptions?.maximumResponseTokens ?? nil
)

let session = LanguageModelSession(
    transcript: transcript
)
let input = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ""
// let response: LanguageModelSession.Response<String> = try await session.respond(to: data.prompt, options: params)

for try await content in session.streamResponse(to: data.prompt, options: params) {
    print(content, terminator: "")
    fflush(stdout)
}
print("")  // newline when done