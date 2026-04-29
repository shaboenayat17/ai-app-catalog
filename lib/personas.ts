export interface Persona {
  id: string;
  emoji: string;
  label: string;
  short: string;       // short label for compact rows
  description: string; // 1-line for the banner
  appIds: string[];    // recommended apps
  defaultUseCase: string; // pre-selected use case on /workflow
}

export const PERSONAS: Persona[] = [
  {
    id: "teacher",
    emoji: "👩‍🏫",
    label: "Teacher",
    short: "Teacher",
    description: "Plan lessons, build slides, transcribe class, and share notes.",
    appIds: ["notion-ai", "chatgpt", "gamma", "canva-ai", "otter", "grammarly"],
    defaultUseCase: "teach-class",
  },
  {
    id: "podcaster",
    emoji: "🎙️",
    label: "Podcaster",
    short: "Podcaster",
    description: "Record, transcribe, edit, and add a theme — solo or with guests.",
    appIds: ["descript", "elevenlabs", "otter", "suno", "assemblyai", "notion-ai"],
    defaultUseCase: "podcast",
  },
  {
    id: "small-biz",
    emoji: "🏪",
    label: "Small Business Owner",
    short: "Small Biz",
    description: "Brand, copy, design, and pitch — without hiring an agency.",
    appIds: ["chatgpt", "canva-ai", "notion-ai", "grammarly", "jasper", "gamma"],
    defaultUseCase: "online-store",
  },
  {
    id: "creative",
    emoji: "🎨",
    label: "Creative / Artist",
    short: "Creative",
    description: "Image, video, and audio generation tools for original work.",
    appIds: ["midjourney", "adobe-firefly", "runway", "suno", "canva-ai", "dalle"],
    defaultUseCase: "animation",
  },
  {
    id: "developer",
    emoji: "💻",
    label: "Developer",
    short: "Dev",
    description: "Plan, code, debug, and ship apps faster.",
    appIds: ["github-copilot", "cursor", "chatgpt", "claude", "replit", "langchain"],
    defaultUseCase: "build-app",
  },
  {
    id: "marketer",
    emoji: "📈",
    label: "Marketer",
    short: "Marketer",
    description: "On-brand copy, creative, and research at scale.",
    appIds: ["jasper", "copy-ai", "canva-ai", "chatgpt", "perplexity", "grammarly"],
    defaultUseCase: "social-grow",
  },
  {
    id: "creator",
    emoji: "🎬",
    label: "Content Creator",
    short: "Creator",
    description: "Make video, voiceovers, music, and thumbnails fast.",
    appIds: ["runway", "elevenlabs", "descript", "canva-ai", "chatgpt", "suno"],
    defaultUseCase: "social-grow",
  },
  {
    id: "student",
    emoji: "📚",
    label: "Student",
    short: "Student",
    description: "Research, write, transcribe, and stay organized.",
    appIds: ["chatgpt", "claude", "perplexity", "grammarly", "notion-ai", "otter"],
    defaultUseCase: "research",
  },
  {
    id: "researcher",
    emoji: "🔬",
    label: "Researcher",
    short: "Researcher",
    description: "Source, synthesize, transcribe, and write up findings.",
    appIds: ["perplexity", "claude", "notion-ai", "otter", "assemblyai", "grammarly"],
    defaultUseCase: "research",
  },
  {
    id: "writer",
    emoji: "✍️",
    label: "Writer / Author",
    short: "Writer",
    description: "Draft long-form, polish, and design covers and pitches.",
    appIds: ["claude", "grammarly", "notion-ai", "jasper", "perplexity", "canva-ai"],
    defaultUseCase: "write-book",
  },
];

export function getPersonaById(id: string | null | undefined): Persona | null {
  if (!id) return null;
  return PERSONAS.find((p) => p.id === id) ?? null;
}
