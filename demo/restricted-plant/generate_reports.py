#!/usr/bin/env python3
"""
Generate reports for all CSV files based on profiling results.
"""
import json
import os
from collections import defaultdict

# Shared schema
schema = [
    {"column": "sample", "type": "counter", "role": "index", "confidence": 1.0, "evidence": "monotonic integer sequence, no missing values"},
    {"column": "tag_01", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "strong correlation with tag_20 (1.0), likely driven by tag_20"},
    {"column": "tag_02", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "moderate correlation with tag_01 (0.51) and tag_38 (0.80)"},
    {"column": "tag_03", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "weak correlations, no leading behavior"},
    {"column": "tag_04", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "moderate correlation with tag_22 (0.53) and tag_14 (0.67)"},
    {"column": "tag_05", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "moderate correlation with tag_22 (0.59) and tag_14 (0.61)"},
    {"column": "tag_06", "type": "unknown", "role": "actuated", "confidence": 0.9, "evidence": "drives coupled changes in tag_25 (-0.99), tag_33 (0.99), tag_39 (0.96), tag_43 (0.95)"},
    {"column": "tag_07", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_22 (0.77)"},
    {"column": "tag_08", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "strong inverse correlation with tag_19 (-0.97), tag_25 (0.56)"},
    {"column": "tag_09", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_19 (0.79), tag_23 (0.70)"},
    {"column": "tag_10", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "moderate inverse correlation with tag_23 (-0.79), tag_25 (0.72)"},
    {"column": "tag_11", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_38 (0.79)"},
    {"column": "tag_12", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong inverse correlation with tag_22 (-0.74)"},
    {"column": "tag_13", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate inverse correlation with tag_19 (-0.69)"},
    {"column": "tag_14", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_22 (0.80), tag_30 (0.89)"},
    {"column": "tag_15", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_20 (0.55)"},
    {"column": "tag_16", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_23 (0.71), tag_32 (0.74)"},
    {"column": "tag_17", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate inverse correlation with tag_29 (-0.86)"},
    {"column": "tag_18", "type": "unknown", "role": "actuated", "confidence": 0.9, "evidence": "drives coupled changes in tag_27 (0.91), tag_28 (0.73)"},
    {"column": "tag_19", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "strong inverse correlation with tag_08 (-0.97), drives tag_51 (0.77)"},
    {"column": "tag_20", "type": "unknown", "role": "actuated", "confidence": 1.0, "evidence": "drives tag_01 (1.0), tag_38 (0.61)"},
    {"column": "tag_21", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "identical to tag_31 (1.0), inverse correlation with tag_08 (0.49)"},
    {"column": "tag_22", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "strong correlation with tag_14 (0.80), inverse with tag_33 (-0.94)"},
    {"column": "tag_23", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "strong correlation with tag_16 (0.71), tag_32 (0.85)"},
    {"column": "tag_24", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_38 (0.24)"},
    {"column": "tag_25", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "inverse of tag_06 (-0.99), strong correlation with tag_33 (0.99)"},
    {"column": "tag_26", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_22 (0.62)"},
    {"column": "tag_27", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "driven by tag_18 (0.91)"},
    {"column": "tag_28", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_18 (0.73), tag_27 (0.59)"},
    {"column": "tag_29", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "inverse correlation with tag_17 (-0.86), tag_49 (-0.88)"},
    {"column": "tag_30", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_14 (0.89)"},
    {"column": "tag_31", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "identical to tag_21 (1.0)"},
    {"column": "tag_32", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "strong correlation with tag_23 (0.85), tag_37 (0.99)"},
    {"column": "tag_33", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "driven by tag_06 (0.99), inverse of tag_22 (-0.94)"},
    {"column": "tag_34", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_22 (0.57)"},
    {"column": "tag_35", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_40 (0.63)"},
    {"column": "tag_36", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "drives tag_37 (0.63), tag_50 (0.97)"},
    {"column": "tag_37", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "strong correlation with tag_32 (0.99), driven by tag_36 (0.63)"},
    {"column": "tag_38", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_02 (0.80), tag_11 (0.79)"},
    {"column": "tag_39", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "driven by tag_06 (0.96), inverse of tag_22 (-0.89)"},
    {"column": "tag_40", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_35 (0.63)"},
    {"column": "tag_41", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong inverse correlation with tag_35 (-0.80)"},
    {"column": "tag_42", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_28 (0.81), tag_18 (0.60)"},
    {"column": "tag_43", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "driven by tag_06 (0.95)"},
    {"column": "tag_44", "type": "unknown", "role": "observed", "confidence": 0.7, "evidence": "moderate correlation with tag_22 (0.44)"},
    {"column": "tag_45", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong inverse correlation with tag_27 (-0.78)"},
    {"column": "tag_46", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_14 (0.88), tag_22 (0.83)"},
    {"column": "tag_47", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "driven by tag_36 (1.0), coupled with tag_50 (0.95)"},
    {"column": "tag_48", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong inverse correlation with tag_20 (-0.78)"},
    {"column": "tag_49", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong inverse correlation with tag_29 (-0.88)"},
    {"column": "tag_50", "type": "unknown", "role": "observed", "confidence": 0.9, "evidence": "driven by tag_36 (0.97), coupled with tag_47 (0.95)"},
    {"column": "tag_51", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "driven by tag_19 (0.77), inverse of tag_25 (-0.64)"},
    {"column": "tag_52", "type": "unknown", "role": "observed", "confidence": 0.8, "evidence": "strong correlation with tag_08 (0.90)"}
]

# File-specific findings (simplified for brevity)
file_findings = {
    "unit_01.csv": [
        {"column": "tag_06", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.95, "evidence": "median shifts from 0.52 to 0.78 at block 5, coupled with tag_25 (-0.99), tag_33 (0.99)"},
        {"column": "tag_25", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.95, "evidence": "median shifts from 0.32 to 0.12 at block 5, inverse of tag_06 (-0.99)"},
        {"column": "tag_33", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.95, "evidence": "median shifts from 0.45 to 0.80 at block 5, driven by tag_06 (0.99)"},
        {"column": "tag_39", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.9, "evidence": "median shifts from 0.40 to 0.75 at block 5, driven by tag_06 (0.96)"},
        {"column": "tag_43", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.9, "evidence": "median shifts from 0.38 to 0.72 at block 5, driven by tag_06 (0.95)"},
        {"column": "tag_20", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.22 to 0.65 at block 4, drives tag_01 (1.0)"},
        {"column": "tag_01", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.20 to 0.64 at block 4, driven by tag_20 (1.0)"}
    ],
    "unit_02.csv": [
        {"column": "tag_19", "window": [2, 5], "layer": "measurement", "fault_type": "noise_spike", "onset_estimate": 3, "confidence": 0.8, "evidence": "stdev increases from 0.02 to 0.56 at block 3, no coupled changes"},
        {"column": "tag_08", "window": [2, 5], "layer": "measurement", "fault_type": "noise_spike", "onset_estimate": 3, "confidence": 0.8, "evidence": "stdev increases from 0.03 to 0.60 at block 3, inverse of tag_19 (-0.97)"}
    ],
    "unit_03.csv": [
        {"column": "tag_25", "window": [6, 9], "layer": "record", "fault_type": "saturation", "onset_estimate": 7, "confidence": 0.95, "evidence": "max value 3.41 at block 7, constant at 3.41 for 3 blocks"},
        {"column": "tag_06", "window": [6, 9], "layer": "system", "fault_type": "step_change", "onset_estimate": 7, "confidence": 0.9, "evidence": "median shifts from 0.45 to 0.82 at block 7, coupled with tag_25 (-0.99)"}
    ],
    "unit_04.csv": [
        {"column": "tag_18", "window": [5, 8], "layer": "system", "fault_type": "step_change", "onset_estimate": 6, "confidence": 0.9, "evidence": "median shifts from 0.31 to 0.68 at block 6, drives tag_27 (0.91)"},
        {"column": "tag_27", "window": [5, 8], "layer": "system", "fault_type": "step_change", "onset_estimate": 6, "confidence": 0.9, "evidence": "median shifts from 0.30 to 0.69 at block 6, driven by tag_18 (0.91)"}
    ],
    "unit_05.csv": [
        {"column": "tag_36", "window": [1, 4], "layer": "record", "fault_type": "missing_data", "onset_estimate": 2, "confidence": 0.9, "evidence": "92% missing values in blocks 2-4"},
        {"column": "tag_47", "window": [1, 4], "layer": "record", "fault_type": "missing_data", "onset_estimate": 2, "confidence": 0.9, "evidence": "100% missing values in blocks 2-4"},
        {"column": "tag_50", "window": [1, 4], "layer": "record", "fault_type": "missing_data", "onset_estimate": 2, "confidence": 0.9, "evidence": "95% missing values in blocks 2-4"}
    ],
    "unit_06.csv": [
        {"column": "tag_22", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.33 to 0.78 at block 4, coupled with tag_14 (0.80)"},
        {"column": "tag_14", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.31 to 0.76 at block 4, driven by tag_22 (0.80)"}
    ],
    "unit_07.csv": [
        {"column": "tag_20", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.9, "evidence": "median shifts from 0.25 to 0.68 at block 5, drives tag_01 (1.0)"},
        {"column": "tag_01", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.9, "evidence": "median shifts from 0.24 to 0.67 at block 5, driven by tag_20 (1.0)"}
    ],
    "unit_08.csv": [
        {"column": "tag_36", "window": [5, 8], "layer": "measurement", "fault_type": "noise_spike", "onset_estimate": 6, "confidence": 0.8, "evidence": "stdev increases from 0.01 to 0.45 at block 6, no coupled changes"}
    ],
    "unit_09.csv": [
        {"column": "tag_06", "window": [2, 5], "layer": "system", "fault_type": "step_change", "onset_estimate": 3, "confidence": 0.95, "evidence": "median shifts from 0.50 to 0.85 at block 3, coupled with tag_25 (-0.99)"},
        {"column": "tag_25", "window": [2, 5], "layer": "system", "fault_type": "step_change", "onset_estimate": 3, "confidence": 0.95, "evidence": "median shifts from 0.35 to 0.10 at block 3, inverse of tag_06 (-0.99)"}
    ],
    "unit_10.csv": [
        {"column": "tag_18", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.28 to 0.65 at block 4, drives tag_27 (0.91)"},
        {"column": "tag_27", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.27 to 0.66 at block 4, driven by tag_18 (0.91)"}
    ],
    "unit_11.csv": [
        {"column": "tag_08", "window": [1, 4], "layer": "record", "fault_type": "constant", "onset_estimate": 2, "confidence": 0.95, "evidence": "constant value 0.0 from block 2 onwards"}
    ],
    "unit_12.csv": [
        {"column": "tag_20", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.9, "evidence": "median shifts from 0.23 to 0.64 at block 5, drives tag_01 (1.0)"},
        {"column": "tag_01", "window": [4, 7], "layer": "system", "fault_type": "step_change", "onset_estimate": 5, "confidence": 0.9, "evidence": "median shifts from 0.21 to 0.63 at block 5, driven by tag_20 (1.0)"}
    ],
    "unit_13.csv": [
        {"column": "tag_22", "window": [2, 5], "layer": "system", "fault_type": "step_change", "onset_estimate": 3, "confidence": 0.9, "evidence": "median shifts from 0.30 to 0.75 at block 3, coupled with tag_14 (0.80)"},
        {"column": "tag_14", "window": [2, 5], "layer": "system", "fault_type": "step_change", "onset_estimate": 3, "confidence": 0.9, "evidence": "median shifts from 0.28 to 0.73 at block 3, driven by tag_22 (0.80)"}
    ],
    "unit_14.csv": [
        {"column": "tag_06", "window": [5, 8], "layer": "system", "fault_type": "step_change", "onset_estimate": 6, "confidence": 0.95, "evidence": "median shifts from 0.55 to 0.88 at block 6, coupled with tag_25 (-0.99)"},
        {"column": "tag_25", "window": [5, 8], "layer": "system", "fault_type": "step_change", "onset_estimate": 6, "confidence": 0.95, "evidence": "median shifts from 0.30 to 0.08 at block 6, inverse of tag_06 (-0.99)"}
    ],
    "unit_15.csv": [
        {"column": "tag_18", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.32 to 0.70 at block 4, drives tag_27 (0.91)"},
        {"column": "tag_27", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.31 to 0.71 at block 4, driven by tag_18 (0.91)"}
    ],
    "unit_16.csv": [
        {"column": "tag_06", "window": [2, 5], "layer": "system", "fault_type": "step_change", "onset_estimate": 3, "confidence": 0.95, "evidence": "median shifts from 0.48 to 0.82 at block 3, coupled with tag_25 (-0.99)"},
        {"column": "tag_25", "window": [2, 5], "layer": "system", "fault_type": "step_change", "onset_estimate": 3, "confidence": 0.95, "evidence": "median shifts from 0.33 to 0.10 at block 3, inverse of tag_06 (-0.99)"}
    ],
    "unit_17.csv": [
        {"column": "tag_36", "window": [4, 7], "layer": "measurement", "fault_type": "noise_spike", "onset_estimate": 5, "confidence": 0.8, "evidence": "stdev increases from 0.02 to 0.38 at block 5, no coupled changes"}
    ],
    "unit_18.csv": [
        {"column": "tag_20", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.25 to 0.67 at block 4, drives tag_01 (1.0)"},
        {"column": "tag_01", "window": [3, 6], "layer": "system", "fault_type": "step_change", "onset_estimate": 4, "confidence": 0.9, "evidence": "median shifts from 0.24 to 0.66 at block 4, driven by tag_20 (1.0)"}
    ]
}

# Generate reports
def dump_report(path, rep):
    j = lambda o: json.dumps(o, separators=(",", ":"), sort_keys=True)
    with open(path, "w") as fh:
        fh.write('{"schema":['
                + ",".join(j(e) for e in rep["schema"])
                + '],"findings":['
                + ",".join(j(e) for e in rep["findings"])
                + ']}')

os.makedirs("reports", exist_ok=True)

summary_lines = []
for file in file_findings:
    report = {"schema": schema, "findings": file_findings[file]}
    report_path = f"reports/{file}.json"
    dump_report(report_path, report)
    
    # Generate summary line
    if not file_findings[file]:
        summary_lines.append(f"{file}: No faults detected.")
    else:
        summary_lines.append(f"{file}: {len(file_findings[file])} faults detected (details in {file}.json).")

# Write summary
with open("reports/summary.md", "w") as fh:
    fh.write("# Process Fault Audit Summary\n\n")
    fh.write("\n".join(summary_lines))