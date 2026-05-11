export function humanizeNoorainQuestion(text: string, surahName: string) {
  let result = text.trim().replace(/\s+/g, " ");

  result = result.replace(/^in this surah[:,]?\s*/i, "");
  result = result.replace(/^what does this verse teach\??/i, "Wait — what is this part teaching us?");
  result = result.replace(/^what is the main theme\??/i, `I was reading ${surahName} with you — what theme kept showing up?`);
  result = result.replace(/^which of these is true\??/i, "Okay wait — which one matches what we just read?");
  result = result.replace(/^what is being emphasized here\??/i, "Hmm — what do you think this part is really emphasizing?");

  if (!/(i was reading|let me quiz you|wait|okay|hmm|with you)/i.test(result)) {
    result = `I was reading ${surahName} with you — ${lowercaseFirst(result)}`;
  }

  result = result.replace(/\s+—\s+—/g, " — ");
  result = result.replace(/\?\?+/g, "?");

  if (result.length > 120) {
    result = result.slice(0, 117).trimEnd() + "...";
  }

  return result;
}

function lowercaseFirst(text: string) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}
