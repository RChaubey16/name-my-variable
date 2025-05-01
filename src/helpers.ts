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

/**
 * Extract function code from the document starting at the given line
 * @param {vscode.TextDocument} document - The active text document
 * @param {number} lineIndex - The line number where the cursor is positioned
 * @returns {string | null} The extracted function code or null if no function is found
 */
export function extractFunctionCode(document: vscode.TextDocument, lineIndex: number): string | null {
  const text = document.getText();
  const lines = text.split("\n");
  
  // Check if the current line contains a function declaration
  const functionRegex = /(async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(async\s*)?\(|(\w+)\s*:\s*(async\s*)?\(|(\w+)\s*=\s*(async\s*)?\(|class\s+(\w+)/;
  let currentLine = lines[lineIndex].trim();
  
  if (!functionRegex.test(currentLine)) {
    // Not on a function line
    return null;
  }
  
  // Extract the full function
  let startLine = lineIndex;
  let endLine = lineIndex;
  let braceCount = 0;
  let inFunction = false;
  
  // Find start of function if we're inside it
  for (let i = lineIndex; i >= 0; i--) {
    const line = lines[i].trim();
    if (functionRegex.test(line)) {
      startLine = i;
      inFunction = true;
      // Count opening braces on this line
      for (const char of lines[i]) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      break;
    }
  }
  
  if (!inFunction) {
    return null;
  }
  
  // Find end of function
  for (let i = startLine + 1; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endLine = i;
          break;
        }
      }
    }
    if (braceCount === 0) break;
  }
  
  // Extract the function code
  return lines.slice(startLine, endLine + 1).join("\n");
}

/**
 * Rename functions using Groq LLM based on function code and file type
 * @param {string} functionCode - The function code to analyze
 * @param {string} fileType - File type extension (e.g., ".tsx", ".py")
 * @returns {Promise<VariableNameResponse>} Suggested function names
 */
export async function renameFunctionWithGroq(
  functionCode: string,
  fileType: string
): Promise<VariableNameResponse> {
  // Validate inputs
  if (!functionCode || !fileType) {
    throw new Error("Both function code and file type are required");
  }

  // Prepare the prompt for Groq
  const prompt = `
    You are an expert in function naming conventions.
    Provide 2 clear, descriptive function names based on the function's purpose and behavior.

    Context:
    - Function Code: ${functionCode}
    - File Type: ${fileType}

    Requirements:
    1. Generate descriptive, meaningful function names
    2. Use camelCase format (or the appropriate convention for the language)
    3. Consider the file type and potential use case
    4. Names should reflect what the function does
    5. Return exactly 2 function name suggestions
    6. Respond in strict JSON format: {"option1": "functionNameSuggestion1", "option2": "functionNameSuggestion2"}
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
    const functionNames: VariableNameResponse = JSON.parse(content);

    if (!functionNames.option1 || !functionNames.option2) {
      throw new Error("Invalid response format from Groq");
    }

    return functionNames;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error calling Groq API:", error.message);
      throw new Error(`Failed to generate function names: ${error.message}`);
    }
    throw error;
  }
}
