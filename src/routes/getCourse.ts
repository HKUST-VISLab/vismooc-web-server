import * as crypto from 'crypto';
import * as Router from 'koa-router';
// import * as Data from "../controllers/data";
// import { OAuthReferer } from '../routes/oauth';

function courseIdOf(query: any) {
    const id: string = query.courseId;
    if (id && id.indexOf(' ') !== -1) {
        return id.replace(new RegExp(' ', 'gm'), '+');
    }
    return id || null;
}

function getCourseIdFromReferer(referer: string) {
    let match = null;
    if (referer) {
        match = referer.match(/course-v1:([^\/]+)\//);
    }
    return match && match[1];
}

const getCourseRouters: Router = new Router()
    .get('/getCourseInfo', async (ctx, next) => {
        if (ctx.body) {
            return await next();
        }
        const query = ctx.query;
        const courseId: string = courseIdOf(query);
        const course = await ctx.dataController.getCourseById(courseId);
        const videoIds: string[] = course.videoIds;
        const videos = (await ctx.dataController.getVideosByList(courseId, videoIds))
            .map((v) => ({
                courseId,
                name: v.name ,
                id: v.originalId ,
                duration: v.duration,
                url: v.url || '',
                section: v.section,
                temporalHotness: v.temporalHotness || {},
            }));

        ctx.body = course && {
            id: course.originalId,
            name: course.name,
            instructor: course.instructor,
            url: course.url,
            image: course.courseImageUrl,
            startDate: course.startDate,
            endDate: course.endDate,
            videos,
            description: course.description,
        };
        await next();
    })
    .get('/getCourseList', async (ctx, next) => {
        if (ctx.body) {
            return await next();
        }
        console.info('in get course list');

        const selectedCourseId = getCourseIdFromReferer(null);
        let permissions = {};
        if (ctx.session && ctx.session.passport && ctx.session.passport.user) {
            ({ permissions = {} } = ctx.session.passport.user);
        }

        console.info(permissions);
        const ret = await ctx.dataController.getCoursesByList(Object.keys(permissions));
        ctx.body = {
            coursesList: ret.map((course) => ({
                id: course.originalId,
                name: course.name,
                year: course.year,
            })),
            selectedCourseId,
        };
        await next();
    })
    .get('/getDemographicInfo', async (ctx, next) => {
        if (ctx.body) {
            return await next();
        }
        const query = ctx.query;
        const courseId: string = courseIdOf(query);
        const course = await ctx.dataController.getCourseById(courseId);
        const studentIds: string[] = course.studentIds as string[];
        // console.info("studentIds", studentIds);
        const students = await ctx.dataController.getUsersByList(studentIds);
        // console.info("students", students);
        const countryDist = new Map<string, number>();
        for (const student of students) {
            const country = student.country || 'CHN';
            if (!(country in countryDist)) {
                countryDist[country] = { users: [], count: 0 };
            }
            countryDist[country].count += 1;
            const hashId = crypto.createHash('md5').update(student.originalId).digest('hex');
            countryDist[country].users.push(hashId);
        }

        ctx.body = Object.keys(countryDist).map((key) => ({
            code3: key as string,
            count: countryDist[key].count as number,
            users: countryDist[key].users as string[],
        }));
        await next();
    });

export default getCourseRouters;
