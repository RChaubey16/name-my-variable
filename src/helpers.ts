import * as vscode from "vscode";
import dotenv from "dotenv";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Load environment variables
dotenv.config();

export interface VariableAssignment {
  variable: string;
  value: string;
}

export interface VariableNameResponse {
  option1: string;
  option2: string;
}

/**
 * Get Gemini API key from user or env
 */
function getAPIKey(): string {
  const config = vscode.workspace.getConfiguration("nameMyVariable");
  return config.get("apiKey") || process.env.GEMINI_API_KEY || "";
}

/**
 * Returns a properly initialized Gemini model
 */
function getGeminiModel(): GenerativeModel {
  const apiKey = getAPIKey() + "ziXHgIvLo";
  if (!apiKey) {
    throw new Error("Gemini API key is missing");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

/**
 * Extracts the variable assignment from a line of code.
 */
export function extractAssignment(line: string): VariableAssignment | null {
  const match = line.match(/\b(\w+)\s*=\s*(.+)/);
  if (match) {
    return { variable: match[1], value: match[2].trim() };
  }
  return null;
}

/**
 * Extracts the file extension.
 */
export function extractFileExtension(filePath: string): string | null {
  const extIndex = filePath.lastIndexOf(".");
  return extIndex !== -1 ? filePath.slice(extIndex) : null;
}

/**
 * Suggests new variable names using Gemini
 */
export async function renameVariableWithGemini(
  variableAssignment: string,
  fileType: string
): Promise<VariableNameResponse> {
  if (!variableAssignment || !fileType) {
    throw new Error("Both variable assignment and file type are required");
  }

  const prompt = `
You are an expert in variable naming conventions. 
Provide 2 simple, readable variable names in camelCase based on the context.

Context:
- Original Variable Assignment: ${variableAssignment}
- File Type: ${fileType}

Requirements:
1. Generate descriptive, meaningful names
2. Use camelCase format
3. Consider the file type and potential use case
4. Return exactly 2 variable name suggestions
5. Respond in strict JSON format: {"option1": "variableNameSuggestion1", "option2": "variableNameSuggestion2"}
`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent([prompt]);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const variableNames: VariableNameResponse = JSON.parse(cleaned);

    if (!variableNames.option1 || !variableNames.option2) {
      throw new Error("Invalid response format from Gemini");
    }

    return variableNames;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error.message);
    throw new Error(`Failed to generate variable names: ${error.message}`);
  }
}

/**
 * Extracts function code starting at the given line
 */
export function extractFunctionCode(
  document: vscode.TextDocument,
  lineIndex: number
): string | null {
  const text = document.getText();
  const lines = text.split("\n");

  const functionRegex =
    /(async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(async\s*)?\(|(\w+)\s*:\s*(async\s*)?\(|(\w+)\s*=\s*(async\s*)?\(|class\s+(\w+)/;
  let currentLine = lines[lineIndex].trim();

  if (!functionRegex.test(currentLine)) {
    return null;
  }

  let startLine = lineIndex;
  let endLine = lineIndex;
  let braceCount = 0;
  let inFunction = false;

  for (let i = lineIndex; i >= 0; i--) {
    const line = lines[i].trim();
    if (functionRegex.test(line)) {
      startLine = i;
      inFunction = true;
      for (const char of lines[i]) {
        if (char === "{") {
          braceCount++;
        }
        if (char === "}") {
          braceCount--;
        }
      }
      break;
    }
  }

  if (!inFunction) {
    return null;
  }

  for (let i = startLine + 1; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === "{") {
        braceCount++;
      }
      if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          endLine = i;
          break;
        }
      }
    }
    if (braceCount === 0) {
      break;
    }
  }

  return lines.slice(startLine, endLine + 1).join("\n");
}

/**
 * Suggests new function names using Gemini
 */
export async function renameFunctionWithGemini(
  functionCode: string,
  fileType: string
): Promise<VariableNameResponse> {
  if (!functionCode || !fileType) {
    throw new Error("Both function code and file type are required");
  }

  const prompt = `
You are an expert in function naming conventions.
Provide 2 clear, descriptive function names based on the function's purpose and behavior.

Context:
- Function Code: ${functionCode}
- File Type: ${fileType}

Requirements:
1. Generate descriptive, meaningful function names
2. Use camelCase format (or appropriate convention for the language)
3. Reflect what the function does
4. Return exactly 2 suggestions
5. Respond in strict JSON format: {"option1": "functionNameSuggestion1", "option2": "functionNameSuggestion2"}
`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent([prompt]);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const functionNames: VariableNameResponse = JSON.parse(cleaned);

    if (!functionNames.option1 || !functionNames.option2) {
      throw new Error("Invalid response format from Gemini");
    }

    return functionNames;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error.message);
    throw new Error(`Failed to generate function names: ${error.message}`);
  }
}
