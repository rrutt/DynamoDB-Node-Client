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

var async = require('async');
var fs = require('fs');
var path = require('path');
var net = require('net');
var util = require('util');

var terminateJsonArray =
function (str) {
    var result = str;
    var n = str.length - 1;
    if (str.indexOf(',', n) !== -1) {
        result = str.substr(0, n) + ']';
    }
    return result;
};

var writeRecordToDynamoDb =
function (logger, dynamodbClient, tableName, dataRecord, callback) {
    dynamodbClient.insertOrUpdateTableRecord(tableName, dataRecord,
    function (err, oldData) {
        if (err) {
            return callback(err, null);
        }

        logger.debug(util.format("Inserted %s", JSON.stringify(dataRecord)));
        callback(null, oldData);
    });
};

var writeDataToDynamoDb =
function (logger, dynamodbClient, tableName, dataArray, callback) {
    logger.debug(util.format("dataArray = %s", JSON.stringify(dataArray)));

    var successCount = 0;

    // The Alternator emulator for DynamoDb is not thread-safe,
    // so be sure to insert records one at a time.
    async.eachSeries(dataArray,
    function (dataRecord, done) {
        logger.debug(util.format("dataRecord = %s", JSON.stringify(dataRecord)));
        writeRecordToDynamoDb(logger, dynamodbClient, tableName, dataRecord,
        function (err, oldData) {
            if (err) {
                return done(err, null);
            }
            successCount++
            done(null, oldData);
        });
    },
    function (err, result) {
        if (err) {
            return callback(err, null);
        }

        var doneMsg = util.format("Inserted %d records into %s table", successCount, tableName);
        callback(null, doneMsg);
    });
};

var loadDataFromFile =
function (logger, jsonDataFileName, callback) {
    try {
        logger.debug(util.format("loadTable.loadDataFromFile %s", jsonDataFileName));
        var data = fs.readFileSync(jsonDataFileName, 'utf8');

        var logMsg = util.format('loadDataFromFile loaded data from file %s', jsonDataFileName);
        logger.info(logMsg);

        var dataArray = JSON.parse(terminateJsonArray(data));

        logMsg = util.format('loadDataFromFile parsed %d input records', dataArray.length);
        logger.info(logMsg);

        callback(null, dataArray);
    } catch (err) {
        return callback(err, null);
    }
};

exports.loadTableFromDataFile =
function (logger, dynamodbClient, tableName, jsonDataFileName, callback) {
    logger.debug(util.format("loadTable.loadTableFromDataFile %s = %s", tableName, jsonDataFileName));
    loadDataFromFile(logger, jsonDataFileName,
    function (err, dataArray) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        }

        writeDataToDynamoDb(logger, dynamodbClient, tableName, dataArray,
        function (err, msg) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            }

            logger.warn(msg);
            return callback(null, msg);
        });
    });
};
