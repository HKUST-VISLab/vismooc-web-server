import test from 'ava';
import * as Koa from 'koa';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { DataController } from '../../src/controllers';
import * as DataSchema from '../../src/database/dataSchema';
import { MongoDatabase } from '../../src/database/mongo';
import getCourseRouters from '../../src/routes/getCourse';
import { mongoContains } from '../testUtils';

interface TestContext {
    app: Koa;
}

const mockCourseData: DataSchema.Course[] = [
    {
        metaInfo: null, enrollmentEnd: null, instructor: ['5'],
        courseImageUrl: '/asset-v1:HKPOLYU+IL1001+2016_Q4_R0+type@asset+block@images_course_image.jpg',
        name: 'Information Literacy for University Students',
        videoIds: [
            '06da6aa72f894c2a86ae0b06eceadaa5',
            '5d4be18bb92a41be8de2b82a6b1a7687',
            '1e539f45a7364ad1bb1bae19df2a5a77',
        ],
        endDate: null, studentIds: ['83', '3', '5', '432', '342'], org: 'HKPOLYU',
        originalId: 'HKPOLYU+IL1001+2016_Q4_R0',
        startDate: 1893474000, description: 'NULL', enrollmentStart: null, status: null, year: null,
        url: null, grades: { 236: 100, 37: 95, 951: 15, 40: 70 },
    },
];

const mockVideoData: DataSchema.Video[] = [
    {
        originalId: '5d4be18bb92a41be8de2b82a6b1a7687', url: null,
        duration: null, description: null, name: null, temporalHotness: {},
        section: 'Module 2: Finding information to fulfill my research needs, A. Introduction, Building relevance',
    },
    {
        originalId: '06da6aa72f894c2a86ae0b06eceadaa5',
        duration: 141, description: 'Video', name: 'Video', temporalHotness: {},
        section: 'Module 1: Understanding my research task, A.  Introduction, Building relevance',
        url: 'https://www.youtube.com/watch?v=3_yD_cEKoCk',
    },
    {
        originalId: '1e539f45a7364ad1bb1bae19df2a5a77',
        duration: 194, description: 'Video', name: 'Video', temporalHotness: {},
        section: 'Module 2: Finding information to fulfill my research needs, D-4.\
            Engineering, Activity 2-4 Learn about different types of Engineering Info & Who makes & disseminates it',
        url: 'https://www.youtube.com/watch?v=i_jFERTtw2w',
    },
];

const mockUserData: DataSchema.User[] = [
    {
        location: '', originalId: '236', username: 'Tnecesoc', name: '',
        gender: '', language: '', bio: 'NULL',
        courseIds: ['HKUST+COMP1022P+2016_Q2_R1',
            'HKUST+EBA102+2016_Q3_R1',
            'HKUST+EBA101+2016_Q3_R1',
            'POLYU+mISE101+2016_Q3_R1',
        ],
        birthDate: null, country: '', droppedCourseIds: [], educationLevel: '', courseRoles: {},
        activeness: { 'HKPOLYU+IL1001+2016_Q4_R0': 10 },
    },
    {
        location: '', originalId: '37', username: 'ShengkeZhou', name: '',
        gender: 'm', language: '', bio: 'NULL', courseIds: [],
        birthDate: 694242000, country: '', droppedCourseIds: [], educationLevel: 'b', courseRoles: {},
        activeness: { 'HKPOLYU+IL1001+2016_Q4_R0': 200 },
    },
    {
        location: '', originalId: '951', username: 'Dennis', name: '',
        gender: 'm', language: '', bio: 'NULL', courseIds: ['HKUST+EBA101+2016_Q4_R1'],
        birthDate: 568011600, country: '', droppedCourseIds: [], educationLevel: 'b', courseRoles: {},
        activeness: { 'HKPOLYU+IL1001+2016_Q4_R0': 50 },
    },
    {
        location: '', originalId: '40', username: 'micktse', name: '',
        gender: 'm', language: '', bio: 'NULL', courseIds: [],
        birthDate: 757400400, country: '', droppedCourseIds: [], educationLevel: 'b', courseRoles: {},
        activeness: { 'HKPOLYU+IL1001+2016_Q4_R0': 144 },
    },
];

let mongo: mongoose.Connection;
const host = 'localhost';
const name = 'test-data-course-routes';
const port = 27017;
let db: MongoDatabase;

test.before(async (t) => {
    (mongoose as any).Promise = global.Promise;
    mongo = mongoose.createConnection(host, name, port);
    await mongo.dropDatabase();

    const CourseTable = mongo.model(DataSchema.COURSES, DataSchema.CourseSchema);
    await CourseTable.insertMany(mockCourseData);

    const VideoTable = mongo.model(DataSchema.VIDEOS, DataSchema.VideoSchema);
    await VideoTable.insertMany(mockVideoData);

    const UserTable = mongo.model(DataSchema.USERS, DataSchema.UserSchema);
    await UserTable.insertMany(mockUserData);

    db = new MongoDatabase(host, port, name);
    await db.open();
    db.model(DataSchema.COURSES, DataSchema.CourseSchema);
    db.model(DataSchema.ENROLLMENTS, DataSchema.EnrollmentSchema);
    db.model(DataSchema.USERS, DataSchema.UserSchema);
    db.model(DataSchema.VIDEOS, DataSchema.VideoSchema);
});

test.after.always('drop database', async (t) => {
    db.close();
    await mongo.dropDatabase();
});

test.beforeEach('New a koa server', async (t) => {
    const app: Koa = new Koa();
    app.use(errMiddleware);
    app.use(getCourseRouters.routes());

    app.context.dataController = new DataController(db);
    t.context = {
        app,
    };
});

const errMiddleware = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // will only respond with JSON
        ctx.status = err.statusCode || err.status || 500;
        ctx.response.status = ctx.status;
        ctx.body = {
            message: err.message,
        };
    }
};

test('CourseRouter#getCourseInfo', async (t) => {
    const { app } = t.context as TestContext;
    const req = request(app.listen());
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    const res = await req.get('/getCourseInfo').query({ courseId });
    const output = res.body;
    const groundTruthCourse = mockCourseData.find(d => d.originalId === courseId);
    const groundTruthVideos = mockVideoData.filter(d => groundTruthCourse.videoIds.find(vid => vid === d.originalId))
        .map((v) => ({
            courseId,
            name: v.name,
            id: v.originalId,
            duration: v.duration,
            url: v.url || '',
            section: v.section,
            temporalHotness: v.temporalHotness,
        }));
    const groundTruth = JSON.parse(JSON.stringify({
        id: groundTruthCourse.originalId,
        name: groundTruthCourse.name,
        instructor: groundTruthCourse.instructor,
        url: groundTruthCourse.url,
        image: groundTruthCourse.courseImageUrl,
        startDate: groundTruthCourse.startDate,
        endDate: groundTruthCourse.endDate,
        videos: groundTruthVideos,
        description: groundTruthCourse.description,
    }));
    t.deepEqual(output, groundTruth, 'the output should be equal to the groundTruth');
});

test('CourseRouter#getCourseList', async (t) => {
    const { app } = t.context as TestContext;
    const req = request(app.listen());
    const courseIds = ['HKPOLYU+IL1001+2016_Q4_R0'];
    const convertCourse = (c) => ({
        id: c.originalId,
        name: c.name,
        year: c.year,
    });

    let res = await req.get('/getCourseList');
    let output = res.body;
    t.falsy(output.selectedCourseId, 'the selectedCourseId of outputs should be empty if no OAuthReferer');
    t.deepEqual(output.coursesList, [], 'the coursesList should be an empty array if no session');

    (app.context as any).session = {};
    res = await req.get('/getCourseList');
    output = res.body;
    t.falsy(output.selectedCourseId, 'the selectedCourseId of outputs should be empty if no OAuthReferer');
    t.deepEqual(output.coursesList, [], 'the coursesList should be an empty array if no session in ctx');

    (app.context as any).session = { passport: {} };
    res = await req.get('/getCourseList');
    output = res.body;
    t.falsy(output.selectedCourseId, 'the selectedCourseId of outputs should be empty if no OAuthReferer');
    t.deepEqual(output.coursesList, [], 'the coursesList should be an empty array if no user in passport');

    (app.context as any).session = { passport: { user: {} } };
    res = await req.get('/getCourseList');
    output = res.body;
    t.falsy(output.selectedCourseId, 'the selectedCourseId of outputs should be empty if no OAuthReferer');
    t.deepEqual(output.coursesList, [], 'the coursesList should be an empty array if no permission in user');

    (app.context as any).session = {
        passport: {
            user: {
                permissions: courseIds.reduce((o, id) => {
                    o[id] = true;
                    return o;
                }, {}),
            },
        },
    };

    res = await req.get('/getCourseList');
    output = res.body;
    const groundTruth = mockCourseData.filter(d => courseIds.indexOf(d.originalId) !== -1).map(convertCourse);
    t.is(output.coursesList.length, groundTruth.length,
        'the length of output should be the same as groundTruth of mockUserData');
    t.deepEqual(output.coursesList, groundTruth, 'the course in output should be the same as groundTruth');

});

test('CourseRouter#getDemographicInfo', async (t) => {
    const { app } = t.context as TestContext;
    const req = request(app.listen());
    const cmp = (a, b) => (a.code3.localeCompare(b.code3));
    //     if (a.code3 === b.code3) {
    //         return 0;
    //     } else if (a.code3 < b.code3) {
    //         return -1;
    //     } else {
    //         return 1;
    //     }
    // };
    /*
    const course = await app.context.dataController.getCourseById(courseId);
    const studentIds: string[] = course.studentIds as string[];
    console.info("studentIds", studentIds);
    let ret = await mongo.model(DataSchema.USERS).find({originalId: "" + studentIds[0]});
    let ret2 = await mongo.model(DataSchema.USERS).find({});
    */

    let courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    const countryDist = {};
    for (const student of mockUserData.filter(d => d.courseIds.indexOf(courseId) !== -1)) {
        const country = student.country || 'CHN';
        if (!(country in countryDist)) {
            countryDist[country] = 0;
        }
        countryDist[country] += 1;
    }
    const groundTruth = Object.keys(countryDist).map((key) => ({
        code3: key,
        count: countryDist[key],
    })).sort(cmp);

    let res = await req.get('/getDemographicInfo').query({ courseId });
    let output = res.body.sort(cmp);
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockUserData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `groundTruth_${i} should be a subset of output_${i}`);
    }

    courseId = 'HKPOLYU IL1001 2016_Q4_R0';
    res = await req.get('/getDemographicInfo').query({ courseId });
    const output2 = res.body.sort(cmp);

    t.is(output.length, output2.length, 'the length of current output should be same as the first time\'s output');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], output2[i]), `current output_${i} should be same as the first output_${i}`);
    }

    courseId = 'asdf';
    res = await req.get('/getDemographicInfo').query({ courseId });
    output = res.body;
    t.falsy(output.length, 'the length of output should be 0');

    courseId = null;
    res = await req.get('/getDemographicInfo').query({ courseId });
    output = res.body;
    t.falsy(output.length, 'the length of output should be 0');
});

test('CourseRouter#already has body cache', async (t) => {
    const app: Koa = new Koa();
    const CachedData: { message: string } = {
        message: 'CACHED',
    };
    app.use(errMiddleware);
    app.use(async (ctx, next) => {
        ctx.body = CachedData;
        await next();
    });
    app.use(getCourseRouters.routes());
    const req = request(app.listen());
    let res = await req.get('/getCourseInfo');
    t.deepEqual(res.body, CachedData, 'the router\'s result should be cached');
    res = await req.get('/getCourseList');
    t.deepEqual(res.body, CachedData, 'the router\'s result should be cached');
    res = await req.get('/getDemographicInfo');
    t.deepEqual(res.body, CachedData, 'the router\'s result should be cached');
});
