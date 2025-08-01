// Import VS Code API
import * as vscode from "vscode";
import {
  extractAssignment,
  extractFileExtension,
  renameVariableWithGemini,
  extractFunctionCode,
  renameFunctionWithGemini,
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

  const resultFromAI = await renameVariableWithGemini(line, fileExtension);
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
 * Function to suggest better function names
 */
async function suggestFunctionNames() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selection = editor.selection;
  let functionCode: string;
  
  // If there's a selection, use it, otherwise extract function from current line
  if (!selection.isEmpty) {
    // Use the selected code
    functionCode = document.getText(selection);
  } else {
    // Extract function from current line
    const extractedFunction = extractFunctionCode(document, selection.active.line);
    if (!extractedFunction) {
      vscode.window.showInformationMessage("No function detected. Please select a function or place cursor on a function declaration.");
      return;
    }
    functionCode = extractedFunction;
  }

  // Get file extension
  const filePath = editor.document.fileName;
  const fileExtension = extractFileExtension(filePath) ?? ".js";

  // Show loading message
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(sync~spin) Generating better function names...";
  statusBarItem.show();

  try {
    // Send to Groq AI
    const resultFromAI = await renameFunctionWithGemini(functionCode, fileExtension);
    const { option1, option2 } = resultFromAI;
    
    // Create an inline decoration
    if (decorationType) {
      decorationType.dispose();
    }

    decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: `    // Better function names: ${option1}, ${option2}`,
        color: "gray",
        fontStyle: "italic",
      },
    });

    // Determine where to place the decoration
    let range;
    if (!selection.isEmpty) {
      // For selected text, put at the end of the selection
      range = new vscode.Range(selection.end, selection.end);
    } else {
      // For detected function, put at the end of the first line
      const line = document.lineAt(selection.active.line);
      range = new vscode.Range(line.range.end, line.range.end);
    }

    editor.setDecorations(decorationType, [range]);

    // Clean up when cursor moves
    const removeDecoration = vscode.window.onDidChangeTextEditorSelection(() => {
      if (decorationType) {
        decorationType.dispose();
        decorationType = null;
      }
      removeDecoration.dispose();
    });
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error generating function names: ${error.message}`);
  } finally {
    statusBarItem.dispose();
  }
}

/**
 * Activate the extension
 */
function activate(context: vscode.ExtensionContext): void {
  let disposableRenameVar: vscode.Disposable = vscode.commands.registerCommand(
    "extension.renameVariable",
    replaceVariableName
  );
  
  let disposableRenameFunc: vscode.Disposable = vscode.commands.registerCommand(
    "extension.suggestFunctionNames",
    suggestFunctionNames
  );
  
  context.subscriptions.push(disposableRenameVar, disposableRenameFunc);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
