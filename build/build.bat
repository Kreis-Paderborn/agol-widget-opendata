REM Define general settings
@echo off

SET BASE_DIR=%~dp0..
CALL %BASE_DIR%\config\environment.bat

for %%a in (%WIDGET_NAMES%) do call :copy_widget %%a
goto :continue1

:copy_widget
    set WIDGET_NAME=%1

    REM -------------------------
    REM Programm-Dateien kopieren
    SET APP_TARGET_DIR=%APPLICATION_FOLDER%widgets\%WIDGET_NAME%
    SET BUILDER_TARGET_DIR=%BUILDER_WIDGET_FOLDER%%WIDGET_NAME%
    echo APP_TARGET_DIR "%APP_TARGET_DIR%"
    echo BUILDER_TARGET_DIR "%BUILDER_TARGET_DIR%"
    mkdir "%APP_TARGET_DIR%"
    mkdir "%BUILDER_TARGET_DIR%"
    xcopy "..\source\%WIDGET_NAME%" "%APP_TARGET_DIR%" /Y /s
    xcopy "..\source\%WIDGET_NAME%" "%BUILDER_TARGET_DIR%" /Y /s

    REM -------------------------
    REM Konfig-Datei kopieren
    SET CONFIG_TARGET_FILE=%APPLICATION_FOLDER%configs\%WIDGET_NAME%\config_%WIDGET_NAME%.json
    REM ensure the file exists, because xcopy should not promt for creating the file
    IF NOT EXIST "%CONFIG_TARGET_FILE%" (
        echo dummy > "%CONFIG_TARGET_FILE%"
    )
    xcopy "..\source\%WIDGET_NAME%\config.json" "%CONFIG_TARGET_FILE%" /y /i

    REM -------------------------
    REM Platzhalter in der kopierten Konfig-Datei ersetzen
     call replace.bat "%CONFIG_TARGET_FILE%" ${FME_SERVER_BASE_URL} %FME_SERVER_BASE_URL%

    REM -------------------------
    REM Platzhalter in der proxy-Konfig-Datei ersetzen
    SET PROXY_CONFIG_TARGET_FILE=%APP_TARGET_DIR%\esriProxy\proxy.config
    IF EXIST "%PROXY_CONFIG_TARGET_FILE%" (
        call replace.bat "%PROXY_CONFIG_TARGET_FILE%" ${PRODUCTION_SERVER_URL} %PRODUCTION_SERVER_URL%
        call replace.bat "%PROXY_CONFIG_TARGET_FILE%" ${FME_SERVER_BASE_URL} %FME_SERVER_BASE_URL%
        echo In %PROXY_CONFIG_TARGET_FILE% wurden Ersetzungen vorgenommen.
    ) 

:continue1    







