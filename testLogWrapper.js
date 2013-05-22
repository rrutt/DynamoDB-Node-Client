/*
   Copyright 2013 Rick Rutt

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var winston = require('winston');
var settings = require('./testSettings');

var config = {
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    },
    colors: {
        debug: 'cyan',
        info: 'green',
        warn: 'yellow',
        error: 'red'
    }
};

exports.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: settings.logger.consoleLevel,  // this will output everything from this level and up
            silent: settings.logger.consoleSilent,
            timestamp: settings.logger.consoleTimestamp,
            colorize: settings.logger.consoleColorize,
            json: settings.logger.consoleJson
        }),
        new (winston.transports.File)({ 
            level: settings.logger.fileLevel,
            silent: settings.logger.fileSilent,
            timestamp: settings.logger.fileTimestamp,
            colorize: settings.logger.fileColorize,
            json: settings.logger.fileJson,
            filename: settings.logger.fileFullPath,
            maxsize: settings.logger.fileMaxSize, // Note intentional difference in camel casing.
            maxFiles: settings.logger.fileMaxFiles
        })
    ],
    levels: config.levels,
    colors: config.colors,
    exitOnError: false
});