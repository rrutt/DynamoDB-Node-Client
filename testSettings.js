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

var settings = {};

// dynamo db
settings.dynamodb = {};

settings.dynamodb.test = {};
settings.dynamodb.test.awsCredentialsPath = './awsCredentials.json';
settings.dynamodb.test.tableNamePrefix = 'alternator-';
settings.dynamodb.test.tableNameSuffix = '-test';
settings.dynamodb.test.useEmulator = true;
settings.dynamodb.test.emulatorEndpoint = 'http://localhost:9090/';
settings.dynamodb.test.readCapacityUnits = 10;
settings.dynamodb.test.writeCapacityUnits = 10;

settings.testTables = [
    {
        name: 'numericHash',
        hashKey: 'hashId'
    },{
        name: 'stringHash',
        hashKey: 'hashCode',
        hashKeyIsString: true
    },{
        name: 'numericHashNumericRange',
        hashKey: 'hashId',
        rangeKey: 'rangeId'
    },{
        name: 'numericHashStringRange',
        hashKey: 'hashId',
        rangeKey: 'rangeCode',
        rangeKeyIsString: true
    },{
        name: 'stringHashNumericRange',
        hashKey: 'hashCode',
        hashKeyIsString: true,
        rangeKey: 'rangeId'
    },{
        name: 'stringHashStringRange',
        hashKey: 'hashCode',
        hashKeyIsString: true,
        rangeKey: 'rangeCode',
        rangeKeyIsString: true
    }
];

settings.logger = {};

settings.logger.consoleLevel = 'info';
settings.logger.consoleSilent = false;
settings.logger.consoleTimestamp = true;
settings.logger.consoleColorize = true;
settings.logger.consoleJson = false;

settings.logger.fileLevel = 'debug';
settings.logger.fileSilent = false;
settings.logger.fileColorize = false;
settings.logger.fileJson = true;
settings.logger.fileTimestamp = true;
settings.logger.fileFullPath = './tests.log';
settings.logger.fileMaxSize = 10000000;  // bytes;
settings.logger.fileMaxFiles = 10;

module.exports = settings;
