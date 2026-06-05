import {
    CreateLikeAction, DeleteSkeetAction,
    HandlerAgent,
    InputIsCommandValidator,
    IsNewPost,
    JetstreamEventCommit, LogMessageAction,
    MessageHandler, PostedByUserValidator
} from "bsky-event-handlers";
import {
    InsertRepostOrDeleteIntoDatabase,
} from "../database/database-handler-actions.ts";
import {PostTypesEnum} from "../database/schema.ts";

const DELETE_COMMAND = <string>Bun.env.DELETE_ME_COMMAND ?? "DeleteMe"

export class DeleteMeHandler extends MessageHandler{
    constructor(
        public handlerAgent: HandlerAgent,
    ) {
        super(
            [
                PostedByUserValidator.make(handlerAgent.getDid),
                IsNewPost.make(),
                InputIsCommandValidator.make(DELETE_COMMAND, false)
            ],
            [
                new CreateLikeAction(MessageHandler.getUriFromMessage, MessageHandler.getCidFromMessage),
                new InsertRepostOrDeleteIntoDatabase(DELETE_COMMAND, PostTypesEnum.DELETE),
                new DeleteSkeetAction(MessageHandler.getUriFromMessage)
            ],
            handlerAgent,
        );
    }

    async handle(handlerAgent:HandlerAgent, message: JetstreamEventCommit): Promise<void> {
        return super.handle(handlerAgent, message);
    }
}