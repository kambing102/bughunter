import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from core import basic_scan

INPUT_FILE = "target_legal.txt"
OUTPUT_DIR = "output"
MAX_WORKERS = 4


def load_targets(path):
    with open(path, "r") as f:
        return list(set([line.strip() for line in f if line.strip()]))


def save_json(data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(os.path.join(OUTPUT_DIR, "results.json"), "w") as f:
        json.dump(data, f, indent=2)


def save_txt(data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(os.path.join(OUTPUT_DIR, "results.txt"), "w") as f:
        for r in data:
            if "error" in r:
                f.write(f"{r['target']} | ERROR\n")
            else:
                ports = ",".join(map(str, r["ports"]))
                f.write(f"{r['target']} | {r['ip']} | {r['status']} | {ports}\n")


def main():
    targets = load_targets(INPUT_FILE)
    results = []

    print(f"[+] Loaded {len(targets)} targets")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(basic_scan, t): t for t in targets}

        for i, fut in enumerate(as_completed(futures), 1):
            res = fut.result()
            print(f"[{i}/{len(targets)}] {res.get('target')}")
            results.append(res)

    results = [r for r in results if r.get("alive")]
    
    save_json(results)
    save_txt(results)

    print("[+] Done. Saved to output/")


if __name__ == "__main__":
    main()
