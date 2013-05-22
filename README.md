# DynamoDB-Node-Client

This is an example Node.js client application that accesses Amazon Web Services DynamoDB.

This tool primarily services as an integration test application for the **Alternator** emulator for DynamoDB that is available here:

<https://github.com/mboudreau/Alternator>

The **dynamodbClient.js** client wrapper module can be adapted for use by other Node.js applications under the Apache Software License, Version 2.0

<http://www.apache.org/licenses/LICENSE-2.0.html>

### Pre-Requisites

This application requires **Git**, **Java Development Kit**, **Maven**, and **Node.js**

<http://git-scm.com/downloads>

<http://www.oracle.com/technetwork/java/javase/downloads/index.html>

<http://maven.apache.org/guides/getting-started/maven-in-five-minutes.html>

<http://nodejs.org/>

### Setup

Clone the **Alternator** GitHub repository from here:

<https://github.com/mboudreau/Alternator>

Open a terminal console window and navigate to the root folder of your **Alternator** cloned repository.
Enter this command:

    mvn clean install -DskipTests -Pstandalone

Clone this **DynamoDB-Node-Client** GitHub repository from here:

<https://github.com/rrutt/DynamoDB-Node-Client>

Open a terminal console window and navigate to the root folder of your **DynamoDB-Node-Client** cloned repository.
Enter this command:

    npm install

### Running the Integration Tests

Open a terminal console window and navigate to the root folder of your **DynamoDB-Node-Client** cloned repository.
Enter one of the following commands:

(For Windows)

    RunAlternator.bat

(For Linux or MacOSX)

    bash RunAltenator.sh

The emulator should start and display various debug progress messages.

Open a separate terminal console window and navigate to the root folder of your **DynamoDB-Node-Client** cloned repository.
Enter the folling command:

    node tests

A successful test run should display the following console messages (with different date/time stamps):

    2013-05-22T20:40:24.725Z - info: testDbClientInit
    2013-05-22T20:40:24.961Z - info: dynamodbClient.configureClient: Connected to DynamoDB endpoint http://localhost:9090/
    2013-05-22T20:40:25.966Z - info: testCreateTables
    2013-05-22T20:40:27.088Z - info: testLoadTables
    2013-05-22T20:40:27.104Z - info: loadDataFromFile loaded data from file ./testData/numericHash.json
    2013-05-22T20:40:27.105Z - info: loadDataFromFile parsed 5 input records
    2013-05-22T20:40:27.155Z - warn: Inserted 5 records into numericHash table
    2013-05-22T20:40:27.157Z - info: loadDataFromFile loaded data from file ./testData/stringHash.json
    2013-05-22T20:40:27.157Z - info: loadDataFromFile parsed 5 input records
    2013-05-22T20:40:27.201Z - warn: Inserted 5 records into stringHash table
    2013-05-22T20:40:27.215Z - info: loadDataFromFile loaded data from file ./testData/numericHashNumericRange.json
    2013-05-22T20:40:27.215Z - info: loadDataFromFile parsed 12 input records
    2013-05-22T20:40:27.321Z - warn: Inserted 12 records into numericHashNumericRange table
    2013-05-22T20:40:27.335Z - info: loadDataFromFile loaded data from file ./testData/numericHashStringRange.json
    2013-05-22T20:40:27.336Z - info: loadDataFromFile parsed 12 input records
    2013-05-22T20:40:27.441Z - warn: Inserted 12 records into numericHashStringRange table
    2013-05-22T20:40:27.448Z - info: loadDataFromFile loaded data from file ./testData/stringHashNumericRange.json
    2013-05-22T20:40:27.449Z - info: loadDataFromFile parsed 12 input records
    2013-05-22T20:40:27.549Z - warn: Inserted 12 records into stringHashNumericRange table
    2013-05-22T20:40:27.582Z - info: loadDataFromFile loaded data from file ./testData/stringHashStringRange.json
    2013-05-22T20:40:27.582Z - info: loadDataFromFile parsed 12 input records
    2013-05-22T20:40:27.677Z - warn: Inserted 12 records into stringHashStringRange table
    2013-05-22T20:40:28.679Z - info: testDumpTables
    2013-05-22T20:40:28.694Z - warn: dumpTable dumped 5 data records to file: ./testData/dump.numericHash.json
    2013-05-22T20:40:28.706Z - warn: dumpTable dumped 5 data records to file: ./testData/dump.stringHash.json
    2013-05-22T20:40:28.716Z - warn: dumpTable dumped 12 data records to file: ./testData/dump.numericHashNumericRange.json
    2013-05-22T20:40:28.727Z - warn: dumpTable dumped 12 data records to file: ./testData/dump.numericHashStringRange.json
    2013-05-22T20:40:28.738Z - warn: dumpTable dumped 12 data records to file: ./testData/dump.stringHashNumericRange.json
    2013-05-22T20:40:28.749Z - warn: dumpTable dumped 12 data records to file: ./testData/dump.stringHashStringRange.json
    2013-05-22T20:40:29.756Z - info: testDumpTables
    2013-05-22T20:40:29.764Z - warn: dumpTable dumped 5 data records to file: ./testData/dump.numericHash.1.json
    2013-05-22T20:40:29.776Z - warn: dumpTable dumped 5 data records to file: ./testData/dump.stringHash.1.json
    2013-05-22T20:40:29.785Z - warn: dumpTable dumped 10 data records to file: ./testData/dump.numericHashNumericRange.1.json
    2013-05-22T20:40:29.788Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.numericHashNumericRange.2.json
    2013-05-22T20:40:29.797Z - warn: dumpTable dumped 10 data records to file: ./testData/dump.numericHashStringRange.1.json
    2013-05-22T20:40:29.799Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.numericHashStringRange.2.json
    2013-05-22T20:40:29.810Z - warn: dumpTable dumped 10 data records to file: ./testData/dump.stringHashNumericRange.1.json
    2013-05-22T20:40:29.812Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.stringHashNumericRange.2.json
    2013-05-22T20:40:29.822Z - warn: dumpTable dumped 10 data records to file: ./testData/dump.stringHashStringRange.1.json
    2013-05-22T20:40:29.824Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.stringHashStringRange.2.json
    2013-05-22T20:40:30.833Z - info: testVerifyDumpFiles
    2013-05-22T20:40:30.836Z - warn: verifyFilesMatch Success: ./testData/dump.numericHash.json vs. ./testReferenceData/reference.numericHash.json
    2013-05-22T20:40:30.838Z - warn: verifyFilesMatch Success: ./testData/dump.stringHash.json vs. ./testReferenceData/reference.stringHash.json
    2013-05-22T20:40:30.847Z - warn: verifyFilesMatch Success: ./testData/dump.numericHashNumericRange.json vs. ./testReferenceData/reference.numericHashNumericRang
    e.json
    2013-05-22T20:40:30.864Z - warn: verifyFilesMatch Success: ./testData/dump.numericHashStringRange.json vs. ./testReferenceData/reference.numericHashStringRange.
    json
    2013-05-22T20:40:30.878Z - warn: verifyFilesMatch Success: ./testData/dump.stringHashNumericRange.json vs. ./testReferenceData/reference.stringHashNumericRange.
    json
    2013-05-22T20:40:30.886Z - warn: verifyFilesMatch Success: ./testData/dump.stringHashStringRange.json vs. ./testReferenceData/reference.stringHashStringRange.js
    on
    2013-05-22T20:40:31.893Z - info: testDumpHashKeyOnly numericHash
    2013-05-22T20:40:31.919Z - warn: dumpTable dumped 3 data records to file: ./testData/dump.hashKey.numericHash.json
    2013-05-22T20:40:31.921Z - warn: verifyFilesMatch Success: ./testData/dump.hashKey.numericHash.json vs. ./testReferenceData/reference.dump.hashKey.numericHash.j
    son
    2013-05-22T20:40:32.922Z - info: testDumpHashKeyOnly stringHash
    2013-05-22T20:40:32.949Z - warn: dumpTable dumped 3 data records to file: ./testData/dump.hashKey.stringHash.json
    2013-05-22T20:40:32.977Z - warn: verifyFilesMatch Success: ./testData/dump.hashKey.stringHash.json vs. ./testReferenceData/reference.dump.hashKey.stringHash.jso
    n
    2013-05-22T20:40:33.989Z - info: testDumpHashKeyRecordSet numericHashNumericRange
    2013-05-22T20:40:34.002Z - warn: dumpTable dumped 5 data records to file: ./testData/dump.hashKeyRecordSet.numericHashNumericRange.json
    2013-05-22T20:40:34.015Z - warn: verifyFilesMatch Success: ./testData/dump.hashKeyRecordSet.numericHashNumericRange.json vs. ./testReferenceData/reference.dump.
    hashKeyRecordSet.numericHashNumericRange.json
    2013-05-22T20:40:35.030Z - info: testDumpHashKeyRecordSet numericHashStringRange
    2013-05-22T20:40:35.042Z - warn: dumpTable dumped 4 data records to file: ./testData/dump.hashKeyRecordSet.numericHashStringRange.json
    2013-05-22T20:40:35.044Z - warn: verifyFilesMatch Success: ./testData/dump.hashKeyRecordSet.numericHashStringRange.json vs. ./testReferenceData/reference.dump.h
    ashKeyRecordSet.numericHashStringRange.json
    2013-05-22T20:40:36.057Z - info: testDumpHashKeyRecordSet stringHashNumericRange
    2013-05-22T20:40:36.066Z - warn: dumpTable dumped 5 data records to file: ./testData/dump.hashKeyRecordSet.stringHashNumericRange.json
    2013-05-22T20:40:36.076Z - warn: verifyFilesMatch Success: ./testData/dump.hashKeyRecordSet.stringHashNumericRange.json vs. ./testReferenceData/reference.dump.h
    ashKeyRecordSet.stringHashNumericRange.json
    2013-05-22T20:40:37.091Z - info: testDumpHashKeyRecordSet stringHashStringRange
    2013-05-22T20:40:37.099Z - warn: dumpTable dumped 4 data records to file: ./testData/dump.hashKeyRecordSet.stringHashStringRange.json
    2013-05-22T20:40:37.112Z - warn: verifyFilesMatch Success: ./testData/dump.hashKeyRecordSet.stringHashStringRange.json vs. ./testReferenceData/reference.dump.ha
    shKeyRecordSet.stringHashStringRange.json
    2013-05-22T20:40:38.124Z - info: testDumpHashKeyRangeKeyRecordToDataFile numericHashNumericRange
    2013-05-22T20:40:38.134Z - warn: dumpTable dumped 1 data records to file: ./testData/dump.hashRangeRecord.numericHashNumericRange.json
    2013-05-22T20:40:38.136Z - warn: verifyFilesMatch Success: ./testData/dump.hashRangeRecord.numericHashNumericRange.json vs. ./testReferenceData/reference.dump.h
    ashRangeRecord.numericHashNumericRange.json
    2013-05-22T20:40:39.147Z - info: testDumpHashKeyRangeKeyRecordToDataFile numericHashStringRange
    2013-05-22T20:40:39.155Z - warn: dumpTable dumped 1 data records to file: ./testData/dump.hashRangeRecord.numericHashStringRange.json
    2013-05-22T20:40:39.157Z - warn: verifyFilesMatch Success: ./testData/dump.hashRangeRecord.numericHashStringRange.json vs. ./testReferenceData/reference.dump.ha
    shRangeRecord.numericHashStringRange.json
    2013-05-22T20:40:40.161Z - info: testDumpHashKeyRangeKeyRecordToDataFile stringHashNumericRange
    2013-05-22T20:40:40.169Z - warn: dumpTable dumped 1 data records to file: ./testData/dump.hashRangeRecord.stringHashNumericRange.json
    2013-05-22T20:40:40.171Z - warn: verifyFilesMatch Success: ./testData/dump.hashRangeRecord.stringHashNumericRange.json vs. ./testReferenceData/reference.dump.ha
    shRangeRecord.stringHashNumericRange.json
    2013-05-22T20:40:41.174Z - info: testDumpHashKeyRangeKeyRecordToDataFile stringHashStringRange
    2013-05-22T20:40:41.183Z - warn: dumpTable dumped 1 data records to file: ./testData/dump.hashRangeRecord.stringHashStringRange.json
    2013-05-22T20:40:41.184Z - warn: verifyFilesMatch Success: ./testData/dump.hashRangeRecord.stringHashStringRange.json vs. ./testReferenceData/reference.dump.has
    hRangeRecord.stringHashStringRange.json
    2013-05-22T20:40:42.189Z - info: testHashRangeQuery stringHashStringRange
    2013-05-22T20:40:42.199Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.hashRangeQuery.BETWEEN.stringHashStringRange.json
    2013-05-22T20:40:42.202Z - warn: verifyFilesMatch Success: ./testData/dump.hashRangeQuery.BETWEEN.stringHashStringRange.json vs. ./testReferenceData/reference.d
    ump.hashRangeQuery.BETWEEN.stringHashStringRange.json
    2013-05-22T20:40:43.204Z - info: testHashRangeQuery stringHashStringRange
    2013-05-22T20:40:43.213Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.hashRangeQuery.IN.stringHashStringRange.json
    2013-05-22T20:40:43.215Z - warn: verifyFilesMatch Success: ./testData/dump.hashRangeQuery.IN.stringHashStringRange.json vs. ./testReferenceData/reference.dump.h
    ashRangeQuery.IN.stringHashStringRange.json
    2013-05-22T20:40:44.218Z - info: testHashRangeQuery stringHashStringRange
    2013-05-22T20:40:44.227Z - warn: dumpTable dumped 3 data records to file: ./testData/dump.hashRangeQuery.GE.stringHashStringRange.json
    2013-05-22T20:40:44.229Z - warn: verifyFilesMatch Success: ./testData/dump.hashRangeQuery.GE.stringHashStringRange.json vs. ./testReferenceData/reference.dump.h
    ashRangeQuery.GE.stringHashStringRange.json
    2013-05-22T20:40:45.231Z - info: testFilter numericHash
    2013-05-22T20:40:45.242Z - warn: dumpTable dumped 3 data records to file: ./testData/dump.testFilter.numberField.BETWEEN.numericHash.json
    2013-05-22T20:40:45.243Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.numberField.BETWEEN.numericHash.json vs. ./testReferenceData/reference.dum
    p.testFilter.numberField.BETWEEN.numericHash.json
    2013-05-22T20:40:46.246Z - info: testFilter numericHash
    2013-05-22T20:40:46.255Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.testFilter.numberField.IN.numericHash.json
    2013-05-22T20:40:46.256Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.numberField.IN.numericHash.json vs. ./testReferenceData/reference.dump.tes
    tFilter.numberField.IN.numericHash.json
    2013-05-22T20:40:47.259Z - info: testFilter numericHash
    2013-05-22T20:40:47.268Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.testFilter.numberField.GE.numericHash.json
    2013-05-22T20:40:47.269Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.numberField.GE.numericHash.json vs. ./testReferenceData/reference.dump.tes
    tFilter.numberField.GE.numericHash.json
    2013-05-22T20:40:48.274Z - info: testFilter numericHash
    2013-05-22T20:40:48.282Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.testFilter.stringField.BETWEEN.numericHash.json
    2013-05-22T20:40:48.283Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.stringField.BETWEEN.numericHash.json vs. ./testReferenceData/reference.dum
    p.testFilter.stringField.BETWEEN.numericHash.json
    2013-05-22T20:40:49.286Z - info: testFilter numericHash
    2013-05-22T20:40:49.294Z - warn: dumpTable dumped 2 data records to file: ./testData/dump.testFilter.stringField.IN.numericHash.json
    2013-05-22T20:40:49.295Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.stringField.IN.numericHash.json vs. ./testReferenceData/reference.dump.tes
    tFilter.stringField.IN.numericHash.json
    2013-05-22T20:40:50.301Z - info: testFilter numericHash
    2013-05-22T20:40:50.309Z - warn: dumpTable dumped 3 data records to file: ./testData/dump.testFilter.stringField.GE.numericHash.json
    2013-05-22T20:40:50.311Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.stringField.GE.numericHash.json vs. ./testReferenceData/reference.dump.tes
    tFilter.stringField.GE.numericHash.json
    2013-05-22T20:40:51.314Z - info: testFilter numericHash
    2013-05-22T20:40:51.326Z - warn: dumpTable dumped 1 data records to file: ./testData/dump.testFilter.stringField.BEGINS_WITH.numericHash.json
    2013-05-22T20:40:51.328Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.stringField.BEGINS_WITH.numericHash.json vs. ./testReferenceData/reference
    .dump.testFilter.stringField.BEGINS_WITH.numericHash.json
    2013-05-22T20:40:52.328Z - info: testFilter numericHash
    2013-05-22T20:40:52.337Z - warn: dumpTable dumped 1 data records to file: ./testData/dump.testFilter.stringField.CONTAINS.numericHash.json
    2013-05-22T20:40:52.338Z - warn: verifyFilesMatch Success: ./testData/dump.testFilter.stringField.CONTAINS.numericHash.json vs. ./testReferenceData/reference.du
    mp.testFilter.stringField.CONTAINS.numericHash.json
    2013-05-22T20:40:53.343Z - info: testDeleteRecord numericHash
    2013-05-22T20:40:53.362Z - warn: dumpTable dumped 4 data records to file: ./testData/dump.testDeleteRecord.numericHash.json
    2013-05-22T20:40:53.363Z - warn: verifyFilesMatch Success: ./testData/dump.testDeleteRecord.numericHash.json vs. ./testReferenceData/reference.dump.testDeleteRe
    cord.numericHash.json
    2013-05-22T20:40:54.372Z - info: testDeleteRecord stringHash
    2013-05-22T20:40:54.386Z - warn: dumpTable dumped 4 data records to file: ./testData/dump.testDeleteRecord.stringHash.json
    2013-05-22T20:40:54.387Z - warn: verifyFilesMatch Success: ./testData/dump.testDeleteRecord.stringHash.json vs. ./testReferenceData/reference.dump.testDeleteRec
    ord.stringHash.json
    2013-05-22T20:40:55.402Z - info: testDeleteRecord numericHashNumericRange
    2013-05-22T20:40:55.417Z - warn: dumpTable dumped 11 data records to file: ./testData/dump.testDeleteRecord.numericHashNumericRange.json
    2013-05-22T20:40:55.426Z - warn: verifyFilesMatch Success: ./testData/dump.testDeleteRecord.numericHashNumericRange.json vs. ./testReferenceData/reference.dump.
    testDeleteRecord.numericHashNumericRange.json
    2013-05-22T20:40:56.431Z - info: testDeleteRecord numericHashStringRange
    2013-05-22T20:40:56.448Z - warn: dumpTable dumped 11 data records to file: ./testData/dump.testDeleteRecord.numericHashStringRange.json
    2013-05-22T20:40:56.456Z - warn: verifyFilesMatch Success: ./testData/dump.testDeleteRecord.numericHashStringRange.json vs. ./testReferenceData/reference.dump.t
    estDeleteRecord.numericHashStringRange.json
    2013-05-22T20:40:57.460Z - info: testDeleteRecord stringHashNumericRange
    2013-05-22T20:40:57.477Z - warn: dumpTable dumped 11 data records to file: ./testData/dump.testDeleteRecord.stringHashNumericRange.json
    2013-05-22T20:40:57.489Z - warn: verifyFilesMatch Success: ./testData/dump.testDeleteRecord.stringHashNumericRange.json vs. ./testReferenceData/reference.dump.t
    estDeleteRecord.stringHashNumericRange.json
    2013-05-22T20:40:58.490Z - info: testDeleteRecord stringHashStringRange
    2013-05-22T20:40:58.506Z - warn: dumpTable dumped 11 data records to file: ./testData/dump.testDeleteRecord.stringHashStringRange.json
    2013-05-22T20:40:58.517Z - warn: verifyFilesMatch Success: ./testData/dump.testDeleteRecord.stringHashStringRange.json vs. ./testReferenceData/reference.dump.te
    stDeleteRecord.stringHashStringRange.json
    2013-05-22T20:40:59.522Z - info: --- Overall Test Results ---
    2013-05-22T20:40:59.522Z - info: === Success for testDbClientInit
    2013-05-22T20:40:59.522Z - info: === Success for testCreateTables
    2013-05-22T20:40:59.523Z - info: === Success for testLoadTables
    2013-05-22T20:40:59.523Z - info: === Success for testDumpTablesFull
    2013-05-22T20:40:59.524Z - info: === Success for testDumpTablesChunks
    2013-05-22T20:40:59.525Z - info: === Success for testVerifyDumpFiles
    2013-05-22T20:40:59.525Z - info: === Success for testDumpNumericHashKeyOnly
    2013-05-22T20:40:59.525Z - info: === Success for testDumpStringHashKeyOnly
    2013-05-22T20:40:59.525Z - info: === Success for testDumpNumericHashNumericRangeRecordSet
    2013-05-22T20:40:59.526Z - info: === Success for testDumpNumericHashStringRangeRecordSet
    2013-05-22T20:40:59.526Z - info: === Success for testDumpStringHashNumericRangeRecordSet
    2013-05-22T20:40:59.526Z - info: === Success for testDumpStringHashStringRangeRecordSet
    2013-05-22T20:40:59.527Z - info: === Success for testDumpNumericHashNumericRangeRecord
    2013-05-22T20:40:59.527Z - info: === Success for testDumpNumericHashStringRangeRecord
    2013-05-22T20:40:59.527Z - info: === Success for testDumpStringHashNumericRangeRecord
    2013-05-22T20:40:59.528Z - info: === Success for testDumpStringHashStringRangeRecord
    2013-05-22T20:40:59.528Z - info: === Success for testHashRangeBetweenQuery
    2013-05-22T20:40:59.528Z - info: === Success for testHashRangeInQuery
    2013-05-22T20:40:59.528Z - info: === Success for testHashRangeGeQuery
    2013-05-22T20:40:59.529Z - info: === Success for testNumericBetweenFilter
    2013-05-22T20:40:59.529Z - info: === Success for testNumericInFilter
    2013-05-22T20:40:59.529Z - info: === Success for testNumericGeFilter
    2013-05-22T20:40:59.530Z - info: === Success for testStringBetweenFilter
    2013-05-22T20:40:59.530Z - info: === Success for testStringInFilter
    2013-05-22T20:40:59.530Z - info: === Success for testStringGeFilter
    2013-05-22T20:40:59.530Z - info: === Success for testStringBeginsWithFilter
    2013-05-22T20:40:59.531Z - info: === Success for testStringContainsFilter
    2013-05-22T20:40:59.531Z - info: === Success for testDeleteNumericHashRecord
    2013-05-22T20:40:59.531Z - info: === Success for testDeleteStringHashRecord
    2013-05-22T20:40:59.532Z - info: === Success for testDeleteNumericHashNumericRangeRecord
    2013-05-22T20:40:59.532Z - info: === Success for testDeleteNumericHashStringRangeRecord
    2013-05-22T20:40:59.532Z - info: === Success for testDeleteStringHashNumericRangeRecord
    2013-05-22T20:40:59.533Z - info: === Success for testDeleteStringHashStringRangeRecord
    2013-05-22T20:40:59.533Z - info: Summary Results: 33 tests Succeeded, 0 tests Failed.


You can leave the **Alternator** process running for several successive integration test runs.

When done testing, simply use **Control-C** in the Alternator emulator terminal window to stop the Java process.


### Amazon AWS-SDK Node.js API Documentation

The overall documentation for the Node.js AWS-SDK resides here:

**<http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html>**

The section for **DynamoDB** has two sub-sections.

The original API documentation is at <http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB_20111205.html>

The new API documentation is at <http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB_20120810.html>

The Node.js NPM package for the AWS-SDK client that supports either API version can be obtained with this entry in your **package.json**

    "dependencies": {
        "aws-sdk": "1.0.0"
    },

By default this client will use the newer '2012-08-10' API protocol, corresponding to the **com.amazonaws.services.dynamodbv2** namespaces.
You can revert to the earlier '2011-12-05' API protocol by using an optional parameter in the constructor:

    var dynamodb = new AWS.DynamoDB({apiVersion: '2011-12-05'});

The earlier **0.9.-pre.#** versions of the NPM package always assume the original '2011-12-05' API protocol.

    "dependencies": {
        "aws-sdk": "0.9.2-pre.3"

    },
