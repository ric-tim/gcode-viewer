; Gcode essai un carre 50x50
; [75,125] [125,125] [125,75] [75,75]
; 
; first layer extrusion width = 0.70mm

G21 ; set units to millimeters
M107 ; disable fan
M104 S200 ; set temperature
G28 ; home all axes
G1 Z5 F5000 ; lift nozzle

M109 S200 ; wait for temperature to be reached
G90 ; use absolute coordinates
G92 E0 ; reset extrusion distance
M82 ; use absolute distances for extrusion
G1 F1800.000 E-1.00000 ; retract
G92 E0 ; reset extrusion distance
G1 Z0.350 F7800.000 ; move to next layer (0)
G1 X75.0 Y125.0 Z0.350; move to first point
G1 X125.000 Y125.0 Z0.350 F540.000 E20.00000 ; second point
G1 X125.000 Y75.0 Z0.350 F540.000 E40.00000 ; third point
G1 X75.000 Y75.0 Z0.350 F540.000 E60.00000 ; quart point
G1 X75.000 Y125.0 Z0.350 F540.000 E80.00000 ; first point
G1 X125.000 Y125.0 Z0.350 F540.000 E100.00000 ; second point
G1 Z0.5 F7800.000 ; move to next layer (1)
G92 E0 ; reset extrusion distance
G1 X75.0 Y125.0 Z0.50; move to first point
G1 X125.000 Y125.0 Z0.50 F540.000 E20.00000 ; second point
G1 X125.000 Y75.0 Z0.50 F540.000 E40.00000 ; third point
G1 X75.000 Y75.0 Z0.50 F540.000 E60.00000 ; quart point
G1 X75.000 Y125.0 Z0.50 F540.000 E80.00000 ; first point
G1 X125.000 Y125.0 Z0.50 F540.000 E100.00000 ; second point
G1 Z0.65 F7800.000 ; move to next layer (2)
G92 E0 ; reset extrusion distance
G1 X75.0 Y125.0 Z0.650; move to first point
G1 X125.000 Y125.0 Z0.650 F540.000 E20.00000 ; second point
G1 X125.000 Y75.0 Z0.650 F540.000 E40.00000 ; third point
G1 X75.000 Y75.0 Z0.650 F540.000 E60.00000 ; quart point
G1 X75.000 Y125.0 Z0.650 F540.000 E80.00000 ; first point
G1 X125.000 Y125.0 Z0.650 F540.000 E100.00000 ; second point