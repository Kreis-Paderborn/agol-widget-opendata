define([
	'dojo/_base/declare',
	'jimu/BaseWidget',
	'esri/toolbars/draw',
	'esri/Color',
	'esri/symbols/SimpleLineSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/graphic',
	'esri/request',
	'dijit/form/SimpleTextarea',
	'dijit/form/Button',
	'dojo/domReady!',
	'dijit/registry',
	'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'],
	function (
		declare,
		BaseWidget,
		Draw,
		Color,
		SimpleLineSymbol,
		SimpleFillSymbol,
		Graphic,
		esriRequest,
		dijitSimpleTextarea,
		dijitButton,
		dijitReady,
		dijitRegistry,
		$) {

		//To create a widget, you need to derive from BaseWidget.
		return declare([BaseWidget], {
			// Custom widget code goes here

			baseClass: 'jimu-widget-widget-at',

			fillSymbol: new SimpleFillSymbol("solid", new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2), new Color([232, 104, 80, 0.25])),

			draw: undefined,

			startup: function () {
				this.inherited(arguments);

				var textarea = new dijitSimpleTextarea({
					rows: 6,
					cols: 32,
					onFocus: function () { console.log("textarea focus handler"); },
					onBlur: function () { console.log("textarea blur handler"); },
					selectOnClick: true,
					value: ""
				}, "dijitTextarea");
				textarea.startup();

				var button = new dijitButton({
					label: "Absenden!!!",
					//baseClass:"jimu-btn",
					disabled: true,
					onClick: function () { 
						console.log("First button was clicked!"); 
						window.document.getElementById("openDataForm").submit();
					}
				}, "dijitButtonSubmit");
				button.startup();

				this.draw = new Draw(this.map);

				// if we do not bind this to "addGraphic" it will not run in scope of "this"
				this.addGraphic = this.addGraphic.bind(this)
				this.draw.on("draw-complete", this.addGraphic);

				var me = this;
				$('.jimu-widget-widget-at .map-id').click(function () {

					if (this.name === "activate") {
						me.startDrawing();
						//alert(this.name);
						this.name = "deactivate"
					} else {
						me.stopDrawing();
						// alert(this.name);
						this.name = "activate"
					}
				});

			},

			stopDrawing: function () {
				this.map.enableMapNavigation();
				this.draw.deactivate();
			},


			startDrawing: function () {
				this.map.disableMapNavigation();
				this.map.graphics.clear();
				this.draw.activate('polygon');
			},

			addGraphic: function (evt) {

				// FIXME: Also set name of draw-button to "deactivate" 
				this.stopDrawing();



				this.map.graphics.add(new Graphic(evt.geometry, this.fillSymbol));

				myWKT = "POLYGON ((";
				evt.geometry.rings[0].forEach(
					function (myPoint) {

						myWKT = myWKT + (myPoint[0] + " " + myPoint[1]) + ", ";

					}


				);
				myWKT = myWKT.substring(0, myWKT.length - 2) + "))";

				var request = esriRequest({
					// Location of the data
					url: this.config.environment.fmeServerBaseUrl + "fmedatastreaming/KPB_OpenData/KPB_Anfrage-Flaeche-pruefen.fmw",
					// Service parameters if required, sent with URL as key/value pairs
					content: {
						paramRequestPolygon: myWKT,
						mode: "server",
						token: this.config.environment.fmeServerToken
					},
					// Data format
					handleAs: "json"
				});

				request.then(
					function (response) {
						alert("Liegt vollständig in Kreisgrenze: " + response.data.requestPolygonInsideKPB + "Fläche ungültig: " + response.data.requestPolygonInvalid + "zu groß?: " + response.data.requestPolygonToLarge);
						window.document.getElementById("dijitTextarea").value = "Liegt vollständig in Kreisgrenze: " + response.data.requestPolygonInsideKPB;
						dijitRegistry.byId("dijitButtonSubmit").set('disabled', false);
					},
					function (error) {
						alert("Error: " + error.message);
					}
				);

				window.document.getElementById("paramRequestPolygon").value = myWKT;

			},

			// onOpen: function () {
			// 	console.log('onOpen');
			// },

			// onClose: function(){
			//   console.log('onClose');
			// },

			// onMinimize: function(){
			//   console.log('onMinimize');
			// },

			// onMaximize: function(){
			//   console.log('onMaximize');
			// },

			// onSignIn: function(credential){
			//   /* jshint unused:false*/
			//   console.log('onSignIn');
			// },

			// onSignOut: function(){
			//   console.log('onSignOut');
			// }

			// onPositionChange: function(){
			//   console.log('onPositionChange');
			// },

			// resize: function(){
			//   console.log('resize');
			// }

			//methods to communication between widgets:

		});
	});