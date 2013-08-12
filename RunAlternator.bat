@echo on

cls

set ALTERNATOR_VERSION=0.6.1-SNAPSHOT
set ALTERNATOR_HOME=%USERPROFILE%\.m2\repository\com\michelboudreau\alternator\%ALTERNATOR_VERSION%

set JAVA_OPTS=-Xms256m -Xmx2048m

java %JAVA_OPTS% -jar "%ALTERNATOR_HOME%\alternator-%ALTERNATOR_VERSION%-jar-with-dependencies.jar" Alternator.db

pause