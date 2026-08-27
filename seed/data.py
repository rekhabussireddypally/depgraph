"""
Realistic (not randomly generated) seed dataset for the dependency
blast-radius graph. Package names, dependency edges, and CVE ids are modeled
on real, publicly documented open-source ecosystem incidents:

- Log4Shell (CVE-2021-44228) in log4j-core
- The 2018 event-stream / flatmap-stream supply-chain compromise
- The 2021 ua-parser-js supply-chain compromise
- Prototype-pollution CVEs in lodash and minimist
- ReDoS CVEs in ansi-regex and urllib3
- PyYAML unsafe-load RCE (CVE-2020-14343)

Maintainer names are fictionalized; the incidents and package/dependency
shapes are representative of the real ecosystem.
"""

# Each package: name, ecosystem, description
PACKAGES = [
    # --- npm: web frameworks & HTTP ---
    ("express", "npm", "Fast, unopinionated web framework for Node.js"),
    ("body-parser", "npm", "Node.js body parsing middleware"),
    ("qs", "npm", "Query string parsing and stringifying"),
    ("send", "npm", "Streaming static file server"),
    ("mime", "npm", "MIME type lookup library"),
    ("axios", "npm", "Promise-based HTTP client"),
    ("follow-redirects", "npm", "HTTP/HTTPS redirect-following module"),
    ("socket.io", "npm", "Realtime bidirectional event-based communication"),
    ("ws", "npm", "Simple WebSocket implementation"),
    # --- npm: build tooling ---
    ("webpack", "npm", "Module bundler"),
    ("loader-utils", "npm", "Utilities for webpack loaders"),
    ("json5", "npm", "JSON5 parser"),
    ("micromatch", "npm", "Glob matching library"),
    ("braces", "npm", "Brace expansion library"),
    ("fill-range", "npm", "Fill numeric/alphabetic ranges"),
    ("to-regex-range", "npm", "Convert a range to a regex"),
    ("is-number", "npm", "Check if a value is a number"),
    ("react-scripts", "npm", "Scripts and configuration used by Create React App"),
    ("babel-core", "npm", "Babel compiler core"),
    ("babel-generator", "npm", "Turns Babel AST into code"),
    ("jest", "npm", "JavaScript testing framework"),
    ("jest-cli", "npm", "Jest command line interface"),
    ("jest-config", "npm", "Jest configuration resolution"),
    ("babel-jest", "npm", "Babel transform for Jest"),
    ("commander", "npm", "Command-line interface toolkit"),
    ("chalk", "npm", "Terminal string styling"),
    ("ansi-regex", "npm", "Regex for matching ANSI escape codes"),
    ("minimist", "npm", "Argument option parser"),
    ("lodash", "npm", "Utility library"),
    ("debug", "npm", "Tiny debugging utility"),
    ("ms", "npm", "Millisecond string conversion"),
    ("semver", "npm", "Semantic version parser"),
    ("tar", "npm", "Tar archive utility"),
    ("cross-spawn", "npm", "Cross-platform child_process.spawn"),
    # --- npm: the two real supply-chain compromise packages ---
    ("event-stream", "npm", "Functional streams library"),
    ("flatmap-stream", "npm", "Flat-map transform stream (malicious payload, 2018)"),
    ("ua-parser-js", "npm", "User-agent string parser"),
    # --- npm: apps built on the above ---
    ("react", "npm", "UI library"),
    # --- maven ---
    ("log4j-core", "maven", "Apache Log4j logging implementation"),
    ("log4j-api", "maven", "Apache Log4j API"),
    # --- pypi ---
    ("requests", "pypi", "HTTP library for Python"),
    ("urllib3", "pypi", "HTTP client for Python"),
    ("certifi", "pypi", "Mozilla CA bundle for Python"),
    ("flask", "pypi", "Lightweight WSGI web framework"),
    ("werkzeug", "pypi", "WSGI utility library"),
    ("jinja2", "pypi", "Template engine"),
    ("markupsafe", "pypi", "Safe string handling for templates"),
    ("click", "pypi", "Command line interface toolkit"),
    ("django", "pypi", "High-level web framework"),
    ("pytz", "pypi", "Timezone definitions"),
    ("pyyaml", "pypi", "YAML parser and emitter"),
    ("numpy", "pypi", "Numerical computing library"),
    ("pandas", "pypi", "Data analysis library"),
    ("cryptography", "pypi", "Cryptographic recipes and primitives"),
]

# (package, depends_on_package, version_range)
DEPENDENCIES = [
    # express stack
    ("express", "body-parser", "^1.20.0"),
    ("express", "send", "^0.18.0"),
    ("body-parser", "qs", "^6.11.0"),
    ("send", "mime", "^1.6.0"),
    ("axios", "follow-redirects", "^1.15.0"),
    ("socket.io", "ws", "^8.11.0"),
    ("socket.io", "debug", "^4.3.0"),
    # webpack stack (deep chain -- good for tree/blast-radius demos)
    ("webpack", "loader-utils", "^2.0.0"),
    ("webpack", "micromatch", "^4.0.5"),
    ("loader-utils", "json5", "^2.2.0"),
    ("micromatch", "braces", "^3.0.2"),
    ("braces", "fill-range", "^7.0.1"),
    ("fill-range", "to-regex-range", "^5.0.1"),
    ("to-regex-range", "is-number", "^7.0.0"),
    ("react-scripts", "webpack", "^5.75.0"),
    ("react-scripts", "react", "^18.2.0"),
    ("react-scripts", "babel-core", "^6.26.3"),
    ("babel-core", "babel-generator", "^6.26.1"),
    # jest stack
    ("jest", "jest-cli", "^29.3.0"),
    ("jest-cli", "jest-config", "^29.3.0"),
    ("jest-config", "babel-jest", "^29.3.0"),
    ("babel-jest", "babel-core", "^6.26.3"),
    # cli tooling
    ("commander", "chalk", "^5.2.0"),
    ("chalk", "ansi-regex", "^6.0.1"),
    ("cross-spawn", "semver", "^7.3.8"),
    ("tar", "chalk", "^5.2.0"),
    # classic transitive-vuln chains
    ("mime", "debug", "^4.3.0"),
    ("debug", "ms", "^2.1.3"),
    ("micromatch", "minimist", "^1.2.8"),  # historically minimist has appeared this deep in many trees
    ("webpack", "lodash", "^4.17.21"),
    ("react-scripts", "lodash", "^4.17.21"),
    # the two real supply-chain compromises
    ("event-stream", "flatmap-stream", "^0.1.1"),
    ("socket.io", "ua-parser-js", "^0.7.33"),
    ("react-scripts", "ua-parser-js", "^0.7.33"),
    # maven
    ("log4j-core", "log4j-api", "2.14.1"),
    # pypi stacks
    ("requests", "urllib3", ">=1.26.0"),
    ("requests", "certifi", ">=2022.9.24"),
    ("flask", "werkzeug", ">=2.2.0"),
    ("flask", "jinja2", ">=3.1.0"),
    ("flask", "click", ">=8.1.0"),
    ("jinja2", "markupsafe", ">=2.1.0"),
    ("django", "pytz", ">=2022.6"),
    ("django", "urllib3", ">=1.26.0"),
    ("pandas", "numpy", ">=1.23.0"),
    ("cryptography", "pandas", ">=1.5.0"),  # illustrative extra hop for blast-radius depth
]

# (cve_id, severity, summary, published, affects_package, version_range)
VULNERABILITIES = [
    (
        "CVE-2021-44228", "CRITICAL",
        "Log4Shell: unauthenticated remote code execution via JNDI lookup in log message rendering.",
        "2021-12-10", "log4j-core", "<2.15.0",
    ),
    (
        "GHSA-2018-EVENTSTREAM", "CRITICAL",
        "Malicious flatmap-stream dependency injected into event-stream, exfiltrating cryptocurrency wallet keys.",
        "2018-11-26", "flatmap-stream", "0.1.1",
    ),
    (
        "GHSA-2021-UAPARSER", "CRITICAL",
        "Compromised npm account published malicious ua-parser-js versions installing a cryptominer and password stealer.",
        "2021-10-22", "ua-parser-js", "0.7.29 - 0.8.1 / 1.0.0",
    ),
    (
        "CVE-2020-8203", "HIGH",
        "Prototype pollution in lodash allows attacker-controlled property injection via defaultsDeep, merge, zipObjectDeep.",
        "2020-07-15", "lodash", "<4.17.19",
    ),
    (
        "CVE-2020-7598", "HIGH",
        "Prototype pollution in minimist via constructor.prototype through crafted argument parsing.",
        "2020-03-11", "minimist", "<1.2.5",
    ),
    (
        "CVE-2021-3807", "MODERATE",
        "Regular expression denial of service (ReDoS) in ansi-regex via crafted input string.",
        "2021-09-17", "ansi-regex", "<6.0.1",
    ),
    (
        "CVE-2021-33503", "MODERATE",
        "Catastrophic backtracking ReDoS in urllib3 when parsing crafted authority components of a URL.",
        "2021-06-29", "urllib3", "<1.26.5",
    ),
    (
        "CVE-2020-14343", "CRITICAL",
        "Arbitrary code execution via PyYAML full_load / unsafe yaml.load on untrusted input.",
        "2020-09-14", "pyyaml", "<5.4",
    ),
]

# (name, username, [packages_maintained])
MAINTAINERS = [
    ("Priya Nair", "priyan", ["express", "body-parser", "send"]),
    ("Diego Ramos", "dieg0", ["axios", "follow-redirects"]),
    ("Wen Zhao", "wenz", ["webpack", "loader-utils"]),
    ("Sofia Bianchi", "sbianchi", ["react-scripts", "react"]),
    ("Tomasz Wolski", "twolski", ["jest", "jest-cli", "jest-config"]),
    ("Aiden Clarke", "aidencl", ["babel-core", "babel-generator", "babel-jest"]),
    ("Grace Osei", "gosei", ["commander", "chalk"]),
    ("Lukas Berg", "lberg", ["micromatch", "braces", "fill-range", "to-regex-range", "is-number"]),
    ("Maya Fischer", "mfischer", ["lodash"]),
    ("R. Okafor", "rokafor", ["minimist"]),          # solo maintainer, deep in many trees -> bus-factor risk
    ("J. Halvorsen", "jhalvorsen", ["event-stream"]),  # solo maintainer, real-world cautionary tale
    ("F. Al-Sayed", "falsayed", ["ua-parser-js"]),     # solo maintainer, real-world cautionary tale
    ("Apache Log4j Team", "log4j-pmc", ["log4j-core", "log4j-api"]),
    ("Kenji Watanabe", "kwatanabe", ["socket.io", "ws"]),
    ("Nadia Petrova", "npetrova", ["ansi-regex", "debug", "ms"]),
    ("PyPA Requests Team", "psf-requests", ["requests", "urllib3", "certifi"]),
    ("Pallets Team", "pallets", ["flask", "werkzeug", "jinja2", "markupsafe", "click"]),
    ("Django Software Foundation", "django-sf", ["django", "pytz"]),
    ("PyYAML Maintainers", "pyyaml-team", ["pyyaml"]),
    ("NumFOCUS Data Team", "numfocus", ["numpy", "pandas"]),
    ("PyCA Team", "pyca", ["cryptography"]),
    ("Elena Voss", "evoss", ["semver", "cross-spawn", "tar"]),
    ("Marcus Lindqvist", "mlindqvist", ["json5", "mime"]),
]

# (project, owner, description, [(package, version), ...])
PROJECTS = [
    ("Acme Storefront", "acme-retail", "Customer-facing e-commerce site", [
        ("express", "4.18.2"), ("react-scripts", "5.0.1"), ("axios", "1.4.0"),
    ]),
    ("DataPipe ETL", "data-eng", "Nightly batch data pipeline", [
        ("pandas", "2.0.3"), ("requests", "2.31.0"), ("pyyaml", "6.0"),
    ]),
    ("Northwind API", "northwind", "Internal order-management API", [
        ("flask", "2.3.2"), ("requests", "2.31.0"),
    ]),
    ("Beacon CMS", "beacon-labs", "Marketing content management system", [
        ("django", "4.2.3"), ("pyyaml", "6.0"),
    ]),
    ("ChatOps Bot", "platform-team", "Slack-integrated deployment bot", [
        ("express", "4.18.2"), ("socket.io", "4.6.1"),
    ]),
    ("Metrics Dashboard", "observability", "Internal metrics visualization app", [
        ("react-scripts", "5.0.1"), ("chalk", "5.2.0"),
    ]),
    ("Log Aggregator", "platform-team", "Central log ingestion service", [
        ("log4j-core", "2.14.1"),
    ]),
    ("Build Tool CLI", "dev-experience", "Internal developer CLI", [
        ("webpack", "5.75.0"), ("commander", "10.0.0"),
    ]),
    ("Test Harness", "qa-team", "Shared CI test runner", [
        ("jest", "29.3.1"),
    ]),
    ("Crypto Wallet Sync", "fintech-labs", "Legacy wallet-balance sync utility", [
        ("event-stream", "3.3.6"),
    ]),
    ("Browser Analytics", "growth-team", "Client-side analytics collector", [
        ("ua-parser-js", "0.7.31"), ("axios", "1.4.0"),
    ]),
    ("ML Feature Store", "ml-platform", "Feature computation and storage service", [
        ("numpy", "1.25.0"), ("cryptography", "41.0.1"),
    ]),
    ("Payments Gateway", "fintech-labs", "Card payment processing service", [
        ("django", "4.2.3"), ("requests", "2.31.0"),
    ]),
    ("Internal Docs Site", "dev-experience", "Engineering documentation portal", [
        ("flask", "2.3.2"),
    ]),
    ("Realtime Support Chat", "support-eng", "Customer support live-chat widget", [
        ("socket.io", "4.6.1"), ("react-scripts", "5.0.1"),
    ]),
]
