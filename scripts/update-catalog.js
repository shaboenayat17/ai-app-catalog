const fs = require('fs')
const path = require('path')
const https = require('https')

const APPS_JSON_PATH = path.join(
  __dirname, '..', 'data', 'apps.json'
)
const SUMMARY_PATH = path.join(
  __dirname, 'last-update-summary.txt'
)

async function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are an AI tools researcher. You only respond with valid JSON. No markdown, no backticks, no explanation. Just raw JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            reject(new Error(parsed.error.message))
          } else {
            resolve(parsed.choices[0].message.content)
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenAI response'))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  console.log('🤖 Starting catalog update...')

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ No OPENAI_API_KEY found. Exiting.')
    fs.writeFileSync(SUMMARY_PATH,
      'note: No OPENAI_API_KEY configured')
    process.exit(0)
  }

  // Read existing apps
  const appsData = JSON.parse(
    fs.readFileSync(APPS_JSON_PATH, 'utf8')
  )
  const existingApps = Array.isArray(appsData)
    ? appsData
    : appsData.apps || []

  const existingIds = new Set(
    existingApps.map(a => a.id)
  )
  const existingNames = existingApps
    .map(a => a.name)
    .join(', ')

  console.log(`📚 Current catalog: ${existingApps.length} apps`)
  console.log('🔍 Asking OpenAI for new apps...')

  const today = new Date().toISOString().split('T')[0]

  const prompt = `
The AI app catalog currently has ${existingApps.length} apps including: ${existingNames}.

Find 4 AI apps that meet ALL these criteria:
1. Launched or became widely known in 2025 or 2026
2. NOT already in this list: ${existingNames}
3. Has a real working website with https URL
4. Genuinely useful for creative or professional work
5. Not a research paper or API-only service

Look specifically for NEW apps in these areas:
- AI video generation (e.g. tools like Kling, Vidu, Haiper, MiniMax)
- AI voice or music (e.g. tools like Neets, Voicenotes, Stable Audio)
- AI coding (e.g. tools like Windsurf, Aide, Zed AI)
- AI image (e.g. tools like Recraft, Ideogram v2, Flux)
- AI productivity (e.g. tools like Granola, Limitless, Tana)
- AI writing (e.g. tools like Fibery AI, Campsite, Craft AI)

Do NOT suggest: ChatGPT, Claude, Gemini, Midjourney,
Canva, Notion, Grammarly, GitHub Copilot, Cursor,
Runway, ElevenLabs, or any app already in the list.

Return ONLY this exact JSON structure with no other text:
{
  "newApps": [
    {
      "id": "lowercase-slug-no-spaces",
      "name": "Exact App Name",
      "description": "One clear sentence about what it does",
      "category": "one of: Text & Writing, Image & Art, Video, Audio & Music, Coding, Productivity, Research, Data & Analytics, Avatar & Meetings, 3D & Design",
      "tags": ["tag1", "tag2", "tag3"],
      "pricing": "Free or Freemium or Paid",
      "url": "https://real-url.com",
      "logoUrl": "https://logo.clearbit.com/domain.com",
      "featured": false,
      "addedDate": "${today}",
      "isNew": true,
      "weeklyViews": 800,
      "savedCount": 80,
      "trendingScore": 78,
      "trendingDirection": "up",
      "rating": 4.3,
      "reviewCount": 0,
      "reviews": [],
      "bestFor": ["use case 1", "use case 2"],
      "workflow": "create",
      "compatibleWith": [],
      "pros": ["Specific pro 1", "Specific pro 2", "Specific pro 3"],
      "cons": ["Specific con 1", "Specific con 2"],
      "verdict": "Best for who and what",
      "notGoodFor": "Who should avoid this",
      "pricing_details": {
        "free_tier": true,
        "free_tier_limits": "describe limits or null",
        "starting_price": "$X/month or null",
        "most_popular_plan": "$X/month or null",
        "annual_discount": "X% or null",
        "has_student_discount": false,
        "free_trial": "X days or none",
        "estimated_monthly_cost": {
          "light_user": "$0-5",
          "regular_user": "$10-20",
          "power_user": "$30-50"
        }
      }
    }
  ]
}
`

  let rawResponse
  try {
    rawResponse = await callOpenAI(prompt)
    console.log('✅ OpenAI responded successfully')
  } catch (err) {
    console.log(`❌ OpenAI call failed: ${err.message}`)
    fs.writeFileSync(SUMMARY_PATH,
      `note: OpenAI call failed - ${err.message}`)
    process.exit(0)
  }

  // Parse response
  let parsed
  try {
    // Clean response in case of any stray characters
    const cleaned = rawResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch (err) {
    console.log('❌ Failed to parse JSON response')
    console.log('Raw response:', rawResponse)
    fs.writeFileSync(SUMMARY_PATH,
      'note: Failed to parse OpenAI JSON response')
    process.exit(0)
  }

  const suggestions = parsed.newApps || []
  console.log(`🔍 OpenAI suggested ${suggestions.length} apps`)

  // Filter out duplicates
  const newApps = suggestions.filter(app => {
    if (!app.id || !app.name || !app.url) {
      console.log(`⚠️ Skipping ${app.name} - missing required fields`)
      return false
    }
    if (existingIds.has(app.id)) {
      console.log(`⚠️ Skipping ${app.name} - ID already exists`)
      return false
    }
    if (!app.url.startsWith('https://')) {
      console.log(`⚠️ Skipping ${app.name} - invalid URL`)
      return false
    }
    // Check if name already exists
    const nameLower = app.name.toLowerCase()
    const nameExists = existingApps.some(
      e => e.name.toLowerCase() === nameLower
    )
    if (nameExists) {
      console.log(`⚠️ Skipping ${app.name} - name already exists`)
      return false
    }
    return true
  })

  console.log(`✅ ${newApps.length} valid new apps after filtering`)

  if (newApps.length === 0) {
    console.log('ℹ️ No new apps to add this run')
    fs.writeFileSync(SUMMARY_PATH,
      `note: No new unique apps found on ${today}`)
    process.exit(0)
  }

  // Add new apps to apps.json
  const updatedApps = [...existingApps, ...newApps]

  // Handle both array and object format
  let updatedData
  if (Array.isArray(appsData)) {
    updatedData = updatedApps
  } else {
    updatedData = { ...appsData, apps: updatedApps }
  }

  fs.writeFileSync(
    APPS_JSON_PATH,
    JSON.stringify(updatedData, null, 2)
  )

  // Write summary
  const summary = newApps
    .map(a => `- ${a.name} (${a.category}) - ${a.url}`)
    .join('\n')

  fs.writeFileSync(
    SUMMARY_PATH,
    `Updated: ${today}\nAdded ${newApps.length} new apps:\n${summary}`
  )

  console.log(`💾 Successfully wrote ${newApps.length} new apps to apps.json`)
  newApps.forEach(app => {
    console.log(`  ✅ Added: ${app.name} (${app.category})`)
  })
  console.log('🎉 Update complete! PR will be created.')
}

main().catch(err => {
  console.error('❌ Script failed:', err.message)
  process.exit(0) // exit 0 so workflow doesn't fail
})
