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

			baseClass: 'jimu-widget-widget-opendata-drawing-extension',
			drawFinishButton: null,

			startup: function () {
				this.inherited(arguments);
				this.fetchDataByName(this.config.NameOfMainWidget);

				var me = this;

				this.drawFinishButton = new BusyButton({
                    label: "Zeichnen abschließen",
					busyLabel: "Zeichnen abschließen...",
					timeout: 500,
                    //baseClass:"jimu-btn",
					disabled: false,
					style: "visibility: hidden",
                    onClick: function () {

						me.publishData({
							drawState: 'finished'
						  }, false);
						this.set("style","visibility: hidden");
                    }
                }, "drawFinish");
                this.drawFinishButton.startup();
			},

			onReceiveData: function(name, widgetId, data, historyData) {
				//filter out messages
				if(name !== this.config.NameOfMainWidget){
				  return;
				}
		
				if (data.drawState === "start") {
					this.drawFinishButton.set("style","visibility: visible");
				} 
				if (data.drawState === "cancel") {
					this.drawFinishButton.set("style","visibility: hidden");
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