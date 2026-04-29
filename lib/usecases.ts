export interface StagedAppPos {
  id: string;
  x: number;
  y: number;
}

export interface UseCaseStage {
  label: string;
  apps: StagedAppPos[];
}

export interface StackBadge {
  emoji: string;
  label: string;
}

export interface StackRole {
  emoji: string;
  label: string;
  tip: string;
}

export interface MinimumStackApp {
  appId: string;
  badges: StackBadge[];
  roles: StackRole[];
  monthlyCost: string;
  freeTier: boolean | "limited";
}

export interface MinimumStack {
  apps: MinimumStackApp[];
  note?: string;
  rationale: string;
}

export interface UseCase {
  id: string;
  label: string;
  emoji: string;
  description: string;
  appIds: string[];
  steps?: string[];
  stages?: UseCaseStage[];
  minimumStack?: MinimumStack;
}

export const USE_CASES: UseCase[] = [
  {
    id: "animation",
    label: "Make an animation",
    emoji: "🎬",
    description: "Concept art, animate clips, score it, and edit it together.",
    steps: ["Concept Art", "Animate", "Score", "Edit"],
    appIds: [
      "midjourney",
      "adobe-firefly",
      "runway",
      "pika",
      "kling",
      "elevenlabs",
      "suno",
      "descript",
    ],
    minimumStack: {
      rationale:
        "Runway covers concept stills, motion, and editing in one product. ElevenLabs handles voiceover and music, so you don't need a separate composer or VO platform.",
      apps: [
        {
          appId: "runway",
          badges: [
            { emoji: "🎨", label: "Images" },
            { emoji: "🎬", label: "Animate" },
            { emoji: "✂️", label: "Edit" },
          ],
          roles: [
            { emoji: "🎨", label: "Image Maker", tip: "Use Runway's Text-to-Image to generate your style reference, then iterate on key frames before animating." },
            { emoji: "🎬", label: "Animator", tip: "Drop a still into Image-to-Video and prompt 'slow camera push-in, leaves blow past' to get a 5-second clip." },
            { emoji: "✂️", label: "Editor", tip: "Stitch generated clips on Runway's timeline — trim, color-grade, and export at the right aspect ratio in one place." },
          ],
          monthlyCost: "$15–$35/mo (Standard tier covers most short animations)",
          freeTier: "limited",
        },
        {
          appId: "elevenlabs",
          badges: [
            { emoji: "🎤", label: "Voice" },
            { emoji: "🎵", label: "Music" },
          ],
          roles: [
            { emoji: "🎤", label: "Voiceover", tip: "Paste your script into Text-to-Speech, pick a character voice, and download the audio for your animation." },
            { emoji: "🎵", label: "Composer", tip: "Use ElevenLabs Music with a prompt like 'cinematic orchestral build, hopeful, 30 seconds' for the score." },
          ],
          monthlyCost: "$5–$22/mo depending on minutes generated",
          freeTier: "limited",
        },
      ],
    },
  },
  {
    id: "podcast",
    label: "Start a podcast",
    emoji: "🎙️",
    description: "Record, transcribe, edit on the transcript, and add a theme.",
    steps: ["Record", "Transcribe", "Edit", "Score"],
    appIds: ["elevenlabs", "descript", "otter", "assemblyai", "suno"],
    minimumStack: {
      rationale:
        "Descript records, transcribes, edits, and publishes in one product. ElevenLabs handles theme music and voice cleanup, replacing both a composer and a separate VO tool.",
      apps: [
        {
          appId: "descript",
          badges: [
            { emoji: "🎙️", label: "Record" },
            { emoji: "📝", label: "Transcribe" },
            { emoji: "✂️", label: "Edit" },
            { emoji: "📤", label: "Publish" },
          ],
          roles: [
            { emoji: "🎙️", label: "Recorder", tip: "Hit record in Descript with your guest — it captures multitrack audio and video natively." },
            { emoji: "📝", label: "Transcriber", tip: "Auto-transcription happens as you record; speaker labels are inferred and editable." },
            { emoji: "✂️", label: "Editor", tip: "Edit by editing text — remove ums with one click, and use Studio Sound to clean noise." },
            { emoji: "📤", label: "Publisher", tip: "Export to your hosting platform or use Descript's built-in podcast publishing flow." },
          ],
          monthlyCost: "$12–$24/mo (Creator/Pro covers most weekly shows)",
          freeTier: "limited",
        },
        {
          appId: "elevenlabs",
          badges: [
            { emoji: "🎵", label: "Theme" },
            { emoji: "🎤", label: "Voice" },
          ],
          roles: [
            { emoji: "🎵", label: "Theme Music", tip: "Generate intro and outro stings — try 'upbeat lo-fi intro, warm synths, 15 seconds, builds then resolves'." },
            { emoji: "🎤", label: "Voice Enhancement", tip: "Use Voice Isolator on noisy guest tracks, or clone your voice for ad reads you can re-record without a session." },
          ],
          monthlyCost: "$5–$22/mo depending on usage",
          freeTier: "limited",
        },
      ],
    },
  },
  {
    id: "build-app",
    label: "Build an app",
    emoji: "🛠️",
    description: "Design UI, generate code, build with an LLM, and ship.",
    steps: ["Design", "Generate Code", "Build", "Deploy"],
    appIds: [
      "chatgpt",
      "claude",
      "v0",
      "cursor",
      "github-copilot",
      "replit",
      "langchain",
      "vercel",
    ],
    minimumStack: {
      rationale:
        "Cursor handles writing, debugging, and explaining code with a built-in AI. ChatGPT covers planning, architecture, and product copy — the parts of building an app that aren't strictly coding.",
      apps: [
        {
          appId: "cursor",
          badges: [
            { emoji: "💻", label: "Code" },
            { emoji: "🐛", label: "Debug" },
            { emoji: "📖", label: "Explain" },
          ],
          roles: [
            { emoji: "💻", label: "Coder", tip: "Cmd+K to ask 'add an API route that fetches users from Supabase and renders a table.' Cursor edits multiple files at once." },
            { emoji: "🐛", label: "Debugger", tip: "Paste a stack trace into chat and ask 'why is this throwing and how do I fix it?'" },
            { emoji: "📖", label: "Explainer", tip: "Highlight unfamiliar code and Cmd+L 'Explain this in plain English' to ramp up on a new codebase." },
          ],
          monthlyCost: "$20/mo (Pro)",
          freeTier: "limited",
        },
        {
          appId: "chatgpt",
          badges: [
            { emoji: "🧠", label: "Plan" },
            { emoji: "🏗️", label: "Architect" },
            { emoji: "📝", label: "Copy" },
          ],
          roles: [
            { emoji: "🧠", label: "Planner", tip: "Ask: 'Walk me through MVP scope and a 2-week build plan for [your app idea].'" },
            { emoji: "🏗️", label: "Architect", tip: "Ask: 'Recommend a stack and data model for [feature]. Compare 2 approaches with tradeoffs.'" },
            { emoji: "📝", label: "Copywriter", tip: "Ask: 'Write the empty state, error messages, and onboarding copy for [feature].'" },
          ],
          monthlyCost: "$0–$20/mo (Plus is enough for most app builds)",
          freeTier: true,
        },
      ],
    },
  },
  {
    id: "social-content",
    label: "Create social content",
    emoji: "📱",
    description: "Captions, visuals, short video, voiceover, and a soundtrack.",
    steps: ["Script", "Visuals", "Video", "Voiceover", "Captions"],
    appIds: [
      "chatgpt",
      "jasper",
      "midjourney",
      "canva-ai",
      "runway",
      "pika",
      "elevenlabs",
      "captions",
    ],
    minimumStack: {
      rationale:
        "Canva AI's Magic Studio covers image generation, short video, post layout, and a built-in content scheduler. ChatGPT covers everything text — captions, hashtags, ideas, and strategy.",
      apps: [
        {
          appId: "canva-ai",
          badges: [
            { emoji: "🖼️", label: "Images" },
            { emoji: "🎬", label: "Video" },
            { emoji: "✏️", label: "Design" },
            { emoji: "📅", label: "Schedule" },
          ],
          roles: [
            { emoji: "🖼️", label: "Image Maker", tip: "Use Magic Media to generate visuals from text, or remix templates with your own brand kit." },
            { emoji: "🎬", label: "Video Editor", tip: "Drop clips into a Reel template; Canva handles aspect ratios for IG, TikTok, and YouTube Shorts." },
            { emoji: "✏️", label: "Designer", tip: "Magic Resize spits out feed, story, and carousel versions of one post in a click." },
            { emoji: "📅", label: "Scheduler", tip: "Use Content Planner to schedule posts directly to your social accounts from inside Canva." },
          ],
          monthlyCost: "$0–$15/mo (Pro unlocks Magic Studio fully)",
          freeTier: true,
        },
        {
          appId: "chatgpt",
          badges: [
            { emoji: "💬", label: "Captions" },
            { emoji: "#️⃣", label: "Hashtags" },
            { emoji: "💡", label: "Ideas" },
            { emoji: "📈", label: "Strategy" },
          ],
          roles: [
            { emoji: "💬", label: "Caption Writer", tip: "Ask: 'Write 5 caption variants for this post about [topic], each under 80 characters.'" },
            { emoji: "#️⃣", label: "Hashtag Picker", tip: "Ask: 'Suggest 12 hashtags for [niche] — mix high-volume and niche tags.'" },
            { emoji: "💡", label: "Idea Generator", tip: "Ask: 'Give me 20 short-form video ideas for [niche] in May, ranked by virality potential.'" },
            { emoji: "📈", label: "Strategist", tip: "Ask: 'Build me a 30-day posting plan for [audience] across IG, TikTok, and LinkedIn.'" },
          ],
          monthlyCost: "$0–$20/mo (Plus is plenty for content)",
          freeTier: true,
        },
      ],
    },
  },
  {
    id: "research",
    label: "Do research",
    emoji: "🔬",
    description: "Source, synthesize meeting notes, and write up findings.",
    steps: ["Search", "Synthesize", "Organize", "Write up"],
    appIds: ["perplexity", "chatgpt", "claude", "otter", "notion-ai", "grammarly"],
    minimumStack: {
      note: "Perplexity alone can handle most research tasks.",
      rationale:
        "Perplexity searches the live web, summarizes the answer, and cites every source — replacing search engines, an LLM, and a note-taking app for most research jobs.",
      apps: [
        {
          appId: "perplexity",
          badges: [
            { emoji: "🔍", label: "Search" },
            { emoji: "📝", label: "Summarize" },
            { emoji: "📚", label: "Cite" },
          ],
          roles: [
            { emoji: "🔍", label: "Searcher", tip: "Ask: 'What are the leading hypotheses about [topic] in 2025?' Perplexity searches the live web in seconds." },
            { emoji: "📝", label: "Summarizer", tip: "Each answer comes pre-summarized with the key points up top — no need to read 10 articles." },
            { emoji: "📚", label: "Citer", tip: "Every claim has a numbered citation. Click through to verify, or ask 'Find primary sources only.'" },
          ],
          monthlyCost: "$0–$20/mo (Pro unlocks more model choices)",
          freeTier: true,
        },
      ],
    },
  },
  {
    id: "presentation",
    label: "Make a presentation",
    emoji: "📊",
    description: "Outline, generate visuals, and assemble a polished deck.",
    steps: ["Outline", "Visuals", "Build Deck"],
    appIds: [
      "chatgpt",
      "midjourney",
      "dalle",
      "gamma",
      "beautiful-ai",
      "tome",
      "canva-ai",
    ],
    minimumStack: {
      note: "Gamma alone can take you from idea to finished slides in minutes.",
      rationale:
        "Gamma generates the outline, writes the slide content, picks visuals, and applies a polished design in one flow — replacing an LLM, a slide tool, and an image generator for most decks.",
      apps: [
        {
          appId: "gamma",
          badges: [
            { emoji: "📋", label: "Outline" },
            { emoji: "🎨", label: "Design" },
            { emoji: "✍️", label: "Write" },
          ],
          roles: [
            { emoji: "📋", label: "Outliner", tip: "Type a one-line prompt: 'A 10-slide pitch about [topic] for [audience]' — Gamma proposes the structure." },
            { emoji: "🎨", label: "Designer", tip: "Pick a theme; Gamma applies layouts, generates visuals, and balances the whitespace automatically." },
            { emoji: "✍️", label: "Writer", tip: "It writes the slide copy too — then ask 'Tighten every bullet to under 6 words.'" },
          ],
          monthlyCost: "$0–$15/mo (Pro removes the watermark)",
          freeTier: true,
        },
      ],
    },
  },
  {
    id: "write-book",
    label: "Write a Book",
    emoji: "✍️",
    description:
      "Research, draft, edit, design a cover, and pitch it — start to finish.",
    steps: ["Research", "Write", "Edit", "Design Cover", "Publish"],
    appIds: [
      "perplexity",
      "notion-ai",
      "chatgpt",
      "claude",
      "jasper",
      "copy-ai",
      "grammarly",
      "midjourney",
      "dalle",
      "adobe-firefly",
      "canva-ai",
      "gamma",
    ],
    // Top-to-bottom flow:
    //   Stage 1 — Research & Outline (top)
    //   Stage 2 — Writing (middle, 2 sub-rows for 5 apps)
    //   Stage 3 — Cover Design (bottom-left, 2x2)
    //   Stage 4 — Publishing & Pitch (bottom-right)
    stages: [
      {
        label: "Research & Outline",
        apps: [
          { id: "perplexity", x: 140, y: 30 },
          { id: "notion-ai", x: 340, y: 30 },
        ],
      },
      {
        label: "Writing",
        apps: [
          { id: "chatgpt", x: 10, y: 160 },
          { id: "claude", x: 220, y: 160 },
          { id: "jasper", x: 430, y: 160 },
          { id: "copy-ai", x: 110, y: 270 },
          { id: "grammarly", x: 320, y: 270 },
        ],
      },
      {
        label: "Cover Design",
        apps: [
          { id: "midjourney", x: 10, y: 390 },
          { id: "dalle", x: 200, y: 390 },
          { id: "adobe-firefly", x: 10, y: 500 },
          { id: "canva-ai", x: 200, y: 500 },
        ],
      },
      {
        label: "Publishing & Pitch",
        apps: [{ id: "gamma", x: 430, y: 445 }],
      },
    ],
    minimumStack: {
      rationale:
        "ChatGPT covers research, drafting, and editing in one tool. Canva AI handles cover design and any visual polish — together they take you from blank page to printable book.",
      apps: [
        {
          appId: "chatgpt",
          badges: [
            { emoji: "✍️", label: "Write" },
            { emoji: "🔍", label: "Research" },
          ],
          roles: [
            { emoji: "✍️", label: "Writer", tip: "Ask: 'Write chapter 1 of my mystery novel based on this outline: [paste outline].'" },
            { emoji: "🔍", label: "Researcher", tip: "Ask: 'Find 5 historical facts about 1920s Paris I can use in my novel.'" },
            { emoji: "📝", label: "Editor", tip: "Ask: 'Review this chapter for pacing, clarity, and consistency with the characters.'" },
          ],
          monthlyCost: "$0–$20/mo (Plus is plenty for a full manuscript)",
          freeTier: true,
        },
        {
          appId: "canva-ai",
          badges: [
            { emoji: "🎨", label: "Cover" },
            { emoji: "✏️", label: "Edit" },
          ],
          roles: [
            { emoji: "🎨", label: "Cover Designer", tip: "Pick a book-cover template, drop in a Magic Media-generated image, then edit the title typography." },
            { emoji: "✏️", label: "Visual Editor", tip: "Magic Edit removes blemishes, swaps backgrounds, and adjusts colors with a single prompt." },
          ],
          monthlyCost: "$0–$15/mo (Pro for full templates)",
          freeTier: true,
        },
      ],
    },
  },
  {
    id: "teach-class",
    label: "Teach a Class",
    emoji: "🎓",
    description: "Plan, build slides, record lectures, and share notes with students.",
    steps: ["Plan", "Slides", "Record", "Transcribe", "Share"],
    appIds: ["chatgpt", "gamma", "canva-ai", "otter", "notion-ai"],
    minimumStack: {
      rationale: "Gamma builds slides from a prompt. ChatGPT handles lesson plans, quiz questions, and explanations students can re-read.",
      apps: [
        { appId: "gamma", badges: [{ emoji: "🎨", label: "Slides" }, { emoji: "📋", label: "Outline" }], roles: [
          { emoji: "🎨", label: "Slide Builder", tip: "Type 'Build a 12-slide lesson on the water cycle for 5th graders' and Gamma generates everything." },
          { emoji: "📋", label: "Lesson Designer", tip: "Pick a theme that matches your curriculum and re-export to PDF or PowerPoint." },
        ], monthlyCost: "$0–$20/mo", freeTier: true },
        { appId: "chatgpt", badges: [{ emoji: "📚", label: "Plan" }, { emoji: "❓", label: "Quiz" }], roles: [
          { emoji: "📚", label: "Lesson Planner", tip: "Ask: 'Build me a 50-minute lesson plan on photosynthesis for 5th graders with a hands-on activity.'" },
          { emoji: "❓", label: "Quiz Writer", tip: "Ask: 'Write 10 multiple-choice questions covering this lesson, mixing easy and hard.'" },
        ], monthlyCost: "$0–$20/mo", freeTier: true },
      ],
    },
  },
  {
    id: "social-grow",
    label: "Grow on Social Media",
    emoji: "📱",
    description: "Ideate, design, animate, voice — and post on a cadence.",
    steps: ["Ideate", "Design", "Video", "Voice", "Post"],
    appIds: ["chatgpt", "canva-ai", "runway", "pika", "elevenlabs"],
    minimumStack: {
      rationale: "Canva AI generates images, edits short video, and posts on a schedule. ChatGPT handles ideation, captions, and hashtags.",
      apps: [
        { appId: "canva-ai", badges: [{ emoji: "🖼️", label: "Design" }, { emoji: "🎬", label: "Video" }, { emoji: "📅", label: "Post" }], roles: [
          { emoji: "🖼️", label: "Designer", tip: "Pick a Reel template, drop in your visuals, and Canva sizes them for IG, TikTok, and Shorts." },
          { emoji: "🎬", label: "Video Editor", tip: "Trim and stitch clips on Canva's timeline; Magic Resize handles aspect ratios." },
          { emoji: "📅", label: "Scheduler", tip: "Use Content Planner to queue posts across platforms from one calendar." },
        ], monthlyCost: "$0–$15/mo", freeTier: true },
        { appId: "chatgpt", badges: [{ emoji: "💡", label: "Ideas" }, { emoji: "💬", label: "Captions" }], roles: [
          { emoji: "💡", label: "Idea Engine", tip: "Ask: 'Give me 20 short-form video ideas for a fitness coach in May, ranked by virality.'" },
          { emoji: "💬", label: "Caption Writer", tip: "Ask: 'Write 5 hooks under 80 characters for this clip about morning routines.'" },
        ], monthlyCost: "$0–$20/mo", freeTier: true },
      ],
    },
  },
  {
    id: "produce-song",
    label: "Produce a Song",
    emoji: "🎵",
    description: "Compose, add vocals, mix, and master a finished track.",
    steps: ["Compose", "Vocals", "Mix", "Master"],
    appIds: ["suno", "elevenlabs", "descript", "assemblyai"],
    minimumStack: {
      note: "Suno alone can generate a complete vocal song from a prompt.",
      rationale: "Suno generates instrumentals and vocals together. For most demos, you don't need anything else — Suno is the studio.",
      apps: [
        { appId: "suno", badges: [{ emoji: "🎼", label: "Compose" }, { emoji: "🎤", label: "Vocals" }, { emoji: "🎚️", label: "Mix" }], roles: [
          { emoji: "🎼", label: "Composer", tip: "Type 'Upbeat indie pop, acoustic guitar, female vocals, 90 bpm, 2 minutes' — Suno writes lyrics and music together." },
          { emoji: "🎤", label: "Vocalist", tip: "Re-prompt for vocal styles: 'same song, breathy female vocal, slightly slower.'" },
          { emoji: "🎚️", label: "Mixer", tip: "Download stems for further mixing — vocals, drums, and instruments arrive on separate tracks." },
        ], monthlyCost: "$0–$30/mo", freeTier: true },
      ],
    },
  },
  {
    id: "online-store",
    label: "Start an Online Store",
    emoji: "🛍️",
    description: "Brand, write product copy, design assets, and pitch your store.",
    steps: ["Brand", "Copy", "Design", "Pitch"],
    appIds: ["chatgpt", "jasper", "copy-ai", "canva-ai", "gamma"],
    minimumStack: {
      rationale: "Canva AI handles brand, product photos, ads, and store visuals. ChatGPT covers naming, descriptions, ad copy, and a pitch deck.",
      apps: [
        { appId: "canva-ai", badges: [{ emoji: "🎨", label: "Brand" }, { emoji: "🖼️", label: "Assets" }, { emoji: "📊", label: "Pitch" }], roles: [
          { emoji: "🎨", label: "Brand Designer", tip: "Use Magic Studio to generate logos, color palettes, and a brand kit in minutes." },
          { emoji: "🖼️", label: "Asset Maker", tip: "Generate product backgrounds, ad creatives, and IG carousels from one set of templates." },
          { emoji: "📊", label: "Deck Builder", tip: "Drop your store info into a pitch deck template for investors or marketplace applications." },
        ], monthlyCost: "$0–$15/mo", freeTier: true },
        { appId: "chatgpt", badges: [{ emoji: "📝", label: "Copy" }, { emoji: "💡", label: "Names" }], roles: [
          { emoji: "📝", label: "Copywriter", tip: "Ask: 'Write 50 product descriptions for this list, each under 60 words, with SEO keywords.'" },
          { emoji: "💡", label: "Brand Namer", tip: "Ask: 'Suggest 20 brand names for a sustainable home goods store, available .com domains preferred.'" },
        ], monthlyCost: "$0–$20/mo", freeTier: true },
      ],
    },
  },
  {
    id: "report-deck",
    label: "Build a Report or Pitch Deck",
    emoji: "📊",
    description: "Research, outline, design, and deliver a compelling deck.",
    steps: ["Research", "Outline", "Design", "Present"],
    appIds: ["perplexity", "chatgpt", "gamma", "canva-ai", "beautiful-ai", "tome"],
    minimumStack: {
      rationale: "Perplexity researches with citations. Gamma turns the research into a polished deck in one prompt — covering outline, design, and copy.",
      apps: [
        { appId: "perplexity", badges: [{ emoji: "🔍", label: "Research" }, { emoji: "📚", label: "Cite" }], roles: [
          { emoji: "🔍", label: "Researcher", tip: "Ask: 'Summarize the EV market in 2025 with 5 key stats and citations.'" },
          { emoji: "📚", label: "Sourcing", tip: "Click into each numbered citation to verify and pull primary sources for the appendix." },
        ], monthlyCost: "$0–$20/mo", freeTier: true },
        { appId: "gamma", badges: [{ emoji: "📋", label: "Outline" }, { emoji: "🎨", label: "Design" }, { emoji: "✍️", label: "Write" }], roles: [
          { emoji: "📋", label: "Outliner", tip: "Paste your research and ask: 'Build a 10-slide investor deck with our market, product, traction, and ask.'" },
          { emoji: "🎨", label: "Designer", tip: "Pick a theme; Gamma applies layout, generates visuals, and balances whitespace." },
          { emoji: "✍️", label: "Writer", tip: "Then prompt: 'Tighten every bullet to under 8 words.'" },
        ], monthlyCost: "$0–$20/mo", freeTier: true },
      ],
    },
  },
  {
    id: "translate-localize",
    label: "Translate & Localize Content",
    emoji: "🌍",
    description: "Translate, voice over, sync, and publish in another language.",
    steps: ["Translate", "Voice", "Sync", "Publish"],
    appIds: ["chatgpt", "claude", "elevenlabs", "assemblyai", "whisper", "descript"],
    minimumStack: {
      rationale: "ChatGPT translates and adapts the script. ElevenLabs voices the result with native-sounding inflection in 30+ languages.",
      apps: [
        { appId: "chatgpt", badges: [{ emoji: "🌐", label: "Translate" }, { emoji: "🪄", label: "Localize" }], roles: [
          { emoji: "🌐", label: "Translator", tip: "Paste source script and ask: 'Translate this to Brazilian Portuguese, keeping jokes and casual tone.'" },
          { emoji: "🪄", label: "Localizer", tip: "Ask: 'Adapt cultural references and metaphors for a Tokyo audience.'" },
        ], monthlyCost: "$0–$20/mo", freeTier: true },
        { appId: "elevenlabs", badges: [{ emoji: "🎤", label: "Voice" }, { emoji: "🔊", label: "Dub" }], roles: [
          { emoji: "🎤", label: "Voice Over", tip: "Pick a voice from the multilingual library and paste your translated script." },
          { emoji: "🔊", label: "Dubbing", tip: "Use the Dubbing Studio to lip-sync the new audio onto the original video." },
        ], monthlyCost: "$0–$22/mo", freeTier: true },
      ],
    },
  },
  {
    id: "ai-chatbot",
    label: "Build an AI Chatbot",
    emoji: "🤖",
    description: "Design, train, connect to data, deploy, and test a chatbot.",
    steps: ["Design", "Train", "Connect Data", "Deploy", "Test"],
    appIds: ["chatgpt", "claude", "langchain", "pinecone", "replit", "huggingface"],
    minimumStack: {
      rationale: "An LLM API plus LangChain covers prompts, tools, retrieval, and observability. That's the entire chatbot stack for v1.",
      apps: [
        { appId: "chatgpt", badges: [{ emoji: "🧠", label: "LLM" }, { emoji: "📝", label: "Prompts" }], roles: [
          { emoji: "🧠", label: "Reasoning Engine", tip: "Use the OpenAI API for chat completions; start with gpt-4o-mini for cost." },
          { emoji: "📝", label: "Prompt Designer", tip: "Iterate the system prompt in ChatGPT first — it's faster than redeploying every change." },
        ], monthlyCost: "Pay-as-you-go (~$5–50/mo light traffic)", freeTier: true },
        { appId: "langchain", badges: [{ emoji: "🔗", label: "Glue" }, { emoji: "🧪", label: "Eval" }], roles: [
          { emoji: "🔗", label: "Orchestrator", tip: "Wire your LLM, vector store, and tools together with chains and agents." },
          { emoji: "🧪", label: "Observer", tip: "Use LangSmith to trace every prompt and tool call when something goes wrong." },
        ], monthlyCost: "$0–$39/mo (LangSmith free for individuals)", freeTier: true },
      ],
    },
  },
  {
    id: "photo-shoot",
    label: "Create a Photo Shoot",
    emoji: "📸",
    description: "Concept, generate, edit, brand, and export — without a studio.",
    steps: ["Concept", "Generate", "Edit", "Brand", "Export"],
    appIds: ["midjourney", "dalle", "adobe-firefly", "stable-diffusion", "canva-ai"],
    minimumStack: {
      rationale: "Midjourney generates photo-real shots with directable style. Canva AI handles brand overlays and exports for every platform.",
      apps: [
        { appId: "midjourney", badges: [{ emoji: "📷", label: "Generate" }, { emoji: "🎨", label: "Style" }], roles: [
          { emoji: "📷", label: "Photographer", tip: "Prompt: 'Editorial fashion photo, golden hour, 35mm, model in linen suit, beach background --ar 4:5'." },
          { emoji: "🎨", label: "Style Director", tip: "Lock the look across the shoot with --sref so every shot reads as one campaign." },
        ], monthlyCost: "$10–$60/mo", freeTier: false },
        { appId: "canva-ai", badges: [{ emoji: "🖌️", label: "Brand" }, { emoji: "📦", label: "Export" }], roles: [
          { emoji: "🖌️", label: "Brand Layer", tip: "Drop the shot into your brand kit template, add product info and CTA." },
          { emoji: "📦", label: "Exporter", tip: "Magic Resize spits out IG, web hero, and print-ready versions in one click." },
        ], monthlyCost: "$0–$15/mo", freeTier: true },
      ],
    },
  },
];

export function getUseCaseById(id: string | null | undefined): UseCase | null {
  if (!id) return null;
  return USE_CASES.find((u) => u.id === id) ?? null;
}

// Per-use-case role descriptions. Tells the user what an app does in this stack.
const APP_ROLES: Record<string, Record<string, string>> = {
  animation: {
    midjourney: "Concept artist — paints the look and key frames the rest of the stack animates.",
    "adobe-firefly": "Asset finisher — cleans plates and prepares commercial-safe images for animation.",
    runway: "Video engine — turns Midjourney stills into motion clips and handles cuts.",
    pika: "Short-shot specialist — quick effects, lip sync, and stylized clips.",
    kling: "Long-shot model — high-fidelity sequences with strong physics.",
    elevenlabs: "Voice — narration, character lines, and dubbed dialogue.",
    suno: "Score — generates the soundtrack and stings.",
    descript: "Editor — assembles clips and audio on a transcript-based timeline.",
  },
  podcast: {
    elevenlabs: "Voice — generate intros, ads, or stand-in narration.",
    descript: "Editor — edit by editing the transcript, including ums and filler.",
    otter: "Live transcription — captures the conversation in real time.",
    assemblyai: "Speech analysis — diarization, summaries, and chapter markers.",
    suno: "Score — theme music and bumpers between segments.",
  },
  "build-app": {
    chatgpt: "Pair thinker — sketches architecture, debugs ideas, drafts copy.",
    claude: "Long-context coder — reads large files end to end and edits them.",
    v0: "UI generator — produces React + Tailwind components from prompts.",
    cursor: "AI editor — multi-file edits and applies generated code at scale.",
    "github-copilot": "Inline autocomplete — accelerates the keystrokes.",
    replit: "Browser IDE — agent that builds and previews the app.",
    langchain: "LLM glue — wires models, tools, and retrieval into your backend.",
    vercel: "Deployment — ships the built app to a global edge.",
  },
  "social-content": {
    chatgpt: "Scriptwriter — hooks, captions, hashtags.",
    jasper: "Brand voice — on-brand marketing copy at scale.",
    midjourney: "Visual style — stylized stills for thumbnails and feed.",
    "canva-ai": "Layout — assembles posts, carousels, and thumbnails.",
    runway: "Video engine — cinematic clips and cuts.",
    pika: "Short clips — quick, punchy formats for Reels and TikTok.",
    elevenlabs: "Voiceover — narration and character voices.",
    captions: "Caption + polish — auto-captions, eye-contact, and clip generation.",
  },
  research: {
    perplexity: "Source finder — surfaces and cites the best web evidence.",
    chatgpt: "Synthesizer — distills long source lists into coherent arguments.",
    claude: "Long-doc reader — analyzes whole papers and reports.",
    otter: "Interview capture — records and transcribes conversations.",
    "notion-ai": "Workspace — organize sources, notes, and chapters.",
    grammarly: "Polish — final pass for clarity and tone.",
  },
  presentation: {
    chatgpt: "Outline — structure and talking points.",
    midjourney: "Visuals — hero images and section dividers.",
    dalle: "Visuals — fast iterations of slide imagery.",
    gamma: "Auto-deck — generates a polished deck from your outline.",
    "beautiful-ai": "Smart slides — auto-layouts for business decks.",
    tome: "Sales-flavored — go-to-market and pitch decks.",
    "canva-ai": "Brand polish — fine-tune layout, fonts, and exports.",
  },
  "write-book": {
    perplexity: "Research engine — pulls cited sources as you draft each chapter.",
    "notion-ai": "Workspace — organize research, chapter outlines, and beats.",
    chatgpt: "Drafter — brainstorms ideas, expands outlines, writes scenes.",
    claude: "Long-form drafter — keeps tone and continuity across long chapters.",
    jasper: "Copy specialist — back-cover copy, blurbs, and marketing snippets.",
    "copy-ai": "Variations — alternate hooks, summaries, and chapter titles.",
    grammarly: "Polish — grammar, tone, and consistency pass.",
    midjourney: "Cover concepts — generates evocative cover art directions.",
    dalle: "Cover concepts — quick iterations and alternates.",
    "adobe-firefly": "Cover finisher — commercial-safe edits and refinements.",
    "canva-ai": "Cover layout — title typography and final composition.",
    gamma: "Pitch deck — proposal slides for agents and publishers.",
  },
  "teach-class": {
    chatgpt: "Lesson planner — outlines, quizzes, and student-facing explanations.",
    gamma: "Slide builder — turns a lesson outline into a polished deck instantly.",
    "canva-ai": "Visuals — handouts, posters, and infographics for the classroom.",
    otter: "Lecture transcriber — captures the live recording and notes.",
    "notion-ai": "Class wiki — share notes, assignments, and reading lists.",
  },
  "social-grow": {
    chatgpt: "Idea engine — hooks, captions, hashtags, and a posting cadence.",
    "canva-ai": "Designer — feed posts, carousels, and short-video templates.",
    runway: "Cinematic clips — animate hero stills into scroll-stopping motion.",
    pika: "Quick clips — short, punchy formats for Reels and TikTok.",
    elevenlabs: "Voiceover — narration in seconds, no studio needed.",
  },
  "produce-song": {
    suno: "Studio in a box — instrumental, vocals, and a finished track from one prompt.",
    elevenlabs: "Vocal effects — alternate vocal styles and ad-libs.",
    descript: "Mixer — edit your stems on a transcript-based timeline.",
    assemblyai: "Lyric extraction — transcribe vocals if you need a printable lyric sheet.",
  },
  "online-store": {
    chatgpt: "Brand naming and copy at scale — descriptions, ads, FAQs.",
    jasper: "On-brand marketing copy across product pages and ad sets.",
    "copy-ai": "Variations — alternate hooks, ad headlines, and chapter titles.",
    "canva-ai": "Brand kit, product photos, ads, and storefront templates.",
    gamma: "Pitch deck for marketplaces, investors, and partner decks.",
  },
  "report-deck": {
    perplexity: "Research with citations you can actually paste into the appendix.",
    chatgpt: "Outline and synthesis from a pile of sources.",
    gamma: "One-prompt deck generator — outline, design, and copy in 30 seconds.",
    "canva-ai": "Brand polish, magic resize, and printable exports.",
    "beautiful-ai": "Smart layouts that auto-balance text and charts for execs.",
    tome: "Sales-flavored decks for outbound and partner pitches.",
  },
  "translate-localize": {
    chatgpt: "Translator and cultural adapter — keeps tone and intent intact.",
    claude: "Long-doc translator — handles entire manuals end to end.",
    elevenlabs: "Multilingual voice with native-sounding inflection.",
    assemblyai: "Source transcription — pull text out of original-language audio.",
    whisper: "Self-hostable transcription for offline or compliance work.",
    descript: "Stitches translated voice back into the original video.",
  },
  "ai-chatbot": {
    chatgpt: "Reasoning model — call the OpenAI API for chat completions.",
    claude: "Long-context model — read whole knowledge bases per turn.",
    langchain: "Orchestration — chains, tools, retrieval, and observability.",
    pinecone: "Vector memory — power RAG with millisecond similarity search.",
    replit: "Build and host the chatbot's backend in the browser.",
    huggingface: "Open-model alternatives and small models for cheap inference.",
  },
  "photo-shoot": {
    midjourney: "Photographer — directable, photo-real shots with locked style.",
    dalle: "Quick iterations on concepts inside ChatGPT.",
    "adobe-firefly": "Commercial-safe touch-ups and Generative Fill for cleanup.",
    "stable-diffusion": "Custom fine-tunes when you need an exact look at scale.",
    "canva-ai": "Brand layer, exports, and printable layouts.",
  },
};

const GENERIC_ROLE_BY_CATEGORY: Record<string, string> = {
  "Text & Writing": "drafts and refines written content for the project.",
  "Image & Art": "generates visuals and concept art.",
  Video: "produces and edits video clips.",
  "Audio & Music": "creates voice, music, or transcription.",
  Coding: "helps generate, edit, or ship code.",
  Productivity: "organizes work, calendars, and tasks.",
  Research: "finds, cites, and synthesizes sources.",
  "Data & Analytics": "powers data, models, or RAG behind the scenes.",
  "Avatar & Meetings": "captures meetings or generates presenter video.",
  "3D & Design": "designs decks, layouts, and 3D assets.",
};

export function getAppRole(
  appId: string,
  category: string,
  appName: string,
  useCaseId: string | null | undefined,
): string {
  if (useCaseId) {
    const role = APP_ROLES[useCaseId]?.[appId];
    if (role) return role;
  }
  const generic = GENERIC_ROLE_BY_CATEGORY[category];
  return generic ? `${appName} ${generic}` : appName;
}

// Use-case-specific "Try this" examples — short, friendly, action-first.
const APP_EXAMPLES: Record<string, Record<string, string>> = {
  "write-book": {
    perplexity:
      "Stuck on historical accuracy? Ask Perplexity 'What did people eat in 1920s Paris cafés?' or 'How does forensic toxicology actually work?' Every answer comes with sources, so you can confidently drop real details into your scenes.",
    "notion-ai":
      "Make a Notion page per chapter, then ask Notion AI 'Summarize the plot beats across chapters 1–5' or 'Find inconsistencies in my character timeline.' It searches your whole workspace, so notes stop falling through the cracks.",
    chatgpt:
      "Start by asking ChatGPT: 'Help me outline a mystery novel set in 1920s Paris with a female detective.' You'll get chapter breakdowns, character ideas, and plot twists. Then say 'Write chapter 1 in a suspenseful tone' to draft from your outline.",
    claude:
      "Paste a full chapter into Claude and say 'Rewrite this scene to feel slow and tense — keep my voice.' Because Claude reads the whole chapter, edits stay consistent and dialogue doesn't drift out of character.",
    jasper:
      "When the manuscript is done, switch to Jasper for marketing copy. Try: 'Write 5 short hooks for a 1920s Paris mystery aimed at fans of Agatha Christie.' It nails the back-cover voice without sounding cheesy.",
    "copy-ai":
      "Use Copy.ai to brainstorm chapter titles. Paste a chapter summary and ask 'Give me 10 short, intriguing chapter title options.' Pick the best, tweak, repeat — way faster than staring at a blank page.",
    grammarly:
      "Run every chapter through Grammarly before sending to beta readers. Set the goal to 'Engaging' and your voice to match the genre. It catches the repeated words you stop seeing after the third pass.",
    midjourney:
      "Prompt your cover with mood and genre, e.g. '1920s Paris mystery novel cover, art deco, smoky café, moody lighting, cinematic --ar 2:3'. Generate a few directions before committing — covers really do sell books.",
    dalle:
      "Inside ChatGPT, ask DALL·E for cover variations: 'Generate 4 different style directions for a literary fiction cover about loss and family — minimal, painterly, photographic, abstract.' Quick way to test what fits before paying a designer.",
    "adobe-firefly":
      "Take your favorite Midjourney concept into Firefly and use Generative Fill to clean edges, swap backgrounds, or extend to a full wraparound. Outputs are commercial-safe, so you can sell the book without licensing worries.",
    "canva-ai":
      "Drop your final cover image into Canva and let Magic Studio handle the title typography. Start from a book-cover template — they nail the proportions that look sharp on Amazon thumbnails.",
    gamma:
      "When you're pitching agents, ask Gamma 'Generate a 6-slide book proposal for a 90,000-word historical mystery set in 1920s Paris.' You get a polished deck in seconds; just tweak the comp titles and audience slides.",
  },
  animation: {
    midjourney:
      "Generate your character sheet and key frames first. Try: 'Cute robot mascot, friendly, vector style, white background --ar 1:1'. Lock the look with --sref later so every frame feels like it lives in the same world.",
    "adobe-firefly":
      "Use Firefly to clean backgrounds and prep plates. Generative Fill is great for removing logos or extending an image to widescreen, so Runway has more canvas to animate into.",
    runway:
      "Drop a Midjourney still into Runway's Image-to-Video and prompt 'Slow camera push-in, character looks up, leaves blow past.' Generate three takes — usually one nails the motion you imagined.",
    pika:
      "Pika is great for short, punchy beats. Upload an image and say 'lip sync to this audio' with your ElevenLabs file — it handles mouth movements better than you'd expect for a 5-second clip.",
    kling:
      "Reach for Kling when you need longer, physically realistic shots. Try 'A glass of water tipping over in slow motion on a marble counter.' Its physics engine handles fluids and weight much better than the alternatives.",
    elevenlabs:
      "Write your narration in ChatGPT, then paste it into ElevenLabs and pick a voice that fits the tone. Save the voice ID — you'll want consistency across every clip in the animation.",
    suno:
      "Type a vibe and a tempo: 'cinematic orchestral build, hopeful, 90 bpm, 30 seconds.' Generate a few options, pick the one that fits the climax, and download stems so you can duck the music under voiceover.",
    descript:
      "Pull all your Runway clips, ElevenLabs voice, and Suno music into Descript. Edit by editing the transcript — say 'remove all the ums' and it cuts them. Way faster than scrubbing a timeline.",
  },
  podcast: {
    elevenlabs:
      "Write your intro and outro in ChatGPT, then paste into ElevenLabs and clone your own voice (or pick a host you like). Now you can re-record cleanly any time you fix a typo — no studio required.",
    descript:
      "Drop your raw recording into Descript. It transcribes everything; delete words and ums by deleting text. Hit Studio Sound to clean echo and noise — sounds like a $300 mic upgrade in one click.",
    otter:
      "Have Otter join the call and let it transcribe live. Afterwards you get speaker-labeled notes and an action-item summary — paste it straight into your show notes.",
    assemblyai:
      "If you want chapter markers and topic tags generated automatically, run your final episode through AssemblyAI's API. Listeners love being able to jump to a specific topic in the feed.",
    suno:
      "Generate your theme song from a prompt like 'upbeat lo-fi intro, warm synths, 15 seconds, builds then resolves.' Save the song — you can spin variations for special episodes without rehiring a composer.",
  },
  "build-app": {
    chatgpt:
      "Architect before you code. Ask: 'I want a habit tracker with auth, daily reminders, and a streak system. Walk me through the data model and tech stack.' That conversation saves you a week of redesigns.",
    claude:
      "Paste a whole file into Claude and say 'Refactor this for readability, but don't change behavior.' Because of long context it actually understands the file before editing — fewer broken imports than the alternatives.",
    v0:
      "Describe a UI in plain English: 'Sign-up form with email, password, OAuth buttons for Google and GitHub, dark mode.' v0 returns clean React + Tailwind you can paste straight into your project.",
    cursor:
      "After v0 gives you a component, hit Cmd+K in Cursor and say 'Wire this to my Supabase auth and add loading states.' It edits multiple files at once and shows the diff before applying.",
    "github-copilot":
      "Treat Copilot as a faster keyboard, not a code generator. Type the function signature and let it finish the boilerplate. Best ROI is on tests and the dull plumbing you'd normally avoid.",
    replit:
      "Need a backend running in 30 seconds? Open Replit and ask the agent 'Build me an Express API with endpoints for users, posts, and comments using SQLite.' It scaffolds, runs, and gives you a public URL.",
    langchain:
      "Wiring up an AI feature? Use LangChain to glue your LLM, vector DB, and tools together. The LangSmith dashboard shows every prompt and tool call, so you can see exactly why an agent went sideways.",
    vercel:
      "Push to GitHub and import the repo on Vercel — that's it, you have a global URL. For AI features, drop in the AI SDK and Vercel handles streaming, edge runtime, and analytics out of the box.",
  },
  "social-content": {
    chatgpt:
      "Ask ChatGPT 'Give me 5 hook variations for a 30-second TikTok about morning routines for new parents.' Test them in the first 3 seconds of your video — engagement is decided before the caption is even read.",
    jasper:
      "Set up your brand voice in Jasper once, then ask 'Write 7 caption variants for our spring campaign in Brand Voice.' Saves the back-and-forth of training every prompt to sound like you.",
    midjourney:
      "Style your feed by locking a vibe with --sref. Generate one hero image you love, grab its style ref, then use it on every future post — your grid feels intentional even with different subjects.",
    "canva-ai":
      "Drop your Midjourney visuals into Canva, pick a 'Reels cover' template, and use Magic Resize to spit out IG, TikTok, and YouTube Shorts versions in one click. Saves the whole export-and-resize chore.",
    runway:
      "When a still won't cut through, animate it. Take your hero image into Runway and prompt 'subtle parallax zoom, 5 seconds, soft motion.' Punchy, scroll-stopping, and only takes a minute.",
    pika:
      "For quick character clips, upload a photo and say 'add a thumbs up and a wink, 3 seconds.' Pika handles short character motion better than the heavier video models — perfect for meme-y reactions.",
    elevenlabs:
      "Record once, voiceover everywhere. Type your caption, pick a voice, and you have audio for Reels and TikTok in seconds. Pair with Captions to add subtitles automatically.",
    captions:
      "Drop your raw clip into Captions and toggle 'Eye Contact' so you're always facing camera, even when you glance at notes. Auto-generated word-by-word subs in your brand color — ready to post.",
  },
  research: {
    perplexity:
      "Start broad: 'What are the leading hypotheses about [your topic] in 2025?' Then click into each cited source to verify. Faster than juggling 20 Google tabs and you keep an audit trail.",
    chatgpt:
      "Once you've gathered sources, paste your notes into ChatGPT and say 'Synthesize these into 3 main arguments with supporting evidence.' It clusters ideas you didn't notice were connected.",
    claude:
      "Drop a 60-page PDF into Claude and ask 'Summarize the methodology and tell me where the authors caveat their findings.' You'll know in 30 seconds whether it's worth a deeper read.",
    otter:
      "Recording an expert interview? Let Otter join the call. Afterwards you get the transcript, speaker labels, and a topic outline — much easier to pull quotes than rewatching the recording.",
    "notion-ai":
      "Build a Notion database for sources with columns for 'Topic', 'Author', 'Key Quote', and 'Strength'. Then ask Notion AI 'Find all sources arguing against [hypothesis]' and it pulls them in seconds.",
    grammarly:
      "Run your final write-up through Grammarly with the goal set to 'Inform' or 'Convince'. It tightens passive voice and flags weak claims you didn't notice across paragraphs.",
  },
  presentation: {
    chatgpt:
      "Before opening any slide tool, ask ChatGPT 'Outline a 10-slide pitch about [topic] for [audience].' Get the story right first — slides are easy once you know the narrative.",
    midjourney:
      "Use Midjourney for one or two hero images, not all 10 slides. Try '--ar 16:9 cinematic photo of [your concept]' to get widescreen images that fit slide proportions without awkward cropping.",
    dalle:
      "Need a quick illustration for a slide title? Ask DALL·E inside ChatGPT: 'Flat vector illustration of a person solving a puzzle, on white background.' Three iterations and you've got something usable.",
    gamma:
      "Paste your outline into Gamma and pick a theme. It generates a polished deck in 30 seconds. Then trim the AI's tendency to write paragraphs — keep it to ~6 words per bullet.",
    "beautiful-ai":
      "If your deck is for execs or sales, use Beautiful.ai's smart templates — they auto-balance text and charts so nothing looks lopsided. Type your bullets and it nails the spacing for you.",
    tome:
      "Tome shines when your deck is part of an outbound sales sequence. Generate a personalized deck per prospect, share via link, and see who actually opened it. Real signal beats 'just sent over the deck.'",
    "canva-ai":
      "When the deck is solid but the brand looks off, drop it into Canva and use Magic Switch to apply your brand kit. One click and every font, color, and logo is consistent.",
  },
  "teach-class": {
    chatgpt: "Ask: 'Build a 50-minute lesson plan on photosynthesis for 5th graders with one hands-on activity and a 5-question quiz.' You'll have your week's prep done in 10 minutes.",
    gamma: "Paste your lesson outline and ask 'Make a 12-slide presentation with student-friendly visuals.' Then use Present Mode in class — Gamma syncs to a tablet so you can walk around.",
    "canva-ai": "Pick a 'worksheet' template and let Magic Write fill in the content from your lesson plan. Print as PDF — your students get the same visuals they saw on the board.",
    otter: "Have Otter join your class via Zoom or run the mobile app on your desk. Students get accurate notes for review, and you get a transcript for assessment evidence.",
    "notion-ai": "Build a class page per week, then ask 'Summarize what we covered in week 4 and list the assignments due.' Great for student catch-ups and parent updates.",
  },
  "social-grow": {
    chatgpt: "Ask: 'Give me 20 short-form video ideas for [niche] in May, ranked by virality and easy to film at home.' Pick 4, batch-shoot in one day.",
    "canva-ai": "Open the Reels template, drop in your visuals, and use Magic Resize to spit out IG, TikTok, and YouTube Shorts versions in one click.",
    runway: "Take a hero photo and prompt: 'subtle parallax push-in, 5 seconds, soft motion.' Punchy, scroll-stopping clip in under a minute.",
    pika: "For meme-y posts, upload a photo and prompt 'add a thumbs up and wink, 3 seconds.' Pika handles small character motion better than the big models.",
    elevenlabs: "Paste your caption, pick a voice, download the audio. Pair with Captions to autogenerate subtitles for silent autoplay feeds.",
  },
  "produce-song": {
    suno: "Type 'Upbeat indie pop, acoustic guitar, female vocals, 90 bpm, 2 minutes.' Suno writes lyrics, music, and vocals together. Re-prompt for variations until it lands.",
    elevenlabs: "Use ElevenLabs Voice for ad-libs and alternate vocal styles you can layer over the Suno track.",
    descript: "Pull the song stems into Descript, edit on the transcript, and add intros or outros for podcast or YouTube use.",
    assemblyai: "Run vocals through AssemblyAI to get a clean lyric sheet you can publish or print in liner notes.",
  },
  "online-store": {
    chatgpt: "Ask: 'Suggest 20 brand names for a sustainable home goods store, available .com domains preferred. Then write 3 product descriptions for [item] under 60 words.'",
    jasper: "Set up your Brand Voice once, then ask 'Write 7 ad variants for our spring drop in Brand Voice.' Saves training every prompt to sound like you.",
    "copy-ai": "Use Copy.ai workflows to spin out 10 product description variants at a time. Pick the strongest and tweak.",
    "canva-ai": "Use Magic Studio to generate product backgrounds, logo concepts, and ad creatives. Magic Resize handles every platform's dimensions.",
    gamma: "When applying to retail partners or marketplaces, ask Gamma 'Build a 6-slide brand deck with our story, products, and traction.'",
  },
  "report-deck": {
    perplexity: "Ask: 'Summarize the EV charging market in 2025 — top 5 stats with sources.' Use the citations directly in your appendix.",
    chatgpt: "Paste your research and ask: 'Synthesize this into a 3-slide story arc with one key statistic per slide.'",
    gamma: "Type 'Build a 10-slide investor deck for [topic] with our market, product, traction, and ask.' Edit themes until it matches your brand.",
    "canva-ai": "Once Gamma is done, drop the deck into Canva and apply your brand kit with Magic Switch for fonts, colors, and logo consistency.",
    "beautiful-ai": "If the deck is for execs, use Beautiful.ai's smart layouts — they auto-balance text and charts so nothing looks lopsided.",
    tome: "For outbound sales decks, generate a personalized deck per prospect and share via link. You'll see who actually opened it.",
  },
  "translate-localize": {
    chatgpt: "Paste source script and ask: 'Translate this to Brazilian Portuguese, keeping jokes and casual tone. Flag any cultural references that won't land.'",
    claude: "Drop a 50-page manual and ask 'Translate to Japanese, keep technical accuracy, and flag any units or measurements that need conversion.'",
    elevenlabs: "Pick a voice from the multilingual library, paste your translated script, and download. Use Dubbing Studio if you need lip-sync onto video.",
    assemblyai: "Transcribe original-language audio first; then translate the transcript and use ElevenLabs to voice the result.",
    whisper: "Self-host Whisper for offline or compliance-sensitive transcription. Pair with ChatGPT for translation in the same script.",
    descript: "Drop original video + translated voiceover into Descript and align them on the transcript timeline. Export with new captions baked in.",
  },
  "ai-chatbot": {
    chatgpt: "Use the OpenAI API for chat completions — start with gpt-4o-mini for cost. Iterate the system prompt in ChatGPT first, then deploy.",
    claude: "Use Claude when you need long-context reading — paste your entire knowledge base into the system prompt for v0 of your bot.",
    langchain: "Wire LLM + vector DB + tools together with LangChain. Use LangSmith to trace every prompt and tool call when debugging.",
    pinecone: "Embed your docs, store in Pinecone, retrieve top-k matches per user query. Get RAG running in an afternoon.",
    replit: "Spin up the backend in Replit's agent — 'Build me a Python API with /chat endpoint that calls OpenAI and stores history in SQLite.'",
    huggingface: "When you need a small open model for cheap inference, deploy a Mistral or Llama variant via HF Inference Endpoints.",
  },
  "photo-shoot": {
    midjourney: "Prompt: 'Editorial fashion photo, golden hour, 35mm, model in linen suit, beach background --ar 4:5'. Lock the look across shots with --sref.",
    dalle: "Inside ChatGPT, ask DALL·E for quick variations: 'Generate 4 alternate styles for the same subject — soft, dramatic, minimal, vintage.'",
    "adobe-firefly": "Use Generative Fill in Photoshop to remove props or extend backgrounds while keeping the rest of the shot commercial-safe.",
    "stable-diffusion": "Fine-tune a model on your existing brand photography with DreamBooth, then generate consistent on-brand shots at scale.",
    "canva-ai": "Drop the final shots into a brand template, add product info and CTA, and Magic Resize for IG, web hero, and print.",
  },
};

export function getAppExample(
  appId: string,
  useCaseId: string | null | undefined,
): string | null {
  if (!useCaseId) return null;
  return APP_EXAMPLES[useCaseId]?.[appId] ?? null;
}
