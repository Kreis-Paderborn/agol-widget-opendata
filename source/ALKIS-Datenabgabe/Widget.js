define([
	'dojo/_base/declare',
	"dojo/_base/lang",
	'jimu/BaseWidget',
	'jimu/PanelManager',
	'dojo/window',
	'classes/OpenDataForm'],
	function (
		declare,
		lang,
		BaseWidget,
		PanelManager,
		dojoWindow,
		OpenDataForm) {

		//To create a widget, you need to derive from BaseWidget.
		return declare([BaseWidget], {
			// Custom widget code goes here

			baseClass: 'jimu-widget-widget-opendata-main',
			form: null,


			startup: function () {
				this.inherited(arguments);
				this.fetchDataByName(this.config.NameOfWidgetToPresentControlsOnMap);

				// Um zu verhindern, dass Eingaben über den Nummernblock im Widget 
				// die Kartennavigation triggert (passiert, wenn der Mauszeiger über der Karte steht)
				// wird hier die Keyboard-Navigation der Karte deaktiviert.
				this.map.disableKeyboardNavigation();

				this.makeSmall = lang.hitch(this, this.makeSmall);
				this.makeTall = lang.hitch(this, this.makeTall);

				this.form = new OpenDataForm(this.map, {
					fmeServerBaseUrl: this.config.environment.fmeServerBaseUrl,
					makeSmallCallback: this.makeSmall,
					makeTallCallback: this.makeTall,
				});

				// Definiere eine globale Variable, um festzustellen ob
				// der Anwender ein Gerät mit Touch benutzt. 
				// Achtung: der Wert kann frühestens nach der ersten Benutzerinteraktion
				// auf TRUE gesetzt sein.
				window.userIsTouching = false;
				window.addEventListener('touchstart', function onFirstTouch() {
					// we could use a class
					window.userIsTouching = true;

					// we only need to know once that a human touched the screen, so we can stop listening now
					window.removeEventListener('touchstart', onFirstTouch, false);
				}, false);



			},

			onReceiveData: function (name, widgetId, data, historyData) {

				// Wir hören hier nur auf Daten von unserem verknüpften Widget.
				// Es gibt teilweise ungewollte Aufrufe, wo dann aber historyData=undefined
				// gesetzt ist. Diese filtern wir auf diese weise aus.				
				if (name !== this.config.NameOfWidgetToPresentControlsOnMap || (historyData === undefined)) {
					return;
				}

				// Im Fall des Abschlusses des "Fläche festlegen per Touch"
				// wird die gezeichnete Fläche verarbeitet und die Oberflächen-
				// Elemente für das Zeichnen ausgeblendet.
				if (data.drawState === 'finished') {
					this.form.processGraphic();
					this.form.stopDrawing();
				}

				// Im Fall des Abbruchs des "Fläche festlegen per Touch"
				// wird die gezeichnete Fläche gelöscht und die Oberflächen-
				// Elemente für das Zeichnen ausgeblendet.
				if (data.drawState === 'cancel') {
					this.map.graphics.clear();
					this.form.resetDrawingButton();
					this.form.stopDrawing();
				}

			},

			// onOpen: function () {
			//   console.log('onOpen');
			// },

			makeSmall: function () {
				var pm = PanelManager.getInstance();
				pm.minimizePanel(this.id + "_panel");

				this.publishData({
					drawState: 'start'
				});
			},

			makeTall: function () {

				// var vs = dojoWindow.getBox();
				// console.log("Breite/Höhe: " + vs.w + "/" + vs.h);

				var pm = PanelManager.getInstance();
				var aPanel = pm.getPanelById(this.id + "_panel");
				pm.maximizePanel(this.id + "_panel");

				this.publishData({
					drawState: 'cancel'
				});
			},

			/**
			 * Wird beim Schließen des Panels aufgerufen.
			 * Entweder durch die Schaltfläche in der Toolbar
			 * oder durch das "X" in der Titelleiste des Panels selbst.
			 */
			onClose: function () {

				// Abbruch der evtl. gestarteten Interaktionen
				// mit der Karte und dem Zeichnwerkzeug
				// Der Parameter killWodget=true bei stopDrawing
				// verhindet einen Konflikt zwischen maximizePanel und 
				// destroyPanel auf dem PanelManager.
				this.map.graphics.clear();
				this.form.stopDrawing(true);

				// Entferne auch die Schaltflächen für das erweiterte Zeichnen
				this.publishData({
					drawState: 'cancel'
				});

				// Zerstören der Panel-Instanz, damit beim
				// nächsten Start sicher alles zurück gesetzt ist.
				var pm = PanelManager.getInstance();
				pm.destroyPanel(this.id + "_panel");

				// Um zu verhindern, dass Eingaben über den Nummernblock im Widget 
				// die Kartennavigation triggert (passiert, wenn der Mauszeiger über der Karte steht)
				// wurde beim Start des Widget die Keyboard-Navigation der Karte deaktiviert.
				// Diese kann nun wieder aktiviert werden.
				this.map.enableKeyboardNavigation();
			},

			onMinimize: function () {
				console.log('onMinimize');
			},

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