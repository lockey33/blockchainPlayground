import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolve = require('path').resolve
const forever = require('forever-monitor');
let params = process.argv.slice(2)
console.log(params)
const child = new (forever.Monitor)('sniper.js', {
    max: 5,
    silent: false,
    args: params,
    killTree: true,
});

child.on('restart', function() {
    console.error('Forever restarting script for ' + child.times + ' time');
});

child.on('exit:code', function(code) {
    console.log(code)
    console.error('Forever detected script exited with code ' + code);
    if (0 === code) child.stop(); // don't restart the script on SIGTERM
});

child.start();