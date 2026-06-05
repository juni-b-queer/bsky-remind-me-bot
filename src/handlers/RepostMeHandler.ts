import {
    CreateLikeAction, DeleteSkeetAction,
    HandlerAgent,
    InputIsCommandValidator,
    IsNewPost,
    JetstreamEventCommit,
    MessageHandler, PostedByUserValidator
} from "bsky-event-handlers";
import {
    InsertRepostOrDeleteIntoDatabase
} from "../database/database-handler-actions.ts";
import {PostTypesEnum} from "../database/schema.ts";

const REPOST_COMMAND = <string>Bun.env.REPOST_ME_COMMAND ?? "RepostMe"

export class RepostMeHandler extends MessageHandler{
    constructor(
        public handlerAgent: HandlerAgent,
    ) {
        super(
            [
                PostedByUserValidator.make(handlerAgent.getDid),
                IsNewPost.make(),
                InputIsCommandValidator.make(REPOST_COMMAND, false)
            ],
            [

                new CreateLikeAction(MessageHandler.getUriFromMessage, MessageHandler.getCidFromMessage),
                new InsertRepostOrDeleteIntoDatabase(REPOST_COMMAND, PostTypesEnum.REPOST),
                new DeleteSkeetAction(MessageHandler.getUriFromMessage)
            ],
            handlerAgent,
        );
    }

    async handle(handlerAgent:HandlerAgent, message: JetstreamEventCommit): Promise<void> {
        return super.handle(handlerAgent, message);
    }
}