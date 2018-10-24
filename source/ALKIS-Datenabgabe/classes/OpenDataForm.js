define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/request",
    'esri/Color',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/toolbars/draw',
    'esri/graphic',
    'esri/request',
    'dijit/form/ValidationTextBox',
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
    esriRequest,
    dijitValidationTextBox,
    dijitReady,
    BusyButton,
    dijitRegistry,
    $) {

        return declare(null, {

            fillSymbol: null,
            map: null,
            fmeServerBaseUrl: null,
            fmeServerToken: null,
            draw: null,
            wktPolygon: null,
            makeSmallCallback: null,
            makeTallCallback: null,
            drawInMobileMode: false,

            // Status für Formular
            polygonValid: false,
            emailValid: false,

            // Texte für Prüfergebnis der Flächenprüfung
            POLYGON_DEFAULT: "Keine Fläche vorhanden.",
            POLYGON_INVALID: "Das eingezeichnete Anfragepolygon ist ungültig.",
            POLYGON_VALID: "Das eingezeichnete Anfragepolygon ist in Ordnung.",
            POLYGON_NO_INTERACTION: "Es wurde keine Geometrie gezeichnet. Setzen Sie durch Tippen in die Karte mindestens 3 Punkte um ein Polygon festzulegen.",
            POLYGON_OUTSIDE_KPB: "Das Anfragepolygon muss innerhalb der Kreisgrenze liegen.",
            POLYGON_TO_LARGE: "Die maximale Größe wurde nicht eingehalten.",


            constructor: function (map, options) {

                this.map = map;
                this.fmeServerBaseUrl = options.fmeServerBaseUrl;
                this.fmeServerToken = options.fmeServerToken;
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

                        dijitRegistry.byId("submitButton").set('disabled', !me.polygonValid || !me.emailValid);
                    },
                    value: "", //value: "TrantowA@Kreis-Paderborn.de",
                    name: "opt_requesteremail"
                }, "opt_requesteremail");
                emailTextbox.startup();



                var drawButton = new BusyButton({
                    label: "Bereich zeichnen",
                    busyLabel: "Bereich zeichnen...",
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
                            url: me.fmeServerBaseUrl + "fmedatadownload/KPB_OpenData/NAS_Abgabe.fmw",
                            // Service parameters if required, sent with URL as key/value pairs
                            content: {
                                Auftragsnummer: "123456",
                                Mode: "server",
                                token: me.fmeServerToken,
                                opt_servicemode: "async",
                                opt_showresult: false,
                                paramRequestPolygon: me.wktPolygon,
                                opt_requesteremail: dijitRegistry.byId("opt_requesteremail").get('value')
                            },
                            // Data format
                            handleAs: "text"
                        });

                        request.then(
                            function (response) {
                                alert("Fertig!");
                                submitButton.cancel();
                            },
                            function (error) {
                                alert("Error: " + error.message);
                            }
                        );
                    }
                }, "submitButton");
                submitButton.startup();

                // Festlegen, welche Positionen für Meldungs-Popups 
                // der ValidationTextbox möglich sein sollen
                dijit.Tooltip.defaultPosition = ['above','below'];

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
                if (state==="valid") {
                    pruefergebnisDiv.className = "submitValid";
                } else if (state==="invalid") {
                    pruefergebnisDiv.className = "submitInvalid";
                } else if (state==="initial") {
                    pruefergebnisDiv.className = "submitInitial";
                } 
                pruefergebnisDiv.innerHTML = pMessage;
            },

            stopDrawing: function () {

                if (this.drawInMobileMode) {
                    this.makeTallCallback();
                }

                this.map.enableMapNavigation();
                this.deactivateDrawingTool();
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
                this.drawInMobileMode = (window.innerWidth < 1000) || window.userIsTouching;
                if (this.drawInMobileMode) {
                    this.makeSmallCallback();
                }

                this.setAreaResult("initial", this.POLYGON_DEFAULT);

                //Ist die Frage, ob man während dem Zeichnen
                //die Karte bewegen könnne soll oder nicht.
                //this.map.disableMapNavigation();
                this.map.graphics.clear();
                this.wktPolygon = undefined;
                this.draw.activate('polygon');
            },

            addGraphic: function (evt) {
                this.stopDrawing();
                var me = this;

                // Hier wird der Stil für die abgeschlossene Grafik gesetzt
                this.map.graphics.add(new Graphic(evt.geometry, this.fillSymbol));

                var myWKT = "POLYGON ((";
                evt.geometry.rings[0].forEach(
                    function (myPoint) {
                        myWKT = myWKT + (myPoint[0] + " " + myPoint[1]) + ", ";
                    }
                );
                myWKT = myWKT.substring(0, myWKT.length - 2) + "))";
                this.wktPolygon = myWKT;

                var request = esriRequest({
                    // Location of the data
                    url: this.fmeServerBaseUrl + "fmedatastreaming/KPB_OpenData/KPB_Anfrage-Flaeche-pruefen.fmw",
                    // Service parameters if required, sent with URL as key/value pairs
                    content: {
                        paramRequestPolygon: myWKT,
                        mode: "server",
                        token: this.fmeServerToken
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

                        dijitRegistry.byId("submitButton").set('disabled', !me.polygonValid || !me.emailValid);
                        me.resetDrawingButton();

                    },
                    function (error) {
                        me.resetDrawingButton();
                        me.setAreaResult("invalid", error.message)

                    }
                );

                window.document.getElementById("paramRequestPolygon").value = myWKT;

            }

        });
    }
);
