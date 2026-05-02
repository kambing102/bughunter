import socket
import requests
import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# ======================
# SESSION
# ======================
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (racon-core)"
})

# ======================
# RESOLVE IP
# ======================
def resolve_ip(target):
    try:
        return socket.gethostbyname(target)
    except:
        return None

# ======================
# HTTP CHECK
# ======================
def check_http(target, timeout=5):
    status = {}

    for scheme in ["http", "https"]:
        url = f"{scheme}://{target}"
        try:
            r = session.get(url, timeout=timeout)
            status[scheme] = r.status_code
        except requests.exceptions.RequestException:
            status[scheme] = "error"

    return status

# ======================
# PORT SCAN
# ======================
def port_scan(ip, ports=None, timeout=1.0):
    if not ip:
        return []

    if ports is None:
        ports = [21, 22, 80, 443, 3306, 8080]

    open_ports = []

    for port in ports:
        try:
            with socket.socket() as s:
                s.settimeout(timeout)
                if s.connect_ex((ip, port)) == 0:
                    open_ports.append(port)
        except:
            pass

    return open_ports

# ======================
# EXTRACT LINKS
# ======================
def extract_links(html, base_url):
    links = set()

    for match in re.findall(r'href=["\'](.*?)["\']', html, re.I):
        if match.startswith("http"):
            links.add(match)
        elif match.startswith("/"):
            links.add(base_url + match)

    return links

# ======================
# FILTER PARAM
# ======================
def find_params(urls):
    interesting = []
    keywords = ["id", "page", "q", "search", "query", "file", "url", "cat", "content"]

    for u in urls:
        if "?" in u and "=" in u:
            for k in keywords:
                if k + "=" in u.lower():
                    interesting.append(u)
                    break

    return interesting

# ======================
# CRAWLER DEPTH
# ======================
def crawl_and_extract(target, max_depth=2, max_urls=30):
    visited = set()
    to_visit = set()
    found_urls = set()

    for scheme in ["http", "https"]:
        to_visit.add(f"{scheme}://{target}")

    depth = 0

    while to_visit and depth < max_depth and len(found_urls) < max_urls:
        next_round = set()

        for url in to_visit:
            if url in visited:
                continue

            visited.add(url)

            try:
                r = session.get(url, timeout=5)
                links = extract_links(r.text, url)

                for link in links:
                    if target in link:
                        found_urls.add(link)
                        if link not in visited:
                            next_round.add(link)

            except:
                pass

        to_visit = next_round
        depth += 1

    param_urls = find_params(found_urls)

    return {
        "urls": list(found_urls),
        "params": param_urls
    }

# ======================
# BUILD PAYLOAD URL
# ======================
def inject_payload(url, payload):
    try:
        u = urlparse(url)
        qs = parse_qs(u.query)

        new_qs = {}
        for k in qs:
            new_qs[k] = payload

        new_query = urlencode(new_qs, doseq=True)

        return urlunparse((u.scheme, u.netloc, u.path, u.params, new_query, u.fragment))
    except:
        return None

# ======================
# XSS TESTER
# ======================
def test_xss(urls):
    findings = []
    payload = "<script>alert(1)</script>"

    for url in urls:
        test_url = inject_payload(url, payload)
        if not test_url:
            continue

        try:
            r = session.get(test_url, timeout=5)

            if payload in r.text:
                findings.append({
                    "url": url,
                    "test_url": test_url,
                    "vuln": "possible_xss"
                })

        except:
            pass

    return findings

# ======================
# MAIN SCAN
# ======================
def basic_scan(target):
    result = {"target": target}

    ip = resolve_ip(target)
    if not ip:
        result["error"] = "DNS failed"
        return result

    result["ip"] = ip
    result["status"] = check_http(target)
    result["ports"] = port_scan(ip)

    # crawler
    crawl_data = crawl_and_extract(target)
    result["urls"] = crawl_data["urls"]
    result["params"] = crawl_data["params"]

    # XSS test
    xss_result = test_xss(result.get("params", []))
    result["xss"] = xss_result

    result["alive"] = (
        result["status"].get("http") == 200
        or result["status"].get("https") == 200
    )

    return result
