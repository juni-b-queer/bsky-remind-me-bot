import {PostHandler} from "../abstract-handler.ts";
import {InputContainsValidator} from "../../validators/string-validators.ts";
import {ReplyWithInputAction} from "../../actions/reply-actions.ts";



export let SixtyNineHandler = new PostHandler(
    [new InputContainsValidator(' 69 ')],
    [new ReplyWithInputAction('Nice. 😎')],
    true
)
