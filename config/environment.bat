
REM Central definition of unique suffix for log files
@for /F "tokens=1,2" %%d in ('date /T') do set xdate=%%d
@for /F "tokens=1,2" %%e in ('time /T') do set xtime=%%e
SET ENV_LOGDATE=%xDATE:~6,4%%xDATE:~3,2%%xDATE:~0,2%
SET ENV_LOGDATETIME=%xDATE:~6,4%%xDATE:~3,2%%xDATE:~0,2%-%xtime:~0,2%%xtime:~3,2%

SET WIDGET_NAME=OpenData Liegenschaftskarte

REM If you modify the APP in the App-Builder your widget may get a new id.
REM This can be found in [AppBuilderRoot]/server/config in the "widget-section"
SET WIDGET_ID=[NAME-OF-WIDGET-ID-IN-SERVER-ROOT-CONFIG]

SET APPLICATION_FOLDER=[PATH-TO-WEBAPP-BUILDER-SERVER-APPS-WIDGETS-FOLDER]
SET BUILDER_WIDGET_FOLDER=[PATH-TO-WEBAPP-BUILDER-CLIENT-STEMAPP-WIDGETS-FOLDER]
SET FME_SERVER_TOKEN=[AUTHORISATION-TOKEN]
SET FME_SERVER_BASE_URL=[URL-TO_OPEN-DATA-REPO]

REM Calling custom environment allows to inject custom start operations here
IF EXIST "%~dp0environment_custom.bat" CALL "%~dp0environment_custom.bat"