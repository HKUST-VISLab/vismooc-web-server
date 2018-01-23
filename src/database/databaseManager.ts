import * as mongoose from 'mongoose';
import * as DataSchema from '../database/dataSchema';
import { CONFIG } from '../init';
import { MongoDatabase, MongoModel } from './mongo';
import { Redis } from './redis';

let cacheDatabase: Redis;
let database: MongoDatabase;
let courseModel: MongoModel<DataSchema.Course, DataSchema.CourseModel>;
let enrollmentModel: MongoModel<DataSchema.Enrollment, DataSchema.EnrollmentModel>;
let userModel: MongoModel<DataSchema.User, DataSchema.UserModel>;
let videoModel: MongoModel<DataSchema.Video, DataSchema.VideoModel>;
let logModel: MongoModel<DataSchema.Log, DataSchema.LogModel>;
let denseLogModel: MongoModel<DataSchema.DenseLog, DataSchema.DenseLogModel>;
let forumModel: MongoModel<DataSchema.Forum, DataSchema.ForumModel>;
let socialNetworkModel: MongoModel<DataSchema.SocialNetwork, DataSchema.SocialNetworkModel>;

async function init() {
    await initMongo();
    await initCacheDatabase();
}

async function initCacheDatabase() {
    if (!cacheDatabase) {
        cacheDatabase = new Redis(CONFIG.redis);
        await cacheDatabase.flushall();
    }
}

async function initMongo() {
    if (!database) {
        (mongoose as any).Promise = global.Promise;
        const { host, port, name } = CONFIG.mongo;
        const db = new MongoDatabase(host, port, name);
        await db.open();
        console.info('open db success');
        courseModel = db.model<DataSchema.Course, DataSchema.CourseModel>(DataSchema.COURSES, DataSchema.CourseSchema);
        enrollmentModel = db.model<DataSchema.Enrollment, DataSchema.EnrollmentModel>(DataSchema.ENROLLMENTS,
            DataSchema.EnrollmentSchema);
        userModel = db.model<DataSchema.User, DataSchema.UserModel>(DataSchema.USERS, DataSchema.UserSchema);
        videoModel = db.model<DataSchema.Video, DataSchema.VideoModel>(DataSchema.VIDEOS, DataSchema.VideoSchema);
        logModel = db.model<DataSchema.Log, DataSchema.LogModel>(DataSchema.LOGS, DataSchema.LogsSchema);
        denseLogModel = db.model<DataSchema.DenseLog, DataSchema.DenseLogModel>(DataSchema.DENSELOGS,
            DataSchema.DenseLogsSchema);
        forumModel = db.model<DataSchema.Forum, DataSchema.ForumModel>(DataSchema.FORUM,
            DataSchema.ForumSchema);
        socialNetworkModel = db.model<DataSchema.SocialNetwork, DataSchema.SocialNetworkModel>(DataSchema.SOCIALNETWORK,
            DataSchema.SocialNetworkSchema);
        database = db;
    }
}

const DatabaseManager = {
    get CacheDatabase(): Redis {
        return cacheDatabase;
    },
    get Database(): MongoDatabase {
        return database;
    },
    get CourseModel() {
        return courseModel;
    },
    get EnrollmentModel() {
        return enrollmentModel;
    },
    get UserModel() {
        return userModel;
    },
    get VideoModel() {
        return videoModel;
    },
    get LogModel() {
        return logModel;
    },
    get DenseLogModel() {
        return denseLogModel;
    },
    get ForumModel() {
        return forumModel;
    },
    get SocialNetworkModel() {
        return socialNetworkModel;
    },
    initMongo,
    initCacheDatabase,
    init,
};

export default DatabaseManager;
export { MONGO } from './mongo';
// export { MYSQL } from "./mysql";
