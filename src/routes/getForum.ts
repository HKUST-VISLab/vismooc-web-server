import * as Router from 'koa-router';
import * as DataSchema from '../database/dataSchema';
import { forceLayout } from '../utils/forceLayout';

function courseIdOf(query: any) {
    const id: string = query.courseId;
    if (id && id.indexOf(' ') !== -1) {
        return id.replace(new RegExp(' ', 'gm'), '+');
    }
    return id || null;
}

const getForumRouters: Router = new Router()
    .get('/getSentiment', async (ctx, next) => {
        if (ctx.body) {
            return await next();
        }
        const query = ctx.query;
        const courseId: string = courseIdOf(query);
        if (courseId === null) {
            return await next();
        }
        const course = await ctx.dataController.getCourseById(courseId);
        if (course === null) {
            return await next();
        }
        const startDate: number = course.startDate;
        const forumData: DataSchema.Forum[] =
            await ctx.dataController.getSentimentById(courseId);
        ctx.body = forumData.map(d => ({
            courseId,
            originalId: d.originalId,
            day: 1 + Math.floor((d.createdAt - startDate) / (86400 * 1000)),
            sentiment: +d.sentiment,
            timestamp: +d.createdAt,
        }));
        return await next();
    })
    // .get('/getWordList', async (ctx, next) => {
    //     /// getThreadsByUserId
    //     if (ctx.body) {
    //         return await next();
    //     }
    //     const query = ctx.query;
    //     const courseId: string = courseIdOf(query);
    //     if (courseId === null) {
    //         return await next();
    //     }
    //     const userId: string = query.userId;
    //     const threadsData: DataSchema.Forum[] = await ctx.dataController.getThreadsByUserId(courseId, userId);
    //     const wordCount = {};
    //     threadsData.forEach((t) => {
    //         t.body.replace(/[^0-9a-z ]/ig, '').split(' ').forEach((d) => {
    //             if (!wordCount[d]) {
    //                 wordCount[d] = 1;
    //             } else {
    //                 wordCount[d] = wordCount[d] + 1;
    //             }
    //         });
    //     });
    //     const wordList = Object.keys(wordCount)
    //         .map((d) => [d, wordCount[d]])
    //         .sort((a, b) => b[1] - a[1]);

    //     ctx.body = wordList.slice(0, 100);
    // })
    .get('/getSocialNetworkLayout', async (ctx, next) => {
        if (ctx.body) {
            return await next();
        }
        const query = ctx.query;
        const courseId: string = courseIdOf(query);
        if (courseId === null) {
            return await next();
        }
        const activenessThreshold = parseFloat(query.activenessThreshold);
        const socialNetworkData = await ctx.dataController.getSocialNetworkCached(courseId);
        if (!socialNetworkData) {
            return await next();
        }

        const userGrades = await ctx.dataController.getUserGradesByCourseId(courseId);
        const userActiveness = new Map<string, number>(Object.keys(socialNetworkData.activeness)
            .filter(d => socialNetworkData.activeness[d] >= activenessThreshold)
            .map(d => [d, socialNetworkData.activeness[d]] as [string, number]));
        const userDegree = {};
        for (const item of socialNetworkData.socialNetwork) {
            if (!userDegree[item.userId1]) {
                userDegree[item.userId1] = 0;
            }
            userDegree[item.userId1] += 1;

            if (!userDegree[item.userId2]) {
                userDegree[item.userId2] = 0;
            }
            userDegree[item.userId2] += 1;
        }
        const degreeThreshold = 10;
        // const nodeIds = new Set<string>();
        const nodes: Map<string, { id: string, activeness: number, grade: number }> = new Map();
        const links: Array<{ source: string, target: string, weight: number }> = new Array();
        let minActiveness = 1000000000000;
        let maxActiveness = -1000000000000;
        for (const item of socialNetworkData.socialNetwork) {
            if (userActiveness.has(item.userId1) && userActiveness.has(item.userId2) && item.userId1 !== item.userId2 &&
                userDegree[item.userId1] > degreeThreshold && userDegree[item.userId2] > degreeThreshold) {
                if (!nodes.has(item.userId1)) {
                    nodes.set(item.userId1, {
                        id: item.userId1,
                        activeness: userActiveness.get(item.userId1),
                        grade: userGrades.has(item.userId1) ? userGrades.get(item.userId1) : 0,
                    });
                }
                if (!nodes.has(item.userId2)) {
                    nodes.set(item.userId2, {
                        id: item.userId2,
                        activeness: userActiveness.get(item.userId2),
                        grade: userGrades.has(item.userId2) ? userGrades.get(item.userId2) : 0,
                    });
                }
                links.push({ source: item.userId1, target: item.userId2, weight: item.edgeWeight });
            }
        }
        for (const node of nodes.values()) {
            minActiveness = Math.min(minActiveness, node.activeness);
            maxActiveness = Math.max(maxActiveness, node.activeness);
        }

        ctx.body = {
            ...forceLayout({ links, nodes: Array.from(nodes.values()) }),
            activenessRange: [minActiveness, maxActiveness],
        };
        return await next();
    });

export default getForumRouters;
