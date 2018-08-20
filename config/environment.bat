
REM Central definition of unique suffix for log files
@for /F "tokens=1,2" %%d in ('date /T') do set xdate=%%d
@for /F "tokens=1,2" %%e in ('time /T') do set xtime=%%e
SET ENV_LOGDATE=%xDATE:~6,4%%xDATE:~3,2%%xDATE:~0,2%
SET ENV_LOGDATETIME=%xDATE:~6,4%%xDATE:~3,2%%xDATE:~0,2%-%xtime:~0,2%%xtime:~3,2%

SET WIDGET_NAME=OpenData Liegenschaftskarte
SET APPLICATION_WIDGET_FOLDER=C:\Programme portable\WebAppBuilderForArcGIS\server\apps\2\widgets\
SET BUILDER_WIDGET_FOLDER=C:\Programme portable\WebAppBuilderForArcGIS\client\stemapp\widgets\

