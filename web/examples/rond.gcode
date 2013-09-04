; Gcode cercle centre 100,100 rayon 25
G92 E0 ; reset extrusion distance
G1 Z0.350 F7800.000 ; move to next layer (0)
G92 E0 ; reset extrusion distance
G1 X125.0 Y75.0 Z0.350 E10; move to first point
G3 X125.000 Y125.0 I-25 J25 F540.000 E20.00000 Z0.350; second point
G1 X125.0 Y125.0 Z0.350
G3 X75.000 Y125.00 I-25 J-25 F540.000 E40.0 Z0.350 ; third point
G1 X75.0 Y125.0 Z0.350
G3 X75.0 Y75.0 I25 J-25 F540.000 E60.0 Z0.350 ; quart point
G1 X75.0 Y75.0 Z0.350
G3 X125.0 Y75.0 I25 J25 F540.000 E80.0 Z0.350 ; first point
G92 E0 ; reset extrusion distance
G1 Z0.5 F7800.000 ; move to next layer (1)
G92 E0 ; reset extrusion distance
G1 X125.0 Y75.0 Z0.50 E10; move to first point
G3 X125.000 Y125.0 I-25 J25 F540.000 E20.00000 Z0.350; second point
G1 X125.0 Y125.0 Z0.50
G3 X75.000 Y125.00 I-25 J-25 F540.000 E40.0 Z0.350 ; third point
G1 X75.0 Y125.0 Z0.50
G3 X75.0 Y75.0 I25 J-25 F540.000 E60.0 Z0.50 ; quart point
G1 X75.0 Y75.0 Z0.50
G3 X125.0 Y75.0 I25 J25 F540.000 E80.0 Z0.50 ; first point
