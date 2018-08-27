@echo off 
setlocal enableextensions disabledelayedexpansion

set "search=%~2"
set "replace=%~3"
set "textfile=%~1"
for /f "delims=" %%i in ('type "%textFile%" ^& break ^> "%textFile%" ') do (
        set "line=%%i"
        setlocal enabledelayedexpansion
        >>"%textFile%" echo(!line:%search%=%replace%!
        endlocal
    )