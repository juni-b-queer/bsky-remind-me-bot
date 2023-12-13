import {DataTypes, Sequelize} from "sequelize";

export const sequelize = new Sequelize(<string>Bun.env.DB_DATABASE, <string>Bun.env.DB_USERNAME, <string>Bun.env.DB_PASSWORD, {
    host: <string>Bun.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});
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
    postDetails:{
      type: DataTypes.JSON,
      allowNull: false
    },
    reminderDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    repliedAt:{
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    // Other model options go here
});



