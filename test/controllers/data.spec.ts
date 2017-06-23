import test from 'ava';
import * as mongoose from 'mongoose';
import { DataController } from '../../src/controllers';
import DatabaseManager from '../../src/database/databaseManager';
import * as DataSchema from '../../src/database/dataSchema';
import { MongoDatabase } from '../../src/database/mongo';
import { mongoContains } from '../testUtils';

interface TestContext {
    db: MongoDatabase;
    courseId: string;
    userId: string;
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
/*
    videoId: String,
    courseId: String,
    timestamp: Number,
    clicks: [Object],
*/
const mockDenselogsData: DataSchema.DenseLog[] = [
    { videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 0, clicks: [] },
    { videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 1, clicks: [] },
    { videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 2, clicks: [] },
    { videoId: '5d4be18bb92a41be8de2b82a6b1a7687', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 3, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 0, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 1, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 2, clicks: [] },
    { videoId: '06da6aa72f894c2a86ae0b06eceadaa5', courseId: 'HKPOLYU+IL1001+2016_Q4_R0', timestamp: 3, clicks: [] },
];

const mockForumData: DataSchema.Forum[] = [
    {
        courseId: 'HKPOLYU+IL1001+2016_Q4_R0',
        originalId: '53b2770e2b8b56e8fe0006ce',
        sentiment: -0.4696, authorId: '4163045', createdAt: 1403852315447,
        parentId: null, commentThreadId: '53acf3242b8b5655e40004c0', type: 'Comment',
        updatedAt: 1403852315447,
        body: 'Getting problem in compiling............package comp102x does not exist....\n\
        \nCan I do this task by using methods available in the standard IO package (java.io)??\
        or Scanner class etc??', threadType: null, title: null,
    },
    {
        courseId: 'HKPOLYU+IL1001+2016_Q4_R0',
        originalId: '53ed862a86d3297497001525',
        sentiment: 0, authorId: '2462790', createdAt: 1406477227926,
        parentId: '53d310de86d329bf9400102e', commentThreadId: '53d2d80b2b8b56cced001043',
        type: 'Comment', updatedAt: 1406477227926,
        body: 'I had almost same mistake and corrected, but 3 minutes after deadline. \
        Anyway, it works after testing.', threadType: null, title: null,
    },
    {
        courseId: 'HKPOLYU+IL1001+2016_Q4_R0',
        originalId: '5649da9990ef9ad1ef00030d',
        sentiment: -0.17745, authorId: '4573581', createdAt: 1405097895532,
        parentId: null, commentThreadId: null, type: 'CommentThread',
        updatedAt: 1405097895532,
        body: 'Week 4, task 3, shows the correct answer as wrong and, at the end,\
         if you have used the 2 attempts, it shows the correct answer, that was marked\
          wrong as right. Please correct this!', threadType: 'Discussion', title: '4573581',
    },
    {
        courseId: 'HKPOLYU+IL1001+2016_Q4_R0',
        originalId: '53c8e1d186d329ac89000db7',
        sentiment: 0, authorId: '4582262', createdAt: 1403973061106,
        parentId: null, commentThreadId: '53acc1ea86d3297728000506', type: 'Comment',
        updatedAt: 1403973061106, body: 'Line 2: Class should be class\n\nLine 6: \
        IO-output should be IO_output and ended with ; not a ,\n\nline 12: fahranhet should be fahrenheit\
         as line 10 suggests and a ; added at the end of the statement ', threadType: null, title: null,
    },
];

const mockSocialNetworkData: DataSchema.SocialNetwork[] = [{
    courseId: 'HKPOLYU+IL1001+2016_Q4_R0',
    socialNetwork: [
        { userId1: '1', userId2: '2', edgeWeight: 0.2 },
        { userId1: '1', userId2: '3', edgeWeight: 0.4 },
        { userId1: '1', userId2: '4', edgeWeight: 0.6 },
        { userId1: '1', userId2: '5', edgeWeight: 0.8 },
        { userId1: '2', userId2: '3', edgeWeight: 0.4 },
        { userId1: '2', userId2: '4', edgeWeight: 0.2 },
        { userId1: '2', userId2: '5', edgeWeight: 0.6 },
        { userId1: '3', userId2: '4', edgeWeight: 1 },
        { userId1: '3', userId2: '5', edgeWeight: 0.4 },
        { userId1: '4', userId2: '5', edgeWeight: 0.2 },
    ],
    activeness: {
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 10,
    },
    activenessRange: [1, 10],
}];

let mongo: mongoose.Connection;
const host = 'localhost';
const name = 'test-data-controller';
const port = 27017;

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

    const ForumTable = mongo.model(DataSchema.FORUM, DataSchema.ForumSchema);
    await ForumTable.insertMany(mockForumData);

    const SocialNetworkTable = mongo.model(DataSchema.SOCIALNETWORK, DataSchema.SocialNetworkSchema);
    await SocialNetworkTable.insertMany(mockSocialNetworkData);
});

test.beforeEach('connect to db', async (t) => {
    const db = new MongoDatabase(host, port, name);
    await db.open();
    db.model(DataSchema.COURSES, DataSchema.CourseSchema);
    db.model(DataSchema.ENROLLMENTS, DataSchema.EnrollmentSchema);
    db.model(DataSchema.USERS, DataSchema.UserSchema);
    db.model(DataSchema.VIDEOS, DataSchema.VideoSchema);
    db.model(DataSchema.LOGS, DataSchema.LogsSchema);
    db.model(DataSchema.DENSELOGS, DataSchema.DenseLogsSchema);
    db.model(DataSchema.FORUM, DataSchema.ForumSchema);
    db.model(DataSchema.SOCIALNETWORK, DataSchema.SocialNetworkSchema);
    t.context = {
        db,
    };
});

test.afterEach.always('close connection to db', async (t) => {
    await t.context.db.close();
});

test.after('drop database', async (t) => {
    await mongo.dropDatabase();
});

test('DataController#constructor', async (t) => {
    const { db } = t.context as TestContext;
    t.throws(() => new DataController(undefined), `The database should not be ${undefined}`,
        'should throw error if try to use undefined to init the controller');
    t.throws(() => new DataController(null), `The database should not be ${null}`,
        'should throw error if try to use null to init the controller');

    t.notThrows(() => new DataController(db), 'init the dataController');
});

test('DataController#getCoursesByList', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    let courseList = ['HKPOLYU+IL1001+2016_Q4_R0', 'HKPOLYU+IL1001+2016_Q4_R1'];
    let output = await dataController.getCoursesByList(courseList);
    let groundTruth = mockCourseData.filter(d => courseList.indexOf(d.originalId) !== -1);
    // console.info(output, groundTruth);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    courseList = ['HKPOLYU+IL1001+2016_Q4_R3', 'asdf'];
    output = await dataController.getCoursesByList(courseList);
    groundTruth = mockCourseData.filter(d => courseList.indexOf(d.originalId) !== -1);
    // console.info(output, groundTruth);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getCoursesById', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    let output = await dataController.getCoursesById(courseId);
    let groundTruth = mockCourseData.filter(d => d.originalId === courseId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    const wrongCourseId = 'asdf';
    output = await dataController.getCoursesById(wrongCourseId);
    groundTruth = mockCourseData.filter(d => d.originalId === wrongCourseId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be 0');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getUserGradesByCourseId', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    const output = await dataController.getUserGradesByCourseId(courseId);
    const groundTruth = mockCourseData.find(d => d.originalId === courseId);
    for (const key of output.keys()) {
        t.is(output.get(key), groundTruth.grades[key],
            'the user grade of output should be the same as groundTruth of mockCourseData');
    }
});

test('DataController#getUsersById', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const userId = '236';
    let output = await dataController.getUsersById(userId);
    let groundTruth = mockUserData.filter(d => d.originalId === userId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockUserData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    const wrongUserId = 'asdf';
    output = await dataController.getUsersById(wrongUserId);
    groundTruth = mockUserData.filter(d => d.originalId === wrongUserId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be 0');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getActivenessByUserId', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    let userId = '236';
    let courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    let output = await dataController.getActivenessByUserId(courseId, userId);
    let groundTruth = mockUserData.find(d => d.originalId === userId);
    t.is(output, groundTruth.activeness[courseId],
        'the content of output should be the same as groundTruth of mockUserData',
    );

    userId = '951';
    courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    output = await dataController.getActivenessByUserId(courseId, userId);
    groundTruth = mockUserData.find(d => d.originalId === userId);
    t.is(output, groundTruth.activeness[courseId],
        'the content of output should be the same as groundTruth of mockUserData',
    );

    userId = 'asdf';
    courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    output = await dataController.getActivenessByUserId(courseId, userId);
    t.falsy(output, 'the content of output should be empty');
});

test('DataController#getAllUsers', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const output = await dataController.getAllUsers();
    const groundTruth = mockUserData;
    // console.info(output, groundTruth);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getUsersByList', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    let userList = ['37', '40', '236'];
    let output = await dataController.getUsersByList(userList);
    let groundTruth = mockUserData.filter(d => userList.indexOf(d.originalId) !== -1);
    // console.info(output, groundTruth);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    userList = ['40', 'asdf'];
    output = await dataController.getUsersByList(userList);
    groundTruth = mockUserData.filter(d => userList.indexOf(d.originalId) !== -1);
    // console.info(output, groundTruth);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getVideosById', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const videoId = '5d4be18bb92a41be8de2b82a6b1a7687';
    let output = await dataController.getVideosById(videoId);
    let groundTruth = mockVideoData.filter(d => d.originalId === videoId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockUserData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    const wrongVideoId = 'asdf';
    output = await dataController.getVideosById(wrongVideoId);
    groundTruth = mockVideoData.filter(d => d.originalId === wrongVideoId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be 0');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getVideosByList', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    let videoList = ['06da6aa72f894c2a86ae0b06eceadaa5', '5d4be18bb92a41be8de2b82a6b1a7687'];
    let output = await dataController.getVideosByList(courseId, videoList);
    let groundTruth = mockVideoData.filter(d => videoList.indexOf(d.originalId) !== -1);
    // console.info(output, groundTruth);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    videoList = ['this is a wrong video id', '5d4be18bb92a41be8de2b82a6b1a7687'];
    output = await dataController.getVideosByList(courseId, videoList);
    groundTruth = mockVideoData.filter(d => videoList.indexOf(d.originalId) !== -1);
    // console.info(output, groundTruth);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getUsersByList', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    let userList = ['37', '40', '236'];
    let output = await dataController.getUsersByList(userList);
    let groundTruth = mockUserData.filter(d => userList.indexOf(d.originalId) !== -1);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    userList = ['40', 'asdf'];
    output = await dataController.getUsersByList(userList);
    groundTruth = mockUserData.filter(d => userList.indexOf(d.originalId) !== -1);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].originalId, groundTruth[i].originalId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getCourseById', async (t) => {
    const { db } = t.context as TestContext;

    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    const dataController = new DataController(db);
    let output = await dataController.getCourseById(courseId);
    t.false(Array.isArray(output), 'shouldn\'t return an array');
    const groundTruth = mockCourseData.find(d => d.originalId === courseId);
    t.is(output.originalId, groundTruth.originalId,
        `groundTruth should be a subset of output`);
    // `${JSON.stringify(groundTruth)} should be a subset of ${JSON.stringify(output)}`);

    const wrongUserId = 'asdf';
    output = await dataController.getCourseById(wrongUserId);
    t.false(Array.isArray(output), 'should return an array');
    t.falsy(output, 'the output should be nullable');
});

test('DataController#getUserById', async (t) => {
    const { db } = t.context as TestContext;
    const userId = '236';
    const dataController = new DataController(db);
    let output = await dataController.getUserById(userId);
    t.false(Array.isArray(output), 'should return an array');
    const groundTruth = mockUserData.find(d => d.originalId === userId);
    t.true(mongoContains(output, groundTruth), 'groundTruth should be a subset of output');

    const wrongUserId = 'asdf';
    output = await dataController.getUserById(wrongUserId);
    t.false(Array.isArray(output), 'should return an array');
    t.falsy(output, 'the output should be nullable');
});

test('DataController#getUserByName', async (t) => {
    const { db } = t.context as TestContext;
    const username = 'Dennis';
    const dataController = new DataController(db);
    let output = await dataController.getUserByUsername(username);
    t.false(Array.isArray(output), 'should return an array');
    const groundTruth = mockUserData.find(d => d.username === username);
    t.true(mongoContains(output, groundTruth), 'groundTruth should be a subset of output');

    const wrongUsername = 'asdf';
    output = await dataController.getUserByUsername(wrongUsername);
    t.false(Array.isArray(output), 'should return an array');
    t.falsy(output, 'the output should be nullable');
});

test('DataController#getDenselogsById', async (t) => {
    const { db } = t.context as TestContext;
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    const videoId = '06da6aa72f894c2a86ae0b06eceadaa5';
    const dataController = new DataController(db);
    let output = await dataController.getDenselogsById(courseId, videoId);
    t.true(Array.isArray(output), 'should return an array');
    let groundTruth = mockDenselogsData.filter(d => d.courseId === courseId && d.videoId === videoId);
    // console.info(output, groundTruth);
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].videoId, groundTruth[i].videoId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
        t.is(output[i].courseId, groundTruth[i].courseId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }

    const wrongVideoId = '06da6aa72f894c2a86ae0b06ecezzzzzz';
    output = await dataController.getDenselogsById(courseId, wrongVideoId);
    t.true(Array.isArray(output), 'should return an array');
    groundTruth = mockDenselogsData.filter(d => d.courseId === courseId && d.videoId === wrongVideoId);
    // console.info(output, groundTruth);
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockCourseData');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].videoId, groundTruth[i].videoId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
        t.is(output[i].courseId, groundTruth[i].courseId,
            'the content of output should be the same as groundTruth of mockCourseData',
        );
    }
});

test('DataController#getSocialNetwork', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    let output = await dataController.getSocialNetwork(courseId);
    t.is(output.courseId, courseId, 'the courseId of output should be equal to the courseId in your query');
    t.truthy(output.activeness, 'the activeness of output should be a solid value');
    t.truthy(output.activenessRange, 'the activenessRange of output should be a solid value');
    t.truthy(output.socialNetwork, 'the socialNetwork of output should be a solid value');

    const wrongCourseId = 'asdf';
    output = await dataController.getSocialNetwork(wrongCourseId);
    t.falsy(output, 'query with wrong courseId should return null value');
});

test('DataController#getSocialNetworkCached', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    DatabaseManager.initCacheDatabase();
    let output = await dataController.getSocialNetworkCached(courseId);
    let output2 = await dataController.getSocialNetworkCached(courseId);
    t.deepEqual(output.activeness, output2.activeness, 'two outputs should be same');
    t.deepEqual(output.activenessRange, output2.activenessRange, 'two outputs should be same');
    t.deepEqual(output.courseId, output2.courseId, 'two outputs should be same');
    t.deepEqual(output.socialNetwork, output2.socialNetwork, 'two outputs should be same');

    const wrongCourseId = 'asdf';
    output = await dataController.getSocialNetworkCached(wrongCourseId);
    output2 = await dataController.getSocialNetworkCached(wrongCourseId);
    t.true(output === output2, 'two outputs should be same');
});

test('DataController#getSentimentById', async (t) => {
    const { db } = t.context as TestContext;
    const dataController = new DataController(db);
    const courseId = 'HKPOLYU+IL1001+2016_Q4_R0';
    let output = await dataController.getSentimentById(courseId);
    let groundTruth = mockForumData.filter(d => d.courseId === courseId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be the same as groundTruth of mockForumData');
    // console.info('sentimentTest', output, groundTruth);
    for (let i = 0, len = output.length; i < len; ++i) {
        t.is(output[i].courseId, groundTruth[i].courseId,
            'the content of output should be the same as groundTruth of mockForumData',
        );
        t.is(output[i].createdAt, groundTruth[i].createdAt,
            'the content of output should be the same as groundTruth of mockForumData',
        );
        t.is(output[i].sentiment, groundTruth[i].sentiment,
            'the content of output should be the same as groundTruth of mockForumData',
        );
    }

    const wronCourseId = 'asdf';
    output = await dataController.getSentimentById(wronCourseId);
    groundTruth = mockForumData.filter(d => d.courseId === wronCourseId);
    t.true(Array.isArray(output), 'should return an array');
    t.is(output.length, groundTruth.length, 'the length of output should be 0');
});
