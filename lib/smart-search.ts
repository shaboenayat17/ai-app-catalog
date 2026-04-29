import type { Category } from "./types";

const KEYWORD_TO_CATEGORY: Array<{ keys: RegExp; category: Category }> = [
  { keys: /\b(write|writing|copy|essay|article|blog|email|story|book)\b/i, category: "Text & Writing" },
  { keys: /\b(image|picture|illustration|art|draw|paint|logo|poster|sticker|illustrate)\b/i, category: "Image & Art" },
  { keys: /\b(video|clip|reel|animate|animation|movie|film|vfx)\b/i, category: "Video" },
  { keys: /\b(voice|voiceover|narration|tts|dub|audio|music|song|track|podcast|sound|score)\b/i, category: "Audio & Music" },
  { keys: /\b(code|coding|app|website|frontend|backend|build|deploy|component|ui)\b/i, category: "Coding" },
  { keys: /\b(schedule|calendar|meeting|task|note|notes|workspace)\b/i, category: "Productivity" },
  { keys: /\b(research|paper|study|cite|citation|source|literature)\b/i, category: "Research" },
  { keys: /\b(data|analytics|sql|query|notebook|vector|embedding|rag)\b/i, category: "Data & Analytics" },
  { keys: /\b(avatar|presenter|talking head|meeting|transcript|transcribe)\b/i, category: "Avatar & Meetings" },
  { keys: /\b(slide|deck|presentation|3d|design)\b/i, category: "3D & Design" },
];

const KEYWORD_TO_USECASE: Array<{ keys: RegExp; useCaseId: string }> = [
  { keys: /\b(animat|cartoon|short film|motion graphic)\b/i, useCaseId: "animation" },
  { keys: /\b(podcast|interview show|audio show)\b/i, useCaseId: "podcast" },
  { keys: /\b(build (an )?app|ship (an )?app|saas|web app|mobile app)\b/i, useCaseId: "build-app" },
  { keys: /\b(social|tiktok|reel|instagram|youtube short|content creator)\b/i, useCaseId: "social-content" },
  { keys: /\b(research|literature review|study|academic)\b/i, useCaseId: "research" },
  { keys: /\b(presentation|slide deck|pitch deck|keynote)\b/i, useCaseId: "presentation" },
];

export interface SmartSearchResult {
  categories: Category[];
  useCaseId: string | null;
}

export function detectIntent(query: string): SmartSearchResult {
  const categories = new Set<Category>();
  for (const { keys, category } of KEYWORD_TO_CATEGORY) {
    if (keys.test(query)) categories.add(category);
  }
  let useCaseId: string | null = null;
  for (const { keys, useCaseId: id } of KEYWORD_TO_USECASE) {
    if (keys.test(query)) {
      useCaseId = id;
      break;
    }
  }
  // If two strong category hits but no use case, try to infer one
  if (!useCaseId && categories.size >= 2) {
    const cats = Array.from(categories);
    const hasImage = cats.includes("Image & Art");
    const hasVideo = cats.includes("Video");
    const hasAudio = cats.includes("Audio & Music");
    if (hasImage && hasVideo && hasAudio) useCaseId = "animation";
    else if (hasAudio && cats.includes("Text & Writing")) useCaseId = "podcast";
    else if (hasImage && hasVideo) useCaseId = "social-content";
  }
  return { categories: Array.from(categories), useCaseId };
}

export { getUseCaseById } from "./usecases";
