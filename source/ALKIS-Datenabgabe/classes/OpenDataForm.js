define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/request",
    'esri/Color',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/toolbars/draw',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/geometry/Polygon',
    'esri/request',
    'esri/geometry/screenUtils',
    'dijit/form/ValidationTextBox',
    'dijit/form/CheckBox',
    'dijit/Dialog',
    'dijit/form/Button',
    'dojo/domReady!',
    'dojox/form/BusyButton',
    'dijit/registry',
    'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'
], function (
    declare,
    lang,
    esriRequest,
    Color,
    SimpleLineSymbol,
    SimpleFillSymbol,
    Draw,
    Graphic,
    Point,
    Polygon,
    esriRequest,
    screenUtils,
    dijitValidationTextBox,
    dijitCheckBox,
    dijitDialog,
    dijitFormButton,
    dijitReady,
    BusyButton,
    dijitRegistry,
    $) {

    return declare(null, {

        fillSymbol: null,
        map: null,
        fmeServerBaseUrl: null,
        draw: null,
        drawnArea: null,
        mapExtentChangeHandle: null,
        wktPolygon: null,
        makeSmallCallback: null,
        makeTallCallback: null,
        drawInMobileMode: false,
        eMailValidationDialog: null,
        validEMails: {
            "trantowa@kreis-paderborn.de": true
        },

        // Status für Formular
        polygonValid: false,
        emailValid: true,
        complianceValid: true,
        
        // Texte für Prüfergebnis der Flächenprüfung
        POLYGON_DEFAULT: "Keine Fläche vorhanden.",
        POLYGON_INVALID: "Das eingezeichnete Anfragepolygon ist ungültig.",
        POLYGON_VALID: "Das eingezeichnete Anfragepolygon ist in Ordnung.",
        POLYGON_NO_INTERACTION: "Es wurde keine Geometrie gezeichnet. Setzen Sie durch Tippen in die Karte mindestens 3 Punkte um ein Polygon festzulegen.",
        POLYGON_OUTSIDE_KPB: "Das Anfragepolygon muss vollständig innerhalb der Kreisgrenze liegen.",
        POLYGON_TO_LARGE_1: "Die maximale Größe wurde nicht eingehalten. Das von Ihnen gezeichnete Polygon hat einen Flächeninhalt von ",
        POLYGON_TO_LARGE_2: " km².",
        POLYGON_INTERNAL_ERROR: "Aktuell besteht ein internes Problem mit der Flächenprüfung. Bitte versuchen Sie es später noch einmal. Sollte das Problem weiterhin bestehen, informieren Sie uns bitte unter GIS@Kreis-Paderborn.de.",
        POLYGON_TIMEOUT: "Der Server ist aktuell ausgelastet. Bitte versuchen Sie es in wenigen Augenblicken noch einmal.",

        // Werte für die Namen von warteschlangen
        QUEUE_DAYTIME_LONG: "Tagsueber_Lange_Jobs",
        QUEUE_DAYTIME_SHORT: "Tagsueber_Kurze_Jobs",
        NIGHTLY: "Nachts%20alle%20Jobs",



        constructor: function (map, options) {

            this.map = map;
            this.fmeServerBaseUrl = options.fmeServerBaseUrl;
            this.makeSmallCallback = options.makeSmallCallback;
            this.makeTallCallback = options.makeTallCallback;

            // specify class defaults
            this.fillSymbol = options.fillSymbol || new SimpleFillSymbol("solid", new SimpleLineSymbol("solid", new Color([0, 155, 216]), 2), new Color([0, 155, 216, 0.25]));
            this.setAreaResult("initial", this.POLYGON_DEFAULT);

            var me = this;
            var emailTextbox = new dijitValidationTextBox({
                style: "width:100%",
                required: true,
                autocomplete: "on",
                promptMessage: "Bitte eMail eingeben.",
                missingMessage: "Es muss eine eMail angegeben werden.",
                invalidMessage: "Der eingegeben Wert ist keine gültige eMail-Adresse",
                regExp: "\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+",
                onKeyUp: function () {
                    me.emailValid = this.isValid();
                },
                value: "andreas@trantow-pb.de",
                name: "opt_requesteremail"
            }, "opt_requesteremail");
            emailTextbox.startup();



            var drawButton = new BusyButton({
                label: "Bereich festlegen",
                busyLabel: "Bitte Zeichnen Sie die Fläche in der Karte ein...",
                disabled: false,
                onClick: function () {

                    // Wir müssem den Button explizit auf "busy" setzen,
                    // da diese nach dem ersten "Cancel" nicht mehr automatisch
                    // funktioniert.
                    drawButton.makeBusy();

                    me.startDrawing();
                }
            }, "drawButton");
            drawButton.startup();

            var complianceCheckBox = new dijitCheckBox({
                name: "complianceCheckBox",
                value: "agreed",
                checked: me.complianceValid,
                onChange: function (checked) {
                    me.complianceValid = checked;
                }
            }, "complianceCheckBox").startup();

            var submitFunction = function () {

                // Wir müssem den Button explizit auf "busy" setzen,
                // da diese nach dem ersten "Cancel" nicht mehr automatisch
                // funktioniert.
                submitButton.makeBusy();

                //window.document.getElementById("openDataForm").submit();
                var request = esriRequest({
                    // Location of the data
                    url: me.fmeServerBaseUrl + "fmedatadownload/KPB_OpenData/ALKIS-Datenabgabe.fmw",
                    // Service parameters if required, sent with URL as key/value pairs
                    content: {
                        AuftragsnummerParam: (new Date()).getTime(),
                        Mode: "server",
                        opt_servicemode: "async",
                        opt_showresult: true,
                        opt_responseformat: "json",
                        paramRequestPolygon: me.wktPolygon,
                        opt_requesteremail: dijitRegistry.byId("opt_requesteremail").get('value'),
                        tm_tag: me.QUEUE_DAYTIME_LONG,
                        param_purpose: "TEST",
                        param_gui: me.drawInMobileMode ? "Touch" : "Desktop"
                    },
                    // Data format
                    handleAs: "json"
                });

                var okButtonWithFunction = "<br><button data-dojo-type=\"dijit/form/Button\" type=\"button\" data-dojo-props=\"onClick:function(){window.kpbClearWidget();}\">OK</button>";
                var successMsg = new dijitDialog({
                    title: "Anfrage erfolgreich",
                    style: "width: 250px;text-align:center",
                    content: "Ihre Anfrage wurde erfolgreich entgegengenommen.<br><br>Nach Abschluss der Bearbeitung erhalten Sie eine Nachricht an die angegebene<br>eMail-Adresse.<br>" + okButtonWithFunction,
                    closable: false,
                    class: "kpbSuccess"
                });
                var okButtonOnlyHide = "<br><button data-dojo-type=\"dijit/form/Button\" type=\"submit\">OK</button>";
                var failureMsg = new dijitDialog({
                    title: "Anfrage fehlgeschlagen",
                    style: "width: 250px;text-align:center",
                    content: "Aktuell besteht ein internes Problem mit der OpenData-Bereitstellung.\n\nBitte versuchen Sie es später noch einmal.\nSollte das Problem weiterhin bestehen, informieren Sie uns bitte unter GIS@Kreis-Paderborn.de..<br>" + okButtonOnlyHide,
                    closable: false,
                    class: "kpbFailure"
                });

                request.then(
                    function (response) {
                        if (response.serviceResponse &&
                            response.serviceResponse.statusInfo &&
                            response.serviceResponse.statusInfo.status === "success") {

                            successMsg.show();

                            // Das Anfragepolygon löschen
                            window.kpbClearWidget = function () {
                                successMsg.hide();
                                me.setAreaResult("initial", me.POLYGON_DEFAULT);
                                me.map.graphics.clear();
                                me.polygonValid = false;
                            }
                        } else {
                            failureMsg.show();
                        }
                        submitButton.cancel();
                    },
                    function (error) {
                        if (error.response.status != 200) {
                            failureMsg.show();
                        }
                        submitButton.cancel();
                    }
                );
            };


            var eMailValidationCode;
            var validationInputId;

            var submitButton = new BusyButton({
                label: "Anfrage absenden",
                busyLabel: "Anfrage absenden...",
                disabled: false,
                onClick: function () {

                    var okButtonOnlyHide = "<br><button data-dojo-type=\"dijit/form/Button\" type=\"submit\">OK</button>";
                    var eMailFromInput = dijitRegistry.byId("opt_requesteremail").get('value');

                    if (!me.polygonValid || !me.emailValid || !me.complianceValid) {
                        var incompleteMsg = "Die Anfrage kann noch<br/>nicht abgesendet werden.<br/><br/>";

                        if (!me.polygonValid) {
                            incompleteMsg += "Bitte legen Sie zunächst einen<br/>gültigen Bereich für die Anfrage fest.";
                        } else if (!me.complianceValid) {
                            incompleteMsg += "Bitte akzeptieren Sie<br/>die Datenschutzbestimmungen.";
                        } else if (!me.emailValid) {
                            incompleteMsg += "Bitte geben Sie eine<br/>gültige eMail-Adresse an.";
                        }

                        var incompleteDialog = new dijitDialog({
                            title: "Formular unvollständig",
                            style: "width: 250px;text-align:center;",
                            content: incompleteMsg + "<br/>" + okButtonOnlyHide,
                            closable: false,
                            class: "kpbIncomplete"
                        });
                        incompleteDialog.show();

                        submitButton.cancel();
                        return;
                    }


                    // Wir setzten für diese Session einen sechstelligen Code, der per eMail verschickt wird.
                    // Da die Zufallszahl so klein sein kann, dass eine unter 6-stellige Zahl raus kommen kann,
                    // prüfen wir das und ergänzen die 6. Stelle ggfs. künstlich.
                    eMailValidationCode = Math.floor((Math.random() * 1000000) + 1);
                    if (eMailValidationCode < 100000) {
                        eMailValidationCode = eMailValidationCode + 100000;
                    }

                    // Das Textfeld innerhalb des Dialogs braucht für jeden Durchgang eine eindeutige ID,
                    // da es bei wiederholten Aufrufen sonst zu konflikten mit nicht eindeutigen IDs kommt.
                    validationInputId = "validationInputId_" + Math.floor((Math.random() * 10) + 1);

                    // Wenn die eMail schon bestätigt wurde, wird direkt die Anfrage an den FME-Server geschickt.
                    if (me.validEMails[eMailFromInput.toLowerCase()]) {
                        submitFunction();
                    } else {

                        var eMailValidationMsg = "An Ihre angegebene eMail-Adresse wurde ein 6-stelliger Zahlencode gesandt.<br/><br/>Bitte prüfen Sie ihr Postfach und tragen Sie den Code in das unten stehende Textfeld ein. Bitte prüfen Sie ggfs. auch Ihren Spam-Ordner.";
                        var okButtonEMailValidation = "<br><tr data-dojo-attach-point=\"titleTr\"><td colspan=\"2\">" +
                            "<input class=\"eMailValidationCode\" id=\"" + validationInputId + "\"></td></tr><br><br>" +
                            "<button data-dojo-type=\"dijit/form/Button\" type=\"button\" data-dojo-props=\"onClick:function(){window.kpbValidationCodeOk();}\">OK</button>" +
                            "<button data-dojo-type=\"dijit/form/Button\" type=\"button\" >Erneut senden</button>";

                        me.eMailValidationDialog = new dijitDialog({
                            title: "Bestätigung Ihrer eMail-Adresse",
                            style: "width: 250px;text-align:center;",
                            content: eMailValidationMsg + "<br/>" + okButtonEMailValidation,
                            closable: false,
                            class: "kpbIncomplete"
                        });


                        me.eMailValidationDialog.show();
                        window.document.getElementById(validationInputId).value = eMailValidationCode;


                        // Das Anfragepolygon löschen
                        window.kpbValidationCodeOk = function () {

                            var input = window.document.getElementById(validationInputId)

                            if (parseInt(input.value) === eMailValidationCode) {
                                me.eMailValidationDialog.hide();
                                me.validEMails[eMailFromInput.toLowerCase()] = true;
                                submitFunction();
                            } else {
                                alert("Zahlencode ist nicht korrekt.");
                                input.style = "color: #ff0808;"
                            }
                        };
                    }
                }
            }, "submitButton");
            submitButton.startup();

            // Festlegen, welche Positionen für Meldungs-Popups 
            // der ValidationTextbox möglich sein sollen
            dijit.Tooltip.defaultPosition = ['above', 'below'];

            // Um die Hinweise beim Zeichnen auf jeden Fall in Deutsch zu haben
            // werden sie hier explizit definiert. Sonst sind sie bei mir aktuell
            // im FF auf deutsch und im Chrome auf englisch.
            esri.bundle.toolbars.draw.start = "Klicken, um mit dem Zeichnen zu beginnen";
            esri.bundle.toolbars.draw.resume = "Klicken, um das Zeichnen fortzusetzen";
            esri.bundle.toolbars.draw.complete = "Doppelklicken, um abzuschließen";

            this.draw = new Draw(this.map, {
                showTooltips: true
            });

            // Hier kann der Stil während des Zeichnens definiert werden
            this.draw.fillSymbol = new SimpleFillSymbol("solid", new SimpleLineSymbol("solid", new Color([0, 155, 216]), 2), new Color([0, 0, 0, 0.25]));

            // addGraphic is called by an external function, esriRequest
            // hitch() is used to provide the proper context so that addGraphic
            // will have access to the instance of this class
            this.addGraphic = lang.hitch(this, this.addGraphic);

            // if we do not bind this to "addGraphic" it will not run in scope of "this"
            //this.addGraphic = this.addGraphic.bind(this)
            this.draw.on("draw-complete", this.addGraphic);

        },

        resetDrawingButton: function () {
            var drawButton = dijitRegistry.byId("drawButton");
            drawButton.cancel();
        },

        setAreaResult: function (state, pMessage) {
            var pruefergebnisDiv = window.document.getElementById("pruefergebnis");
            if (state === "valid") {
                pruefergebnisDiv.className = "submitValid";
            } else if (state === "invalid") {
                pruefergebnisDiv.className = "submitInvalid";
            } else if (state === "initial") {
                pruefergebnisDiv.className = "submitInitial";
            }
            pruefergebnisDiv.innerHTML = pMessage;
        },

        stopDrawing: function (killWidget) {

            if (this.drawInMobileMode) {

                // Wenn das Festlegen der Fläche gestoppt wird, weil das ganze
                // Widget geschlosen wird, öffnen wir das Panel nicht erneut.
                // Diese würde sich mit dem Zerstören des Panels überschneiden und
                // in der folgenden Fehlermeldung enden:
                // "Cannot read property 'style' of null"
                if (!killWidget) {
                    this.makeTallCallback();
                }

                if (this.mapExtentChangeHandle) {
                    this.mapExtentChangeHandle.remove();
                }

            } else {
                this.deactivateDrawingTool();
            }
        },

        /**
         * Der Aufruf zum Deaktivieren der Zeichenfunktion
         * wird in einer eigenen Methode angeboten, um dies
         * auch von außen aufreufen zu können.
         */
        deactivateDrawingTool: function () {
            this.draw.deactivate();
        },

        startDrawing: function () {

            // Die Mobil-Variante wird geschaltet, wenn entweder zu wenig 
            // Platz auf dem Bildschirm ist oder ein Gerät mit Touch-Bedienung
            // verwendet wird.
            this.drawInMobileMode = (window.innerWidth < 1000) || (window.innerHeight < 600) || window.userIsTouching;

            this.setAreaResult("initial", this.POLYGON_DEFAULT);
            this.map.graphics.clear();
            this.wktPolygon = undefined;
            var me = this;

            if (this.drawInMobileMode) {
                this.makeSmallCallback();
                this.mapExtentChangeHandle = this.map.on('extent-change', function (data) {

                    // Geografische Koordinanten der BBOX
                    var xmax = data.extent.xmax;
                    var ymax = data.extent.ymax;
                    var xmin = data.extent.xmin;
                    var ymin = data.extent.ymin;
                    var wkid = data.extent.spatialReference.wkid;

                    // Forme die Eckpunkte der BBOX in Pixel-Koords um
                    var screenPointMin = screenUtils.toScreenGeometry(me.map.extent, me.map.width, me.map.height,
                        new Point({ "x": xmin, "y": ymin, "spatialReference": { "wkid": wkid } }));
                    var screenPointMax = screenUtils.toScreenGeometry(me.map.extent, me.map.width, me.map.height,
                        new Point({ "x": xmax, "y": ymax, "spatialReference": { "wkid": wkid } }));

                    // Veränderung der BBOX , damit sie innerhalb der Schaltflächen liegt.
                    screenPointMax.setY(screenPointMax.y + 70);
                    screenPointMin.setY(screenPointMin.y - 140);
                    screenPointMax.setX(screenPointMax.x - 20);
                    screenPointMin.setX(screenPointMin.x + 57);

                    // Veränderte Eckpunkte werden wieder in Geografische Koordinanten umgeformt
                    var mapPointMin = screenUtils.toMapGeometry(me.map.extent, me.map.width, me.map.height, screenPointMin);
                    var mapPointMax = screenUtils.toMapGeometry(me.map.extent, me.map.width, me.map.height, screenPointMax);

                    // Aus den Koords wird eine Esri-Grafik erzeugt und auf die Karte gelegt.
                    // Die Fläche wird für die spätere Verarbeitung in der Klassen-Variable "drawnArea" gesspeichert.
                    var polygonJson = {
                        "rings": [[[mapPointMin.x, mapPointMin.y], [mapPointMin.x, mapPointMax.y], [mapPointMax.x, mapPointMax.y], [mapPointMax.x, mapPointMin.y], [mapPointMin.x, mapPointMin.y]]],
                        "spatialReference": { "wkid": wkid }
                    };

                    me.drawnArea = new Polygon(polygonJson);
                    me.map.graphics.clear();
                    me.map.graphics.add(new Graphic(me.drawnArea, me.fillSymbol));
                });

                this.map.emit("extent-change", { extent: this.map.extent });

            } else {
                this.draw.activate('polygon');
            }

        },

        addGraphic: function (evt) {
            this.stopDrawing();
            var me = this;
            this.drawnArea = evt.geometry;

            // Hier wird der Stil für die abgeschlossene Grafik gesetzt
            this.map.graphics.add(new Graphic(this.drawnArea, this.fillSymbol));

            this.processGraphic();

        },

        processGraphic: function () {
            var me = this;

            if (this.drawnArea && this.drawnArea.rings) {
                var myWKT = "POLYGON ((";


                this.drawnArea.rings[0].forEach(
                    function (myPoint) {
                        myWKT = myWKT + (myPoint[0] + " " + myPoint[1]) + ", ";
                    }
                );
                myWKT = myWKT.substring(0, myWKT.length - 2) + "))";
                this.wktPolygon = myWKT;

                var request = esriRequest({
                    // Location of the data
                    url: this.fmeServerBaseUrl + "fmedatastreaming/KPB_OpenData/Anfrage-Flaeche-pruefen.fmw",
                    // Service parameters if required, sent with URL as key/value pairs
                    content: {
                        paramRequestPolygon: myWKT,
                        mode: "server",
                        tm_ttl: 5, // Setzt die maximale Wartezeit auf 5 Sekunden
                        tm_tag: me.QUEUE_DAYTIME_SHORT // Wähle die zu verwendende Warteschlange
                    },
                    // Data format
                    handleAs: "json"
                });

                request.then(
                    function (response) {
                        var polygonValid = true;

                        if (response[0].requestPolygonInvalid == 1) {
                            me.setAreaResult("invalid", me.POLYGON_INVALID)
                            polygonValid = false;
                        } else if (response[0].requestPolygonInvalid == 0) {
                            me.setAreaResult("valid", me.POLYGON_VALID)
                        } else {
                            polygonValid = false;
                        }

                        if (response[0].requestPolygonToLarge == 1) {
                            me.setAreaResult("invalid", me.POLYGON_TO_LARGE_1 + response[0].details + me.POLYGON_TO_LARGE_2)
                            polygonValid = false;
                        } else if (response[0].requestPolygonToLarge == 0) {

                            if (response[0].requestPolygonOutsideKPB == 1) {
                                me.setAreaResult("invalid", me.POLYGON_OUTSIDE_KPB)
                                polygonValid = false;
                            } else if (response[0].requestPolygonOutsideKPB == 0) {
                                me.setAreaResult("valid", me.POLYGON_VALID)
                            } else {
                                polygonValid = false;
                            }

                        } else {
                            polygonValid = false;
                        }

                        me.polygonValid = polygonValid;
                        me.resetDrawingButton();

                    },
                    function (error) {
                        me.resetDrawingButton();
                        if (error.response.status === 502) {
                            // Dies wird vermutlich sein, wenn die Verarbeitung wegen Zeitüberschreitung abgebrochen wurde
                            me.setAreaResult("invalid", me.POLYGON_TIMEOUT)
                            me.polygonValid = false;
                        } else {
                            // Dies könnte sein, wenn Status 404 ist, also der Worksapce nicht mehr unter dem Namen vorhanden ist.
                            me.setAreaResult("invalid", me.POLYGON_INTERNAL_ERROR)
                            me.polygonValid = false;
                        }

                    }
                );
            }
        }
    });
}
);
