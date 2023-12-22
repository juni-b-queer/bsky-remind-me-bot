import {PostHandler, LogInputTextAction, LogPostDetailsAction, LogRepoOperationAction, InputStartsWithValidator} from "bsky-event-handlers";
// import {} from "../../validators/string-validators.ts";

export let TestHandler = new PostHandler(
    [new InputStartsWithValidator('h')],
    [new LogPostDetailsAction(), new LogRepoOperationAction(), new LogInputTextAction('Logged text')],
    false
)
