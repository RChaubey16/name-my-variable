/**
 * TODO: FIRST COMMIT BEFORE MOVING FORWARD.
 * Extension development plan.
 *
 * 1. Get current variable assignment line [DONE]
 * 2. Get the current file extension (.tsx, .js, etc) [DONE]
 * 3. Function that takes the variable assignment line and file extension and return AI generated better, readable variable names in JSON format. 2 maximum [DONE]
 * 4. Replace the dummy variable name "num1" with AI generated variable name [DONE]
 * 5. Brainstorm whether we should create a new trigger function that generate variable names using underscores or not. But the current function will be camelCase {TODO}
 * 6. Move helper function to a separate file.
 *
 */

// Import VS Code API
import * as vscode from "vscode";
import Groq from "groq-sdk";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Extracts the variable assignment from a line of code.
 * Example: "let x = 5;" -> { variable: "x", value: "5" }
 */
interface VariableAssignment {
  variable: string;
  value: string;
}

// Helper function
function extractAssignment(line: string): VariableAssignment | null {
  const match = line.match(/\b(\w+)\s*=\s*(.+)/);
  if (match) {
    return { variable: match[1], value: match[2].trim() };
  }
  return null;
}

// Helper function
function extractFileExtension(filePath: string): string | null {
  const extIndex = filePath.lastIndexOf(".");
  if (extIndex !== -1) {
    return filePath.slice(extIndex); // Returns the extension including the dot (e.g., ".tsx")
  }
  return null; // Return null if no extension found
}

interface VariableNameResponse {
  option1: string;
  option2: string;
}

/**
 * Rename variables using Groq LLM based on context and file type
 * @param {string} variableAssignment - Original variable assignment line (e.g., "const abc = 123")
 * @param {string} fileType - File type extension (e.g., ".tsx", ".py")
 * @returns {Promise<Object>} Suggested variable names in camelCase
 */
async function renameVariableWithGroq(
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
      apiKey: "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",
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

let decorationType: vscode.TextEditorDecorationType | null = null;
/**
 * Main function to replace variable names
 */
async function replaceVariableName() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selection = editor.selection;
  //   Current line value
  const line = document.lineAt(selection.active.line).text;
  //   Current active file.
  const filePath = editor.document.fileName;
  const fileExtension = extractFileExtension(filePath) ?? ".js";

  const assignment = extractAssignment(line);
  if (!assignment) {
    return;
  }

  const resultFromAI = await renameVariableWithGroq(line, fileExtension);
  const { option1, option2 } = resultFromAI;
  const betterVariableNamesComment = `    // Better variable names: ${option1}, ${option2}`;

  // Create an inline decoration (instead of permanently modifying the text)
  if (decorationType) {
    decorationType.dispose(); // Dispose of the previous decoration
  }

  decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      contentText: betterVariableNamesComment,
      color: "gray",
      fontStyle: "italic",
    },
  });

  const currentLine = document.lineAt(selection.active.line);
  const range = new vscode.Range(currentLine.range.end, currentLine.range.end);

  editor.setDecorations(decorationType, [range]);

  // Clean up the decoration when the user moves the cursor away
  const removeDecoration = vscode.window.onDidChangeTextEditorSelection(() => {
    if (decorationType) {
      decorationType.dispose();
      decorationType = null;
    }
    removeDecoration.dispose(); // Remove the event listener after it's executed
  });
}

/**
 * Activate the extension
 */
function activate(context: vscode.ExtensionContext): void {
  let disposable: vscode.Disposable = vscode.commands.registerCommand(
    "extension.renameVariable",
    replaceVariableName
  );
  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
