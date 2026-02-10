
import { GoogleGenAI, Type } from "@google/genai";

// Guidelines: 
// 1. Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// 2. Create instance right before use to ensure updated key access.
// 3. For complex reasoning like design curation, use gemini-3-pro-preview.

export interface DailyAnalysisResult {
  day_summary: {
    title_en: string;
    title_zh: string;
    vibe_description: string;
  };
  layout_config: {
    grid_style: 'masonry' | 'grid';
    background_color: string;
  };
  images_analysis: {
    image_index: number;
    tags: string[];
    suggested_size: 'large' | 'medium' | 'small';
    orientation: 'landscape' | 'portrait' | 'square';
  }[];
}

/**
 * Analyzes inspirations images using Gemini 3 Pro for advanced design curation.
 */
export const analyzeDailyInspirations = async (base64Images: string[], dateContext: string): Promise<DailyAnalysisResult> => {
  // Initialize AI client directly with process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const imageParts = base64Images.map(base64 => ({
    inlineData: {
      mimeType: 'image/png',
      data: base64.split(',')[1],
    },
  }));

  const response = await ai.models.generateContent({
    // Using gemini-3-pro-preview for complex reasoning and design terminology mapping
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...imageParts,
        {
          text: `# Role
你是一个灵感手账的 AI 策展人。你的目标是将用户上传的碎片化图片整理成一个有主题的“每日合集”。
你的分析必须包含每张图片的物理属性（比例类型）以及核心的设计术语标签。

# Output Schema (Critical)
你必须严格返回以下 JSON 结构：

{
  "day_summary": {
    "title_en": "Deep Amber Minimalism",
    "title_zh": "深琥珀极简主义",
    "vibe_description": "20 字以内的氛围描述，需体现设计美感。"
  },
  "layout_config": {
    "grid_style": "masonry", // 建议：masonry (瀑布流) 或 grid (网格)
    "background_color": "#HexCode" // 建议背景色，需与图片色调和谐
  },
  "images_analysis": [
    {
      "image_index": 0,
      "tags": ["Low Poly", "Gradient", "Futurism"], // 生成 5-10 个专业设计术语
      "suggested_size": "large", 
      "orientation": "portrait" // 必须是: landscape, portrait, square
    }
  ]
}`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          day_summary: {
            type: Type.OBJECT,
            properties: {
              title_en: { type: Type.STRING },
              title_zh: { type: Type.STRING },
              vibe_description: { type: Type.STRING }
            },
            required: ["title_en", "title_zh", "vibe_description"]
          },
          layout_config: {
            type: Type.OBJECT,
            properties: {
              grid_style: { type: Type.STRING },
              background_color: { type: Type.STRING }
            },
            required: ["grid_style", "background_color"]
          },
          images_analysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                image_index: { type: Type.NUMBER },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                suggested_size: { type: Type.STRING },
                orientation: { type: Type.STRING }
              },
              required: ["image_index", "tags", "suggested_size", "orientation"]
            }
          }
        },
        required: ["day_summary", "layout_config", "images_analysis"]
      }
    }
  });

  try {
    // Access response.text property directly as per latest SDK
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return {
      day_summary: {
        title_en: "Daily Muse",
        title_zh: "每日灵感",
        vibe_description: "A collection of found moments."
      },
      layout_config: {
        grid_style: 'masonry',
        background_color: "#fffbeb"
      },
      images_analysis: base64Images.map((_, i) => ({
        image_index: i,
        tags: ["Inspiration"],
        suggested_size: "medium",
        orientation: "square"
      }))
    };
  }
};
