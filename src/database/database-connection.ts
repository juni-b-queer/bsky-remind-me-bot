import {DataTypes, Sequelize} from "sequelize";
import {PostDetails} from "../utils/legacy-utils.ts";
import {Reply} from "bsky-event-handlers";

export const sequelize = new Sequelize(<string>Bun.env.DB_DATABASE, <string>Bun.env.DB_USERNAME, <string>Bun.env.DB_PASSWORD, {
    host: <string>Bun.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

export type PostAttributes = {
    id: number,
    cid: string,
    uri: string,
    did: string,
    postDetails: PostDetails | null,
    reply: Reply | null,
    messageTest: string | null,
    reminderDate: string,
    repliedAt: string,
    timezone: string,
}

export const Post = sequelize.define('Post', {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    cid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    uri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    did: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postDetails: {
        type: DataTypes.JSON,
        allowNull: true
    },
    reply: {
        type: DataTypes.JSON,
        allowNull: true
    },
    messageText: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reminderDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    repliedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    timezone: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    // Other model options go here
});



