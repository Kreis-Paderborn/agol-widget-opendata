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

			baseClass: 'jimu-widget-widget-at',
			form: null,

			startup: function () {
				this.inherited(arguments);

				this.makeSmall = lang.hitch(this, this.makeSmall);
				this.makeTall = lang.hitch(this, this.makeTall);


				this.form = new OpenDataForm(this.map, {
					fmeServerBaseUrl: this.config.environment.fmeServerBaseUrl,
					fmeServerToken: this.config.environment.fmeServerToken,
					makeSmallCallback: this.makeSmall,
					makeTallCallback: this.makeTall,
				});
			},

			onOpen: function () {

			},

			makeSmall: function () {
				var pm = PanelManager.getInstance();
				pm.minimizePanel(this.id + "_panel");
			},

			makeTall: function () {

				// var vs = dojoWindow.getBox();
				// console.log("Breite/Höhe: " + vs.w + "/" + vs.h);

				var pm = PanelManager.getInstance();
				var aPanel = pm.getPanelById(this.id + "_panel");
				console.log("PANEL:");
				console.log(aPanel);
				pm.maximizePanel(this.id + "_panel");
			},

			/**
			 * Wird beim Schließen des Panels aufgerufen.
			 * Entweder durch die Schaltfläche in der Toolbar
			 * oder durch das "X" in der Titelleiste des Panels selbst.
			 */
			onClose: function () {

				// Abbruch der evtl. gestarteten Interaktionen
				// mit der Karte und dem Zeichnwerkzeug
				this.map.enableMapNavigation();
				this.map.graphics.clear();
				this.form.deactivateDrawingTool();

				// Zerstören der Panel-Instanz, damit beim
				// nächsten Start sicher alles zurück gesetzt ist.
				var pm = PanelManager.getInstance();
				pm.destroyPanel(this.id + "_panel");
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