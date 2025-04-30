import {datetime, int, json, mysqlTable, serial, varchar} from "drizzle-orm/mysql-core";
import {PostDetails} from "../utils/legacy-utils.ts";
import {JetstreamReply} from "bsky-event-handlers";

export const posts = mysqlTable('Posts', {
    id: serial().autoincrement().notNull().primaryKey(),
    cid: varchar({ length: 255 }),
    uri: varchar({ length: 255 }),
    did: varchar({ length: 255 }),
    postDetails: json(),
    reply: json(),
    messageText: varchar({ length: 255 }),
    reminderDate: datetime({ mode: 'string'}),
    repliedAt: datetime({ mode: 'string'}),
    timezone: varchar({ length: 255 }),
    createdAt: datetime({ mode: 'string'}),
    updatedAt: datetime({ mode: 'string'}),
})

export type PostType = {
    id: number;
    cid: string;
    uri: string;
    did: string | null;
    postDetails: PostDetails | null;
    reply: JetstreamReply | null;
    messageText: string | null;
    reminderDate: string;
    repliedAt: Date | null;
    timezone: string;
    // Drizzle typically adds these fields
    createdAt?: Date;
    updatedAt?: Date;
};
