import test from 'ava';
import * as crypto from 'crypto';
import * as Koa from 'koa';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { Logger, transports } from 'winston';
import { DataController } from '../../src/controllers';
import * as DataSchema from '../../src/database/dataSchema';
import { MongoDatabase } from '../../src/database/mongo';
import getVideoRouters from '../../src/routes/getVideo';

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
        id: 'HKPOLYU+IL1001+2016_Q4_R0',
        startDate: 1893474000, description: 'NULL', enrollmentStart: null, status: null, year: null,
        url: null, grades: { 236: 100, 37: 95, 951: 15, 40: 70 },
    },
];

const mockVideoData: DataSchema.Video[] = [
    {
        id: '5d4be18bb92a41be8de2b82a6b1a7687', url: null,
        duration: null, description: null, name: null, temporalHotness: {},
        section: 'Module 2: Finding information to fulfill my research needs, A. Introduction, Building relevance',
    },
    {
        id: '06da6aa72f894c2a86ae0b06eceadaa5',
        duration: 141, description: 'Video', name: 'Video', temporalHotness: {},
        section: 'Module 1: Understanding my research task, A.  Introduction, Building relevance',
        url: 'https://www.youtube.com/watch?v=3_yD_cEKoCk',
    },
    {
        id: '1e539f45a7364ad1bb1bae19df2a5a77',
        duration: 194, description: 'Video', name: 'Video', temporalHotness: {},
        section: 'Module 2: Finding information to fulfill my research needs, D-4.\
            Engineering, Activity 2-4 Learn about different types of Engineering Info & Who makes & disseminates it',
        url: 'https://www.youtube.com/watch?v=i_jFERTtw2w',
    },
];

const mockUserData: DataSchema.User[] = [
    {
        location: '', id: '236', username: 'Tnecesoc', name: '',
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
        location: '', id: '37', username: 'ShengkeZhou', name: '',
        gender: 'm', language: '', bio: 'NULL', courseIds: [],
        birthDate: 694242000, country: '', droppedCourseIds: [], educationLevel: 'b', courseRoles: {},
        activeness: { 'HKPOLYU+IL1001+2016_Q4_R0': 200 },
    },
    {
        location: '', id: '951', username: 'Dennis', name: '',
        gender: 'm', language: '', bio: 'NULL', courseIds: ['HKUST+EBA101+2016_Q4_R1'],
        birthDate: 568011600, country: '', droppedCourseIds: [], educationLevel: 'b', courseRoles: {},
        activeness: { 'HKPOLYU+IL1001+2016_Q4_R0': 50 },
    },
    {
        location: '', id: '40', username: 'micktse', name: '',
        gender: 'm', language: '', bio: 'NULL', courseIds: [],
        birthDate: 757400400, country: '', droppedCourseIds: [], educationLevel: 'b', courseRoles: {},
        activeness: { 'HKPOLYU+IL1001+2016_Q4_R0': 144 },
    },
];

const mockDenselogsData: DataSchema.DenseLog[] = [
    { videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 4000, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 1000, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 2000, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 3000, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 4000, clicks: [] },
    {
        videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 1000, clicks: [
            { userId: 531, path: '/event', type: 'load_video' },
            { userId: 845, path: '/event', type: 'load_video' },
            { path: '/event', userId: 845, currentTime: 0.08, type: 'play_video' },
            { path: '/event', userId: 845, currentTime: 429.8592, type: 'stop_video' },
            { userId: 531, path: '/event', type: 'load_video' },
            { userId: 531, path: '/event', type: 'load_video' },
        ],
    },
    {
        videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 2000, clicks: [
            { path: '/event', type: 'load_video' },
            { userId: 531, path: '/event', type: 'load_video' },
        ],
    },
    {
        videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 3000, clicks: [
            { userId: 778, path: '/event', type: 'load_video' },
            { userId: 1168, path: '/event', type: 'load_video' },
            { userId: 1168, path: '/event', type: 'load_video' },
        ],
    },
];

let mongo: mongoose.Connection;
const host = 'localhost';
const name = 'test-get-video-routes';
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

    const DenselogsTable = mongo.model(DataSchema.DENSELOGS, DataSchema.DenseLogsSchema);
    await DenselogsTable.insertMany(mockDenselogsData);

    db = new MongoDatabase(host, port, name);
    await db.open();
    db.model(DataSchema.COURSES, DataSchema.CourseSchema);
    db.model(DataSchema.USERS, DataSchema.UserSchema);
    db.model(DataSchema.VIDEOS, DataSchema.VideoSchema);
    db.model(DataSchema.LOGS, DataSchema.LogsSchema);
    db.model(DataSchema.DENSELOGS, DataSchema.DenseLogsSchema);
});

test.after.always('drop database', async (t) => {
    db.close();
    await mongo.dropDatabase();
});

test.beforeEach('New a koa server', async (t) => {
    const app: Koa = new Koa();
    app.use(errMiddleware);
    app.use(getVideoRouters.routes());

    app.context.dataController = new DataController(db);
    // loger
    app.context.logger = new Logger({
        level: 'debug',
        transports: [
            new (transports.Console)(),
        ],
    });
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

interface VideoRouterResponse {
    courseId: string;
    denseLogs: Array<{
        timestamp: number;
        clicks: any[];
    }>;
}

test('VideoRouter#click operators', async (t) => {
    const { app } = t.context as TestContext;
    const req = request(app.listen());
    const cmp = (a, b) => a.timestamp - b.timestamp;
    function checkOutputWithGroundTruth(msgPrefix, output: VideoRouterResponse,
                                        cId: string, vId: string, sDate?, eDate?) {
        if (cId && cId.indexOf(' ') !== -1) {
            cId = cId.replace(new RegExp(' ', 'gm'), '+');
        }
        const denseLogs = output.denseLogs;
        denseLogs.sort(cmp);
        const groundTruth = mockDenselogsData
            .filter(d => d.courseId === cId && d.videoId === vId &&
                (!sDate || d.timestamp >= sDate) && (!eDate || d.timestamp <= eDate))
            .sort(cmp).map((d) => Object.assign({}, d));
        for (let i = 0, len = denseLogs.length; i < len; ++i) {
            const item = denseLogs[i];
            for (const click of groundTruth[i].clicks) {
                delete click.path;
                if (click.userId) {
                    click.userId = crypto.createHash('md5').update(`${click.userId}`).digest('hex');
                }
            }
            delete groundTruth[i].courseId;
            delete groundTruth[i].videoId;

            t.deepEqual(item, groundTruth[i],
                `${msgPrefix}:the denseLogs_${i} should be the same as the groundTruth_${i}`);
        }
    }

    let startDate: number = 1000;
    let endDate: number = 4000;
    let courseId: string = 'HKPOLYU+IL1001+2016_Q4_R0';
    let videoId: string = '5d4be18bb92a41be8de2b82a6b1a7687';
    let res = await req.get('/getClicks')
        .query({
            courseId,
            videoId,
            startDate,
            endDate,
        });
    let output: VideoRouterResponse = res.body;
    checkOutputWithGroundTruth('in the whole time range', output, courseId, videoId, startDate, endDate);

    startDate = 2000;
    endDate = 3000;
    courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    videoId = '06da6aa72f894c2a86ae0b06eceadaa5';
    res = await req.get('/getClicks')
        .query({
            courseId,
            videoId,
            startDate,
            endDate,
        });
    output = res.body as VideoRouterResponse;
    checkOutputWithGroundTruth('within the time range', output, courseId, videoId, startDate, endDate);

    startDate = 3000;
    endDate = 1000;
    courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    videoId = '06da6aa72f894c2a86ae0b06eceadaa5';
    res = await req.get('/getClicks')
        .query({
            courseId,
            videoId,
            startDate,
            endDate,
        });
    output = res.body as VideoRouterResponse;
    checkOutputWithGroundTruth('not in the time range', output, courseId, videoId, startDate, endDate);

    courseId = 'HKPOLYU IL1001 2016_Q4_R0';
    videoId = '06da6aa72f894c2a86ae0b06eceadaa5';
    res = await req.get('/getClicks')
        .query({
            courseId,
            videoId,
            startDate,
            endDate,
        });
    output = res.body as VideoRouterResponse;
    checkOutputWithGroundTruth('courseId seperated by space', output, courseId, videoId);

    courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    videoId = '06da6aa72f894c2a86ae0b06eceadaa5';
    res = await req.get('/getClicks')
        .query({
            courseId,
            videoId,
        });
    output = res.body as VideoRouterResponse;
    checkOutputWithGroundTruth('no time range', output, courseId, videoId);

    courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    videoId = '06da6aa72f894c2a86ae0b06eceadaa5';
    res = await req.get('/getClicks');
    output = res.body as VideoRouterResponse;
    checkOutputWithGroundTruth('no courseId and videoId', output, null, null);
});

test('VideoRouter#with cache', async (t) => {
    const app: Koa = new Koa();
    const CachedData = {
        message: 'test',
    };
    app.use(errMiddleware);
    app.use(async (ctx, next) => {
        ctx.body = CachedData;
        await next();
    });
    app.use(getVideoRouters.routes());
    const req = request(app.listen());
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    const videoId = '06da6aa72f894c2a86ae0b06eceadaa5';
    const res = await req.get('/getClicks')
        .query({
            courseId,
            videoId,
        });
    const body = res.body;
    t.deepEqual(body, CachedData, 'the body should be equal to the TestBody');
});
