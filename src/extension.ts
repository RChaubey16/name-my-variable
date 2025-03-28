/**
 * TODO: FIRST COMMIT BEFORE MOVING FORWARD.
 * Extension development plan.
 *
 * 1. Get current variable assignment line [DONE]
 * 2. Get the current file extension (.tsx, .js, etc) [DONE]
 * 3. Function that takes the variable assignment line and file extension and return AI generated better, readable variable names in JSON format. 2 maximum [DONE]
 * 4. Replace the dummy variable name "num1" with AI generated variable name [DONE]
 * 5. Brainstorm whether we should create a new trigger function that generate variable names using underscores or not. But the current function will be camelCase {TODO}
 * 6. Move helper function to a separate file [DONE].
 *
 */

// Import VS Code API
import * as vscode from "vscode";
import {
  extractAssignment,
  extractFileExtension,
  renameVariableWithGroq,
} from "./helpers";

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

  // Checks whether the line ia a variable assignment code or not.
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
