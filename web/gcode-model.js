function createObjectFromGCode(gcode) {
  // GCode descriptions come from:
  //    http://reprap.org/wiki/G-code
  //    http://en.wikipedia.org/wiki/G-code
  //    SprintRun source code
	
  var lastLine = {x:0, y:0, z:0, e:0, f:0, i:0, j:0, extruding:false , arc:false ,arc_cw:false};
 
 	var layers = [];
 	var layer = undefined;
 	var bbbox = { min: { x:100000,y:100000,z:100000 }, max: { x:-100000,y:-100000,z:-100000 } };
 	
 	function newLayer(line) {
 		layer = { type: {}, layer: layers.count(), z: line.z, };
 		layers.push(layer);
 	}
 	function getLineGroup(line) {
 		if (layer == undefined)
 			newLayer(line);
 		var speed = Math.round(line.e / 1000);
 		var grouptype = (line.extruding ? 10000 : 0) + speed;
		var color = new THREE.Color(line.extruding ? 0xffffff : 0x0000ff);
		var colored = new THREE.Color(line.extruding ? 0xffffff : 0xff0000);
		
 		if (layer.type[grouptype] == undefined) {
 			layer.type[grouptype] = {
 				type: grouptype,
 				feed: line.e,
 				extruding: line.extruding,
 				color: color,
				couleur: colored,
 				segmentCount: 0,
 				material: new THREE.LineBasicMaterial({
					  opacity:line.extruding ? 0.5 : 0.4,
					  transparent: true,
					  linewidth: 2,
					  vertexColors: THREE.FaceColors }),
				geometry: new THREE.Geometry(),
			}
		}
		return layer.type[grouptype];
 	}
	
 	function addSegment(p1, p2) {
		var group = getLineGroup(p2);
		var geometry = group.geometry;
		
		group.segmentCount++;
        geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(p1.x, p1.y, p1.z)));
        geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(p2.x, p2.y, p2.z)));
        
        geometry.colors.push(group.color);
        if (p2.extruding) {
			bbbox.min.x = Math.min(bbbox.min.x, p2.x);
			bbbox.min.y = Math.min(bbbox.min.y, p2.y);
			bbbox.min.z = Math.min(bbbox.min.z, p2.z);
			bbbox.max.x = Math.max(bbbox.max.x, p2.x);
			bbbox.max.y = Math.max(bbbox.max.y, p2.y);
			bbbox.max.z = Math.max(bbbox.max.z, p2.z);
		}
 	}
	function addArc(p1, p2) {
		var group = getLineGroup(p2);
		var geometry = group.geometry;
	// On va devoir dessiner l'arc... comme Three.js ne comporte pas une telle routine
	// on va donc construire des segments... ;-) avec l'algorithme de Marlin !!!
	// mc_arc() dans motion_control.cpp
	// Ce bout de code est bien partagé en robotique, on le trouve ailleurs ;-)
	// float center_axis0 = position[axis_0] + offset[axis_0];
    // float center_axis1 = position[axis_1] + offset[axis_1];
    // float linear_travel = target[axis_linear] - position[axis_linear];
		var linear_travel = p2.z - p1.z;
    // float extruder_travel = target[E_AXIS] - position[E_AXIS];
    // float r_axis0 = -offset[axis_0];  // Radius vector from center to current location
    // float r_axis1 = -offset[axis_1];
    // float rt_axis0 = target[axis_0] - center_axis0;
    // float rt_axis1 = target[axis_1] - center_axis1;
	// On calcule le rayon radius racine de (i^2 + j^2)
		var radius = Math.sqrt(Math.pow(p2.i,2)  + Math.pow(p2.j,2));
		console.log("Rayon ", radius);
	// L = lastline = position courante
	// N = newline = target
		var cx = p1.x + p2.i ; 
		var cy = p1.y + p2.j ;
		if((cx > 99) && (cx < 101)) { cx = 100 ; }
		if((cy > 99) && (cy < 101)) { cy = 100 ; }
		console.log("Center ", cx,cy);
	// rx Vecteur Centre-> Current location = -i
	// ry Vecteur Centre-> Current location = -j
		var rx = - p2.i ;
		var ry = - p2.j ;
	// rtx Vecteur Centre-> Target = Tx - Cx
	// rty Vecteur Centre-> Tatget = Ty - Cy
		var rtx = p2.x - cx;
		var rty = p2.y - cy;
	// float angular_travel = atan2(r_axis0*rt_axis1-r_axis1*rt_axis0, r_axis0*rt_axis0+r_axis1*rt_axis1);
		var theta = Math.atan2((rx*rty - ry*rtx),(rx*rtx + ry*rty));
		
    // if (angular_travel < 0) { angular_travel += 2*M_PI; }
	//	if (theta < 0) { theta += 2 * Math.PI ;}
		if (theta < 0) { theta = -1*theta ;}
    // if (isclockwise) { angular_travel -= 2*M_PI; }
		if (p2.arc_cw == true) { theta -= 2 * Math.PI ; }
	// console.log("Angle corrige", theta);
	// float millimeters_of_travel = hypot(angular_travel*radius, fabs(linear_travel));
		var millimeters_of_travel = Math.sqrt(Math.pow(theta*radius,2),Math.pow((p2.z - p1.z)),2);
    // if (millimeters_of_travel < 0.001) { return; }
    //uint16_t segments = floor(millimeters_of_travel/MM_PER_ARC_SEGMENT);
		var nb_segments = Math.floor(millimeters_of_travel / 1);
    // if(segments == 0) segments = 1;
		if(nb_segments == 0) nb_segments = 1;
	// console.log("Nb Segments ", nb_segments);
    // float theta_per_segment = angular_travel/segments;
		var theta_per_segment = theta/nb_segments;
    // float linear_per_segment = linear_travel/segments;
		var linear_per_segment = linear_travel/nb_segments;
    // float extruder_per_segment = extruder_travel/segments;
	// Vector rotation matrix values
    // float cos_T = 1 -0.5*theta_per_segment*theta_per_segment; // Small angle approximation
		var cos_T = 1 -0.5*theta_per_segment*theta_per_segment; // Small angle approximation
    // float sin_T = theta_per_segment;
		var sin_T = theta_per_segment;
    // float arc_target[4];
		var arc_target = [];
		var old_target = [];
    // float sin_Ti;
		var sin_Ti;
    // float cos_Ti;
		var cos_Ti;
    // float r_axisi;
		var rxi;
    // uint16_t i;
	    var i ;
    // int8_t count = 0;
		var count = 0 ;
	// Initialize the linear axis - Rt - On change Z
    // arc_target[axis_linear] = position[axis_linear];
 		    
         old_target[0] = p1.x ;
		 old_target[1] = p1.y ;
		 old_target[2] = p1.z ;
    for (i = 1; i<nb_segments; i++) { // Increment (segments-1)
	/*
	 * Si on laissait tomber cette approximation....
	if (count < 25) {
		// Apply vector rotation matrix 
		rxi = rx*sin_T + ry*cos_T;
		rx = rx*cos_T - ry*sin_T;
		ry = rxi;
		count++;
		} else {
		// Arc correction to radius vector. Computed only every N_ARC_CORRECTION increments.
		// Compute exact location by applying transformation matrix from initial radius vector(=-offset).
		cos_Ti = Math.cos(i*theta_per_segment);
		sin_Ti = Math.sin(i*theta_per_segment);
		rx = -p2.i*cos_Ti + p2.j*sin_Ti;
		ry = -p2.i*sin_Ti - p2.j*cos_Ti;
		count = 0;
		}
	*/
		cos_Ti = Math.cos(i*theta_per_segment);
		sin_Ti = Math.sin(i*theta_per_segment);
		rx = -p2.i*cos_Ti + p2.j*sin_Ti;
		ry = -p2.i*sin_Ti - p2.j*cos_Ti;
		// Update arc_target location
		arc_target[0] = cx + rx;
		arc_target[1] = cy + ry;
		arc_target[2] += linear_per_segment;
		// plan_buffer_line(arc_target[X_AXIS], arc_target[Y_AXIS], arc_target[Z_AXIS], arc_target[E_AXIS], feed_rate, extruder);
    

		group.segmentCount++;
		geometry.colors.push(group.couleur);
		geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(old_target[0],old_target[1], old_target[2]))); 
        geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(arc_target[0],arc_target[1], arc_target[2]))); 
			//console.log("Vertex ", i,arc_target[0],arc_target[1]);
	    
             old_target[0] = arc_target[0];
			 old_target[1] = arc_target[1];
			 old_target[2] = arc_target[2];
        if (p2.extruding) {
			bbbox.min.x = Math.min(bbbox.min.x, arc_target[0]);
			bbbox.min.y = Math.min(bbbox.min.y, arc_target[1]);
			bbbox.min.z = Math.min(bbbox.min.z, p2.z);
			bbbox.max.x = Math.max(bbbox.max.x, arc_target[0]);
			bbbox.max.y = Math.max(bbbox.max.y, arc_target[1]);
			bbbox.max.z = Math.max(bbbox.max.z, p2.z);
		} 
			
	}
    // Ensure last segment arrives at target location.
    // plan_buffer_line(target[X_AXIS], target[Y_AXIS], target[Z_AXIS], target[E_AXIS], feed_rate, extruder);
		group.segmentCount++;
		geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(old_target[0],old_target[1], old_target[2]))); 
        geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(p2.x, p2.y, p2.z)));
			// console.log("Vertex ", i,p2.x,p2.y);
        
        if (p2.extruding) {
			bbbox.min.x = Math.min(bbbox.min.x, p2.x);
			bbbox.min.y = Math.min(bbbox.min.y, p2.y);
			bbbox.min.z = Math.min(bbbox.min.z, p2.z);
			bbbox.max.x = Math.max(bbbox.max.x, p2.x);
			bbbox.max.y = Math.max(bbbox.max.y, p2.y);
			bbbox.max.z = Math.max(bbbox.max.z, p2.z);
		}
		geometry.colors.push(group.couleur);
	}
	function addArcNew(p1, p2) {
		var group = getLineGroup(p2);
		var geometry = group.geometry;
	// On va devoir dessiner l'arc... 
	// Essai THREE.ArcCurve(aX,aY,aRadius,aStartAngle,aEndAngle,aCW)
	// On calcule le rayon radius racine de (i^2 + j^2)
		var radius = Math.sqrt(Math.pow(p2.i,2)  + Math.pow(p2.j,2));
		// console.log("Rayon ", radius);
	// L = lastline = position courante
	// N = newline = target
		var cx = p1.x + p2.i ; 
		var cy = p1.y + p2.j ;
		//console.log("Center ", cx,cy);
	
		if( p1.x == cx) { 
		    if ((p1.y - cy) > 0 ) { var aStart = Math.PI/2 ; } else {  var aStart = 3* Math.PI/2 ; }
		} else { 
			// var aStart = Math.atan2((p1.y - cy),(p1.x -cx)) ;
               var aStart = 7*Math.PI/4 ;			
		}
		// if (aStart < 0) { aStart -= 2*Math.PI ;}
		if( p2.x == cx) { 
		    if ((p2.y - cy) > 0 ) { var aEnd = Math.PI/2 ; } else {  var aEnd = 3* Math.PI/2 ; }
		} else { 
			// var aEnd = Math.atan2((p2.y - cy),(p2.x -cx)) ;
				var aEnd = Math.PI/4 ;
		}
		 // if (aEnd < 0) { aEnd -= 2*Math.PI ;}		
		
		var Courbe = new THREE.ArcCurve(cx,cy,radius,aStart,aEnd,false);
		
		// var Courbe = new THREE.ArcCurve(cx,cy,radius,0,2*Math.PI,false);
		
		 console.log("Courbe ", p1.x,p1.y, p2.x,p2.y,aStart,aEnd,p2.arc_cw );
		var points = Courbe.getPoints(40) ;
		for (i = 0; i<40; i++) {
		group.segmentCount++;
        geometry.vertices.push( new THREE.Vertex (
		            new THREE.Vector3(points[i].x, points[i].y, p2.z)));
			// console.log("Vertex ", group.segmentCount,points[i].x,points[i].y);
        geometry.colors.push(group.couleur);
		}
		/*
		for (i = 0; i<1; i+= 0.05) {
		var point = Courbe.getPoint(i) ;
 		group.segmentCount++;
        geometry.vertices.push( new THREE.Vertex (
		            new THREE.Vector3(point.x, point.y, p2.z)));
			 console.log("Vertex ", group.segmentCount,point.x,point.y);
        geometry.colors.push(group.color);
               
		}
		*/
	    // group.segmentCount++;
        //geometry.vertices.push( new THREE.Vertex (
		//            new THREE.Vector3(p2.x, p2.y, p2.z)));
        // geometry.colors.push(group.color);
        if (p2.extruding) {
			bbbox.min.x = Math.min(bbbox.min.x, p2.x);
			bbbox.min.y = Math.min(bbbox.min.y, p2.y);
			bbbox.min.z = Math.min(bbbox.min.z, p2.z);
			bbbox.max.x = Math.max(bbbox.max.x, p2.x);
			bbbox.max.y = Math.max(bbbox.max.y, p2.y);
			bbbox.max.z = Math.max(bbbox.max.z, p2.z);
		}
			
	/* 
    // Ensure last segment arrives at target location.
    // plan_buffer_line(target[X_AXIS], target[Y_AXIS], target[Z_AXIS], target[E_AXIS], feed_rate, extruder);
		group.segmentCount++;
        geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(p2.x, p2.y, p2.z)));
			// console.log("Vertex ", i,p2.x,p2.y);
        
        geometry.colors.push(group.color);
        if (p2.extruding) {
			bbbox.min.x = Math.min(bbbox.min.x, p2.x);
			bbbox.min.y = Math.min(bbbox.min.y, p2.y);
			bbbox.min.z = Math.min(bbbox.min.z, p2.z);
			bbbox.max.x = Math.max(bbbox.max.x, p2.x);
			bbbox.max.y = Math.max(bbbox.max.y, p2.y);
			bbbox.max.z = Math.max(bbbox.max.z, p2.z);
		}
	*/
	}
	
  	var relative = false;
	function delta(v1, v2) {
		return relative ? v2 : v2 - v1;
	}
	function absolute (v1, v2) {
		return relative ? v1 + v2 : v2;
	}

  var parser = new GCodeParser({  	
    G1: function(args, line) {
      // Example: G1 Z1.0 F3000
      //          G1 X99.9948 Y80.0611 Z15.0 F1500.0 E981.64869
      //          G1 E104.25841 F1800.0
      // Go in a straight line from the current (X, Y) point
      // to the point (90.6, 13.8), extruding material as the move
      // happens from the current extruded length to a length of
      // 22.4 mm.

      var newLine = {
        x: args.x !== undefined ? absolute(lastLine.x, args.x) : lastLine.x,
        y: args.y !== undefined ? absolute(lastLine.y, args.y) : lastLine.y,
        z: args.z !== undefined ? absolute(lastLine.z, args.z) : lastLine.z,
        e: args.e !== undefined ? absolute(lastLine.e, args.e) : lastLine.e,
        f: args.f !== undefined ? absolute(lastLine.f, args.f) : lastLine.f,
        i: args.i !== undefined ? absolute(lastLine.i, args.i) : lastLine.i,
        j: args.j !== undefined ? absolute(lastLine.j, args.j) : lastLine.j,		
      };
      /* layer change detection is or made by watching Z, it's made by
         watching when we extrude at a new Z position */
		if (delta(lastLine.e, newLine.e) > 0) {
			newLine.extruding = delta(lastLine.e, newLine.e) > 0;
			if (layer == undefined || newLine.z != layer.z)
				newLayer(newLine);
		}
		newLine.arc = false ;
		addSegment(lastLine, newLine);
      lastLine = newLine;
    },
   G2: function(args, line) {
      // Example: G1 Z1.0 F3000
      //          G2 X66.871 Y88.751 I-1.237 J0.600 F3600.000 E66.61182 
      //          G1 E104.25841 F1800.0
      // Arc in clockwise Center I and J Go in a arc line from the current (X, Y) point
      // to the point (66.8, 88.7), extruding material as the move
      // happens from the current extruded length to a length of
      // 66.6 mm.

      var newLine = {
        x: args.x !== undefined ? absolute(lastLine.x, args.x) : lastLine.x,
        y: args.y !== undefined ? absolute(lastLine.y, args.y) : lastLine.y,
        z: args.z !== undefined ? absolute(lastLine.z, args.z) : lastLine.z,
        e: args.e !== undefined ? absolute(lastLine.e, args.e) : lastLine.e,
        f: args.f !== undefined ? absolute(lastLine.f, args.f) : lastLine.f,
		i: args.i !== undefined ? absolute(lastLine.i, args.i) : lastLine.i,
        j: args.j !== undefined ? absolute(lastLine.j, args.j) : lastLine.j,
      };
      /* layer change detection is or made by watching Z, it's made by
         watching when we extrude at a new Z position */
		if (delta(lastLine.e, newLine.e) > 0) {
			newLine.extruding = delta(lastLine.e, newLine.e) > 0;
			if (layer == undefined || newLine.z != layer.z)
				newLayer(newLine);
		}
		newLine.arc_cw = true ;
		newLine.arc = true ;
		addArc(lastLine, newLine);
		// addSegment(lastLine, newLine);
      lastLine = newLine;
    },
  G3: function(args, line) {
      // Example: G1 Z1.0 F3000
      //          G3 X66.871 Y88.751 I-1.237 J0.600 F3600.000 E66.61182 
      //          G1 E104.25841 F1800.0
      // Arc in counterclockwise Center I and J Go in a arc line from the current (X, Y) point
      // to the point (66.8, 88.7), extruding material as the move
      // happens from the current extruded length to a length of
      // 66.6 mm.

      var newLine = {
        x: args.x !== undefined ? absolute(lastLine.x, args.x) : lastLine.x,
        y: args.y !== undefined ? absolute(lastLine.y, args.y) : lastLine.y,
        z: args.z !== undefined ? absolute(lastLine.z, args.z) : lastLine.z,
        e: args.e !== undefined ? absolute(lastLine.e, args.e) : lastLine.e,
        f: args.f !== undefined ? absolute(lastLine.f, args.f) : lastLine.f,
		i: args.i !== undefined ? absolute(lastLine.i, args.i) : lastLine.i,
        j: args.j !== undefined ? absolute(lastLine.j, args.j) : lastLine.j,
      };
      /* layer change detection is or made by watching Z, it's made by
         watching when we extrude at a new Z position */
		if (delta(lastLine.e, newLine.e) > 0) {
			newLine.extruding = delta(lastLine.e, newLine.e) > 0;
			if (layer == undefined || newLine.z != layer.z)
				newLayer(newLine);
		}
		newLine.arc_cw = false;
		newLine.arc = true;
		 addArc(lastLine, newLine);
		// addSegment(lastLine, newLine);
      lastLine = newLine;
    },	
    G21: function(args) {
      // G21: Set Units to Millimeters
      // Example: G21
      // Units from now on are in millimeters. (This is the RepRap default.)

      // No-op: So long as G20 is not supported.
    },

    G90: function(args) {
      // G90: Set to Absolute Positioning
      // Example: G90
      // All coordinates from now on are absolute relative to the
      // origin of the machine. (This is the RepRap default.)

      relative = false;
    },

    G91: function(args) {
      // G91: Set to Relative Positioning
      // Example: G91
      // All coordinates from now on are relative to the last position.

      // TODO!
      relative = true;
    },

    G92: function(args) { // E0
      // G92: Set Position
      // Example: G92 E0
      // Allows programming of absolute zero point, by reseting the
      // current position to the values specified. This would set the
      // machine's X coordinate to 10, and the extrude coordinate to 90.
      // No physical motion will occur.

      // TODO: Only support E0
      var newLine = lastLine;
      newLine.x= args.x !== undefined ? args.x : newLine.x;
      newLine.y= args.y !== undefined ? args.y : newLine.y;
      newLine.z= args.z !== undefined ? args.z : newLine.z;
      newLine.e= args.e !== undefined ? args.e : newLine.e;
      lastLine = newLine;
    },

    M82: function(args) {
      // M82: Set E codes absolute (default)
      // Descriped in Sprintrun source code.

      // No-op, so long as M83 is not supported.
    },

    M84: function(args) {
      // M84: Stop idle hold
      // Example: M84
      // Stop the idle hold on all axis and extruder. In some cases the
      // idle hold causes annoying noises, which can be stopped by
      // disabling the hold. Be aware that by disabling idle hold during
      // printing, you will get quality issues. This is recommended only
      // in between or after printjobs.

      // No-op
    },

    'default': function(args, info) {
//      console.error('Unknown command:', args.cmd, args, info);
    },
  });

  parser.parse(gcode);

	console.log("Layer Count ", layers.count());

  var object = new THREE.Object3D();
	
	for (var lid in layers) {
		var layer = layers[lid];
//		console.log("Layer ", layer.layer);
		for (var tid in layer.type) {
			var type = layer.type[tid];
//			console.log("Layer ", layer.layer, " type ", type.type, " seg ", type.segmentCount);
		  object.add(new THREE.Line(type.geometry, type.material, THREE.LinePieces));
		}
	}
	console.log("bbox ", bbbox);

  // Center
  var scale = 3; // TODO: Auto size

  var center = new THREE.Vector3(
  		bbbox.min.x + ((bbbox.max.x - bbbox.min.x) / 2),
  		bbbox.min.y + ((bbbox.max.y - bbbox.min.y) / 2),
  		bbbox.min.z + ((bbbox.max.z - bbbox.min.z) / 2));
	console.log("center ", center);
  
  object.position = center.multiplyScalar(-scale);

  object.scale.multiplyScalar(scale);

  return object;
}
