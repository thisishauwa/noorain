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
  result = result.replace(/\??\?+/g, "?");

  if (result.length > 120) {
    result = result.slice(0, 117).trimEnd() + "...";
  }

  return result;
}

export function humanizeTafsirNote(text: string): string {
  let result = text.trim();

  // Strip common AI filler openers
  result = result
    .replace(/^(this (verse|passage|ayah|text|surah)) (reminds us|teaches us|shows|tells us|emphasizes|highlights|underscores|conveys|reveals|illustrates)[^,.]*[,.]\s*/i, "")
    .replace(/^(the (tafsir|commentary|explanation))[^,.]*[,.]\s*/i, "")
    .replace(/^(in this (verse|passage|ayah),?\s*)/i, "")
    .replace(/^(it is (important|worth noting|clear) (to (note|understand|remember))?[^,.]*[,.]\s*)/i, "");

  // Add warm Noorain opener if it sounds too clinical
  if (result && !/(subhanallah|mashallah|you know|ibn kathir|this is actually|wait —|actually,|so —)/i.test(result.slice(0, 40))) {
    result = `SubhanAllah — ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
  }

  return result;
}

function lowercaseFirst(text: string) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}
