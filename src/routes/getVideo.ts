import * as crypto from 'crypto';
import * as Router from 'koa-router';
// import * as Data from "../controllers/data";
import { date } from '../utils';

function courseIdOf(query: any): string {
    const id: string = query.courseId;
    if (id && id.indexOf(' ') !== -1) {
        return id.replace(new RegExp(' ', 'gm'), '+');
    }
    return id || null;
}

function videoIdOf(query: any): string {
    return query.videoId || null;
}

function startDateOf(query: any): number {
    return query.startDate ? date.parseDate(parseInt(query.startDate, 10)) : null;
}

function endDateOf(query: any): number {
    return query.endDate ? date.parseDate(parseInt(query.endDate, 10)) : null;
}

const getVideoRouters: Router = new Router()
    .get('/getClicks', async (ctx, next) => {
        if (ctx.body) {
            return await next();
        }
        ctx.logger.debug('==========Begin of /getClicks==========');

        const query = ctx.query;
        const videoId: string = videoIdOf(query);
        const courseId: string = courseIdOf(query);
        const startDateBound: number = startDateOf(query);
        const endDateBound: number = endDateOf(query);
        let logs: any[] = await ctx.dataController.getDenselogsById(courseId, videoId);
        logs = logs.filter((d) => (!startDateBound || d.timestamp >= startDateBound) &&
            (!endDateBound || d.timestamp <= endDateBound));
        const duration = Math.max(...logs.map(d => Math.max(...
                d.clicks.map(e => e.currentTime || 0))));
        console.warn(duration);
        for (const denselog of logs) {
            denselog.clicks = denselog.clicks.filter(
                d => !d.currentTime || (d.currentTime >= 3 && d.currentTime < duration - 5),
            );
            for (const click of denselog.clicks) {
                delete click.path;
                if (click.userId) {
                    click.userId = crypto.createHash('md5').update(`${click.userId}`).digest('hex');
                }
            }
            delete denselog.__v;
            delete denselog._id;
            delete denselog.courseId;
            delete denselog.videoId;
        }
        ctx.body = { courseId, videoId, denseLogs: logs };

        ctx.logger.debug(`The body.courseId is:${ctx.body.courseId}`);
        ctx.logger.debug(`The body.videoId is:${ctx.body.videoId}`);
        ctx.logger.silly(`The res.body is:${JSON.stringify(ctx.body)}`);
        ctx.logger.debug('=======End of /getClicks===========');
        await next();
    });

export default getVideoRouters;
