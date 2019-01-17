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

            // Status für Formular
            polygonValid: false,
            emailValid: false,
            complianceValid: false,

            // Texte für Prüfergebnis der Flächenprüfung
            POLYGON_DEFAULT: "Keine Fläche vorhanden.",
            POLYGON_INVALID: "Das eingezeichnete Anfragepolygon ist ungültig.",
            POLYGON_VALID: "Das eingezeichnete Anfragepolygon ist in Ordnung.",
            POLYGON_NO_INTERACTION: "Es wurde keine Geometrie gezeichnet. Setzen Sie durch Tippen in die Karte mindestens 3 Punkte um ein Polygon festzulegen.",
            POLYGON_OUTSIDE_KPB: "Das Anfragepolygon muss vollständig innerhalb der Kreisgrenze liegen.",
            POLYGON_TO_LARGE: "Die maximale Größe wurde nicht eingehalten.",
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
                this.fillSymbol = options.fillSymbol || new SimpleFillSymbol("solid", new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2), new Color([232, 104, 80, 0.25]));
                this.setAreaResult("initial", this.POLYGON_DEFAULT);

                var me = this;
                var emailTextbox = new dijitValidationTextBox({
                    style: "width:100%",
                    required: true,
                    promptMessage: "Bitte eMail eingeben.",
                    missingMessage: "Es muss eine eMail angegeben werden.",
                    invalidMessage: "Der eingegeben Wert ist keine gültige eMail-Adresse",
                    regExp: "\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+",
                    onKeyUp: function () {
                        me.emailValid = this.isValid();

                        dijitRegistry.byId("submitButton").set('disabled', !me.polygonValid || !me.emailValid || !me.complianceValid);
                    },
                    value: "", //value: "TrantowA@Kreis-Paderborn.de",
                    name: "opt_requesteremail"
                }, "opt_requesteremail");
                emailTextbox.startup();



                var drawButton = new BusyButton({
                    label: "Bereich festlegen",
                    busyLabel: "Bereich festlegen...",
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
                    checked: false,
                    onChange: function (checked) {
                        me.complianceValid = checked;
                        dijitRegistry.byId("submitButton").set('disabled', !me.polygonValid || !me.emailValid || !me.complianceValid);
                    }
                }, "complianceCheckBox").startup();

                var submitButton = new BusyButton({
                    label: "Anfrage absenden",
                    busyLabel: "Anfrage absenden...",
                    //baseClass:"jimu-btn",
                    disabled: true,
                    onClick: function () {

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
                                paramRequestPolygon: me.wktPolygon,
                                opt_requesteremail: dijitRegistry.byId("opt_requesteremail").get('value'),
                                tm_tag: me.QUEUE_DAYTIME_LONG
                            },
                            // Data format
                            handleAs: "text"
                        });

                        request.then(
                            function (response) {
                                if (response.includes("Completed Successfully")) {
                                    alert("Ihre Anfrage wurde erfolgreich entgegengenommen.\n\nNach Abschluss der Bearbeitung erhalten Sie eine eMail an die angegebene Adresse.");
                                } else {
                                    alert("Aktuell besteht ein internes Problem mit der OpenData-Bereitstellung.\n\nBitte versuchen Sie es später noch einmal.\nSollte das Problem weiterhin bestehen, informieren Sie uns bitte unter GIS@Kreis-Paderborn.de.");
                                }
                                submitButton.cancel();
                            },
                            function (error) {
                                if (error.response.status != 200) {
                                    alert("Aktuell besteht ein internes Problem mit der OpenData-Bereitstellung.\n\nBitte versuchen Sie es später noch einmal.\nSollte das Problem weiterhin bestehen, informieren Sie uns bitte unter GIS@Kreis-Paderborn.de.");
                                }
                                submitButton.cancel();

                            }
                        );
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
                // this.draw.fillSymbol = this.fillSymbol;

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

                //Ist die Frage, ob man während dem Zeichnen
                //die Karte bewegen könnne soll oder nicht.
                // this.map.enableMapNavigation();

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

                //Ist die Frage, ob man während dem Zeichnen
                //die Karte bewegen könnne soll oder nicht.
                //this.map.disableMapNavigation();

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
                                me.setAreaResult("invalid", me.POLYGON_TO_LARGE)
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

                            dijitRegistry.byId("submitButton").set('disabled', !me.polygonValid || !me.emailValid || !me.complianceValid);
                            me.resetDrawingButton();

                        },
                        function (error) {
                            me.resetDrawingButton();
                            if (error.response.status === 502) {
                                // Dies wird vermutlich sein, wenn die Verarbeitung wegen Zeitüberschreitung abgebrochen wurde
                                me.setAreaResult("invalid", me.POLYGON_TIMEOUT)
                            } else {
                                // Dies könnte sein, wenn Status 404 ist, also der Worksapce nicht mehr unter dem Namen vorhanden ist.
                                me.setAreaResult("invalid", me.POLYGON_INTERNAL_ERROR)
                            }

                        }
                    );
                }
            }
        });
    }
);
