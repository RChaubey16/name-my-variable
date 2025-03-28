import * as vscode from "vscode";
import Groq from "groq-sdk";
import dotenv from "dotenv";

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
 * Get Groq API key.
 * @returns Groq API key
 */
function getAPIKey(): string {
  const config = vscode.workspace.getConfiguration('nameMyVariable');
  return config.get('apiKey') || '';
}

/**
 * Extracts the variable assignment from a line of code.
 * Example: "let x = 5;" -> { variable: "x", value: "5" }
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
 * Example: "file.tsx" -> .tsx
 */
export function extractFileExtension(filePath: string): string | null {
  const extIndex = filePath.lastIndexOf(".");
  if (extIndex !== -1) {
    return filePath.slice(extIndex); // Returns the extension including the dot (e.g., ".tsx")
  }
  return null; // Return null if no extension found
}

/**
 * Rename variables using Groq LLM based on context and file type
 * @param {string} variableAssignment - Original variable assignment line (e.g., "const abc = 123")
 * @param {string} fileType - File type extension (e.g., ".tsx", ".py")
 * @returns {Promise<Object>} Suggested variable names in camelCase
 */
export async function renameVariableWithGroq(
  variableAssignment: string,
  fileType: string
): Promise<VariableNameResponse> {
  // Validate inputs
  if (!variableAssignment || !fileType) {
    throw new Error("Both variable assignment and file type are required");
  }

  // Prepare the prompt for Groq
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
    const groq = new Groq({
      apiKey: getAPIKey() + 'OBfPC9F',
    });

    // Make API call to Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a helpful coding assistant." },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content received from Groq");
    }

    // Parse and validate the JSON response
    const variableNames: VariableNameResponse = JSON.parse(content);

    if (!variableNames.option1 || !variableNames.option2) {
      throw new Error("Invalid response format from Groq");
    }

    return variableNames;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error calling Groq API:", error.message);
      throw new Error(`Failed to generate variable names: ${error.message}`);
    }
    throw error;
  }
}
