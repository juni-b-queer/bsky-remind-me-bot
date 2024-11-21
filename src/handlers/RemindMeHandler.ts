import {CreateSkeetHandler, CreateSkeetMessage, HandlerAgent, InputIsCommandValidator} from "bsky-event-handlers";
import {InsertPostReminderInToDatabase, ReplyWithDataFromDatabase} from "../database/database-handler-actions.ts";
import {PostAttributes} from "../database/database-connection.ts";
import moment from "moment-timezone";
moment.tz.link(
    require('../utils/tz.json').links
)

const COMMAND = <string>Bun.env.REMIND_ME_COMMAND ?? "RemindMe"

export class RemindMeHandler extends CreateSkeetHandler {
    constructor(
        public handlerAgent: HandlerAgent,
    ) {
        super(
            [new InputIsCommandValidator(COMMAND, false)],
            [
                new InsertPostReminderInToDatabase(COMMAND),
                new ReplyWithDataFromDatabase(responseGenerator)
            ],
            handlerAgent,
        );
    }

    async handle(message: CreateSkeetMessage): Promise<void> {
        return super.handle(message);
    }
}

// @ts-ignore
export function responseGenerator(post: PostAttributes) {
    let tz = post['timezone'] !== "" ? post['timezone'] : moment.tz("America/Chicago").zoneAbbr()
    return `Reminder set for ${generateHumanReadable(post['reminderDate'], tz)}`
}

export function generateHumanReadable(dateString: string | Date, timezone: string): string {
    let momentDate = moment.tz(dateString, timezone);
    return momentDate.format("MMM D, YYYY") + " at " + momentDate.format("HH:mmA") + ` ${timezone}`;
}