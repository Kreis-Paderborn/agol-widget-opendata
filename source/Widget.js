define([
	'dojo/_base/declare',
	'jimu/BaseWidget',
	'jimu/WidgetManager',
	'classes/OpenDataForm'],
	function (
		declare,
		BaseWidget,
		WidgetManager,
		OpenDataForm) {

		//To create a widget, you need to derive from BaseWidget.
		return declare([BaseWidget], {
			// Custom widget code goes here

			baseClass: 'jimu-widget-widget-at',

			startup: function () {
				this.inherited(arguments);

				var form = new OpenDataForm(this.map, {
					fmeServerBaseUrl: this.config.environment.fmeServerBaseUrl,
					fmeServerToken: this.config.environment.fmeServerToken
				});
			},

			onOpen: function () {
				var wm = WidgetManager.getInstance();

				alert("minimizeWidget!");
				wm.minimizeWidget(this);

				// alert("closeWidget!");
				// wm.closeWidget(this);

				// alert("destroyWidget!");
				// wm.destroyWidget(this);

			},


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