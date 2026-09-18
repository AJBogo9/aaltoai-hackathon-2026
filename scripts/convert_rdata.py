"""Convert the Tennessee Eastman .RData files to Parquet, once.

The hackathon data arrives as R workspace files. Everything downstream reads Parquet,
so R is needed exactly zero times after this script has run.

Usage:
    uv run python scripts/convert_rdata.py
"""

from pathlib import Path

import pyreadr

DATA = Path(__file__).resolve().parent.parent / "data"
OUT = DATA / "parquet"


def convert(path: Path) -> None:
    result = pyreadr.read_r(str(path))
    for name, frame in result.items():
        # R stores simulationRun / sample / faultNumber as doubles; they are indices.
        # Process values stay float64: the quantization analysis depends on exact values.
        for col in ("faultNumber", "simulationRun", "sample"):
            if col in frame.columns:
                frame[col] = frame[col].astype("int32")
        target = OUT / f"{name}.parquet"
        frame.to_parquet(target, index=False)
        print(f"{path.name}: {name} {frame.shape} -> {target.relative_to(DATA.parent)}"
              f" ({target.stat().st_size / 1e6:.1f} MB)")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(DATA.glob("*.RData"))
    if not files:
        raise SystemExit(f"no .RData files in {DATA}")
    for path in files:
        convert(path)


if __name__ == "__main__":
    main()
