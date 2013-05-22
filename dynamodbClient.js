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

module.exports = function dynamodbClient() {
    "use strict";

    var awssdk = require('aws-sdk');

    var className = "dynamodbClient";

    var awsDbClient = null;
    var tableNamePrefix = '';
    var tableNameSuffix = '';

    var logger, util;

    var init =
    function (settingsInit, winstonLogger, callback) {
        var settings = settingsInit;
        logger = winstonLogger;

        logger.debug("dynamodbClient.init");

        util = require('util');

        return configureClient(settings, callback);
    };

    var configureClient =
    function (dynamodbSettings, callback) {
        logger.debug("dynamodbClient.configureClient");

        if (awsDbClient) {
            var warnMsg = "dynamodbClient.configureClient: awsDbClient is already configured.";
            logger.warn(warnMsg);
            return callback(null, warnMsg);
        }

        tableNamePrefix = dynamodbSettings.tableNamePrefix;
        tableNameSuffix = dynamodbSettings.tableNameSuffix;

        var options = {};
        if (dynamodbSettings.useEmulator) {
            // Use local emulator; do not connect to AWS.
            options.endpoint = dynamodbSettings.emulatorEndpoint;

            // Set the credentials to dummy variables; they do need to be populated for the client to function.
            awssdk.config.update({ accessKeyId: 'akid', secretAccessKey: 'secret', region: 'us-east-1', "maxRetries": 1 });
        } else {
            // Since not using local emulator, will need to connect to AWS.
            var credentialsPath = dynamodbSettings.awsCredentialsPath;
            try {
                awssdk.config.loadFromPath(credentialsPath);
            } catch (err) {
                var errMsg = util.format("dynamodbClient.configureClient: Could not load AWS credentials from '%s': %s", credentialsPath, JSON.stringify(err));
                logger.error(errMsg);
                logger.error(err.stack);
                return callback(new Error(errMsg), null);
            }
        }

        var service = new awssdk.DynamoDB(options);
        awsDbClient = service.client;

        // Call list tables to ensure we are connected.
        awsDbClient.listTables({ Limit: 1 }, function (err) {
            try {
                if (err) {
                    // Null out our AWS client reference to allow for a retry after a bad configuration attempt.
                    awsDbClient = null;
                    return callback(err, null);
                }

                // If no error, then we are connected.
                var endpoint = currentEndpoint();
                var doneMsg = util.format("dynamodbClient.configureClient: Connected to DynamoDB endpoint %s", endpoint);
                logger.info(doneMsg);
                return callback(null, doneMsg);
            } catch (err) {
                logger.error(util.format("dynamodbClient.configureClient caught exception: %s", err));
                logger.error(err.stack);
                logger.error('*** forcing process.exit');
                process.exit(2);
            }
        });
    };

    var getClientHasBeenConfigured =
    function () {
        var clientHasBeenConfigured = false;
        if (awsDbClient) {
            clientHasBeenConfigured = true;
        }
        return clientHasBeenConfigured;
    };

    var ensureClientHasBeenConfigured =
    function () {
        logger.debug("dynamodbClient.ensureClientHasBeenConfigured");

        if (!awsDbClient) {
            var errMsg = "dynamodbClient.ensureClientHasBeenConfigured: awsDbClient is null.";
            logger.error(errMsg);
            throw new Error(errMsg);
        }

        logger.debug("dynamodbClient.ensureClientHasBeenConfigured OK");
    };

    var currentEndpoint =
    function () {
        var endpoint = null;
        if (awsDbClient) {
            endpoint = awsDbClient.config.endpoint;
            if (!endpoint) {
                endpoint = awsDbClient.endpoint.href;
            }
        }
        return endpoint;
    };

    var mapLongTableName =
    function (shortTableName) {
        var longTableName = tableNamePrefix + shortTableName + tableNameSuffix;
        logger.debug(util.format("mapLongTableName %s = %s", shortTableName, longTableName));
        return longTableName;
    }

    var getAllTableRecords =
    function (tableName, callback) {
        logger.debug("dynamodbClient.getAllTableRecords");

        try {
            ensureClientHasBeenConfigured();
            longTableName = mapLongTableName(tableName);
        } catch (err) {
            return callback(err, null);
        }

        var longTableName = mapLongTableName(tableName);
        logger.debug(util.format("dynamodbClient.getAllTableRecords table: %s = %s", tableName, longTableName));

        var params = {
            TableName: longTableName,
            ReturnConsumedCapacity: "TOTAL"
        };
        awsDbClient.scan(params,
        function (err, data) {
            if (err) {
                logger.error(util.format("dynamodbClient.getAllTableRecords awsDbClient.scan error: %s %s", JSON.stringify(err), err.message));
                return callback(err, null);
            } else if (!data) {
                logger.error("dynamodbClient.getAllTableRecords awsDbClient.scan did not return any data");
                return callback(err, null);
            }

            var decodedItems = decodeJsonObjectsFromDynamoDbItems(data.Items);
            return callback(null, decodedItems);
        });
    };

    var getTableRecordForHashKey =
    function (tableName, hashKeyName, hashKeyValue, callback) {
        logger.debug("dynamodbClient.getTableRecordForHashKey");

        try {
            ensureClientHasBeenConfigured();
        } catch (err) {
            return callback(err, null);
        }

        var key = {};
        key[hashKeyName] = hashKeyValue;
        var keyParam = encodeJsonObjectForDynamoDb(key);

        var longTableName = mapLongTableName(tableName);
        var params = {
            TableName: longTableName,
            Key: keyParam,
            ConsistentRead: false
        };

        awsDbClient.getItem(params,
        function (err, data) {
            try {
                if (err) {
                    var errMsg = util.format("awsDbClient.getItem %s error: %s %s", longTableName, JSON.stringify(err), err.message);
                    logger.error(errMsg);
                    return callback(errMsg, null);
                } else if (!data) {
                    logger.error("dynamodbClient.getTableRecordForHashKey awsDbClient.getItem did not return any data");
                    return callback(err, null);
                }

                var decodedData = decodeJsonObjectFromDynamoDb(data.Item);
                return callback(null, decodedData);
            } catch (err) {
                logger.error(util.format("dynamodbClient.getTableRecordForHashKey %s caught exception: %s", longTableName, err));
                logger.error(err.stack);
                return callback(err, null);
            }
        });
    };

    var getTableRecordsForHashKey =
    function (tableName, hashKeyName, hashKeyValue, callback) {
        logger.debug("dynamodbClient.getTableRecordsForHashKey");

        try {
            ensureClientHasBeenConfigured();
        } catch (err) {
            return callback(err, null);
        }

        var encodedHashKeyValues = [];
        var encodedHashKeyValue = encodeValueForDynamoDb(hashKeyValue);
        encodedHashKeyValues.push(encodedHashKeyValue);

        var hashKeyCondition = {};
        hashKeyCondition.AttributeValueList = encodedHashKeyValues;
        hashKeyCondition.ComparisonOperator = 'EQ';

        var keyConditions = {};
        keyConditions[hashKeyName] = hashKeyCondition;

        var longTableName = mapLongTableName(tableName);
        var params = {
            TableName: longTableName,
            KeyConditions: keyConditions,
            ConsistentRead: false
        };

        awsDbClient.query(params,
        function (err, data) {
            try {
                if (err) {
                    var errMsg = util.format("awsDbClient.query %s error: %s %s", longTableName, JSON.stringify(err), err.message);
                    logger.error(errMsg);
                    return callback(errMsg, null);
                } else if (!data) {
                    logger.error("dynamodbClient.getTableRecordsForHashKey awsDbClient.query did not return any data");
                    return callback(err, null);
                }

                var decodedData = decodeJsonObjectsFromDynamoDbItems(data.Items);
                return callback(null, decodedData);
            } catch (err) {
                logger.error(util.format("dynamodbClient.getTableRecordsForHashKey %s caught exception: %s", longTableName, err));
                logger.error(err.stack);
                return callback(err, null);
            }
        });
    };

    var getTableRecordForHashAndRangeKey =
    function (tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, callback) {
        logger.debug("dynamodbClient.getTableRecordForHashAndRangeKey");

        try {
            ensureClientHasBeenConfigured();
            longTableName = mapLongTableName(tableName);
        } catch (err) {
            return callback(err, null);
        }

        var keyParam = {};
        keyParam[hashKeyName] = encodeValueForDynamoDb(hashKeyValue);
        if (rangeKeyName) {
            keyParam[rangeKeyName] = encodeValueForDynamoDb(rangeKeyValue);
        }

        var longTableName = mapLongTableName(tableName);
        var params = {
            TableName: longTableName,
            Key: keyParam,
            ConsistentRead: false
        };

        logger.debug(util.format("dynamodbClient.getTableRecordForHashAndRangeKey calling awsDbClient.getItem with params: %s", JSON.stringify(params)));

        awsDbClient.getItem(params,
        function (err, data) {
            try {
                if (err) {
                    var errMsg = util.format("awsDbClient.getItem %s error: %s %s", longTableName, JSON.stringify(err), err.message);
                    logger.error(errMsg);
                    return callback(errMsg, null);
                } else if (!data) {
                    logger.error("dynamodbClient.getTableRecordForHashAndRangeKey awsDbClient.getItem did not return any data");
                    return callback(err, null);
                }

                logger.debug(util.format("dynamodbClient.getTableRecordForHashAndRangeKey awsDbClient.getItem returned data: %s", JSON.stringify(data)));

                var decodedData = decodeJsonObjectFromDynamoDb(data.Item);
                return callback(null, decodedData);
            } catch (err) {
                logger.error(util.format("dynamodbClient.getTableRecordForHashKey %s caught exception: %s", longTableName, err));
                logger.error(err.stack);
                return callback(err, null);
            }
        });
    };

    var queryTableRecords =
    function (tableName, hashKeyName, hashKeyValue, comparison, rangeKeyName, rangeKeyValues, scanIndexForward, attributesToGet, callback) {
        logger.debug(util.format("dynamodbClient.queryTableRecords %s", tableName));

        try {
            ensureClientHasBeenConfigured();
        } catch (err) {
            return callback(err, null);
        }

        var longTableName = mapLongTableName(tableName);
        logger.debug(util.format("dynamodbClient.queryTableRecords table: %s = %s", tableName, longTableName));

        queryHelper(longTableName, hashKeyName, hashKeyValue, comparison, rangeKeyName, rangeKeyValues, scanIndexForward, attributesToGet,
        function (err, dataItems) {
            if (err) {
                logger.error(util.format("dynamodbClient.queryTableRecords queryHelper error: %s", JSON.stringify(err)));
                return callback(err, null);
            } else {
                return callback(null, dataItems);
            }
        });
    };

    // Load an array of objects associated with the specified key(s).
    //   table (required) The name of the table.
    //           NOTE: The currently configured environment ('-dev', etc.)
    //           will be automatically appended to this name.
    //   hashKeyName, hashKeyValue (required) The "aggregrate root" key for a hash-range table.
    //   comparison (required) One of 'EQ','LE','LT','GE','GT','BEGINS_WITH','CONTAINS'
    //   rangeKeyName, rangeKeyValues (nullable) The array of range key values to compare against.
    //       'IN' allows any number of entries.
    //       'BETWEEN' requires 2 entries.
    //       All other comparisons require 1 entry.
    //       If null, the comparison applies to the hashKeyValue.
    //   scanIndexForward (nullable) Set to true to return records in ascending rangeKeyValue order.
    //       Set to false for descending order.
    //       If null, assumes true.
    //   attributesToGet (nullable) NOT YET IMPLEMENTED.
    //       If null, returns all attribute
    //   callback = function(err, data)
    //       err returns null on success, or an error message on failure.
    //       data returns null on failure, or the loaded object array on success.
    var queryHelper =
    function (longTableName, hashKeyName, hashKeyValue, comparison, rangeKeyName, rangeKeyValues, scanIndexForward, attributesToGet, callback) {
        // Jf there is a supplied rangeKey, 
        // then the supplied comparison if for the range keys, 
        // so set the hash key comparison to EQ.  
        // Otherwise, set the hashKeyComparison to comparison.
        var hashKeyComparison;
        var rangeKeyComparison;

        if (rangeKeyValues) {
            hashKeyComparison = 'EQ';
            rangeKeyComparison = comparison;
        } else {
            if (comparison) {
                hashKeyComparison = comparison;
            } else {
                hashKeyComparison = 'EQ';
            }
            rangeKeyComparison = null;
        }

        // Build up rangeKeyCondition.
        var rangeKeyCondition;
        if (rangeKeyValues) {
            var encodedRangeKeyValues = [];
            for (var r = 0; r < rangeKeyValues.length; r++) {
                var encodedRangeKeyValue = encodeValueForDynamoDb(rangeKeyValues[r]);
                encodedRangeKeyValues.push(encodedRangeKeyValue);
            }

            rangeKeyCondition = {};
            rangeKeyCondition.AttributeValueList = encodedRangeKeyValues;
            rangeKeyCondition.ComparisonOperator = rangeKeyComparison;
        }

        // build up hashKeyCondition
        var encodedHashKeyValue = encodeValueForDynamoDb(hashKeyValue);
        var encodedHashKeyValues = [];
        encodedHashKeyValues.push(encodedHashKeyValue);

        var hashKeyCondition = {};
        hashKeyCondition.AttributeValueList = encodedHashKeyValues;
        hashKeyCondition.ComparisonOperator = hashKeyComparison;

        var keyConditions = {};
        keyConditions[hashKeyName] = hashKeyCondition;

        if (rangeKeyValues) {
            keyConditions[rangeKeyName] = rangeKeyCondition;
        }

        var params = {
            TableName: longTableName,
            KeyConditions: keyConditions,
            ScanIndexForward: scanIndexForward,
            ConsistentRead: false
        };

        awsDbClientQueryMethod(params,
        function (err, data) {
            try {
                if (err) {
                    var errMsg = util.format("awsDbClient.query %s error from awsDbClientQueryMethod: %s", longTableName, JSON.stringify(err));
                    logger.error(errMsg);
                    return callback(errMsg, null);
                }

                if (data && data.message) {
                    logger.error(util.format("awsDbClient.query %s message: %s", longTableName, JSON.stringify(data.message)));
                    return callback(data.message, null);
                }

                var lastEvaluatedKey = data.LastEvaluatedKey;
                if (lastEvaluatedKey) {
                    logger.debug(util.format("dynamodbClient.queryHelper for table %s returned lastEvaluatedKey = %s", longTableName, JSON.stringify(lastEvaluatedKey)));
                    retrieveMoreDataItems(awsDbClientQueryMethod, params, lastEvaluatedKey, data.Items,
                    function (err, extendedItems) {
                        if (err) {
                            var errMsg = util.format("dynamodbClient.queryHelper %s retrieveMoreDataItems error: %s", longTableName, JSON.stringify(err));
                            logger.error(errMsg);
                            return callback(errMsg, null);
                        }
                        var extendedDecodedItems = decodeJsonObjectsFromDynamoDbItems(extendedItems);
                        return callback(null, extendedDecodedItems);
                    });
                } else {
                    var decodedItems = decodeJsonObjectsFromDynamoDbItems(data.Items);
                    return callback(null, decodedItems);
                }
            } catch (err) {
                logger.error(util.format("dynamodbClient.queryHelper %s caught exception: %s", longTableName, err));
                logger.error(err.stack);
                return callback(err, null);
            }
        });
    };

    var retrieveMoreDataItems =
    function (awsDbMethod, params, lastEvaluatedKey, priorItems, callback) {
        try {
            params.ExclusiveStartKey = lastEvaluatedKey;
            awsDbMethod(params,
            function (err, data) {
                try {
                    if (err) {
                        var errMsg = util.format("dynamodbClient.retrieveMoreDataItems error: %s", JSON.stringify(err));
                        logger.error(errMsg);
                        return callback(errMsg, null);
                    }

                    if (data && data.message) {
                        logger.error(util.format("dynamodbClient.retrieveMoreDataItems message: %s", JSON.stringify(data.message)));
                        return callback(data.message, null);
                    }

                    var combinedItems = priorItems;
                    if (data.Items) {
                        combinedItems = priorItems.concat(data.Items);
                        logger.debug(util.format("dynamodbClient.retrieveMoreDataItems = %d + %d => %d for table %s", priorItems.length, data.Items.length, combinedItems.length, params.TableName));
                    } else {
                        logger.debug(util.format("dynamodbClient.retrieveMoreDataItems = %d for table %s", combinedItems.length, params.TableName));
                    }

                    if (typeof data.ConsumedCapacity !== "undefined") {
                        var consumedCapacity = data.ConsumedCapacity.CapacityUnits;
                        logger.info("DYNAMODB", { table: params.TableName, consumedCapacity: consumedCapacity, records: data.Items.length, lastEvaluatedKey: JSON.stringify(data.LastEvaluatedKey) });
                    }

                    var lastEvaluatedKey = data.LastEvaluatedKey;
                    if (lastEvaluatedKey) {
                        logger.debug(util.format("recursive dynamodbClient.retrieveMoreDataItems for table %s with lastEvaluatedKey = %s", params.TableName, JSON.stringify(lastEvaluatedKey)));
                        retrieveMoreDataItems(awsDbMethod, params, lastEvaluatedKey, combinedItems,
                        function (err, extendedItems) {
                            try {
                                if (err) {
                                    var errMsg = util.format("recursive dynamodbClient.retrieveMoreDataItems error: %s", JSON.stringify(err));
                                    logger.error(errMsg);
                                    return callback(errMsg, null);
                                }
                                return callback(null, extendedItems);
                            } catch (err) {
                                logger.error(util.format("recursive dynamodbClientretrieveMoreDataItems caught exception: %s", err));
                                logger.error(err.stack);
                                return callback(err, null);
                            }
                        });
                    } else {
                        logger.debug(util.format("dynamodbClient.retrieveMoreDataItems final = %d for table %s", combinedItems.length, params.TableName));
                        return callback(null, combinedItems);
                    }
                } catch (err) {
                    logger.error(util.format("dynamodbClient.retrieveMoreDataItems caught exception from awsDbMethod: %s", err));
                    logger.error(err.stack);
                    return callback(err, null);
                }
            });
        } catch (err) {
            logger.error(util.format("dynamodbClient.retrieveMoreDataItems caught exception: %s", err));
            logger.error(err.stack);
            return callback(err, null);
        }
    };

    var awsDbClientQueryMethod =
    function (params, callback) {
        logger.debug(util.format("calling awsDbClient.query with params: %s", JSON.stringify(params)));
        awsDbClient.query(params,
        function (err, data) {
            logger.debug(util.format("awsDbClient.query returned err: %s data: %s", JSON.stringify(err), JSON.stringify(data)));
            return callback(err, data);
        });
    };

    var insertOrUpdateTableRecord =
    function (tableName, data, callback) {
        logger.debug("dynamodbClient.insertOrUpdateTableRecord");

        try {
            ensureClientHasBeenConfigured();
        } catch (err) {
            return callback(err, null);
        }

        var longTableName = mapLongTableName(tableName);
        var encodedData = encodeJsonObjectForDynamoDb(data);
        var params = {
            TableName: longTableName,
            Item: encodedData,
            ReturnValues: "ALL_OLD"
        };

        awsDbClient.putItem(params,
        function (err, oldData) {
            try {
                if (err) {
                    var errMsg = util.format("dynamodbClient.insertOrUpdateTableRecord: awsDbClient.putItem %s error: %s %s", longTableName, JSON.stringify(err), err.message);
                    logger.error(errMsg);
                    return callback(errMsg, null);
                }

                var decodedData = decodeJsonObjectFromDynamoDb(oldData.Attributes);
                return callback(null, decodedData);
            } catch (err) {
                logger.error(util.format("dynamodbClient.insertOrUpdateTableRecord %s caught exception: %s", longTableName, err));
                logger.error(err.stack);
                return callback(err, null);
            }
        });
    };

    var createKeySchema =
    function (hashKeyName, hashKeyIsString, rangeKeyName, rangeKeyIsString) {
        logger.debug("dynamodbClient.createKeySchema");

        var keySchema = {};
        try {
            if (hashKeyIsString) {
                if (rangeKeyName) {
                    if (rangeKeyIsString) {
                        keySchema = createHashStringRangeStringKeySchema(hashKeyName, rangeKeyName);
                    } else {
                        keySchema = createHashStringRangeNumberKeySchema(hashKeyName, rangeKeyName);
                    }
                } else {
                    keySchema = createHashStringKeySchema(hashKeyName);
                }
            } else {
                if (rangeKeyName) {
                    if (rangeKeyIsString) {
                        keySchema = createHashNumberRangeStringKeySchema(hashKeyName, rangeKeyName);
                    } else {
                        keySchema = createHashNumberRangeNumberKeySchema(hashKeyName, rangeKeyName);
                    }
                } else {
                    keySchema = createHashNumberKeySchema(hashKeyName);
                }
            }
        } catch (err) {
            logger.error(util.format("dynamodbClient.createKeySchema caught exception: %s", err));
            logger.error(err.stack);
            keySchema = null;
        }
        return keySchema;
    };

    var createHashStringKeySchema =
    function (hashKeyName) {
        return [
            { AttributeName: hashKeyName, KeyType: "HASH", AttributeType: "S" }
        ];
    };

    var createHashNumberKeySchema =
    function (hashKeyName) {
        return [
            { AttributeName: hashKeyName, KeyType: "HASH", AttributeType: "N" }
        ];
    };

    var createHashStringRangeStringKeySchema =
    function (hashKeyName, rangeKeyName) {
        return [
            { AttributeName: hashKeyName, KeyType: "HASH", AttributeType: "S" },
            { AttributeName: rangeKeyName, KeyType: "RANGE", AttributeType: "S" }
        ];
    };

    var createHashStringRangeNumberKeySchema =
    function (hashKeyName, rangeKeyName) {
        return [
            { AttributeName: hashKeyName, KeyType: "HASH", AttributeType: "S" },
            { AttributeName: rangeKeyName, KeyType: "RANGE", AttributeType: "N" }
        ];
    };

    var createHashNumberRangeStringKeySchema =
    function (hashKeyName, rangeKeyName) {
        return [
            { AttributeName: hashKeyName, KeyType: "HASH", AttributeType: "N" },
            { AttributeName: rangeKeyName, KeyType: "RANGE", AttributeType: "S" }
        ];
    };

    var createHashNumberRangeNumberKeySchema =
    function (hashKeyName, rangeKeyName) {
        return [
            { AttributeName: hashKeyName, KeyType: "HASH", AttributeType: "N" },
            { AttributeName: rangeKeyName, KeyType: "RANGE", AttributeType: "N" }
        ];
    };

    var createTable =
    function (tableName, hashKeyName, hashKeyIsString, rangeKeyName, rangeKeyIsString, readCapacityUnits, writeCapacityUnits, callback) {
        logger.debug(util.format('dynamodbClient.createTable tableName: %s', tableName));

        try {
            ensureClientHasBeenConfigured();

            var longTableName = mapLongTableName(tableName);
            var keySchema = createKeySchema(hashKeyName, hashKeyIsString, rangeKeyName, rangeKeyIsString);

            // Convert keySchema into KeySchema and AttributeDefinitions.
            var keyFields = [];
            var attributeDefinitions = [];
            for (var i = 0; i < keySchema.length; i++) {
                var schema = keySchema[i];
                keyFields.push({ AttributeName: schema.AttributeName, KeyType: schema.KeyType });
                attributeDefinitions.push({ AttributeName: schema.AttributeName, AttributeType: schema.AttributeType });
            }

            var params = {
                TableName: longTableName,
                KeySchema: keyFields,
                AttributeDefinitions: attributeDefinitions,
                ProvisionedThroughput: {
                    ReadCapacityUnits: readCapacityUnits,
                    WriteCapacityUnits: writeCapacityUnits
                }
            };

            awsDbClient.createTable(params, function (err, data) {
                if (err) {
                    if (err.code === 'ResourceInUseException') {
                        logger.warn(util.format("dynamodbClient.createTable: awsDbClient.createTable %s already exists", longTableName));
                        return callback(null, longTableName);
                    }
                    var errMsg = util.format("dynamodbClient.createTable: awsDbClient.createTable %s returned error: %s %s", longTableName, JSON.stringify(err), err.message);
                    logger.error(errMsg);
                    return callback(errMsg, null);
                }

                if (data.message && data.message.substring(0, 29) === 'The following Errors occured:') {
                    var errMsg = util.format("dynamodbClient.createTable: awsDbClient.createTable %s returned data message: %s", longTableName, data.message);
                    logger.error(errMsg);
                    return callback(errMsg, null);
                }

                return callback(null, longTableName);
            });
        } catch (err) {
            logger.error(util.format("dynamodbClient.createTable caught exception: %s", JSON.stringify(err)));
            logger.error(err.stack);
            return callback(err, null);
        }
    };

    var deleteTableRecord =
    function (tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, callback) {
        logger.debug("dynamodbClient.deleteTableRecord");

        var longTableName = mapLongTableName(tableName);

        logger.debug(util.format("dynamodbClient.deleteTableRecord table: %s = %s, key: %s = %s [%s = %s]",
            tableName, longTableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue));

        var keyParam = {};
        keyParam[hashKeyName] = encodeValueForDynamoDb(hashKeyValue);
        if (rangeKeyName) {
            keyParam[rangeKeyName] = encodeValueForDynamoDb(rangeKeyValue);
        }

        var longTableName = mapLongTableName(tableName);
        var params = {
            TableName: longTableName,
            Key: keyParam,
            ReturnValues: "ALL_OLD"
        };

        awsDbClient.deleteItem(params,
        function (err, oldData) {
            try {
                if (err) {
                    var errMsg = util.format("dynamodbClient.deleteTableRecord awsDbClient.deleteItem %s error: %s %s", longTableName, JSON.stringify(err), err.message);
                    logger.error(errMsg);
                    return callback(errMsg, null);
                } else if (!oldData) {
                    logger.error("dynamodbClient.getAllTableRecords awsDbClient.deleteItem did not return any oldData");
                    return callback(err, null);
                }

                logger.debug(util.format("awsDbClient.deleteItem returned oldData: %s", JSON.stringify(oldData)));
                var decodedData = decodeJsonObjectFromDynamoDb(oldData.Attributes);
                logger.debug(util.format("awsDbClient.deleteItem decodedData: %s", JSON.stringify(decodedData)));
                return callback(null, decodedData);
            } catch (err) {
                logger.error(util.format("dynamodbClient.deleteTableRecord %s caught exception: %s", longTableName, err));
                logger.error(err.stack);
                return callback(err, null);
            }
        });
    }

    var filterTableRecords =
    function (tableName, filter, callback) {
        logger.debug("dynamodbClient.filterTableRecords");

        var longTableName = mapLongTableName(tableName);
        logger.debug(util.format("dynamodbClient.filterTableRecords table: %s = %s",
            tableName, longTableName));

        var params = {
            TableName: longTableName,
            ReturnConsumedCapacity: "TOTAL",
            ScanFilter: filter
        };
        logger.debug(util.format("dynamodbClient.filterTableRecords awsDbClient.scan params: %s", JSON.stringify(params)));
        awsDbClient.scan(params,
        function (err, data) {
            if (err) {
                logger.error(util.format("dynamodbClient.filterTableRecords awsDbClient.scan error: %s", JSON.stringify(err)));
                logger.error(err.stack);
                return callback(err, null);
            } else if (!data) {
                logger.error("dynamodbClient.filterTableRecords awsDbClient.scan did not return any data");
                return callback(err, null);
            }

            logger.debug(util.format("dynamodbClient.filterTableRecords awsDbClient.scan returned data: %s", JSON.stringify(data)));
            var decodedItems = decodeJsonObjectsFromDynamoDbItems(data.Items);
            logger.debug(util.format("dynamodbClient.filterTableRecords awsDbClient.scan decodedItems: %s", JSON.stringify(decodedItems)));
            return callback(null, decodedItems);
        });
    };

    var createAttributeFilter =
    function (attributeName, comparison, attributeValues) {
        logger.debug(util.format("dynamodbClient.createAttributeFilter %s %s %s", attributeName, comparison, JSON.stringify(attributeValues)));

        var attrValueList = [];
        for (var i = 0; i < attributeValues.length; i++) {
            var attributeValue = attributeValues[i];
            attrValueList.push(encodeValueForDynamoDb(attributeValue));
        }

        var filter = {};
        filter[attributeName] = {
            AttributeValueList: attrValueList,
            ComparisonOperator: comparison
        };

        return filter;
    };

    var encodeStringForDynamoDb =
    function (s) {
        var result = encodeURIComponent(s)
            .replace(/%20/g, ' ')
            .replace(/%2F/g, '/')
            .replace(/%3A/g, ':')
            .replace(/%24/g, '$');
        return result;
    };

    var decodeStringFromDynamoDb =
    function (s) {
        var result = decodeURIComponent(s);
        return result;
    };

    var encodeJsonObjectForDynamoDb =
    function (data) {
        var encodedData = {};

        if (data) {
            for (var key in data) {
                // Ignore prototype-inherited members.
                if (data.hasOwnProperty(key)) {
                    var propertyValue = data[key];
                    if (propertyValue === null) {
                        // Ignore.
                    } else if (typeof propertyValue === 'undefined') {
                        // Ignore.
                    } else if (typeof propertyValue === 'number') {
                        encodedData[key] = { N: propertyValue.toString() };
                    } else if (propertyValue instanceof Date) {
                        encodedData[key] = { S: JSON.stringify(propertyValue).replace(/"/g, '') };
                    } else if (typeof propertyValue === 'object') {
                        encodedData[key] = { S: JSON.stringify(propertyValue) };
                    } else {
                        // Suppress empty string values due to DynamoDB restriction.
                        if (propertyValue !== '') {
                            encodedData[key] = { S: encodeStringForDynamoDb(propertyValue) };
                        }
                    }
                }
            }
        }

        return encodedData;
    };

    var encodeValueForDynamoDb =
    function (propertyValue) {
        var encodedData = {};

        if (propertyValue === null) {
            // Ignore.
        } else if (typeof propertyValue === 'undefined') {
            // Ignore.
        } else if (typeof propertyValue === 'number') {
            encodedData = { N: propertyValue.toString() };
        } else if (propertyValue instanceof Date) {
            encodedData = { S: JSON.stringify(propertyValue).replace(/"/g, '') };
        } else if (typeof propertyValue === 'object') {
            encodedData = { S: JSON.stringify(propertyValue) };
        } else {
            // Suppress empty string values due to DynamoDB restriction.
            if (propertyValue !== '') {
                encodedData = { S: encodeStringForDynamoDb(propertyValue) };
            }
        }

        return encodedData;
    };

    var decodeJsonObjectsFromDynamoDbItems =
    function (items) {
        var decodedItems = [];
        if (items) {
            for (var i = 0; i < items.length; i++) {
                var decodedItem = decodeJsonObjectFromDynamoDb(items[i]);
                decodedItems[i] = decodedItem;
            }
        }
        logger.debug(util.format("decodeJsonObjectsFromDynamoDbItems items: %s", JSON.stringify(items)));
        logger.debug(util.format("decodeJsonObjectsFromDynamoDbItems decodedItems: %s", JSON.stringify(decodedItems)));

        return decodedItems;
    };

    var decodeJsonObjectFromDynamoDb =
    function (data) {
        var decodedData = null;

        if (data) {
            for (var key in data) {
                // Ignore prototype-inherited members.
                if (data.hasOwnProperty(key)) {
                    if (!decodedData) {
                        decodedData = {};
                    }

                    var propertyValue = data[key];
                    if (propertyValue.N) {
                        decodedData[key] = Number(propertyValue.N);
                    } else if (propertyValue.S) {
                        if ((propertyValue.S.indexOf('{') === 0) ||
                            (propertyValue.S.indexOf('[') === 0)) {
                            decodedData[key] = JSON.parse(propertyValue.S);
                        } else {
                            decodedData[key] = decodeStringFromDynamoDb(propertyValue.S);
                        }
                    }
                }
            }
        }

        return decodedData;
    };

    return {
        init: init,
        currentEndpoint: currentEndpoint,
        getAllTableRecords: getAllTableRecords,
        getTableRecordForHashKey: getTableRecordForHashKey,
        getTableRecordsForHashKey: getTableRecordsForHashKey,
        getTableRecordForHashAndRangeKey: getTableRecordForHashAndRangeKey,
        queryTableRecords: queryTableRecords,
        insertOrUpdateTableRecord: insertOrUpdateTableRecord,
        createTable: createTable,
        deleteTableRecord: deleteTableRecord,
        filterTableRecords: filterTableRecords,
        createAttributeFilter: createAttributeFilter
    };
} ();
