// Shared between the streaming server generator and the client: status
// updates ride the same plain-text stream as the answer, wrapped in a
// Unicode Private Use Area character (U+E000) as a delimiter -- reserved
// for exactly this kind of private signaling, and guaranteed never to
// appear in real LLM text output (unlike a word like "status", which
// shows up constantly in this domain: barrier status, request status...).
// The client strips these markers out and shows them as a transient
// "working" indicator instead of appending them to the visible message.
const MARKER = "";
const STATUS_RE = /([\s\S]*?)/g;

export function statusChunk(text: string): string {
  return `${MARKER}${text}${MARKER}`;
}

/** Strips status markers from accumulated raw text, returning the visible content and the latest status (if any). */
export function parseStatusStream(raw: string): { content: string; status?: string } {
  let status: string | undefined;
  const content = raw.replace(STATUS_RE, (_match, message: string) => {
    status = message;
    return "";
  });
  return { content, status };
}
