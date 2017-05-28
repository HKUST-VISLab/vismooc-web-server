export function getWeeks(d: Date): number {
    const t = d.getTime();
    // a week is from sunday to saturday.
    return Math.floor((t / 86400000 + 4) / 7);
    // if a week is from monday to sunday.
    // return Math.floor((t / 3600 / 24 / 1000 + 3) / 7);
}

export function parseDate(d: number | string): number {
    if (!d) {
        return 0;
    } else if (typeof d === 'string') {
        return Date.parse(d);
    } else {
        if (d % 1000 === 0) {
            return d;
        } else {
            // second to milliseconds
            return d * 1000;
        }
    }
}

const weekday: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function getDay(d: Date): string {
    return weekday[new Date(d).getUTCDay()];
}

export function getDateString(d: Date): string {
    d = new Date(d);
    return `${getDay(d)}, ${d.getUTCFullYear()}, ${d.getUTCMonth()}, ${d.getDate()}`;
}

export default {
    getDay,
    getDateString,
    getWeeks,
    parseDate,
};
