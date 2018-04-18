import DatabaseManager from '../database/databaseManager';
import * as DataSchema from '../database/dataSchema';
import { MongoDatabase } from '../database/mongo';

// import { parseDate } from '../utils/date';

/*-----------------Mongo----------------*/
export class DataController {

    constructor(private database: MongoDatabase) {
        if (!database) {
            throw new Error(`The database should not be ${database}`);
        }
    }

    public getCourseById = async (id) => this.getCoursesById(id).then(this.firstElement);
    public getVideoById = async (id) => this.getVideosById(id).then(this.firstElement);
    public getUserById = async (id) => this.getUsersById(id).then(this.firstElement);
    public getUserByUsername = async (username) => this.getUsersByUsername(username).then(this.firstElement);

    public async getSentimentById(courseId: string): Promise<DataSchema.Forum[]> {
        return await this.database.model<DataSchema.Forum, DataSchema.ForumModel>(DataSchema.FORUM)
            .where('courseId').equals(courseId)
            .select('courseId createdAt sentiment id')
            .exec();
    }

    /*
    outofdate, data schema already changed
        public async getThreadsByUserId(courseId: string, userId: string): Promise<DataSchema.Forum[]> {
            const threads = await this.database.model<DataSchema.Forum, DataSchema.ForumModel>(DataSchema.FORUM)
                .where('courseId').equals(courseId)
                .where('authorId').equals(userId)
                .exec();
            return threads;
        }
    */
    public async getActivenessByUserId(courseId: string, userId: string): Promise<number> {
        const users = await this.database.model<DataSchema.User, DataSchema.UserModel>(DataSchema.USERS)
            .where('id').equals(userId)
            .exec();
        if (users.length === 0) {
            return null;
        }
        const user = users[0];
        return +user.activeness[courseId];
    }

    /*
        public async getUserActivenessByCourseId(courseId: string, activityThreshold: number = 0) {
            const users = await this.database.model<DataSchema.User, DataSchema.UserModel>(DataSchema.USERS)
                .where(`activeness.${courseId}`).gte(activityThreshold)
                .select('originalId activeness')
                .exec();
            const ret = new Map<string, number>();
            for (const user of users) {
                ret.set(user.originalId, +user.activeness[courseId]);
            }
            return ret;
        }

        public async getUserActivenessByCourseIdCache(courseId: string, activityThreshold: number = 0) {
            const queryStr: string = `getUserActivenessByCourseId#${courseId}_#${activityThreshold}`;
            const retStr: string = await (DatabaseManager.CacheDatabase && DatabaseManager.CacheDatabase.get(queryStr));
            if (retStr) {
                const ret = new Map<string, number>();
                const obj = JSON.parse(retStr);
                Object.keys(obj).forEach(key => ret.set(key, obj[key]));
                return ret;
            } else {
                const ret = await this.getUserActivenessByCourseId(courseId, activityThreshold);
                await DatabaseManager.CacheDatabase.set(queryStr, JSON.stringify(ret));
                return ret;
            }
        }
        */

    public async getUserGradesByCourseId(courseId: string) {
        const course = await this.getCourseById(courseId);
        const grades = course.grades;
        const ret = new Map<string, number>();
        if (grades) {
            Object.keys(grades).forEach(d => ret.set(d, grades[d]));
        }
        return ret;
    }

    /*
        No need to use cache now
        public async getUserGradesByCourseIdCached(courseId: string) {
            const queryStr: string = `getUserGradesByCourseId#${courseId}`;
            const retStr: string = await (DatabaseManager.CacheDatabase && DatabaseManager.CacheDatabase.get(queryStr));
            if (retStr) {
                const ret = new Map<string, number>();
                const obj = JSON.parse(retStr);
                Object.keys(obj).forEach(key => ret.set(key, obj[key]));
                return ret;
            } else {
                const ret = await this.getUserGradesByCourseId(courseId);
                await DatabaseManager.CacheDatabase.set(queryStr, JSON.stringify(ret));
                return ret;
            }
        }
        */

    /*
        public async getTotalGradeByUserId(courseId: string, userId: string): Promise<number> {
            const grades: DataSchema.Grade[] = await this.getGradesByUserId(courseId, userId);
            const maxGrade: Map<string, number> = new Map<string, number>();
            for (const d of grades) {
                const grade = parseFloat(d.grade);
                if (grade > 0) {
                    if (!maxGrade.has(d.courseModule) || maxGrade.get(d.courseModule) < grade) {
                        maxGrade.set(d.courseModule, grade);
                    }
                }
            }
            let sum: number = 0;
            for (const val of maxGrade.values()) {
                sum += val;
            }
            return sum;
        }
    */
    public async getSocialNetwork(courseId: string): Promise<DataSchema.SocialNetwork> {
        const socialNetworkDatas = await this.database
            .model<DataSchema.SocialNetwork, DataSchema.SocialNetworkModel>(DataSchema.SOCIALNETWORK)
            .where('courseId').equals(courseId)
            .exec();
        if (socialNetworkDatas.length === 0) {
            return null;
        } else {
            return socialNetworkDatas[0];
        }
    }

    public async getSocialNetworkCached(courseId: string): Promise<DataSchema.SocialNetwork> {
        const queryStr: string = `getSocialNetwork#${courseId}`;
        const retStr: string = await (DatabaseManager.CacheDatabase && DatabaseManager.CacheDatabase.get(queryStr));
        if (retStr) {
            const ret: DataSchema.SocialNetwork = JSON.parse(retStr) as DataSchema.SocialNetwork;
            return ret;
        } else {
            const ret: DataSchema.SocialNetwork = await this.getSocialNetwork(courseId);
            await DatabaseManager.CacheDatabase.set(queryStr, JSON.stringify(ret));
            return ret;
        }
    }

    public async getCoursesById(id: string): Promise<DataSchema.Course[]> {
        return await this.database.model<DataSchema.Course, DataSchema.CourseModel>(DataSchema.COURSES)
            .where('id').equals(id)
            .exec();
    }

    public async getCoursesByList(courseIds: string[]): Promise<DataSchema.Course[]> {
        return await this.database.model<DataSchema.Course, DataSchema.CourseModel>(DataSchema.COURSES)
            .where('id').in(courseIds)
            .exec();
    }

    public async getAllCourses(courseIds: string[]): Promise<DataSchema.Course[]> {
        return await this.database.model<DataSchema.Course, DataSchema.CourseModel>(DataSchema.COURSES)
            .all();
    }

    public async getVideosById(id: string): Promise<DataSchema.Video[]> {
        return await this.database.model<DataSchema.Video, DataSchema.VideoModel>(DataSchema.VIDEOS)
            .where('id').equals(id)
            .exec();
    }

    public async getVideosByList(courseId: string, videoIds: string[]): Promise<DataSchema.Video[]> {
        return await this.database.model<DataSchema.Video, DataSchema.VideoModel>(DataSchema.VIDEOS)
            .where('id').in(videoIds)
            .exec();
    }

    public async getAllUsers(): Promise<DataSchema.User[]> {
        return await this.database.model<DataSchema.User, DataSchema.UserModel>(DataSchema.USERS)
            .all();
    }

    public async getUsersById(id: string): Promise<DataSchema.User[]> {
        return await this.database.model<DataSchema.User, DataSchema.UserModel>(DataSchema.USERS)
            .where('id').equals(id)
            .exec();
    }

    public async getUsersByUsername(username: string): Promise<DataSchema.User[]> {
        return await this.database.model<DataSchema.User, DataSchema.UserModel>(DataSchema.USERS)
            .where('username').equals(username)
            .exec();
    }

    public async getUsersByList(userIds: string[]): Promise<DataSchema.User[]> {
        // console.info('The first user is', await this.getAllUsers());
        return await this.database.model<DataSchema.User, DataSchema.UserModel>(DataSchema.USERS)
            .where('id').in(userIds)
            .exec();
    }

    public async getDenselogsById(courseId: string, videoId: string): Promise<DataSchema.DenseLog[]> {
        return await this.database.model<DataSchema.DenseLog, DataSchema.DenseLogModel>(DataSchema.DENSELOGS)
            .where('courseId').equals(courseId)
            .where('videoId').equals(videoId)
            .exec();
    }

    private firstElement<T>(els: T[]): T {
        return (els && els.length) ? els[0] : null;
    }
}

// export async function getControllerByDb(db1: BaseDatabase, db2: BaseDatabase = null) {
//     const MongoController = {
//         getCoursesById: getCoursesByIdFromMongo,
//         getVideosById: getVideosByIdFromMongo,
//         getUsersById: getUsersByIdFromMongo,
//         getVideosByList: getVideosByListFromMongo,
//         getCoursesByList: getCoursesByListFromMongo,
//         getUsersByList: getUsersByListFromMongo,
//         getDenselogsById: getDenselogsByIdFromMongo,
//         getVideoById: R.memoize(
//             async (id: string) => getVideosByIdFromMongo(id).then(firstElement),
//         ),
//         getUserById: R.memoize(
//             async (id: string) => getUsersByIdFromMongo(id).then(firstElement),
//         ),
//         getCourseById: R.memoize(
//             async (id: string) => getCoursesByIdFromMongo(id).then(firstElement),
//         ),
//     };
//     const MySQLController = {
//         getCoursesById: getCoursesByIdFromMySQL,
//         getVideosById: getVideosByIdFromMySQL,
//         getUsersById: getUsersByIdFromMySQL,
//         getVideosByList: getVideosByListFromMySQL,
//         getCoursesByList: getCoursesByListFromMySQL,
//         getUsersByList: getUsersByListFromMySQL,
//         getDenselogsById: getDenselogsByIdFromMySQL,
//         getVideoById: R.memoize(
//             async (id: string) => getVideosByIdFromMySQL(id).then(firstElement),
//         ),
//         getUserById: R.memoize(
//             async (id: string) => getUsersByIdFromMySQL(id).then(firstElement),
//         ),
//         getCourseById: R.memoize(
//             async (id: string) => getCoursesByIdFromMySQL(id).then(firstElement),
//         ),
//     };
//     const Controller = (database) => {
//         if (database === null) {
//             return {};
//         } else if (database.Type === MONGO) {
//             return MongoController;
//         } else if (database.Type === MYSQL) {
//             return MySQLController;
//         } else {
//             return {};
//         }
//     };
//     const BaseController = Controller(db1);
//     const OptionController = Controller(db2);
//     for (const attr of Object.keys(BaseController)) {
//         if (BaseController[attr] === null) {
//             BaseController[attr] = OptionController[attr];
//         }
//     }
//     return BaseController;
// }

// export async function getCourseStartDate(id: string) {
//     return getCourseById(id)
//         .then((course: any) => course && course.startDate ? course.startDate : 0)
//         .then(parseDate);
// }

// export async function getCourseEndDate(id: string) {
//     return getCourseById(id)
//         .then((course: any) => course && course.endDate ? course.endDate : 0)
//         .then(parseDate);
// }

/*---------------SQL-------------------*/
// const mysqlResourceTypes = [
//     { id: 0, content: 'None', medium: 'None' },
//     { id: 1, content: 'problem', medium: 'text' },
//     { id: 2, content: 'informational', medium: 'text' },
//     { id: 3, content: 'forum', medium: 'text' },
//     { id: 4, content: 'profile', medium: 'None' },
//     { id: 5, content: 'lecture', medium: 'video' },
// ];
// const resourceTypeVideo: number = mysqlResourceTypes[5].id;
// const getDenselogsByIdFromMySQL = null;
// const getUsersByListFromMySQL = null;
// const getUsersByIdFromMySQL = null;
// async function getCoursesByListFromMySQL(courseIds: string[]): Promise<any[]> {
//     const courses = [];
//     for (const id of courseIds) {
//         const course = await getCoursesByIdFromMySQL(id);
//         courses.push(course);

//     }
//     return courses;
// }

// async function getVideosByListFromMySQL(courseId: string, videoIds: string[]): Promise<any> {
//     const videos = await DatabaseManager.Database.model('resources')
//         .where('course_id').equals(courseId)
//         .where('resource_type_id').equals(resourceTypeVideo)
//         .exec();
//     return videos
//         .map((v) => ({
//             courseId: v.courseId as string,
//             name: v.resource_name as string,
//             originalId: v.resource_id as string,
//             duration: v.video_duration as number,
//             url: v.resource_uri || ' as string,
//             section: v.video_section as string,
//             temporalHotness: [], // to be calculated
//         }));
// }

// async function getCoursesByIdFromMySQL(id: string): Promise<any> {
//     /*
//         id: course.originalId as string,
//         name: course.name as string,
//         instructor: course.instructor as string,
//         url: course.url as string,
//         image: course.image as string,
//         startDate: course.startDate as number,
//         endDate: course.endDate as number,
//         videos,
//         description: course.description as string,
//     */
//     const videos = await DatabaseManager.Database.model('resources')
//         .where('course_id').equals(id)
//         .where('resource_type_id').equals(resourceTypeVideo)
//         .select('resource_id')
//         .exec();

//     const course = await DatabaseManager.Database.model('course')
//         .where('course_id').equals(id) // cannot find the course_id in current table
//         .exec();

//     return {
//         id: id as string,
//         name: course.name as string, // cannot find the name in current table
//         instructor: course.instructor as string,
//         url: course.course_url as string,
//         image: course.image as string, // cannot find
//         startDate: course.startDate as number, // cannot find
//         endDate: course.endDate as number, // cannot find
//         videoIds: videos.map(video => video.resource_id),
//         description: course.description as string,
//     };
// }

// async function getVideosByIdFromMySQL(id: string): Promise<any> {
//     const videos = await DatabaseManager.Database.model('resources')
//         .where('recourse_id').equals(id)
//         .where('resource_type_id').equals(resourceTypeVideo)
//         .exec();
//     return videos
//         .map((v) => ({
//             courseId: v.courseId as string,
//             name: v.resource_name as string,
//             originalId: v.resource_id as string,
//             duration: v.video_duration as number,
//             url: v.resource_uri || ' as string,
//             section: v.video_section as string,
//             temporalHotness: [], // to be calculated
//         }));
// }
