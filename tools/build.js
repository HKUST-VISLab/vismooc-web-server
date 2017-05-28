const shelljs = require("shelljs");

const dist = "dist";
function cleanDist() {
    shelljs.rm("-rf", dist);
}

switch (process.argv[2]) {
    case "clean":
        cleanDist();
        break;
    default:
        console.info("No command");
}