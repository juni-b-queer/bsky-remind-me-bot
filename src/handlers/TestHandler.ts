import {PostHandler, LogInputTextAction, LogPostDetailsAction, LogRepoOperationAction, InputStartsWithValidator} from "bsky-event-handlers";

export let TestHandler = new PostHandler(
    [new InputStartsWithValidator('h')],
    [new LogPostDetailsAction(), new LogRepoOperationAction(), new LogInputTextAction('Logged text')],
    false
)
