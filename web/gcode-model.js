function createObjectFromGCode(gcode) {
  // GCode descriptions come from:
  //    http://reprap.org/wiki/G-code
  //    http://en.wikipedia.org/wiki/G-code
  //    SprintRun source code

  var object = new THREE.Object3D();

  var geometry = new THREE.Geometry();

  parseGCode(gcode, {

    G1: function(args, line) {
      // Example: G1 Z1.0 F3000
      //          G1 X99.9948 Y80.0611 Z15.0 F1500.0 E981.64869
      //          G1 E104.25841 F1800.0
      // Go in a straight line from the current (X, Y) point
      // to the point (90.6, 13.8), extruding material as the move
      // happens from the current extruded length to a length of
      // 22.4 mm.

      if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
        geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(args.x, args.y, args.z)));
      }
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

      // TODO!
    },

    G91: function(args) {
      // G91: Set to Relative Positioning
      // Example: G91
      // All coordinates from now on are relative to the last position.

      // TODO!
    },

    G92: function(args) { // E0
      // G92: Set Position
      // Example: G92 E0
      // Allows programming of absolute zero point, by reseting the
      // current position to the values specified. This would set the
      // machine's X coordinate to 10, and the extrude coordinate to 90.
      // No physical motion will occur.

      // TODO: Only support E0
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
  });

  var lineMaterial = new THREE.LineBasicMaterial({color:0xFFFFFF, opacity:0.2, linewidth: 1});
  object.add(new THREE.Line(geometry, lineMaterial));

  // Center
  geometry.computeBoundingBox();
  var center = new THREE.Vector3()
      .add(geometry.boundingBox.min, geometry.boundingBox.max)
      .divideScalar(2);
  var scale = 3; // TODO: Auto size
  object.position = center.multiplyScalar(-scale);
  object.scale.multiplyScalar(scale);

  return object;
}