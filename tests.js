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

var dbClient = require('./dynamodbClient');
var settings = require('./testSettings');
var logger = require('./testLogWrapper').logger;
var async = require('async');
var fs = require('fs');
var util = require('util');

// Setup:
//   Install node (including npm).
//   Navigate to this folder and run the following command:
//
//     npm install
//
// Usage:
//   Start the Alternator process in a separate command/terminal window.
//   Run these manual integration tests via the command line:
//
//     node tests
//
//   Overall Test Results messages will be logged to the console as 'info' or higher.

var secondsBetweenTests = 1;

var loadFileFolderPath = './testData';
var dumpFileFolderPath = './testData';
var referenceFileFolderPath = './testReferenceData';

process.on('uncaughtException', function (err) {
    logger.error('*** uncaughtException:');
    logger.error(err);
    logger.error(err.stack);
    logger.error(JSON.stringify(err));
    logger.error('*** forcing process.exit')
    process.exit(2);
});

var pause = function (waitSeconds, err, ok, callback) {
    var waitMilliseconds = waitSeconds * 1000;
    logger.debug(util.format("Waiting %d seconds.", waitSeconds));
    setTimeout(function () {
        callback(err, ok);
    }, waitMilliseconds);
};

var verifyFilesMatch =
function (testFileFullPath, referenceFileFullPath, callback) {
    try {
        logger.debug(util.format("verifyFilesMatch %s vs. %s", testFileFullPath, referenceFileFullPath));

        var testData = fs.readFileSync(testFileFullPath, 'utf8');
        var referenceData = fs.readFileSync(referenceFileFullPath, 'utf8');

        if (stringsMatchIgnoringCarriageReturns(testData, referenceData)) {
            var okMsg = util.format("verifyFilesMatch Success: %s vs. %s", testFileFullPath, referenceFileFullPath);
            logger.warn(okMsg);
            return callback(null, true);
        } else {
            var errMsg = util.format("verifyFilesMatch FAILURE: %s vs. %s", testFileFullPath, referenceFileFullPath);
            logger.error(errMsg);
            return callback(null, false);
        }
    } catch (err) {
        logger.error(util.format("verifyFilesMatch caught exception: %s", JSON.stringify(err)));
        logger.error(err.stack);
        return callback(null, false);
    }
};

var stringsMatchIgnoringCarriageReturns =
function (testString, referenceString) {
    var testWithoutBlanks = testString.replace(/\r/g, '');
    var referenceWithoutBlanks = referenceString.replace(/\r/g, '');
    var match = (testWithoutBlanks === referenceWithoutBlanks);
    return match;
};

var testDbClientInit =
function (callback) {
    logger.info("testDbClientInit");

    dbClient.init(settings.dynamodb.test, logger,
    function (err, result) {
        if (err) {
            logger.error(util.format("testDbClientInit: dbClient.init returned error: %s", JSON.stringify(err)));
            if ((err.code === "NetworkingError") && (err.errno === "ECONNREFUSED")) {
                logger.warn("*** You need to start Alternator in a separate process! ***");
                logger.warn("(You can use the command 'mvn exec:java' from the root Alternator folder.)");
                logger.warn("Forcing process exit.");
                process.exit(1);
            }
            return callback(null, false);
        }

        var endpoint = dbClient.currentEndpoint();
        if (!endpoint) {
            logger.error("testDbClientInit: dbClient.currentEndpoint returned no value");
            return callback(null, false);
        }

        logger.debug("testCreateConnection dbClient.init succeeded");
        return callback(null, true);
    });
}

var testCreateTables =
function (callback) {
    logger.info("testCreateTables");

    async.eachSeries(settings.testTables,
    function (testTable, asyncCallback) {
        logger.debug(util.format("testCreateTables %s", JSON.stringify(testTable)));
        dbClient.createTable(
            testTable.name,
            testTable.hashKey,
            testTable.hashKeyIsString,
            testTable.rangeKey,
            testTable.rangeKeyIsString,
            settings.dynamodb.test.readCapacityUnits,
            settings.dynamodb.test.writeCapacityUnits,
        function (err, result) {
            if (err) {
                logger.warn(util.format("testCreateTables: dbClient.createTable '%s' returned error: ", testTable.name, JSON.stringify(err)));
                return asyncCallback(err, null);
            }

            logger.debug(util.format("testCreateTables: dbClient.createTable '%s' returned result: ", testTable.name, JSON.stringify(result)));
            return asyncCallback(null, result);
        });
    }, function (err) {
        if (err) {
            logger.error(util.format("testCreateTables: encountered error: %s", JSON.stringify(err)));
            return callback(null, false);
        }

        logger.debug("testCreateTables succeeded");
        return callback(null, true);
    });
}

var testLoadTables =
function (callback) {
    logger.info("testLoadTables");

    var loadTable = require('./loadTable');

    async.eachSeries(settings.testTables,
    function (testTable, asyncCallback) {
        try {
            var loadFileFullPath = util.format("%s/%s.json", loadFileFolderPath, testTable.name);

            logger.debug(util.format("testLoadTables %s from %s", testTable.name, loadFileFullPath));
            loadTable.loadTableFromDataFile(logger, dbClient, testTable.name, loadFileFullPath,
            function (err, result) {
                if (err) {
                    logger.warn(util.format("testLoadTables: loadTable.loadTableFromDataFile '%s' returned error: ", testTable.name, JSON.stringify(err)));
                    return asyncCallback(err, null);
                }

                logger.debug(util.format("testLoadTables: loadTable.loadTableFromDataFile '%s' returned result: ", testTable.name, JSON.stringify(result)));
                return asyncCallback(null, result);
            });
        } catch (err) {
            logger.error(util.format("testLoadTables caught exception: %s", JSON.stringify(err)));
            logger.error(err.stack);
            return asyncCallback(err, null);
        }
    }, function (err) {
        if (err) {
            logger.error(util.format("testLoadTables: encountered error: %s", JSON.stringify(err)));
            return callback(null, false);
        }

        logger.debug("testLoadTables succeeded");
        return callback(null, true);
    });
}

var testDumpTables =
function (recordsPerFile, callback) {
    logger.info("testDumpTables");

    var dumpTable = require('./dumpTable');

    async.eachSeries(settings.testTables,
    function (testTable, asyncCallback) {
        try {
            var baseFileName = util.format("dump.%s", testTable.name);
            logger.debug(util.format("testDumpTables %s to %s", testTable.name, dumpFileFolderPath));
            dumpTable.dumpTableToDataFile(logger, dbClient, testTable.name, dumpFileFolderPath, baseFileName, recordsPerFile,
            function (err, result) {
                if (err) {
                    logger.warn(util.format("testDumpTables: dumpTable.dumpTableToDataFile '%s' returned error: ", testTable.name, JSON.stringify(err)));
                    return asyncCallback(err, null);
                }

                logger.debug(util.format("testDumpTables: dumpTable.dumpTableToDataFile '%s' returned result: ", testTable.name, JSON.stringify(result)));
                return asyncCallback(null, result);
            });
        } catch (err) {
            logger.error(util.format("testDumpTables caught exception: %s", JSON.stringify(err)));
            logger.error(err.stack);
            return asyncCallback(err, null);
        }
    }, function (err) {
        if (err) {
            logger.error(util.format("testDumpTables: encountered error: %s", JSON.stringify(err)));
            return callback(null, false);
        }

        logger.debug("testDumpTables succeeded");
        return callback(null, true);
    });
}

var testVerifyDumpFiles =
function (callback) {
    logger.info("testVerifyDumpFiles");

    var mismatchCount = 0;

    async.each(settings.testTables,
    function (testTable, asyncCallback) {
        try {
            var referenceFileFullPath = util.format("%s/reference.%s.json", referenceFileFolderPath, testTable.name);
            var dumpFileFullPath = util.format("%s/dump.%s.json", dumpFileFolderPath, testTable.name);

            verifyFilesMatch(dumpFileFullPath, referenceFileFullPath,
            function (err, filesMatch) {
                if (err) {
                    return asyncCallback(err, null);
                }

                if (!filesMatch) {
                    mismatchCount++;
                }

                return asyncCallback(null, filesMatch);
            });
        } catch (err) {
            logger.error(util.format("testVerifyDumpFiles caught exception: %s", JSON.stringify(err)));
            logger.error(err.stack);
            return asyncCallback(err, null);
        }
    }, function (err) {
        if (err) {
            logger.error(util.format("testVerifyDumpFiles: encountered error: %s", JSON.stringify(err)));
            return callback(null, false);
        }

        if (mismatchCount === 0) {
            logger.debug("testVerifyDumpFiles succeeded");
            return callback(null, true);
        } else {
            logger.error(util.format("testVerifyDumpFiles failed for %d files.", mismatchCount));
            return callback(null, false);
        }
    });
}

var testDumpHashKeyOnly =
function (tableName, hashKeyName, hashKeyValues, hashKeyIsString, callback) {
    logger.info(util.format("testDumpHashKeyOnly %s", tableName));

    var dumpTable = require('./dumpTable');

    try {
        var baseFileName = util.format("dump.hashKey.%s", tableName);
        var recordsPerFile = null;

        logger.debug(util.format("testDumpHashKeyOnly %s (%s) to %s", tableName, hashKeyValues, dumpFileFolderPath));
        dumpTable.dumpHashKeyOnlyRecordsToDataFile(logger, dbClient, tableName, hashKeyName, hashKeyValues, hashKeyIsString, dumpFileFolderPath, baseFileName, recordsPerFile,
        function (err, result) {
            if (err) {
                logger.warn(util.format("testDumpHashKeyOnly: dumpTable.dumpHashKeyOnlyRecordsToDataFile '%s' returned error: ", tableName, JSON.stringify(err)));
                return callback(err, null);
            }

            logger.debug(util.format("testDumpHashKeyOnly: dumpTable.dumpHashKeyOnlyRecordsToDataFile '%s' returned result: ", tableName, JSON.stringify(result)));

            var referenceFileFullPath = util.format("%s/reference.%s.json", referenceFileFolderPath, baseFileName);
            var dumpFileFullPath = util.format("%s/%s.json", dumpFileFolderPath, baseFileName);

            verifyFilesMatch(dumpFileFullPath, referenceFileFullPath, callback);
        });
    } catch (err) {
        logger.error(util.format("testDumpHashKeyOnly caught exception: %s", JSON.stringify(err)));
        logger.error(err.stack);
        return callback(err, null);
    }
}

var testDumpHashKeyRecordSet =
function (tableName, hashKeyName, hashKeyValue, callback) {
    logger.info(util.format("testDumpHashKeyRecordSet %s", tableName));

    var dumpTable = require('./dumpTable');

    try {
        var baseFileName = util.format("dump.hashKeyRecordSet.%s", tableName);
        var recordsPerFile = null;

        logger.debug(util.format("testDumpHashKeyRecordSet %s (%s) to %s", tableName, hashKeyValue, dumpFileFolderPath));
        dumpTable.dumpHashKeyRecordSetToDataFile(logger, dbClient, tableName, hashKeyName, hashKeyValue, dumpFileFolderPath, baseFileName, recordsPerFile,
        function (err, result) {
            if (err) {
                logger.warn(util.format("testDumpHashKeyRecordSet: dumpTable.dumpHashKeyOnlyRecordsToDataFile '%s' returned error: ", tableName, JSON.stringify(err)));
                return callback(err, null);
            }

            logger.debug(util.format("testDumpHashKeyRecordSet: dumpTable.dumpHashKeyOnlyRecordsToDataFile '%s' returned result: ", tableName, JSON.stringify(result)));

            var referenceFileFullPath = util.format("%s/reference.%s.json", referenceFileFolderPath, baseFileName);
            var dumpFileFullPath = util.format("%s/%s.json", dumpFileFolderPath, baseFileName);

            verifyFilesMatch(dumpFileFullPath, referenceFileFullPath, callback);
        });
    } catch (err) {
        logger.error(util.format("testDumpHashKeyRecordSet caught exception: %s", JSON.stringify(err)));
        logger.error(err.stack);
        return callback(err, null);
    }
}

var testDumpHashKeyRangeKeyRecordToDataFile =
function (tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, callback) {
    logger.info(util.format("testDumpHashKeyRangeKeyRecordToDataFile %s", tableName));

    var dumpTable = require('./dumpTable');

    try {
        var baseFileName = util.format("dump.hashRangeRecord.%s", tableName);

        logger.debug(util.format("testDumpHashKeyRangeKeyRecordToDataFile %s (%s %s) to %s", tableName, hashKeyValue, rangeKeyValue, dumpFileFolderPath));
        dumpTable.dumpHashKeyRangeKeyRecordToDataFile(logger, dbClient, tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, dumpFileFolderPath, baseFileName,
        function (err, result) {
            if (err) {
                logger.warn(util.format("testDumpHashKeyRangeKeyRecordToDataFile: dumpTable.testDumpHashKeyRangeKeyRecordToDataFile '%s' returned error: ", tableName, JSON.stringify(err)));
                return callback(err, null);
            }

            logger.debug(util.format("testDumpHashKeyRangeKeyRecordToDataFile: dumpTable.testDumpHashKeyRangeKeyRecordToDataFile '%s' returned result: ", tableName, JSON.stringify(result)));

            var referenceFileFullPath = util.format("%s/reference.%s.json", referenceFileFolderPath, baseFileName);
            var dumpFileFullPath = util.format("%s/%s.json", dumpFileFolderPath, baseFileName);

            verifyFilesMatch(dumpFileFullPath, referenceFileFullPath, callback);
        });
    } catch (err) {
        logger.error(util.format("testDumpHashKeyRangeKeyRecordToDataFile caught exception: %s", JSON.stringify(err)));
        logger.error(err.stack);
        return callback(err, null);
    }
}

var testHashRangeQuery =
function (tableName, hashKeyName, hashKeyValue, rangeKeyComparison, rangeKeyName, rangeKeyValues, callback) {
    logger.info(util.format("testHashRangeQuery %s", tableName));

    var dumpTable = require('./dumpTable');

    try {
        var baseFileName = util.format("dump.hashRangeQuery.%s.%s", rangeKeyComparison, tableName);

        logger.debug(util.format("testHashRangeQuery %s (%s) to %s", tableName, hashKeyValue, dumpFileFolderPath));
        dumpTable.dumpHashRangeQueryToDataFile(logger, dbClient, tableName, hashKeyName, hashKeyValue, rangeKeyComparison, rangeKeyName, rangeKeyValues, dumpFileFolderPath, baseFileName,
        function (err, result) {
            if (err) {
                logger.warn(util.format("testHashRangeQuery: dumpTable.dumpHashRangeQueryToDataFile '%s' returned error: ", tableName, JSON.stringify(err)));
                return callback(err, null);
            }

            logger.debug(util.format("testHashRangeQuery: dumpTable.dumpHashRangeQueryToDataFile '%s' returned result: ", tableName, JSON.stringify(result)));

            var referenceFileFullPath = util.format("%s/reference.%s.json", referenceFileFolderPath, baseFileName);
            var dumpFileFullPath = util.format("%s/%s.json", dumpFileFolderPath, baseFileName);

            verifyFilesMatch(dumpFileFullPath, referenceFileFullPath, callback);
        });
    } catch (err) {
        logger.error(util.format("testHashRangeQuery caught exception: %s", JSON.stringify(err)));
        logger.error(err.stack);
        return callback(err, null);
    }
};

var testFilter =
function (tableName, attrName, comparison, attrValues, callback) {
    logger.info(util.format("testFilter %s", tableName));

    var dumpTable = require('./dumpTable');

    try {
        var baseFileName = util.format("dump.testFilter.%s.%s.%s", attrName, comparison, tableName);

        logger.debug(util.format("testFilter %s (%s %s) to %s", tableName, attrName, comparison, dumpFileFolderPath));
        var filter = dbClient.createAttributeFilter(attrName, comparison, attrValues);

        dumpTable.dumpFilterToDataFile(logger, dbClient, tableName, filter, dumpFileFolderPath, baseFileName,
        function (err, result) {
            if (err) {
                logger.warn(util.format("testFilter: dumpTable.dumpFilterToDataFile '%s' returned error: ", tableName, JSON.stringify(err)));
                return callback(err, null);
            }

            logger.debug(util.format("testFilter: dumpTable.dumpFilterToDataFile '%s' returned result: ", tableName, JSON.stringify(result)));

            var referenceFileFullPath = util.format("%s/reference.%s.json", referenceFileFolderPath, baseFileName);
            var dumpFileFullPath = util.format("%s/%s.json", dumpFileFolderPath, baseFileName);

            verifyFilesMatch(dumpFileFullPath, referenceFileFullPath, callback);
        });
    } catch (err) {
        logger.error(util.format("testFilter caught exception: %s", JSON.stringify(err)));
        logger.error(err.stack);
        return callback(err, null);
    }
};

var testDeleteRecord =
function (tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, callback) {
    logger.info(util.format("testDeleteRecord %s", tableName));

    var dumpTable = require('./dumpTable');

    try {
        logger.debug(util.format("testDeleteRecord %s (%s %s) to %s", tableName, hashKeyValue, rangeKeyValue, dumpFileFolderPath));
        dbClient.deleteTableRecord(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue,
        function (err, oldData) {
            if (err) {
                logger.error(util.format("testDeleteRecord: dbClient.deleteTableRecord '%s' returned error: ", tableName, JSON.stringify(err)));
                logger.error(err.stack);
                return callback(null, false);
            }

            if (oldData) {
                if (oldData[hashKeyName] !== hashKeyValue) {
                    logger.error(util.format("testDeleteRecord: dbClient.deleteTableRecord '%s' returned incorrect oldData.%s: %s", tableName, hashKeyName, JSON.stringify(oldData)));
                    return callback(null, false);
                } else if (rangeKeyName) {
                    if (oldData[rangeKeyName] !== rangeKeyValue) {
                        logger.error(util.format("testDeleteRecord: dbClient.deleteTableRecord '%s' returned incorrect oldData.%s: %s", tableName, rangeKeyName, JSON.stringify(oldData)));
                        return callback(null, false);
                    }
                }
            } else {
                logger.warn(util.format("testDeleteRecord: dbClient.deleteTableRecord '%s' did not return oldData", tableName));
                return callback(null, false);
            }

            var baseFileName = util.format("dump.testDeleteRecord.%s", tableName);
            var recordsPerFile = null;
            dumpTable.dumpTableToDataFile(logger, dbClient, tableName, dumpFileFolderPath, baseFileName, recordsPerFile,
            function (err, result) {
                if (err) {
                    logger.warn(util.format("testDeleteRecord: dumpTable.dumpTableToDataFile '%s' returned error: ", tableName, JSON.stringify(err)));
                    return asyncCallback(err, null);
                }

                logger.debug(util.format("testDeleteRecord: dumpTable.dumpTableToDataFile '%s' returned result: ", tableName, JSON.stringify(result)));

                var referenceFileFullPath = util.format("%s/reference.%s.json", referenceFileFolderPath, baseFileName);
                var dumpFileFullPath = util.format("%s/%s.json", dumpFileFolderPath, baseFileName);

                verifyFilesMatch(dumpFileFullPath, referenceFileFullPath, callback);
            });
        });
    } catch (err) {
        logger.error(util.format("testDeleteRecord caught exception: %s", JSON.stringify(err)));
        logger.error(err.stack);
        return callback(err, null);
    }
}

// Reference: https://github.com/caolan/async#series
async.series({
    testDbClientInit: function (callback) {
        testDbClientInit(function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testCreateTables: function (callback) {
        testCreateTables(function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testLoadTables: function (callback) {
        testLoadTables(function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpTablesFull: function (callback) {
        var recordsPerFile = null;
        testDumpTables(recordsPerFile, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpTablesChunks: function (callback) {
        var recordsPerFile = 10;
        testDumpTables(recordsPerFile, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testVerifyDumpFiles: function (callback) {
        testVerifyDumpFiles(function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpNumericHashKeyOnly: function (callback) {
        var tableName = 'numericHash';
        var hashKeyName = 'hashId';
        var hashKeyValues = '123,789,131415';
        var hashKeyIsString = false;

        testDumpHashKeyOnly(tableName, hashKeyName, hashKeyValues, hashKeyIsString, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpStringHashKeyOnly: function (callback) {
        var tableName = 'stringHash';
        var hashKeyName = 'hashCode';
        var hashKeyValues = 'abc,ghi,jkl';
        var hashKeyIsString = true;

        testDumpHashKeyOnly(tableName, hashKeyName, hashKeyValues, hashKeyIsString, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpNumericHashNumericRangeRecordSet: function (callback) {
        var tableName = 'numericHashNumericRange';
        var hashKeyName = 'hashId';
        var hashKeyValue = 456;

        testDumpHashKeyRecordSet(tableName, hashKeyName, hashKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpNumericHashStringRangeRecordSet: function (callback) {
        var tableName = 'numericHashStringRange';
        var hashKeyName = 'hashId';
        var hashKeyValue = 123;

        testDumpHashKeyRecordSet(tableName, hashKeyName, hashKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpStringHashNumericRangeRecordSet: function (callback) {
        var tableName = 'stringHashNumericRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '456';

        testDumpHashKeyRecordSet(tableName, hashKeyName, hashKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpStringHashStringRangeRecordSet: function (callback) {
        var tableName = 'stringHashStringRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '123';

        testDumpHashKeyRecordSet(tableName, hashKeyName, hashKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpNumericHashNumericRangeRecord: function (callback) {
        var tableName = 'numericHashNumericRange';
        var hashKeyName = 'hashId';
        var hashKeyValue = 456;
        var rangeKeyName = 'rangeId';
        var rangeKeyValue = 2022;

        testDumpHashKeyRangeKeyRecordToDataFile(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpNumericHashStringRangeRecord: function (callback) {
        var tableName = 'numericHashStringRange';
        var hashKeyName = 'hashId';
        var hashKeyValue = 789;
        var rangeKeyName = 'rangeCode';
        var rangeKeyValue = 'a1';

        testDumpHashKeyRangeKeyRecordToDataFile(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpStringHashNumericRangeRecord: function (callback) {
        var tableName = 'stringHashNumericRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '456';
        var rangeKeyName = 'rangeId';
        var rangeKeyValue = 2022;

        testDumpHashKeyRangeKeyRecordToDataFile(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDumpStringHashStringRangeRecord: function (callback) {
        var tableName = 'stringHashStringRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '123';
        var rangeKeyName = 'rangeCode';
        var rangeKeyValue = 'a1';

        testDumpHashKeyRangeKeyRecordToDataFile(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testHashRangeBetweenQuery: function (callback) {
        var tableName = 'stringHashStringRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '456';
        var rangeKeyComparison = 'BETWEEN';
        var rangeKeyName = 'rangeCode';
        var rangeKeyValues = ['b2', 'b3'];

        testHashRangeQuery(tableName, hashKeyName, hashKeyValue, rangeKeyComparison, rangeKeyName, rangeKeyValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testHashRangeInQuery: function (callback) {
        var tableName = 'stringHashStringRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '456';
        var rangeKeyComparison = 'IN';
        var rangeKeyName = 'rangeCode';
        var rangeKeyValues = ['b2', 'b4'];

        testHashRangeQuery(tableName, hashKeyName, hashKeyValue, rangeKeyComparison, rangeKeyName, rangeKeyValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testHashRangeGeQuery: function (callback) {
        var tableName = 'stringHashStringRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '456';
        var rangeKeyComparison = 'GE';
        var rangeKeyName = 'rangeCode';
        var rangeKeyValues = ['b2'];

        testHashRangeQuery(tableName, hashKeyName, hashKeyValue, rangeKeyComparison, rangeKeyName, rangeKeyValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testNumericBetweenFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'numberField';
        var comparison = 'BETWEEN';
        var attrValues = [202, 404];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testNumericInFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'numberField';
        var comparison = 'IN';
        var attrValues = [202, 404];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testNumericGeFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'numberField';
        var comparison = 'GE';
        var attrValues = [404];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testStringBetweenFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'stringField';
        var comparison = 'BETWEEN';
        var attrValues = ['ghi', 'jkl'];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testStringInFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'stringField';
        var comparison = 'IN';
        var attrValues = ['def', 'mno'];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testStringGeFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'stringField';
        var comparison = 'GE';
        var attrValues = ['ghi'];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testStringBeginsWithFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'stringField';
        var comparison = 'BEGINS_WITH';
        var attrValues = ['g'];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testStringContainsFilter: function (callback) {
        var tableName = 'numericHash';
        var attrName = 'stringField';
        var comparison = 'CONTAINS';
        var attrValues = ['e'];

        testFilter(tableName, attrName, comparison, attrValues, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDeleteNumericHashRecord: function (callback) {
        var tableName = 'numericHash';
        var hashKeyName = 'hashId';
        var hashKeyValue = 456;
        var rangeKeyName = null;
        var rangeKeyValue = null;

        testDeleteRecord(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDeleteStringHashRecord: function (callback) {
        var tableName = 'stringHash';
        var hashKeyName = 'hashCode';
        var hashKeyValue = 'def';
        var rangeKeyName = null;
        var rangeKeyValue = null;

        testDeleteRecord(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDeleteNumericHashNumericRangeRecord: function (callback) {
        var tableName = 'numericHashNumericRange';
        var hashKeyName = 'hashId';
        var hashKeyValue = 456;
        var rangeKeyName = 'rangeId';
        var rangeKeyValue = 2022;

        testDeleteRecord(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDeleteNumericHashStringRangeRecord: function (callback) {
        var tableName = 'numericHashStringRange';
        var hashKeyName = 'hashId';
        var hashKeyValue = 789;
        var rangeKeyName = 'rangeCode';
        var rangeKeyValue = 'a1';

        testDeleteRecord(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDeleteStringHashNumericRangeRecord: function (callback) {
        var tableName = 'stringHashNumericRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '456';
        var rangeKeyName = 'rangeId';
        var rangeKeyValue = 2022;

        testDeleteRecord(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    },
    testDeleteStringHashStringRangeRecord: function (callback) {
        var tableName = 'stringHashStringRange';
        var hashKeyName = 'hashCode';
        var hashKeyValue = '123';
        var rangeKeyName = 'rangeCode';
        var rangeKeyValue = 'a1';

        testDeleteRecord(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, function (err, ok) {
            pause(secondsBetweenTests, err, ok, callback);
        });
    }
}, function (err, results) {
    logger.info("--- Overall Test Results ---");
    if (err) {
        logger.warn(util.format("*** Error Results: %s", JSON.stringify(err)));
    }
    if (results) {
        var successCount = 0;
        var failureCount = 0;
        for (var testName in results) {
            if (results.hasOwnProperty(testName)) {
                var testOk = results[testName];
                if (testOk) {
                    logger.info(util.format("=== Success for %s", testName));
                    successCount++;
                } else {
                    logger.warn(util.format("*** Failure for %s", testName));
                    failureCount++;
                }
            }
        }
        var summaryMsg = util.format("Summary Results: %d tests Succeeded, %d tests Failed.", successCount, failureCount);
        if (failureCount > 0) {
            logger.error(summaryMsg);
        } else {
            logger.info(summaryMsg);
        }
    }
    process.exit(0);
});
