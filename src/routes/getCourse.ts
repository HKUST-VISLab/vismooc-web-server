import * as crypto from 'crypto';
import * as Router from 'koa-router';
// import * as Data from "../controllers/data";

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
        match = referer.match(/course-v1:?([^\/]+)/);
    }
    return match ? match[1] : referer;
}

const getCourseRouters: Router = new Router()
    .get('/getCourseInfo', async (ctx: any, next) => {
        if (ctx.body) {
            return await next();
        }
        ctx.logger.debug('==========Begin of /getCourseInfo==========');
        const query = ctx.query;
        const courseId: string = courseIdOf(query);
        const course = await ctx.dataController.getCourseById(courseId);
        const videoIds: string[] = course.videoIds;
        const videos = (await ctx.dataController.getVideosByList(courseId, videoIds))
            .map((v) => {
                const temporalHotness = {};
                if (v.temporalHotness) {
                    Object.keys(v.temporalHotness[courseId] || {}).forEach(date => {
                        temporalHotness[date] = {};
                        Object.keys(v.temporalHotness[courseId][date]).forEach(userId => {
                            const hashId = crypto.createHash('md5').update(`${userId}`).digest('hex');
                            temporalHotness[date][hashId] = v.temporalHotness[courseId][date][userId];
                        });
                    });
                }

                return {
                    courseId,
                    name: v.name,
                    id: v.id,
                    duration: v.duration,
                    url: v.url || '',
                    section: v.section,
                    temporalHotness,
                };
            });

        ctx.body = course && {
            id: course.id,
            originalId: course.originalId,
            name: course.name,
            instructor: course.instructor,
            url: course.url,
            image: course.courseImageUrl,
            startDate: +course.startDate,
            endDate: +course.endDate,
            videos,
            description: course.description,
        };
        ctx.logger.debug(`the res.body.id is:${ctx.body.id}`);
        ctx.logger.debug(`the res.body.name is:${ctx.body.name}`);
        ctx.logger.debug(`the res.body.instructor is:${ctx.body.instructor}`);
        ctx.logger.debug(`the res.body.startDate is ${ctx.body.startDate}`);
        ctx.logger.debug(`the res.body.endDate is ${ctx.body.endDate}`);
        ctx.logger.silly(`the res.body is:${JSON.stringify(ctx.body)}`);
        ctx.logger.debug('=======End of /getCourseInfo===========');
        await next();
    })
    .get('/getCourseList', async (ctx: any, next) => {
        if (ctx.body) {
            return await next();
        }
        ctx.logger.debug('==========Begin of /getCourseList==========');

        let permissions = {};
        let username = null;
        if (ctx.session && ctx.session.passport && ctx.session.passport.user) {
            ({ permissions = {} } = ctx.session.passport.user);
            username = ctx.session.passport.user.username;
        }
        let selectedCourseId;
        if (ctx.session) {
            selectedCourseId = getCourseIdFromReferer(ctx.session.redirectCourseId);
            ctx.session.redirectCourseId = undefined;
        }

        ctx.logger.debug(`The permissions of ${username} is:`);
        ctx.logger.debug(JSON.stringify(permissions));

        const ret = await ctx.dataController.getCoursesByList(Object.keys(permissions));
        ctx.body = {
            username,
            coursesList: ret.map((course) => ({
                id: course.id,
                originalId: course.originalId,
                name: course.name,
                year: course.year,
                startDate: course.startDate,
                endDate: course.endDate,
            })),
            selectedCourseId,
        };

        ctx.logger.debug(`The res.body is:${JSON.stringify(ctx.body)}`);
        ctx.logger.debug('=======End of /getCourseList===========');

        await next();
    })
    .get('/getDemographicInfo', async (ctx: any, next) => {
        if (ctx.body) {
            return await next();
        }
        ctx.logger.debug('==========Begin of /getDemographicInfo==========');

        const query = ctx.query;
        const courseId: string = courseIdOf(query);
        const course = await ctx.dataController.getCourseById(courseId);
        const studentIds: string[] = course.studentIds as string[];
        const students = await ctx.dataController.getUsersByList(studentIds);
        const countryDist = new Map<string, number>();
        for (const student of students) {
            const country = student.country || 'CHN';
            if (!(country in countryDist)) {
                countryDist[country] = { users: [], count: 0 };
            }
            countryDist[country].count += 1;
            const hashId = crypto.createHash('md5').update(student.id).digest('hex');
            countryDist[country].users.push(hashId);
        }

        ctx.body = {
            courseId,
            demographicInfo: Object.keys(countryDist).map((key) => ({
                code3: key as string,
                count: countryDist[key].count as number,
                users: countryDist[key].users as string[],
            })),
        };
        ctx.logger.debug(`The res.body.courseId is:${JSON.stringify(ctx.body.courseId)}`);
        ctx.logger.debug(`The length of res.body.demographicInfo is:${ctx.body.demographicInfo.length}`);
        ctx.logger.silly(`The res.body is:${JSON.stringify(ctx.body)}`);
        ctx.logger.debug('=======End of /getDemographicInfo===========');
        await next();
    });

export default getCourseRouters;
