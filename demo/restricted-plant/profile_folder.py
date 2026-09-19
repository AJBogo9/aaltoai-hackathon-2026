#!/usr/bin/env python3
"""
Profile all CSV files in a folder to compute folder-wide statistics.
Standard library only. No pandas/numpy.
"""
import csv
import os
import sys
import math
import statistics
from collections import defaultdict


def read_csv(file_path):
    """Read a CSV file and return rows as a list of lists."""
    with open(file_path, 'r') as f:
        return list(csv.reader(f))


def compute_statistics(data):
    """Compute statistics for all columns in the data."""
    if not data:
        return {}
    
    headers = data[0]
    rows = data[1:]
    num_columns = len(headers)
    
    # Transpose rows to columns
    columns = list(zip(*rows))
    
    stats = {}
    for i, col in enumerate(columns):
        col_name = headers[i]
        try:
            col_float = [float(x) for x in col if x.strip() != '']
        except ValueError:
            # Non-numeric column, skip statistics
            continue
        
        if not col_float:
            continue
        
        # Basic statistics
        col_min = min(col_float)
        col_max = max(col_float)
        col_mean = statistics.mean(col_float)
        col_median = statistics.median(col_float)
        col_stdev = statistics.stdev(col_float) if len(col_float) > 1 else 0.0
        
        # Detect saturation
        saturation_low = 1 if col_min == min(set(col_float)) else 0
        saturation_high = 1 if col_max == max(set(col_float)) else 0
        
        # Detect constant columns
        is_constant = 1 if len(set(col_float)) == 1 else 0
        
        # Windowed statistics (split into 10 blocks)
        block_size = len(col_float) // 10
        block_stats = []
        for block in range(10):
            start = block * block_size
            end = (block + 1) * block_size if block < 9 else len(col_float)
            block_data = col_float[start:end]
            if block_data:
                block_stats.append({
                    "min": min(block_data),
                    "max": max(block_data),
                    "mean": statistics.mean(block_data),
                    "median": statistics.median(block_data),
                    "stdev": statistics.stdev(block_data) if len(block_data) > 1 else 0.0
                })
            else:
                block_stats.append({})
        
        stats[col_name] = {
            "min": col_min,
            "max": col_max,
            "mean": col_mean,
            "median": col_median,
            "stdev": col_stdev,
            "saturation_low": saturation_low,
            "saturation_high": saturation_high,
            "is_constant": is_constant,
            "block_stats": block_stats,
            "num_samples": len(col_float),
            "num_missing": len(col) - len(col_float)
        }
    
    return stats


def compute_cross_correlation(stats, headers):
    """Compute cross-correlation between numeric columns."""
    correlations = defaultdict(dict)
    for i, col1 in enumerate(headers):
        if col1 not in stats:
            continue
        for j, col2 in enumerate(headers):
            if col2 not in stats or i >= j:
                continue
            
            # Simple Pearson correlation
            col1_data = [x for x in stats[col1]["block_stats"] if x]
            col2_data = [x for x in stats[col2]["block_stats"] if x]
            
            if len(col1_data) != len(col2_data):
                continue
            
            # Correlate block means
            x = [block["mean"] for block in col1_data]
            y = [block["mean"] for block in col2_data]
            
            n = len(x)
            if n == 0:
                continue
            
            sum_x = sum(x)
            sum_y = sum(y)
            sum_x2 = sum(xi ** 2 for xi in x)
            sum_y2 = sum(yi ** 2 for yi in y)
            sum_xy = sum(xi * yi for xi, yi in zip(x, y))
            
            numerator = sum_xy - (sum_x * sum_y) / n
            denominator = math.sqrt((sum_x2 - (sum_x ** 2) / n) * (sum_y2 - (sum_y ** 2) / n))
            
            if denominator == 0:
                correlation = 0.0
            else:
                correlation = numerator / denominator
            
            correlations[col1][col2] = correlation
            correlations[col2][col1] = correlation
    
    return correlations


def main():
    folder = "sensordata"
    files = [f for f in os.listdir(folder) if f.endswith('.csv')]
    
    if not files:
        print("No CSV files found in the folder.", file=sys.stderr)
        return
    
    all_stats = {}
    all_headers = []
    
    for file in files:
        file_path = os.path.join(folder, file)
        data = read_csv(file_path)
        if not data:
            continue
        
        headers = data[0]
        if not all_headers:
            all_headers = headers
        elif headers != all_headers:
            print(f"Warning: Headers in {file} do not match others. Using first header set.", file=sys.stderr)
        
        stats = compute_statistics(data)
        all_stats[file] = stats
    
    # Compute cross-correlation for the first file's headers
    correlations = compute_cross_correlation(all_stats[files[0]], all_headers)
    
    # Print folder-wide statistics
    print("=== Folder-wide statistics ===")
    print("Files:", ", ".join(files))
    print("\nHeaders:", ", ".join(all_headers))
    
    print("\n=== Per-file statistics ===")
    for file, stats in all_stats.items():
        print(f"\nFile: {file}")
        for col, col_stats in stats.items():
            print(f"  Column: {col}")
            print(f"    Min: {col_stats['min']:.4f}, Max: {col_stats['max']:.4f}")
            print(f"    Mean: {col_stats['mean']:.4f}, Median: {col_stats['median']:.4f}")
            print(f"    Stdev: {col_stats['stdev']:.4f}")
            print(f"    Missing: {col_stats['num_missing']}, Samples: {col_stats['num_samples']}")
            print(f"    Saturated low: {col_stats['saturation_low']}, Saturated high: {col_stats['saturation_high']}")
            print(f"    Constant: {col_stats['is_constant']}")
            print(f"    Block stats (10 blocks):")
            for i, block in enumerate(col_stats['block_stats']):
                if block:
                    print(f"      Block {i}: min={block['min']:.4f}, max={block['max']:.4f}, mean={block['mean']:.4f}, median={block['median']:.4f}, stdev={block['stdev']:.4f}")
    
    print("\n=== Cross-correlation (Pearson) ===")
    for col1, corr_dict in correlations.items():
        for col2, corr in corr_dict.items():
            print(f"  {col1} <-> {col2}: {corr:.4f}")


if __name__ == "__main__":
    main()