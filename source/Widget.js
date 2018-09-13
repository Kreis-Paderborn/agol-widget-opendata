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

			startup: function () {
				this.inherited(arguments);

				this.makeSmall = lang.hitch(this, this.makeSmall);
				this.makeTall = lang.hitch(this, this.makeTall);


				var form = new OpenDataForm(this.map, {
					fmeServerBaseUrl: this.config.environment.fmeServerBaseUrl,
					fmeServerToken: this.config.environment.fmeServerToken,
					makeSmallCallback: this.makeSmall,
					makeTallCallback: this.makeTall,
				});
			},

			onOpen: function () {

			},

			makeSmall: function() {
				var pm = PanelManager.getInstance();
				pm.minimizePanel(this.id + "_panel");
			},

			makeTall: function() {

				// var vs = dojoWindow.getBox();
				// console.log("Breite/Höhe: " + vs.w + "/" + vs.h);

				var pm = PanelManager.getInstance();
				pm.maximizePanel(this.id + "_panel");
			},


			onClose: function(){
			  var pm = PanelManager.getInstance();
				pm.destroyPanel(this.id + "_panel");
			},

			onMinimize: function(){
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