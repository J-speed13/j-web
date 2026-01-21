import { GoogleGenAI } from "@google/genai";
import { WebPageContent } from "../types";

const getSystemInstruction = () => `
You are the J-Zoom Rendering Engine.
Your ONE and ONLY task is to generate valid, standalone HTML5 code for the requested URL.

CRITICAL OUTPUT RULES:
1. **RAW HTML ONLY**: Do NOT wrap the code in markdown blocks (e.g. no \`\`\`html).
2. **NO CONVERSATION**: Do not include "Here is the code" or any other text.
3. **START**: Your response MUST start with \`<!DOCTYPE html>\`.
4. **END**: Your response MUST end with \`</html>\`.

DESIGN & TECH STACK:
- **Tailwind CSS**: Must include <script src="https://cdn.tailwindcss.com"><\/script> in <head>.
- **Icons**: Use Emoji symbols (📁, 📄, 🔍, 🔔) instead of external SVGs/images to ensure visibility.
- **Layout**: Replicate the target site's layout, colors, and typography exactly.
- **Images**: Use placeholder service: https://picsum.photos/seed/{random}/200/200.

SITE SPECIFIC INSTRUCTIONS:
- **GitHub**:
  - Header: Dark gray (bg-gray-900), white text. Search bar, Bell icon, Avatar.
  - Navigation: Tabs (Code, Issues, Pull Requests) with 'Code' selected.
  - Repo Info: Breadcrumb (User / Repo), Public badge (rounded, border).
  - File List: Table style. Header (Name, Last commit, Date). Rows with Emoji icon, Name (blue), Commit msg (gray), Time.
  - README: A bordered container below files. "README.md" header. Content looks like rendered markdown.
  - Colors: bg-white, text-gray-900, link-blue-600, border-gray-300.

- **Blocked Sites (YouTube, X, etc)**:
  - Create a functional-looking mock.
  - YouTube: Video player rectangle (black), Sidebar with video thumbnails.
  - X/Twitter: Feed layout, Tweet cards.

AD BLOCKING:
- No ads, no cookie banners, no popups.

Translate all content to English.
`;

export const generatePageContent = async (
  input: string
): Promise<WebPageContent> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (input === 'j-zoom://welcome' || input === '') {
      return {
        title: 'New Tab',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>New Tab</title>
            <script src="https://cdn.tailwindcss.com"><\/script>
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
    
    // CLEANUP LOGIC:
    // 1. Remove Markdown Code Blocks completely
    html = html.replace(/```html/gi, '').replace(/```/g, '');

    // 2. Find the true start and end of HTML
    const docTypeIndex = html.indexOf('<!DOCTYPE');
    const htmlTagIndex = html.indexOf('<html');
    
    // Determine start index (prefer doctype)
    let startIndex = 0;
    if (docTypeIndex !== -1) startIndex = docTypeIndex;
    else if (htmlTagIndex !== -1) startIndex = htmlTagIndex;

    const endIndex = html.lastIndexOf('</html>');

    if (endIndex !== -1) {
      html = html.substring(startIndex, endIndex + 7);
    } else {
      // If no end tag, just take from start
      html = html.substring(startIndex);
    }

    html = html.trim();

    // 3. Fallback if HTML is still not valid
    if (html.length < 50 || (!html.includes('<body') && !html.includes('<div'))) {
        html = `
            <!DOCTYPE html>
            <html>
            <head><script src="https://cdn.tailwindcss.com"><\/script></head>
            <body class="p-10 text-center">
                <h1 class="text-2xl font-bold text-gray-800">Content Generation Incomplete</h1>
                <p class="text-gray-600">The AI response was not valid HTML.</p>
                <div class="mt-4 p-4 bg-gray-100 rounded text-left text-xs font-mono overflow-auto max-h-96">
                    ${response.text?.replace(/</g, '&lt;')}
                </div>
            </body>
            </html>
        `;
    }

    // Extract Title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : input;

    // Extract Grounding Data
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
        <!DOCTYPE html>
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