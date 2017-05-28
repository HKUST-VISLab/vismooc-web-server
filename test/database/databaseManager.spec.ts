import test from 'ava';
import DatabaseManager from '../../src/database/databaseManager';
import { MongoDatabase } from '../../src/database/mongo';
import { Redis } from '../../src/database/redis';

test('DataManager#init', async (t) => {
    t.falsy(await DatabaseManager.CacheDatabase, 'before init, the CacheDatabase is null');
    t.falsy(await DatabaseManager.Database, 'before init, the Database is null');
    await DatabaseManager.init();
    t.truthy(DatabaseManager.CacheDatabase instanceof Redis, 'the CacheDatabase is an instance of Redis');
    t.truthy(DatabaseManager.Database instanceof MongoDatabase, 'the Database is an instance of BaseDatabase');

    const firstCacheDatabase = DatabaseManager.CacheDatabase;
    await DatabaseManager.initCacheDatabase();
    t.is(DatabaseManager.CacheDatabase, firstCacheDatabase, 'should be the same instance');

    const firstDatabase = DatabaseManager.Database;
    await DatabaseManager.initMongo();
    t.is(DatabaseManager.Database, firstDatabase, 'should be the same instance');

    const CourseModel = DatabaseManager.CourseModel;
    t.truthy(CourseModel, 'should have a valid model');
    const DenseLogModel = DatabaseManager.DenseLogModel;
    t.truthy(DenseLogModel, 'should have a valid model');
    const EnrollmentModel = DatabaseManager.EnrollmentModel;
    t.truthy(EnrollmentModel, 'should have a valid model');
    const LogModel = DatabaseManager.LogModel;
    t.truthy(LogModel, 'should have a valid model');
    const UserModel = DatabaseManager.UserModel;
    t.truthy(UserModel, 'should have a valid model');
    const VideoModel = DatabaseManager.VideoModel;
    t.truthy(VideoModel, 'should have a valid model');
});
