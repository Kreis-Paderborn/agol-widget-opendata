define([
	'dojo/_base/declare',
	"dojo/_base/lang",
	'jimu/BaseWidget',
	'jimu/PanelManager',
	'dojo/window',
	'dojox/form/BusyButton'],
	function (
		declare,
		lang,
		BaseWidget,
		PanelManager,
		dojoWindow,
		BusyButton) {

		//To create a widget, you need to derive from BaseWidget.
		return declare([BaseWidget], {
			// Custom widget code goes here

			baseClass: 'jimu-widget-widget-opendata-touch',
			drawFinishButton: null,
			drawAbortButton: null,
			drawStatusText: null,

			startup: function () {
				this.inherited(arguments);
				this.fetchDataByName(this.config.NameOfMainWidget);

				var me = this;
				this.drawFinishButton = window.document.getElementById("finishDrawing");
				this.drawAbortButton = window.document.getElementById("abortDrawing");
				this.drawStatusText = window.document.getElementById("statusText");


				this.drawFinishButton.onclick = function () {
					me.publishData({
						drawState: 'finished'
					}, false);
				}

				this.drawAbortButton.onclick = function () {
					me.publishData({
						drawState: 'cancel'
					}, false);
				}
			},

			onReceiveData: function (name, widgetId, data, historyData) {
				//filter out messages
				if (name !== this.config.NameOfMainWidget) {
					return;
				}

				if (data.drawState === "start") {
					this.drawFinishButton.style = "visibility: visible";
					this.drawAbortButton.style = "visibility: visible";
					this.drawStatusText.style = "visibility: visible";
				}
				if (data.drawState === "cancel") {
					this.drawFinishButton.style = "visibility: hidden";
					this.drawAbortButton.style = "visibility: hidden";
					this.drawStatusText.style = "visibility: hidden";
				}

			},

			// onOpen: function () {
			// },

			/**
			 * Wird beim Schließen des Panels aufgerufen.
			 * Entweder durch die Schaltfläche in der Toolbar
			 * oder durch das "X" in der Titelleiste des Panels selbst.
			 */
			// onClose: function () {

			// },

			// onMinimize: function () {

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