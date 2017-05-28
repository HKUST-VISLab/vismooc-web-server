import test from 'ava';
import * as mongoose from 'mongoose';
import * as DS from '../../src/database/dataSchema';
import { MongoDatabase, MongoModel } from '../../src/database/mongo';
import { mongoContains } from '../testUtils';

interface TestContext {
    db: MongoDatabase;
    model: MongoModel<DS.Enrollment, DS.EnrollmentModel>;
}

function sortData(a, b) {
    return a.timestamp - b.timestamp;
}

const mockData = [
    { userId: '0', courseId: '0', timestamp: 0, action: 'a' },
    { userId: '0', courseId: '0', timestamp: 1, action: 'a' },
    { userId: '1', courseId: '0', timestamp: 2, action: 'a' },
    { userId: '0', courseId: '1', timestamp: 3, action: 'a' },
    { userId: '1', courseId: '1', timestamp: 4, action: 'f' },
];

let mongo;
const host = 'localhost';
const port = 27017;
const name = 'test';

test.before('init db', async (t) => {
    (mongoose as any).Promise = global.Promise;

    mongo = mongoose.createConnection(host, name, port);
    const EnrollmentTable = mongo.model(DS.ENROLLMENTS, DS.EnrollmentSchema);
    await EnrollmentTable.insertMany(mockData);
});

test.beforeEach('new a db instance', async (t) => {
    const db = new MongoDatabase(host, port, name);
    await db.open();
    const model =  db.model<DS.Enrollment, DS.EnrollmentModel>(DS.ENROLLMENTS, DS.EnrollmentSchema);
    t.context = {
        db,
        model,
    };
});

test.afterEach.always('close a db instance', async (t) => {
    await t.context.db.close();
});

test.after.always('drop db', async (t) => {
    await mongo.dropDatabase();
});

test('MongoDatabase#constructor', (t) => {
    let db = new MongoDatabase();
    t.deepEqual(db.Type, 'MONGO', 'should be a mongo database');
    t.deepEqual(db.Name, 'vismooc', 'should be the default name');
    t.deepEqual(db.Host, 'localhost', 'should be the default host');
    t.deepEqual(db.Port, 27017, 'should be the default port');

    db = new MongoDatabase(host, port, name);
    t.deepEqual(db.Type, 'MONGO', 'should be a mongo database');
    t.deepEqual(db.Host, host, 'should be the given host');
    t.deepEqual(db.Port, port, 'should be the given port');
    t.deepEqual(db.Name, name, 'should be the given name');
});

test('MongoDatabase#open', async (t) => {
    const db = new MongoDatabase(host, port, name);
    await db.open();
    t.pass('Connect to db sucessed');
    /*
    const testPort: number = 80;
    db = new MongoDatabase(host, testPort, name);
    await t.throws(db.open(),
        new RegExp(`failed to connect to server [${host}:${testPort}] on first connect`),
        'throw an error if use the wrong parameters',
    );
    t.pass('Database open test successd');
    */
});

test('MongoDatabase#model', async (t) => {
    const db = new MongoDatabase(host, port, name);
    t.throws(() => db.model(DS.ENROLLMENTS), 'you should fristly open the database',
        'throw an error if no db has been opened');
    await db.open();
    t.throws(() => db.model(DS.ENROLLMENTS),
        `Schema hasn\'t been registered for model \"${DS.ENROLLMENTS}\".\nUse mongoose.model(name, schema)`,
        'should throw an error if the schema hasn\'t been registered');

    t.truthy(db.model(DS.ENROLLMENTS, DS.EnrollmentSchema) instanceof MongoModel, 'should return a MongoModel');
});

test('MongoDatabase#close', async (t) => {
    const db = new MongoDatabase(host, port, name);
    t.is(await db.close(), undefined, 'should do nothing if no db opened');
    await db.open();
    t.truthy(db.model(DS.ENROLLMENTS, DS.EnrollmentSchema) instanceof MongoModel,
        'should return a MongoModel');
    await db.close();
    t.throws(() => db.model(DS.ENROLLMENTS),
        'you should fristly open the database',
        'throw an error if no db has been opened',
    );
});

test('MongoModel#where', async (t) => {
    const { model } = t.context as TestContext;

    let output = await model.where('userId').equals('1').where('action', 'f').exec();

    let groundTruth = mockData.filter(d => d.userId === '1' && d.action === 'f');
    t.is(output.length, groundTruth.length, `the number of items in output should be ${groundTruth.length}`);
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    output = await model.where('userId').equals('0').where('action', 'a').exec();
    groundTruth = mockData.filter(d => d.userId === '0' && d.action === 'a');
    t.is(output.length, groundTruth.length, `the number of items in output should be ${groundTruth.length}`);
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoModel#all', async (t) => {
    const { model } = t.context as TestContext;
    const output = await model.all();

    const groundTruth = mockData;
    t.is(output.length, groundTruth.length, `the number of items in output should be ${groundTruth.length}`);
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#equals', async (t) => {
    const { model } = t.context as TestContext;

    // []
    let output = await model.where('timestamp').equals(2).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp === 2).sort(sortData);
    t.true(output.every(d => d.timestamp === 2), 'the timestamp of items should equal to 2');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    output = await model.where('userId').equals('1').exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.userId === '1').sort(sortData);
    t.true(output.every(d => d.userId === '1'), 'the userId of items should equal to 1');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#gt', async (t) => {
    const { model } = t.context as TestContext;

    // []
    let output = await model.where('timestamp').gt(2).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp > 2).sort(sortData);
    t.true(output.every(d => d.timestamp > 2), 'the timestamp of items should greater than 2');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >
    output = await model.where('timestamp').gt(10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp > 10).sort(sortData);
    t.true(output.every(d => d.timestamp > 10), 'the timestamp of items should greater than 10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >=
    output = await model.where('timestamp').gt(-10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp > -10).sort(sortData);
    t.true(output.every(d => d.timestamp > -10), 'the timestamp of items should greater than -10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#gte', async (t) => {
    const { model } = t.context as TestContext;

    // []
    let output = await model.where('timestamp').gte(2).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp >= 2).sort(sortData);
    t.true(output.every(d => d.timestamp >= 2), 'the timestamp of items should greater than or equal to 2');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >
    output = await model.where('timestamp').gte(10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp >= 10).sort(sortData);
    t.true(output.every(d => d.timestamp >= 10), 'the timestamp of items should greater than or equal to 10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >=
    output = await model.where('timestamp').gte(-10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp >= -10).sort(sortData);
    t.true(output.every(d => d.timestamp >= -10), 'the timestamp of items should greater than or equal to -10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#in', async (t) => {
    const { model } = t.context as TestContext;

    // []
    let output = await model.where('timestamp').in([0, 1]).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp === 0 || d.timestamp === 1).sort(sortData);
    t.true(output.every(d => d.timestamp === 0 || d.timestamp === 1), 'the timestamp of items should in {0, 1}');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >
    output = await model.where('timestamp').in([3, 4]).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp === 3 || d.timestamp === 4).sort(sortData);
    t.true(output.every(d => d.timestamp === 3 || d.timestamp === 4), 'the timestamp of items should in {3, 4}');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#lt', async (t) => {
    const { model } = t.context as TestContext;

    // []
    let output = await model.where('timestamp').lt(2).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp < 2).sort(sortData);
    t.true(output.every(d => d.timestamp < 2), 'the timestamp of items should lesser than or equal to 2');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >
    output = await model.where('timestamp').lt(10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp < 10).sort(sortData);
    t.true(output.every(d => d.timestamp < 10), 'the timestamp of items should lesser than or equal to 10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >=
    output = await model.where('timestamp').lt(-10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp < -10).sort(sortData);
    t.true(output.every(d => d.timestamp < -10), 'the timestamp of items should lesser than or equal to -10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#lte', async (t) => {
    const { model } = t.context as TestContext;

    // []
    let output = await model.where('timestamp').lte(2).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp <= 2).sort(sortData);
    t.true(output.every(d => d.timestamp <= 2), 'the timestamp of items should lesser than or equal to 2');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >
    output = await model.where('timestamp').lte(10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp <= 10).sort(sortData);
    t.true(output.every(d => d.timestamp <= 10), 'the timestamp of items should lesser than or equal to 10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >=
    output = await model.where('timestamp').lte(-10).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp <= -10).sort(sortData);
    t.true(output.every(d => d.timestamp <= -10), 'the timestamp of items should lesser than or equal to -10');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#ne', async (t) => {
    const { model } = t.context as TestContext;
    // []
    let output = await model.where('timestamp').ne(2).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp !== 2).sort(sortData);
    t.true(output.every(d => d.timestamp !== 2), 'the timestamp of items should not equal to 2');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    output = await model.where('userId').ne('1').exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.userId !== '1').sort(sortData);
    t.true(output.every(d => d.userId !== '1'), 'the userId of items should not equal to 1');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#nin', async (t) => {
    const { model } = t.context as TestContext;
    // []
    let output = await model.where('timestamp').nin([0, 1]).exec();
    output.sort(sortData);
    let groundTruth = mockData.filter(d => d.timestamp !== 0 && d.timestamp !== 1).sort(sortData);
    t.true(output.every(d => d.timestamp !== 0 && d.timestamp !== 1), 'the timestamp of items should not in {0, 1}');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    // >
    output = await model.where('timestamp').nin([3, 4]).exec();
    output.sort(sortData);
    groundTruth = mockData.filter(d => d.timestamp !== 3 && d.timestamp !== 4).sort(sortData);
    t.true(output.every(d => d.timestamp !== 3 && d.timestamp !== 4), 'the timestamp of items should not in {3, 4}');
    t.is(output.length, groundTruth.length, 'the number of items in output should be the same as groundTruth');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#select', async (t) => {
    const { model } = t.context as TestContext;

    const output = await model.where('userId').equals('1').exec();
    output.sort(sortData);

    const output2 = await model.where('userId').equals('1').select('userId timestamp').exec();
    output2.sort(sortData);

    t.true(output2.every(d => Object.keys(d).length === 3), 'the number of fields in output2 should be 3');
    t.is(output.length, output2.length, 'the number of items in output and output2 should be the same');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], output2[i]), `the item_${i} in output2 should be contained in output_${i}`);
    }
});

test('MongoQuery#where', async (t) => {
    const { model } = t.context as TestContext;

    let output = await model.where('userId').equals('1').where('action', 'f').exec();
    output.sort(sortData);

    let groundTruth = mockData.filter(d => d.userId === '1' && d.action === 'f');
    groundTruth.sort(sortData);
    t.is(output.length, groundTruth.length, 'the number of items in output should be 1');
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }

    output = await model.where('userId').equals('0').where('action', 'a').exec();
    output.sort(sortData);

    groundTruth = mockData.filter(d => d.userId === '0' && d.action === 'a');
    groundTruth.sort(sortData);
    t.is(output.length, groundTruth.length, `the number of items in output should be ${groundTruth.length}`);
    for (let i = 0, len = output.length; i < len; ++i) {
        t.true(mongoContains(output[i], groundTruth[i]), `the item_${i} in output should be contained in groundTruth`);
    }
});

test('MongoQuery#count', async (t) => {
    const { model } = t.context as TestContext;

    // !==
    let output = await model.where('userId').ne('1').count();
    let groundTruth = mockData.filter(d => d.userId !== '1').length;
    t.is(output, groundTruth, 'the number in output should be the same as groundTruth');

    // ===
    output = await model.where('userId').equals('1').count();
    groundTruth = mockData.filter(d => d.userId === '1').length;
    t.is(output, groundTruth, 'the number in output should be the same as groundTruth');

    // >=
    output = await model.where('userId').equals('100').count();
    groundTruth = mockData.filter(d => d.userId === '100').length;
    t.is(output, groundTruth, 'the number in output should be the same as groundTruth');
});
