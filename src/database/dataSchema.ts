import { Document, Schema } from 'mongoose';

/*------------------Course------------------ */
export interface Course {
    originalId: string;
    name: string;
    year: string;
    org: string;
    courseImageUrl: string;
    instructor: string[]; // missing
    status: string; // missing
    url: string; // missing
    description: string;
    startDate: number; // the microsecond of date(use date.gettime())
    endDate: number; // the microsecond of date(use date.gettime())
    enrollmentStart: number;
    enrollmentEnd: number;
    studentIds: string[];
    videoIds: string[];
    grades: { [key: string]: number };
    metaInfo: string;
}
export interface CourseModel extends Course, Document { }
export const COURSES = 'courses';
export const CourseSchema = new Schema({
    originalId: String,
    name: String,
    year: Number,
    org: String,
    courseImageUrl: String,
    instructor: [String], // missing
    status: String, // missing
    url: String, // missing
    description: String,
    startDate: Number, // the microsecond of date(use date.gettime())
    endDate: Number, // the microsecond of date(use date.gettime())
    enrollmentStart: Number,
    enrollmentEnd: Number,
    studentIds: [String],
    videoIds: [String],
    grades: Schema.Types.Mixed,
    metaInfo: String,
}, { collection: COURSES });

/*------------------User------------------ */
export interface User {
    originalId: string;
    username: string;
    name: string;
    language: string;
    location: string;
    birthDate: number;
    educationLevel: string;
    bio: string;
    gender: string;
    country: string;
    activeness: { [key: string]: number };
    courseRoles: { [courseId: string]: string[] };
    courseIds: string[];
    droppedCourseIds: string[];
}
export interface UserModel extends User, Document { }
export const USERS = 'users';
export const UserSchema = new Schema({
    originalId: String,
    username: String,
    name: String,
    language: String,
    location: String,
    birthDate: Number,
    educationLevel: String,
    bio: String,
    gender: String,
    country: String,
    activeness: Schema.Types.Mixed,
    courseRoles: Schema.Types.Mixed,
    courseIds: [String],
    droppedCourseIds: [String],
}, { collection: USERS });

/*------------------Enrollment------------------ */
export interface Enrollment {
    userId: string;
    courseId: string;
    timestamp: number; // the microsecond of date(use date.gettime())
    action: string;
}
export interface EnrollmentModel extends Enrollment, Document { }
export const ENROLLMENTS = 'enrollments';
export const EnrollmentSchema = new Schema({
    userId: String,
    courseId: String,
    timestamp: Number, // the microsecond of date(use date.gettime())
    action: String,
}, { collection: ENROLLMENTS });

/*------------------Video------------------ */
export interface Video {
    originalId: string;
    name: string;
    temporalHotness: { [key: string]: number } | object;
    section: string;
    description: string;
    releaseDate?: number; // the microsecond of date(use date.gettime())
    url: string;
    duration: number;
    metaInfo?: object;
}
export interface VideoModel extends Video, Document { }
export const VIDEOS = 'videos';
export const VideoSchema = new Schema({
    originalId: String,
    name: String,
    temporalHotness: Schema.Types.Mixed,
    section: String,
    description: String,
    releaseDate: Number, // the microsecond of date(use date.gettime())
    url: String,
    duration: Number,
    metaInfo: Schema.Types.Mixed,
}, { collection: VIDEOS });

/*------------------forum------------------ */
export interface Forum {
    originalId: string;
    authorId: string;
    courseId: string;
    createdAt: number;
    updatedAt: number;
    body: string;
    sentiment: number;
    type: string;
    title: string;
    threadType: string;
    commentThreadId: string;
    parentId: string;
}
export interface ForumModel extends Forum, Document { }
export const FORUM = 'forumthreads';
export const ForumSchema = new Schema({
    authorId: String,
    originalId: String,
    courseId: String,
    createdAt: Number,
    updatedAt: Number,
    body: String,
    sentiment: {
        type: Number,
        max: 1,
        min: -1,
    },
    type: {
        type: String,
        enum: ['CommentThread', 'Comment', null],
    },
    title: String,
    threadType: {
        type: String,
        enum: ['Question', 'Discussion', null],
    },
    commentThreadId: String,
    parentId: String,
}, { collection: FORUM });

/*------------------Forum SocialNetwork------------------ */
export interface SocialNetwork {
    courseId: string;
    socialNetwork: Array<{
        userId1: string;
        userId2: string;
        edgeWeight: number;
    }>;
    activeness: { [key: string]: number };
    activenessRange: [number, number];
}
export interface SocialNetworkModel extends SocialNetwork, Document { }
export const SOCIALNETWORK = 'forumsocialnetworks';
export const SocialNetworkSchema = new Schema({
    courseId: String,
    socialNetwork: [Schema.Types.Mixed],
    activeness: Schema.Types.Mixed,
    activenessRange: [Number],
}, { collection: SOCIALNETWORK });

/*------------------logs------------------ */
export interface Log {
    metaInfo: object;
    userId: string;
    videoId: string;
    courseId: string;
    timestamp: number; // Date.gettime
    type: string;
}
export interface LogModel extends Log, Document { }
export const LOGS = 'logs';
export const LogsSchema = new Schema({
    metaInfo: Schema.Types.Mixed,
    userId: String,
    videoId: String,
    courseId: String,
    timestamp: Number, // Date.gettime
    type: String,
}, { collection: LOGS });

/*------------------denslogs------------------ */
export interface DenseLog {
    videoId: string;
    courseId: string;
    timestamp: number;
    clicks: any[];
}
export interface DenseLogModel extends DenseLog, Document { }
export const DENSELOGS = 'denselogs';
export const DenseLogsSchema = new Schema({
    videoId: String,
    courseId: String,
    timestamp: Number,
    clicks: [Schema.Types.Mixed],
}, { collection: DENSELOGS });

/*------------------denslogs------------------ */
export interface MetadbFiles {
    createdAt: number;
    lastModified: number;
    processed: boolean;
    etag: string;
    path: string;
    type: string;
}
export interface MetadbFilesModel extends MetadbFiles, Document { }
export const METADBFILES = 'metadbfiles';
export const MetadbFilesSchema = new Schema({
    createdAt: Number,
    lastModified: Number,
    processed: Boolean,
    etag: String,
    path: String,
    type: String,
}, { collection: METADBFILES });

export default {
    // course
    COURSES,
    CourseSchema,
    // user
    USERS,
    UserSchema,
    // enrollment
    ENROLLMENTS,
    EnrollmentSchema,
    // video
    VIDEOS,
    VideoSchema,
    // logs
    LOGS,
    LogsSchema,
    // denselogs
    DENSELOGS,
    DenseLogsSchema,
    // forum
    FORUM,
    ForumSchema,
    // socialnetwork
    SOCIALNETWORK,
    SocialNetworkSchema,
    // metadbfiles
    METADBFILES,
    MetadbFilesSchema,
};
