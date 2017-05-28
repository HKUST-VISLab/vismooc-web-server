import test from 'ava';
import * as Koa from 'koa';
import * as mongoose from 'mongoose';
import DataSchema from '../../src/database/dataSchema';
import Permission from '../../src/middlewares/permission';
import { MockReq, MockRes } from '../testUtils';
// import DatabaseManager from "../../src/database/databaseManager";

interface TestContext {
    ctx: Koa.Context;
    app: Koa;
}

const username = 'testUser';
const mockUsers = [{
    originalId: '123',
    username,
    name: 'wqer',
    language: 'en',
    location: 'hongkong',
    birthDate: 717177600000,
    educationLevel: 'graduated',
    bio: 'asdfasdf',
    gender: 'male',
    country: 'China',
    courseIds: ['course1', 'course2', 'course3'],
    droppedCourseIds: [],
    courseRoles: {
        course1: ['staff'],
        course2: ['instructor'],
        course3: ['student'],
    },
}];

test.before('init database', async (t) => {
    await mongoose.connect('mongodb://localhost:27017/test_permission');
    const table = mongoose.model(DataSchema.USERS, DataSchema.UserSchema);
    await table.insertMany(mockUsers);
});

test.after('drop database', async (t) => {
    await mongoose.connection.db.dropDatabase();
});

test.beforeEach('init app and ctx', (t) => {
    const app: Koa = new Koa();
    const ctx = app.createContext(new MockReq(), new MockRes());
    t.context = {
        app,
        ctx,
    };
});

test('permission#use', async (t) => {
    const { ctx } = t.context as TestContext;
    const middleware = Permission();
    let nextCount = 0;
    const next = () => {
        ++nextCount;
        return Promise.resolve({});
    };
    middleware(ctx, next);
    t.is(nextCount, 1, 'should call next once if no session');

    (ctx as any).session = {};
    middleware(ctx, next);
    t.is(nextCount, 2, 'should call next once if no session.passport');

    (ctx as any).session.passport = {};
    middleware(ctx, next);
    t.is(nextCount, 3, 'should call next once if no session.passport.user');

    // (ctx as any).session.passport.user = {};
    // middleware(ctx, next);
    // t.is(nextCount, 4, "should call next once if no session.passport.user is empty");

    // const permission = {
    //     course1: true,
    //     course2: true,
    //     course3: false,
    // };
    // (ctx as any).session.passport.user = { username };
    // middleware(ctx, next);
    // t.is(nextCount, 5, "should call next once if no session.passport.user is founded");
    // t.deepEqual(ctx.session.passport.user.permission, permission, "the permission should be set based on courseRole");
});
