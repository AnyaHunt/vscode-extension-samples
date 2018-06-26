'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let NEXT_TERM_ID = 1;

	vscode.window.showInformationMessage('Hello World!');

	console.log("Terminals: " + (<any>vscode.window).terminals.length);

	(<any>vscode.window).onDidOpenTerminal(e => {
		console.log("Terminal opened. Total count: " + (<any>vscode.window).terminals.length);

		e.onData(data => {
			console.log("Terminal data: ", data);
		});
	});

	(<any>vscode.window).onDidChangeActiveTerminal(e => {
		console.log(`Active terminal changed, name=${e ? e.name : 'undefined'}`);
	});

	// vscode.window.createTerminal
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.createTerminal', () => {
		vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		vscode.window.showInformationMessage('Hello World 2!');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.createAndSend', () => {
		const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		terminal.sendText("echo 'Sent text immediately after creating'");
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.createZshLoginShell', () => {
		vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`, '/bin/zsh', ['-l']);
	}));

	// Terminal.hide
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.hide', () => {
		if (ensureTerminalExists()) {
			selectTerminal().then(terminal => terminal.hide());
		}
	}));

	// Terminal.show
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.show', () => {
		if (ensureTerminalExists()) {
			selectTerminal().then(terminal => terminal.show());
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.showPreserveFocus', () => {
		if (ensureTerminalExists()) {
			selectTerminal().then(terminal => terminal.show(true));
		}
	}));

	// Terminal.sendText
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.sendText', () => {
		if (ensureTerminalExists()) {
			selectTerminal().then(terminal => terminal.sendText("echo 'Hello world!'"));
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.sendTextNoNewLine', () => {
		if (ensureTerminalExists()) {
			selectTerminal().then(terminal => terminal.sendText("echo 'Hello world!'", false));
		}
	}));

	// Terminal.dispose
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.dispose', () => {
		if (ensureTerminalExists()) {
			selectTerminal().then(terminal => {
				if (terminal) {
					terminal.dispose();
				}
			});
		}
	}));

	// Terminal.processId
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.processId', () => {
		selectTerminal().then(terminal => {
			terminal.processId.then((processId) => {
				if (processId) {
					vscode.window.showInformationMessage(`Terminal.processId: ${processId}`);
				} else {
					vscode.window.showInformationMessage('Terminal does not have a process ID');
				}
			});
		});
	}));

	// vscode.window.onDidCloseTerminal
	vscode.window.onDidCloseTerminal((terminal) => {
		vscode.window.showInformationMessage(`onDidCloseTerminal, name: ${terminal.name}`);
	});


	// vvv Proposed APIs in 1.23 below vvv


	// vscode.window.terminals
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.terminals', () => {
		selectTerminal();
	}));

	// vscode.window.onDidOpenTerminal
	if ('onDidOpenTerminal' in vscode.window) {
		(<any>vscode.window).onDidOpenTerminal((terminal: vscode.Terminal) => {
			vscode.window.showInformationMessage(`onDidOpenTerminal, name: ${terminal.name}`);
		});
	}
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.onData', () => {
		selectTerminal().then(terminal => {
			vscode.window.showInformationMessage(`onData listener attached for terminal: ${terminal.name}, check the devtools console to see events`);
			(<any>terminal).onData((data: string) => {
				console.log('onData: ' + data);
			});
		});
	}));

	// vvv Proposed APIs in 1.25 below vvv
	let renderer;
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.terminalRendererCreate', () => {
		renderer = (<any>vscode.window).createTerminalRenderer('renderer');
		renderer.write(colorText('~~~ Hello world! ~~~'));
		renderer.onDidChangeMaximumDimensions(dim => {
			console.log(`Dimensions for renderer changed: columns=${dim.columns}, rows=${dim.rows}`);
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.terminalRendererName', () => {
		if (!renderer) {
			return;
		}
		vscode.window.showInputBox({ placeHolder: "Enter a new name" }).then(value => {
			if (!value) {
				return;
			}
			renderer.name = value;
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.terminalRendererWrite', () => {
		if (!renderer) {
			return;
		}
		vscode.window.showInputBox({ placeHolder: "Enter text to write" }).then(value => {
			if (!value) {
				return;
			}
			// Note that entering characters like `\r` in the input box will result in `\\r` being written
			renderer.write(value);
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.createFakeShell', () => {
		const shell = (<any>vscode.window).createTerminalRenderer('fake shell');
		shell.write('Type and press enter to echo the text\r\n\r\n');
		let line = '';
		shell.onInput(data => {
			if (data === '\r') {
				shell.write(`\r\necho: "${colorText(line)}"\r\n\n`);
				line = '';
				return;
			}
			line += data;
			shell.write(data);
		});
		shell.terminal.then(t => t.show());
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.maximumDimensions', () => {
		renderer.maximumDimensions.then(dimensions => {
			vscode.window.showInformationMessage(`TerminalRenderer.maximumDimensions: columns=${dimensions.columns}, rows=${dimensions.rows}`);
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.dimensions', () => {
		vscode.window.showInputBox({ placeHolder: "Enter columns" }).then(columns => {
			if (!columns) {
				return;
			}
			vscode.window.showInputBox({ placeHolder: "Enter rows" }).then(rows => {
				if (!rows) {
					return;
				}
				renderer.dimensions = { columns: parseInt(columns, 10), rows: parseInt(rows, 10) };
			});
		});
	}));
}

function colorText(text: string): string {
	let output = '';
	let colorIndex = 1;
	for (let i = 0; i < text.length; i++) {
		const char = text.charAt(i);
		if (char === ' ' || char === '\r' || char === '\n') {
			output += char;
		} else {
			output += `\x1b[3${colorIndex++}m${text.charAt(i)}\x1b[0m`;
			if (colorIndex > 6) {
				colorIndex = 1;
			}
		}
	}
	return output;
}

function selectTerminal(): Thenable<vscode.Terminal> {
	interface TerminalQuickPickItem extends vscode.QuickPickItem {
		terminal: vscode.Terminal;
	}
	const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
	const items: TerminalQuickPickItem[] = terminals.map(t => {
		return {
			label: `name: ${t.name}`,
			terminal: t
		};
	})
	return vscode.window.showQuickPick(items).then(item => {
		return item.terminal;
	});
}

function ensureTerminalExists(): boolean {
	if ((<any>vscode.window).terminals.length === 0) {
		vscode.window.showErrorMessage('No active terminals');
		return false;
	}
	return true;
}