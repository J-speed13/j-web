import { GoogleGenAI } from "@google/genai";
import { WebPageContent } from "../types";

const getSystemInstruction = () => `
You are the rendering engine for "J-Zoom", a browser that generates websites in real-time.
Your goal is to output a **Single, Valid, Standalone HTML5 Document** for the requested URL.

RULES:
1. **OUTPUT FORMAT**: 
   - Return RAW HTML only. Do NOT use markdown blocks (no \`\`\`html). Do NOT return JSON.
   - Start with <!DOCTYPE html><html>...
   - Include a <head> with a <title>.

2. **DESIGN**:
   - Use <script src="https://cdn.tailwindcss.com"></script> for styling.
   - Replicate the visual identity of the requested site (colors, layout, fonts) as closely as possible.
   - **Ad Blocking**: STRICTLY FORBIDDEN. Do not generate any ads, popups, cookie banners, or sponsored content. Clean layout only.
   - **Translation**: If the content would naturally be in a foreign language, TRANSLATE the visible text to English, but keep the layout authentic to the original region's style.

3. **SPECIFIC SITE HANDLING**:
   - **GitHub**: If the URL looks like a repository (github.com/user/repo), you MUST render:
     - The repository header (User / Repo name, Public badge).
     - The tabs (Code, Issues, Pull requests, Actions, Projects, Security, Insights).
     - A file list table with columns: Name, Last commit message, Commit time.
     - The README.md content below the file list, styled like a markdown preview.
     - Use GitHub's color palette (white/gray background, blue links, gray borders).
   - **Social Feeds**: Render plausible posts with timestamps and usernames.
   - **Video Sites**: Render a main video player placeholder and a sidebar of recommendations.

4. **CONTENT**:
   - Use the 'googleSearch' tool to get real data (news headlines, video titles, prices, repo descriptions).
   - Use meaningful <a> tags: <a href="https://example.com/page">Link</a>.

5. **IMAGES**:
   - Use generic placeholders: https://picsum.photos/seed/{seed}/300/200
   - Do NOT use real image URLs unless you are 100% sure they are static CDN links (like logos).

Generate the file now.
`;

export const generatePageContent = async (
  input: string
): Promise<WebPageContent> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Simulate welcome page
    if (input === 'j-zoom://welcome' || input === '') {
      return {
        title: 'New Tab',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>New Tab</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
            <div class="w-full max-w-2xl flex flex-col items-center animate-bounce">
                <h1 class="text-6xl font-bold text-indigo-600 mb-6">J-Zoom</h1>
                <p class="text-xl text-gray-500">Fast. Ad-Free. Translated.</p>
            </div>
          </body>
          </html>
        `
      };
    }

    const model = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate HTML for: ${input}`,
      config: {
        systemInstruction: getSystemInstruction(),
        tools: [{ googleSearch: {} }],
      }
    });

    let html = response.text || '';
    
    // Cleanup: Remove markdown code fences if the model adds them
    html = html.replace(/^```html\s*/i, '').replace(/```$/, '');

    // Extract Title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : input;

    // Extract Grounding Data (Real Source URLs)
    const sourceUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web)
      .filter(web => web !== undefined && web !== null)
      .map(web => ({ title: web.title || '', uri: web.uri || '' }));
    
    return {
      title,
      html,
      sourceUrls
    };

  } catch (error) {
    console.error("Gemini Browser Error:", error);
    return {
      title: "Error",
      html: `
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #ef4444;">Generation Failed</h1>
            <p>J-Zoom could not generate this page.</p>
            <pre style="background: #f3f4f6; padding: 10px; display: inline-block;">${error instanceof Error ? error.message : String(error)}</pre>
          </body>
        </html>
      `
    };
  }
};