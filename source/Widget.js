define([
	'dojo/_base/declare', 
	'jimu/BaseWidget',
	'esri/toolbars/draw',
	'esri/Color',
	'esri/symbols/SimpleLineSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/graphic',
	'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'],
  function(
	declare, 
	BaseWidget,
	Draw,
	Color,
	SimpleLineSymbol,
	SimpleFillSymbol,
	Graphic,	
	$) {

    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-widget-at',
	  
	  fillSymbol: new SimpleFillSymbol("solid", new SimpleLineSymbol("solid", new Color([232,104,80]), 2), new Color([232,104,80,0.25])),
	  
	  draw: undefined,

      //this property is set by the framework when widget is loaded.
      //name: 'CustomWidget',


      //methods to communication with app container:

      // postCreate: function() {
      //   this.inherited(arguments);
      //   console.log('postCreate');
      // },
	  
	  

      startup: function() {
        this.inherited(arguments);
        // this.mapIdNode.innerHTML = 'map id:' + this.map.id;
					// window.document.getElementById("xmax").value = this.map.extent.xmax;
			// window.document.getElementById("ymax").value = this.map.extent.ymax;
			// window.document.getElementById("xmin").value = this.map.extent.xmin;
			// window.document.getElementById("ymin").value = this.map.extent.ymin;
				// window.document.getElementById("wkid").value = this.map.spatialReference.wkid;
				
        // console.log('startup');
		
		
		
		this.draw = new Draw(this.map);
		this.draw.on("draw-complete", this.addGraphic);
		
		var me = this;
		 $('.jimu-widget-widget-at .map-id').click(function(){
			 
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
	   
	   stopDrawing: function() {
	    this.map.enableMapNavigation();
		this.draw.deactivate();
	  },		  
	   
	   
	  startDrawing: function() {
	    this.map.disableMapNavigation();
		this.map.graphics.clear();
		this.draw.activate('polygon');
	  },		 

	  addGraphic: function(evt) {
				
		 //this.stopDrawing();
		 
		 
		 
         this.map.graphics.add(new Graphic(evt.geometry, this.fillSymbol));
		 
		 myWKT="POLYGON ((";
		   evt.geometry.rings[0].forEach(
            function(myPoint) {
					
				    myWKT=myWKT+(myPoint[0]+" "+myPoint[1])+", ";
					
					}
					
					
		  );
		  myWKT = myWKT.substring(0 ,myWKT.length-2) + "))";
	
		  window.document.getElementById("paramRequestPolygon").value = myWKT;
		  window.document.getElementById("submitButton").disabled = false
		
		
	  },	  
	   
	  
		  

      onOpen: function(){
        	
			// window.document.getElementById("xmax").value = this.map.extent.xmax;
			// window.document.getElementById("ymax").value = this.map.extent.ymax;
			// window.document.getElementById("xmin").value = this.map.extent.xmin;
			// window.document.getElementById("ymin").value = this.map.extent.ymin;
			// window.document.getElementById("wkid").value = this.map.spatialReference.wkid;
		
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