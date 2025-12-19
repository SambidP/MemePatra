const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Gemini & AI Configuration ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- MASTER PROMPT (ENGLISH) ---
const MASTER_PROMPT_ENGLISH = `Master Prompt: The Meme Architect (Nano Banana Protocol v5.0)
System Role:
You are the Chief Visual Satirist (Code Name: Meme Architect). Your engine takes input data (User Prompt, Raw News, or Both) and converts it into a SINGLE JSON object containing 3 distinct meme concepts.

CRITICAL TECHNICAL CONSTRAINTS:
Aspect Ratio: You MUST append  --ar 4:5 to the very end of every final_generation_string.
Text Handling:
External Caption: The external_caption MUST be in English.
Internal Text: Any text inside the image generation string (on signs/shirts) should be short and punchy.
Integrated Text (Internal): You must instruct the generator to render text inside the scene (e.g., on a sign/shirt/screen) to anchor the image.
Single Output: Return ONLY ONE JSON object. Do not output multiple JSON blocks.
Step 0: The "Vibe Audit" (Research Mode):
Simulate Browse: Check the vibe of Twitter (Cynical), Reddit (Pedantic), and Instagram (Relatable).
Tone Check: Ensure the captions match specific viral tones (Sarcastic, Wholesome, Shitpost, or Informative).
Step 1: The "Visuals" (Mandatory Specifics):
Vehicles: Cybertrucks, beaten up sedans, public transit.
Objects: Coffee cups, smartphones, messy desks, cats.
Locations: Bodegas, office cubicles, dystopian cityscapes, cozy bedrooms.
Step 2: Style Selection (Variety):
Concept 1 (Photorealistic): High-end editorial/news photography.
Concept 2 (Surreal): Metaphorical (e.g., A melting clock made of pizza).
Concept 3 (Wildcard): Retro Poster, glitched CCTV, or Political Cartoon.
Output Format (Strict JSON)
Return a single JSON object with this exact structure:
JSON
{
  "meme_concepts": [
    {
      "id": 1,
      "style": "Photorealistic Satire",
      "rationale": "Why this fits the trend.",
      "final_generation_string": "A detailed visual description of [Subject] with [Details]. The text '[SHORT TEXT]' is clearly written on a [sign/screen/t-shirt] in the scene. --ar 4:5",
      "external_caption": "Your witty punchline here",
      "caption_style": "White_Bar_Top",
      "cta": "News Headline or Engagement Hook",
      "virality_score": 85,
      "target_audience": "General Public / Students / Corporate",
      "controversy_level": "Medium"
    },
    {
      "id": 2,
      "style": "Surreal/Abstract",
      "rationale": "...",
      "final_generation_string": "Description... Text '[SHORT TEXT]' formed by smoke... --ar 4:5",
      "external_caption": "Abstract/Deep punchline",
      "caption_style": "Transparent_Text_Overlay_Bottom",
      "cta": "CTA",
      "virality_score": 70,
      "target_audience": "Niche/Artistic",
      "controversy_level": "Low"
    },
    {
      "id": 3,
      "style": "Retro/Wildcard",
      "rationale": "...",
      "final_generation_string": "Description... Retro font text '[SHORT TEXT]'... --ar 4:5",
      "external_caption": "Aggressive or funny punchline",
      "caption_style": "White_Bar_Top",
      "cta": "CTA",
      "virality_score": 92,
      "target_audience": "Political/Youth",
      "controversy_level": "High"
    }
  ]
}`;

// --- MASTER PROMPT (NEPALI) ---
const MASTER_PROMPT_NEPALI = `Master Prompt: The Nepali Meme Architect (Nano Banana Protocol v6.0)
System Role:
You are the Chief Visual Satirist of Nepal (Code Name: Meme Architect). Your engine takes input data (User Prompt, Raw News, or Both) and converts it into a SINGLE JSON object containing 3 distinct meme concepts.

CRITICAL TECHNICAL CONSTRAINTS:
Aspect Ratio: You MUST append  --ar 4:5 to the very end of every final_generation_string.
Language (Devanagari):
External Caption: The external_caption MUST be in Nepali (Devanagari script). Use colloquial, witty, and viral internet Nepali (e.g., "यस्तो पनि हुन्छ?", "के पारा हो यो?").
Internal Text: Any text inside the image generation string (on signs/shirts) should be short and in Devanagari if possible, or Romanized Nepali if the visual concept requires it.
Integrated Text (Internal): You must instruct the generator to render text inside the scene (e.g., on a sign/shirt/screen) to anchor the image.
Single Output: Return ONLY ONE JSON object. Do not output multiple JSON blocks.
Step 0: The "Trend Audit" (Research Mode):
Simulate Browse: Check the vibe of Meme Nepal (Cynical), Memeosa (Relatable), and RONB (Informative).
Tone Check: Ensure the Nepali captions match specific viral tones (Sarcastic, Frustrated, "Bbal", or Wholesome).
Step 1: The "Nepopan" Visuals (Mandatory Specifics):
Vehicles: Tata trucks, Blue Microbuses, Sajha Yatayat, Red Honda Shine, White Taxis (Black Top).
Objects: Dented steel plates, Tapari, Chiya (glass cup), Goldstar shoes, Wai Wai noodles, Nanglo.
Locations: Brick walls, dusty haze, "Ganjagol" (wires), Maitighar, Thamel, Chiya Pasal.
Step 2: Style Selection (Variety):
Concept 1 (Photorealistic): High-end editorial/news photography.
Concept 2 (Surreal): Metaphorical (e.g., A sinking boat made of ballot papers).
Concept 3 (Wildcard): Retro Poster, CCTV, or Political Cartoon.
Output Format (Strict JSON)
Return a single JSON object with this exact structure:
JSON

{
  "meme_concepts": [
    {
      "id": 1,
      "style": "Photorealistic Satire",
      "rationale": "Why this fits the trend.",
      "final_generation_string": "A detailed visual description of [Subject] with [Nepopan Details]. The text '[SHORT DEVANAGARI/ROMAN TEXT]' is clearly written on a [sign/screen/t-shirt] in the scene. --ar 4:5",
      "external_caption": "Your witty punchline in Devanagari here (e.g., देश कसरी चल्दैछ?)",
      "caption_style": "White_Bar_Top",
      "cta": "News Headline or Engagement Hook in Devanagari",
      "virality_score": 85,
      "target_audience": "General Public / Students / Corporate",
      "controversy_level": "Medium"
    },
    {
      "id": 2,
      "style": "Surreal/Abstract",
      "rationale": "...",
      "final_generation_string": "Description... Text '[SHORT DEVANAGARI TEXT]' formed by smoke... --ar 4:5",
      "external_caption": "Abstract/Deep punchline in Devanagari",
      "caption_style": "Transparent_Text_Overlay_Bottom",
      "cta": "CTA in Devanagari",
      "virality_score": 70,
      "target_audience": "Niche/Artistic",
      "controversy_level": "Low"
    },
    {
      "id": 3,
      "style": "Retro/Wildcard",
      "rationale": "...",
      "final_generation_string": "Description... Retro font text '[SHORT DEVANAGARI TEXT]'... --ar 4:5",
      "external_caption": "Aggressive or funny punchline in Devanagari",
      "caption_style": "White_Bar_Top",
      "cta": "CTA in Devanagari",
      "virality_score": 92,
      "target_audience": "Political/Youth",
      "controversy_level": "High"
    }
  ]
}`;

// --- Image Generation (Gemini Image Model) ---
const generateImage = async (prompt) => {
    try {
        // Using Gemini 3 Pro Image Preview as requested
        const imageModel = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

        const result = await imageModel.generateContent(prompt);
        const response = result.response;

        // Typical structure for multimodal response. 
        if (response.candidates &&
            response.candidates.length > 0 &&
            response.candidates[0].content &&
            response.candidates[0].content.parts &&
            response.candidates[0].content.parts.length > 0) {

            const part = response.candidates[0].content.parts[0];

            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        console.warn("Unexpected Image Response Structure:", JSON.stringify(response, null, 2));
        // Fallback placeholder
        return `https://placehold.co/600x400?text=Gen+Error`;

    } catch (error) {
        console.error("Gemini Image Generation Failed:", error);
        return `https://placehold.co/600x400?text=Gen+Exception`;
    }
};

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve static files from uploads
app.use('/uploads', express.static('uploads'));

// GET Available Templates
app.get('/api/templates', (req, res) => {
    const templatesDir = './uploads/templates';
    if (!fs.existsSync(templatesDir)) {
        return res.json([]);
    }

    fs.readdir(templatesDir, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to list templates' });
        }
        const fileUrls = files.map(file => `http://localhost:${PORT}/uploads/templates/${file}`);
        res.json(fileUrls);
    });
});

// POST Upload Template
app.post('/api/upload-template', upload.single('template'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    res.json({
        success: true,
        filePath: req.file.path,
        url: `http://localhost:${PORT}/uploads/templates/${req.file.filename}`
    });
});

// Parsing Endpoint
app.post('/api/parse-context', upload.single('file'), async (req, res) => {
    try {
        let parsedText = '';
        const instructions = req.body.instructions || '';

        if (req.file) {
            const filePath = req.file.path;
            const ext = path.extname(req.file.originalname).toLowerCase();

            if (ext === '.pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdf(dataBuffer);
                parsedText = pdfData.text;
            } else if (ext === '.docx') {
                const result = await mammoth.extractRawText({ path: filePath });
                parsedText = result.value;
            } else {
                console.log('Unsupported file type for parsing:', ext);
            }
        }

        if (!parsedText.trim()) {
            parsedText = instructions;
        }

        res.json({
            success: true,
            filePath: req.file ? req.file.path : null,
            parsedText: parsedText
        });

    } catch (error) {
        console.error('Error processing context:', error);
        res.status(500).json({ success: false, error: 'Failed to process context' });
    }
});

// --- Meme Generation Controller ---
app.post('/api/generate-memes', upload.single('file'), async (req, res) => {
    console.log("================================================================");
    console.log("[SERVER] Received /api/generate-memes request");

    try {
        const { parsedNewsText, userVibe, contextLanguage } = req.body;
        console.log("[SERVER] Context Language:", contextLanguage);

        const userVibeText = userVibe || '';

        // Handle potential JSON object or string for parsedNewsText
        let contextTextRaw = parsedNewsText;
        console.log("[SERVER] Raw Inputs - User Vibe:", userVibeText);
        console.log("[SERVER] Raw Inputs - ParsedNewsText Type:", typeof contextTextRaw);

        let contextText = '';

        if (typeof contextTextRaw === 'object') {
            console.log("[SERVER] contentTextRaw is object, stringifying...");
            contextText = JSON.stringify(contextTextRaw, null, 2);
        } else {
            contextText = contextTextRaw || '';
        }
        console.log("[SERVER] Final Context Text Length:", contextText.length);

        // SELECT MASTER PROMPT
        const selectedPrompt = contextLanguage === 'Nepali' ? MASTER_PROMPT_NEPALI : MASTER_PROMPT_ENGLISH;
        console.log("****************************************************************");
        console.log(`[SERVER] ACTIVE LANGUAGE CONTEXT: ${contextLanguage === 'Nepali' ? '🇳🇵 NEPALI' : '🇺🇸 ENGLISH'}`);
        console.log("****************************************************************");

        // 1. Construct Prompt with Explicit Sections
        const finalPrompt = `${selectedPrompt}

--- INPUT DATA START ---

<RawNews>
${contextText}
</RawNews>

<UserPrompt>
${userVibeText}
</UserPrompt>

--- INPUT DATA END ---
`;
        console.log("[SERVER] Final Prompt Constructed. Total Length:", finalPrompt.length);
        // console.log("[SERVER] Prompt Snapshot:", finalPrompt.substring(0, 200) + "...");

        // 2. Gemini Step (JSON Generation - Text Model)
        console.log("[SERVER] Calling Gemini Text Model (gemini-3-pro-preview)...");

        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(finalPrompt);
        const responseText = result.response.text();
        console.log("[SERVER] Gemini Text Response Received. Length:", responseText.length);
        // console.log("[SERVER] Response Text Snapshot:", responseText.substring(0, 100) + "...");

        const geminiJson = JSON.parse(responseText);
        console.log("[SERVER] JSON Parsed Successfully.");

        if (!geminiJson.meme_concepts || !Array.isArray(geminiJson.meme_concepts)) {
            console.error("[SERVER] Invalid JSON Structure:", Object.keys(geminiJson));
            throw new Error("Invalid JSON structure from Gemini");
        }
        console.log(`[SERVER] Found ${geminiJson.meme_concepts.length} meme concepts.`);

        // 3. Image Generation Step (Parallel - Image Model)
        const concepts = geminiJson.meme_concepts.slice(0, 3);
        console.log("[SERVER] Starting Image Generation for top 3 concepts...");

        const memePromises = concepts.map(async (concept, index) => {
            const prompt = concept.final_generation_string;
            console.log(`[SERVER] Generating Image for Concept ${index + 1}... Prompt:`, prompt);

            if (!prompt) {
                console.warn(`[SERVER] Concept ${index + 1} missing generation string.`);
                return { ...concept, generated_image_url: null, error: "No prompt string" };
            }

            try {
                // generateImage returns a Data URI (data:image/png;base64,...)
                const base64DataUri = await generateImage(prompt);

                if (base64DataUri.startsWith('data:image')) {
                    // Extract Base64 Data
                    const matches = base64DataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                    if (matches && matches.length === 3) {
                        // Return the Base64 Data URI directly
                        console.log(`[SERVER] Returned Base64 image for Concept ${index + 1}`);

                        return {
                            ...concept,
                            generated_image_url: base64DataUri
                        };
                    }
                }

                // Fallback (if no base64 match or other issue)
                console.log(`[SERVER] Image generated for Concept ${index + 1}. (Returned specific URL or error)`);
                return {
                    ...concept,
                    generated_image_url: base64DataUri
                };
            } catch (err) {
                console.error(`[SERVER] Image gen failed for Concept ${index + 1}:`, err);
                return { ...concept, generated_image_url: null, error: "Image generation failed" };
            }
        });

        const finalMemes = await Promise.all(memePromises);
        console.log("[SERVER] All images processed. Sending final response.");

        res.json({
            success: true,
            memes: finalMemes
        });

    } catch (error) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error('[SERVER] Meme generation FATAL ERROR:', error);
        if (error.message) console.error('[SERVER] Error Message:', error.message);
        if (error.response) console.error('[SERVER] API Response Error:', JSON.stringify(error.response, null, 2));
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        res.status(500).json({ success: false, error: 'Failed to generate memes. Check server logs for details.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
