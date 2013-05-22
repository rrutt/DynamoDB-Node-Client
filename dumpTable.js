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

var writeRecordsToFile =
function (logger, dataItems, folderPath, baseFileName, recordsPerFile, callback) {
    try {
        var dataChunks = [];
        if (recordsPerFile) {
            var chunk = [];
            for (var i = 0; i < dataItems.length; i++) {
                var item = dataItems[i];

                if (chunk.length < recordsPerFile) {
                    chunk.push(item);
                } else {
                    dataChunks.push(chunk);
                    chunk = [];
                    chunk.push(item);
                }
            }

            if (chunk.length > 0) {
                dataChunks.push(chunk);
            }
        } else {
            dataChunks.push(dataItems);
        }

        var chunkCounter = 0;
        async.eachSeries(dataChunks,
        function (chunk, asyncCallback) {
            var counterSuffix = '';
            if (recordsPerFile) {
                chunkCounter++;
                counterSuffix = util.format('.%d', chunkCounter);
            }
            var filename = util.format(
                "%s/%s%s.json",
                folderPath,
                baseFileName,
                counterSuffix);

            fs.writeFile(filename, JSON.stringify(chunk, null, 2), 'utf8',
            function (err) {
                if (err) {
                    var errMsg = util.format("dumpTable could not write to file: %s %s", filename, JSON.stringify(err));
                    return asyncCallback(err, null);
                }

                var doneMsg = util.format("dumpTable dumped %d data records to file: %s", chunk.length, filename);
                logger.warn(doneMsg);
                return asyncCallback(null, filename);
            });
        }, function (err, asyncResults) {
            return callback(err, asyncResults);
        });
    } catch (err) {
        logger.error(util.format("dumpTable.writeRecordsToFile caught exception: %s", err));
        logger.error(err.stack);
        logger.error('*** forcing process.exit')
        process.exit(2);
    }
};

exports.dumpTableToDataFile =
function (logger, dynamodbClient, tableName, folderPath, baseFileName, recordsPerFile, callback) {
    logger.debug(util.format('dumpTable.dumpTableToDataFile: %s', tableName));

    dynamodbClient.getAllTableRecords(tableName,
    function (err, dataItems) {
        try {
            if (err) {
                var errMsg = util.format("dumpTable.dumpTableToDataFile could not dump table: %s: %s", tableName, err);
                return callback(errMsg, null);
            }

            writeRecordsToFile(logger, dataItems, folderPath, baseFileName, recordsPerFile, callback);
        } catch (err) {
            logger.error(util.format("dumpTable.dumpTableToDataFile caught exception: %s", err));
            logger.error(err.stack);
            logger.error('*** forcing process.exit')
            process.exit(2);
        }
    });
};

exports.dumpHashKeyOnlyRecordsToDataFile =
function (logger, dynamodbClient, tableName, hashKeyName, hashKeyValues, hashKeyIsString, folderPath, baseFileName, recordsPerFile, callback) {
    logger.debug(util.format('dumpHashKeyOnlyRecordsToDataFile: %s (%s)', tableName, hashKeyValues));

    var allDataItems = [];

    var hashKeyValueArray = hashKeyValues.split(',');
    async.eachSeries(hashKeyValueArray,
    function (hashKeyValue, asyncCallback) {
        var typedHashKeyValue = hashKeyValue;
        if (!hashKeyIsString) {
            var typedHashKeyValue = Number(hashKeyValue);
        }
        dynamodbClient.getTableRecordForHashKey(tableName, hashKeyName, typedHashKeyValue,
        function (err, dataItem) {
            if (err) {
                var errMsg = util.format("dumpHashKeyOnlyRecords could not dump table record: %s (%s = %s): %s", tableName, hashKeyName, hashKeyValue, err);
                return asyncCallback(errMsg, null);
            }

            logger.debug(util.format("dumpHashKeyOnlyRecords returned dataItem: %s", JSON.stringify(dataItem)));

            if (dataItem) {
                allDataItems.push(dataItem);
            }

            return asyncCallback(null, dataItem);
        });
    }, function (err, asyncResults) {
        if (err) {
            var errMsg = util.format("dumpHashKeyOnlyRecords async final callback returned error: %s", JSON.stringify(err));
            return callback(errMsg, null);
        }

        writeRecordsToFile(logger, allDataItems, folderPath, baseFileName, recordsPerFile, callback);
    });
};

exports.dumpHashKeyRecordSetToDataFile =
function (logger, dynamodbClient, tableName, hashKeyName, hashKeyValue, folderPath, baseFileName, recordsPerFile, callback) {
    logger.debug(util.format('dumpHashKeyRecordSetToDataFile: %s (%s)', tableName, hashKeyValue));

    var allDataItems = [];

    dynamodbClient.getTableRecordsForHashKey(tableName, hashKeyName, hashKeyValue,
    function (err, dataItems) {
        if (err) {
            var errMsg = util.format("dumpHashKeyRecordSetToDataFile could not dump table records: %s (%s = %s): %s", tableName, hashKeyName, hashKeyValue, err);
            return asyncCallback(errMsg, null);
        }

        writeRecordsToFile(logger, dataItems, folderPath, baseFileName, recordsPerFile, callback);
    });
};

exports.dumpHashKeyRangeKeyRecordToDataFile =
function (logger, dynamodbClient, tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, folderPath, baseFileName, callback) {
    logger.debug(util.format('dumpHashKeyRangeKeyRecordToDataFile: %s (%s %s)', tableName, hashKeyValue, rangeKeyValue));

    var allDataItems = [];

    dynamodbClient.getTableRecordForHashAndRangeKey(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue,
    function (err, dataItem) {
        if (err) {
            var errMsg = util.format("dumpHashKeyRangeKeyRecordToDataFile could not dump table record: %s (%s = %s): %s", tableName, hashKeyName, hashKeyValue, err);
            return callback(errMsg, null);
        }

        logger.debug(util.format("dumpHashKeyRangeKeyRecordToDataFile returned dataItem: %s", JSON.stringify(dataItem)));

        if (dataItem) {
            allDataItems.push(dataItem);
        }

        var recordsPerFile = null;
        writeRecordsToFile(logger, allDataItems, folderPath, baseFileName, recordsPerFile, callback);
    });
};

exports.dumpHashRangeQueryToDataFile =
function (logger, dynamodbClient, tableName, hashKeyName, hashKeyValue, rangeKeyComparison, rangeKeyName, rangeKeyValues, folderPath, baseFileName, callback) {
    logger.debug(util.format('dumpHashRangeQueryToDataFile: %s (%s)', tableName, hashKeyValue));

    var allDataItems = [];

    var scanIndexForward = true;
    var attributesToGet = null;

    dynamodbClient.queryTableRecords(tableName, hashKeyName, hashKeyValue, rangeKeyComparison, rangeKeyName, rangeKeyValues, scanIndexForward, attributesToGet,
    function (err, dataItems) {
        if (err) {
            var errMsg = util.format("dumpHashRangeQueryToDataFile could not dump table records: %s (%s = %s): %s", tableName, hashKeyName, hashKeyValue, err);
            return asyncCallback(errMsg, null);
        }

        var recordsPerFile = null
        writeRecordsToFile(logger, dataItems, folderPath, baseFileName, recordsPerFile, callback);
    });
};

exports.dumpFilterToDataFile =
function (logger, dynamodbClient, tableName, filter, dumpFileFolderPath, baseFileName, callback) {
    logger.debug(util.format('dumpFilterToDataFile: %s', tableName));

    var allDataItems = [];

    dynamodbClient.filterTableRecords(tableName, filter,
    function (err, dataItems) {
        if (err) {
            var errMsg = util.format("dumpFilterToDataFile could not dump table records: %s (%s)", tableName, JSON.stringify(filter), err);
            return callback(errMsg, null);
        }

        var recordsPerFile = null
        writeRecordsToFile(logger, dataItems, dumpFileFolderPath, baseFileName, recordsPerFile, callback);
    });
};
