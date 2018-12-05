@echo off

REM Define general settings
SET TEST_DIR=%~dp0
SET ENDPOINT=https://fmetest.gkdpb.de
SET BASE_DIR=%~dp0..\..\
CALL %BASE_DIR%\config\environment.bat

REM Relative dir for soap-ui Logs (used as well by junit-viewer)
SET SOAP_LOG_DIR_NAME=logs\%ENV_LOGDATETIME%\

REM Absoute path for soap-ui needed by Soap-UI itself
SET MY_LOGDIR=%~dp0%SOAP_LOG_DIR_NAME%
mkdir %MY_LOGDIR%

REM RUN the SOAP-UI tests
SET PROJECT_FILE="%~dp0Check-Anfrage-Flaeche-pruefen-soapui-project.xml"
cd %MY_LOGDIR%
call "C:\Programme portable\SoapUI-5.4.0-EB\bin\testrunner.bat" -e%ENDPOINT% -PFME_SERVER_TOKEN=%FME_SERVER_TOKEN% -r -j -f%MY_LOGDIR% %PROJECT_FILE% > %MY_LOGDIR%test_run.log
cd %TEST_DIR%

REM Create HTML out of soap-ui's junit results
call junit-viewer --results=%SOAP_LOG_DIR_NAME% --save=%SOAP_LOG_DIR_NAME%results.html --minify=false  --contracted

