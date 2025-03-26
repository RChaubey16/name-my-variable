
/**
 * TODO: FIRST COMMIT BEFORE MOVING FORWARD.
 * Extension development plan.
 * 
 * 1. Get current variable assignment line [DONE]
 * 2. Get the current file extension (.tsx, .js, etc) [DONE]
 * 3. Function that takes the variable assignment line and file extension and return AI generated better, readable variable names in JSON format. 2 maximum {TODO}
 * 4. Replace the dummy variable name "num1" with AI generated variable name {TODO}
 * 5. Brainstorm whether we should create a new trigger function that generate variable names using underscores or not. But the current function will be camelCase {TODO}
 * 
 */


// Import VS Code API
import * as vscode from "vscode";
const axios = require("axios");

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
  const fileExtension = extractFileExtension(filePath);

  console.log(`LINE`, line);
  console.log(`FILE NAME`, fileExtension);

  const assignment = extractAssignment(line);
  if (!assignment) {
    return;
  }

  //   TODO: A function which will get me better variable names in JSON format. Replace the "num1" with the AI generated variable.
  const updatedLine = line.replace(assignment.variable, "num1");

  editor.edit((editBuilder: vscode.TextEditorEdit) => {
    editBuilder.replace(
      document.lineAt(selection.active.line).range,
      updatedLine
    );
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
