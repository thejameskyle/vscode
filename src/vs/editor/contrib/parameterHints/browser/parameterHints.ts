/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as nls from 'vs/nls';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { dispose } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ICommonCodeEditor, IEditorContribution, EditorKbExpr } from 'vs/editor/common/editorCommon';
import { KbExpr } from 'vs/platform/keybinding/common/keybinding';
import { KeybindingsRegistry } from 'vs/platform/keybinding/common/keybindingsRegistry';
import { withCodeEditorFromCommandHandler } from 'vs/editor/common/config/config';
import { ServicesAccessor, EditorAction, CommonEditorRegistry } from 'vs/editor/common/editorCommonExtensions';
import { ICodeEditor } from 'vs/editor/browser/editorBrowser';
import { EditorBrowserRegistry } from 'vs/editor/browser/editorBrowserExtensions';
import { SignatureHelpProviderRegistry } from 'vs/editor/common/modes';
import { ParameterHintsWidget } from './parameterHintsWidget';
import { Context } from '../common/parameterHints';

class ParameterHintsController implements IEditorContribution {

	static ID = 'editor.controller.parameterHints';

	static get(editor:ICommonCodeEditor): ParameterHintsController {
		return <ParameterHintsController>editor.getContribution(ParameterHintsController.ID);
	}

	private editor:ICodeEditor;
	private widget: ParameterHintsWidget;

	constructor(editor:ICodeEditor, @IInstantiationService instantiationService: IInstantiationService) {
		this.editor = editor;
		this.widget = instantiationService.createInstance(ParameterHintsWidget, this.editor);
	}

	getId(): string {
		return ParameterHintsController.ID;
	}

	cancel(): void {
		this.widget.cancel();
	}

	previous(): void {
		this.widget.previous();
	}

	next(): void {
		this.widget.next();
	}

	trigger(): void {
		this.widget.trigger();
	}

	dispose(): void {
		this.widget = dispose(this.widget);
	}
}

export class TriggerParameterHintsAction extends EditorAction {

	constructor() {
		super(
			'editor.action.triggerParameterHints',
			nls.localize('parameterHints.trigger.label', "Trigger Parameter Hints"),
			'Trigger Parameter Hints',
			false
		);

		this.kbOpts = {
			kbExpr: EditorKbExpr.TextFocus,
			primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Space
		};
	}

	public supported(accessor:ServicesAccessor, editor:ICommonCodeEditor): boolean {
		if (!super.supported(accessor, editor)) {
			return false;
		}
		return SignatureHelpProviderRegistry.has(editor.getModel());
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void {
		ParameterHintsController.get(editor).trigger();
	}
}

const weight = CommonEditorRegistry.commandWeight(75);

function handler(id: string, fn: (controller: ParameterHintsController) => void) {
	return accessor => withCodeEditorFromCommandHandler(id, accessor, editor => {
		fn(ParameterHintsController.get(editor));
	});
}

EditorBrowserRegistry.registerEditorContribution(ParameterHintsController);

CommonEditorRegistry.registerEditorAction(new TriggerParameterHintsAction());

KeybindingsRegistry.registerCommandDesc({
	id: 'closeParameterHints',
	handler: handler('closeParameterHints', c => c.cancel()),
	weight,
	when: KbExpr.and(EditorKbExpr.TextFocus, Context.Visible),
	primary: KeyCode.Escape,
	secondary: [KeyMod.Shift | KeyCode.Escape]
});

KeybindingsRegistry.registerCommandDesc({
	id: 'showPrevParameterHint',
	handler: handler('showPrevParameterHint', c => c.previous()),
	weight,
	when: KbExpr.and(EditorKbExpr.TextFocus, Context.Visible, Context.MultipleSignatures),
	primary: KeyCode.UpArrow,
	secondary: [KeyMod.Alt | KeyCode.UpArrow],
	mac: { primary: KeyCode.UpArrow, secondary: [KeyMod.Alt | KeyCode.UpArrow, KeyMod.WinCtrl | KeyCode.KEY_P] }
});

KeybindingsRegistry.registerCommandDesc({
	id: 'showNextParameterHint',
	handler: handler('showNextParameterHint', c => c.next()),
	weight,
	when: KbExpr.and(EditorKbExpr.TextFocus, Context.Visible, Context.MultipleSignatures),
	primary: KeyCode.DownArrow,
	secondary: [KeyMod.Alt | KeyCode.DownArrow],
	mac: { primary: KeyCode.DownArrow, secondary: [KeyMod.Alt | KeyCode.DownArrow, KeyMod.WinCtrl | KeyCode.KEY_N] }
});