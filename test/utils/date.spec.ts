import test from 'ava';
import date from '../../src/utils/date';

test('date', (t) => {
    t.is(date.getWeeks(new Date(1493546050000)), 2470, 'the week of this time should be 2470');
    t.is(date.parseDate(null), 0, 'Input date should not be empty');
    t.is(date.parseDate(1493546050000), 1493546050000, 'Input date as millsecond format');
    t.is(date.parseDate(1493546050), 1493546050000, 'Input date as second format');
    t.is(date.parseDate('Sun Apr 30 2017 17:54:10 GMT+0800 (HKT)'), 1493546050000, 'Input date as a string');
    t.is(date.parseDate('Sun Apr 30 2017 17:54:10 GMT+0800'), 1493546050000, 'Input date as a string');
});
