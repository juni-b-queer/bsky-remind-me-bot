import {PostHandler} from "../abstract-handler.ts";
import {InputStartsWithValidator} from "../../validators/string-validators.ts";
import {LogInputTextAction, LogPostDetailsAction, LogRepoOperationAction} from "../../actions/logging-actions.ts";

export let TestHandler = new PostHandler(
    [new InputStartsWithValidator('h')],
    [new LogPostDetailsAction(), new LogRepoOperationAction(), new LogInputTextAction('Logged text')],
    true
)
