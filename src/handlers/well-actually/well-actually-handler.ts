import {PostHandler} from "../abstract-handler.ts";
import {REPLIES} from "./well-actually-replies.ts";
import {InputStartsWithValidator} from "../../validators/string-validators.ts";
import {ReplyWithGeneratedTextAction} from "../../actions/reply-actions.ts";
import {LogPostDetailsAction} from "../../actions/logging-actions.ts";

export let WellActuallyHandler = new PostHandler(
    [new InputStartsWithValidator('wellactually')],
    [new ReplyWithGeneratedTextAction(()=> `well actually ${REPLIES[Math.floor(Math.random() * (REPLIES.length - 1))]}`), new LogPostDetailsAction()],
    true
)
