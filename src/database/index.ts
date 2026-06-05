import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from './schema'
import { createPool } from 'mysql2/promise'
import {JetstreamReply} from "bsky-event-handlers";
import {posts, PostType, PostTypesEnum} from "./schema";
import {eq} from "drizzle-orm";
import {inArray} from "drizzle-orm/sql/expressions/conditions";



// dotenv.config({ path: path.join(__dirname, '../../.env') })

const pool = createPool({
    uri: <string>Bun.env.DATABASE_URL,
})

// Initialize Drizzle with schema
export const db = drizzle(pool, { schema, mode: 'default' })


export interface SaveReminderParams {
    cid: string,
    uri: string,
    did: string,
    reply: JetstreamReply,
    messageText: string,
    reminderDate: Date,
    silent: boolean,
    postType: PostTypesEnum | null,
    timezone: string
}

export class DBClient {
    constructor(private readonly drizzleClient: typeof db) {}

    public get db() {
        return this.drizzleClient
    }

    public async saveReminder(saveReminderParams: SaveReminderParams) {
        try {
            await this.db.insert(posts).values({
                cid: saveReminderParams.cid,
                uri: saveReminderParams.uri,
                did: saveReminderParams.did,
                reply: saveReminderParams.reply,
                messageText: saveReminderParams.messageText,
                reminderDate: saveReminderParams.reminderDate,
                silent: saveReminderParams.silent,
                postType: saveReminderParams.postType,
                timezone: saveReminderParams.timezone,
                createdAt: new Date(),
                modifiedAt: new Date()
            })
        } catch (e) {
            console.log(e)
        }
    }

    public async getPostFromCid(cid: string){
        return await this.db.query.posts.findFirst({
            where: eq(posts.cid, cid)
        })
    }

    public async getPostsToRemind(): Promise<PostType[]>{
        const now = new Date()
        const posts = await this.db.query.posts.findMany({
            where: (posts, { and, lte, isNull, eq, or }) => and(
                lte(posts.reminderDate, now),
                isNull(posts.repliedAt),
                or(eq(posts.postType, PostTypesEnum.REMINDER), isNull(posts.postType)),
            )
        });

        return posts as PostType[]

    }

    public async getPostsToRepost(): Promise<PostType[]>{
        const now = new Date()
        const posts = await this.db.query.posts.findMany({
            where: (posts, { and, lte, isNull, eq }) => and(
                lte(posts.reminderDate, now),
                isNull(posts.repliedAt),
                eq(posts.postType, PostTypesEnum.REPOST)
            )
        });

        return posts as PostType[]

    }

    public async getPostsToDelete(): Promise<PostType[]>{
        const now = new Date()
        const posts = await this.db.query.posts.findMany({
            where: (posts, { and, lte, isNull, eq }) => and(
                lte(posts.reminderDate, now),
                isNull(posts.repliedAt),
                eq(posts.postType, PostTypesEnum.DELETE)
            )
        });

        return posts as PostType[]

    }

    public async updateRemindedPosts(remindedPosts: PostType[]) {
        const now = new Date();

        if (remindedPosts.length === 0) {
            return; // Nothing to update
        }

        // Get all post IDs that were reminded
        const postIds = remindedPosts.map(post => post.id);

        // Update all matching posts in a single query
        await this.db.update(posts)
            .set({ repliedAt: now })
            .where(inArray(posts.id, postIds));

        return postIds.length; // Return the count of updated posts
    }

}

export const dbClient = new DBClient(db)
