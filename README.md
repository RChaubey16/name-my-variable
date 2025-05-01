# Name My Variable

In software engineering, two notoriously difficult things are cache invalidation and naming things. While we can't help with the first one, we've got your back for the second! 😉

A Visual Studio Code extension that helps developers write more readable code by suggesting meaningful variable and function names. Perfect for JavaScript and TypeScript projects.

## Features

- 🤖 AI-powered variable and function name suggestions
- ✨ Instant inline suggestions without modifying your code
- 🎯 Context-aware naming based on value, usage, and function purpose
- 🔄 Multiple naming options for flexibility
- 💡 Supports JavaScript and TypeScript files

## Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Name My Variable"
4. Click Install

## How to Use Variable Naming

1. Write a variable assignment (e.g., `const abc = 123`)
2. Place your cursor on the line containing the variable assignment
3. Open the Command Palette (Ctrl+Shift+P)
4. Type and select "Generate variable name suggestions"
5. View suggested variable names as inline comments

![Variable naming demo video](./demo.gif)

## How to Use Function Naming

1. Select the function code you want to rename.
2. Open the Command Palette (Ctrl+Shift+P)
3. Type and select "Generate function name suggestions"
4. View suggested function names as inline comments

For best results with function naming, select the entire function body including the function declaration and closing brackets.

## Requirements

- Visual Studio Code 1.98.0 or higher

## Known Issues

[Report issues on our GitHub repository](https://github.com/RChaubey16/name-my-variable/issues)

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Release Notes

### 1.1.0

- Added function name suggestions
- Improved code detection for variable and function names
- Enhanced inline comment display

### 0.0.1

- Initial release
- Basic variable name suggestions for JavaScript and TypeScript
- Inline suggestion display
