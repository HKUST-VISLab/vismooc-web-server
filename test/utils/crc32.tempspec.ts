// import { exec } from "child_process";

// import test from "ava";
// test("test", () => { });
// const VALUES = [
//     "1234567890",
//     "cwd String Current working directory of the child process",
//     "env Object Environment key-value pairs",
//     "encoding String (Default: 'utf8')",
//     "timeout Number (Default: 0)",
//     "maxBuffer Number (Default: 200*1024)",
//     "killSignal String (Default: 'SIGTERM')",
// ];

// test("Test crc32", (t) => {
//     VALUES.forEach(value => {
//         t("should calculate a full checksum", done => testStringValue(value, initial, done));
//         t("should calculate a full checksum with initial 0x0", done => testStringValue(value, 0, done));
//         t("should calculate a checksum for multiple data", done => testStringSplitValue(value, initial, done));
//         t("should calculate a checksum for multiple data with initial 0x0", done => testStringSplitValue(value, 0, done));
//     });
// });

// export function crcSuiteFor({crc}) {

//     function getReferenceValueForString(model, string, initial, callback) {
//         initial = typeof (initial) !== "undefined" ? `--xor-in=0x${initial.toString(16)}` : "";
//         exec(`${__dirname}/pycrc/pycrc.py --model=${model} ${initial} --check-string="${string}"`,
//             (err, reference) => {
//                 callback(err, (reference || "").replace(/^0x|\n$/g, ""));
//             });
//     }

//     function testStringValue(string, initial, callback) {
//         getReferenceValueForString(crc.model, string, initial, function (err, reference) {
//             if (err) return callback(err);
//             crc(string, initial).toString(16).should.equal(reference);
//             callback();
//         });
//     }

//     function testStringSplitValue(value, initial, callback) {
//         const middle = value.length / 2;
//         const chunk1 = value.substr(0, middle);
//         const chunk2 = value.substr(middle);
//         const v1 = crc(chunk1, initial);
//         const v2 = crc(chunk2, v1);

//         getReferenceValueForString(crc.model, value, initial, function (err, reference) {
//             if (err) return callback(err);
//             v2.toString(16).should.equal(reference);
//             callback();
//         });
//     }
// }
