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
    'dijit/form/Textarea',
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
    dijitTextarea,
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



            textAreaDefaultText: "?? - Gültiges Anfragepolygon    ?? - Maximale Größe eingehalten ?? - Anfrage innerhalb KPB",

            textAreaLoadingText: "%% - Gültiges Anfragepolygon    %% - Maximale Größe eingehalten %% - Anfrage innerhalb KPB",

            constructor: function (map, options) {

                this.map = map;
                this.fmeServerBaseUrl = options.fmeServerBaseUrl;
                this.fmeServerToken = options.fmeServerToken;
                this.makeSmallCallback = options.makeSmallCallback;
                this.makeTallCallback = options.makeTallCallback;



                // specify class defaults
                this.fillSymbol = options.fillSymbol || new SimpleFillSymbol("solid", new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2), new Color([232, 104, 80, 0.25]));

                var me = this;





                var textarea = new dijitTextarea({
                    rows: 6,
                    cols: 32,
                    style: "width:auto;",
                    wrap: "hard",
                    onFocus: function () {
                        console.log("textarea focus handler");

                        this.makeSmallCallback();
                    },
                    onBlur: function () { 
                        this.makeTallCallback();
                     },
                    selectOnClick: true
                }, "dijitTextarea");
                textarea.startup();

                var emailTextbox = new dijitValidationTextBox({
                    style: "width:248px;",
                    required: true,
                    promptMessage: "Bitte eMail eingeben.",
                    missingMessage: "Es muss eine eMail angegeben werden.",
                    invalidMessage: "Der eingegeben Wert ist keine gültige eMail-Adresse",
                    regExp: "\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+",
                    onKeyUp: function () { console.log("email is valid: " + this.isValid()); },
                    value: "TrantowA@Kreis-Paderborn.de",
                    name: "opt_requesteremail"
                }, "opt_requesteremail");
                emailTextbox.startup();

                var button = new BusyButton({
                    label: "Anfrage absenden",
                    busyLabel: "Anfrage absenden...",
                    //baseClass:"jimu-btn",
                    disabled: true,
                    onClick: function () {

                        button.makeBusy();

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
                                button.cancel();
                            },
                            function (error) {
                                alert("Error: " + error.message);
                            }
                        );
                    }
                }, "dijitButtonSubmit");
                button.startup();

                this.draw = new Draw(this.map);

                // addGraphic is called by an external function, esriRequest
                // hitch() is used to provide the proper context so that addGraphic
                // will have access to the instance of this class
                this.addGraphic = lang.hitch(this, this.addGraphic);

                // if we do not bind this to "addGraphic" it will not run in scope of "this"
                //this.addGraphic = this.addGraphic.bind(this)
                this.draw.on("draw-complete", this.addGraphic);


                $('.jimu-widget-widget-at .map-id').click(function () {

                    if (this.name === "activate") {
                        me.startDrawing();
                        //alert(this.name);
                        this.name = "deactivate";
                        this.value = "'Bereich zeichnen' läuft...";
                    } else {
                        me.stopDrawing();
                        // alert(this.name);
                        this.name = "activate";
                        this.value = "'Bereich zeichnen' starten";
                    }
                });


            },

            stopDrawing: function () {
                var drawButton = window.document.getElementById("drawButton");
                drawButton.name = "activate";
                drawButton.value = "'Bereich zeichnen' starten";

                this.makeTallCallback();

                this.map.enableMapNavigation();
                this.draw.deactivate();
            },


            startDrawing: function () {
                var drawButton = window.document.getElementById("drawButton");
                drawButton.name = "deactivate";
                drawButton.value = "'Bereich zeichnen' läuft...";

                this.makeSmallCallback();


                var textarea = window.document.getElementById("dijitTextarea");
                textarea.value = this.textAreaDefaultText;

                this.map.disableMapNavigation();
                this.map.graphics.clear();
                this.wktPolygon = undefined;
                this.draw.activate('polygon');
            },

            addGraphic: function (evt) {
                this.stopDrawing();

                var textarea = window.document.getElementById("dijitTextarea");
                textarea.value = this.textAreaLoadingText;



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
                        var textarea = window.document.getElementById("dijitTextarea");
                        var submit = true;
                        //alert("Liegt vollständig in Kreisgrenze: " + response[0].requestPolygonInsideKPB + "Fläche ungültig: " + response[0].requestPolygonInvalid + "zu groß?: " + response[0].requestPolygonToLarge);



                        if (response[0].requestPolygonInvalid == 1) {
                            textarea.value = "!! - Gültiges Anfragepolygon    ";
                            submit = false;
                        } else if (response[0].requestPolygonInvalid == 0) {
                            textarea.value = "ok - Gültiges Anfragepolygon    "
                        } else {
                            textarea.value = "?? - Gültiges Anfragepolygon    ";
                            submit = false;
                        }

                        if (response[0].requestPolygonToLarge == 1) {
                            textarea.value += "!! - Maximale Größe eingehalten ";
                            submit = false;
                        } else if (response[0].requestPolygonToLarge == 0) {
                            textarea.value += "ok - Maximale Größe eingehalten "
                        } else {
                            textarea.value += "?? - Maximale Größe eingehalten ";
                            submit = false;
                        }

                        if (response[0].requestPolygonOutsideKPB == 1) {
                            textarea.value += "!! - Anfrage innerhalb KPB";
                            submit = false;
                        } else if (response[0].requestPolygonOutsideKPB == 0) {
                            textarea.value += "ok - Anfrage innerhalb KPB"
                        } else {
                            textarea.value += "?? - Anfrage innerhalb KPB";
                            submit = false;
                        }

                        dijitRegistry.byId("dijitButtonSubmit").set('disabled', !submit);
                    },
                    function (error) {
                        alert("Error: " + error.message);
                    }
                );

                window.document.getElementById("paramRequestPolygon").value = myWKT;

            }

        });
    }
);
