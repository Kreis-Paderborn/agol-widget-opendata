REM Define general settings
@echo off &setlocal

SET BASE_DIR=%~dp0..
CALL %BASE_DIR%\config\environment.bat

REM copy sources
SET APP_TARGET_DIR=%APPLICATION_FOLDER%widgets\%WIDGET_NAME%
SET BUILDER_TARGET_DIR=%BUILDER_WIDGET_FOLDER%%WIDGET_NAME%
mkdir "%BUILDER_TARGET_DIR%"
xcopy "..\source" "%APP_TARGET_DIR%" /Y /s
xcopy "..\source" "%BUILDER_TARGET_DIR%" /Y /s

REM Replace placeholders in copied proxyconfig
SET PROXY_CONFIG_TARGET_FILE=%APP_TARGET_DIR%\esriProxy\proxy.config
call replace.bat "%PROXY_CONFIG_TARGET_FILE%" ${PRODUCTION_SERVER_URL} %PRODUCTION_SERVER_URL%
call replace.bat "%PROXY_CONFIG_TARGET_FILE%" ${FME_SERVER_BASE_URL} %FME_SERVER_BASE_URL%

rem copy config
SET CONFIG_TARGET_FILE=%APPLICATION_FOLDER%configs\%WIDGET_NAME%\config_%WIDGET_ID%.json
REM ensure the file exists, because xcopy should not promt for creating the file
IF NOT EXIST "%CONFIG_TARGET_FILE%" (
    echo dummy > "%CONFIG_TARGET_FILE%"
)
xcopy "..\source\config.json" "%CONFIG_TARGET_FILE%" /y /i

REM Replace placeholders in copied config
call replace.bat "%CONFIG_TARGET_FILE%" ${FME_SERVER_TOKEN} %FME_SERVER_TOKEN%
call replace.bat "%CONFIG_TARGET_FILE%" ${FME_SERVER_BASE_URL} %FME_SERVER_BASE_URL%
