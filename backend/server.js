
// ==========================================
// PHISHGUARD - NODE.JS BACKEND
// ==========================================

const express = require("express");
const path = require("path");

const app = express();
const PORT = 5000;


// 1. MIDDLEWARE
app.use(express.json());


// 2. SERVE FRONTEND FILES
const frontendPath = path.join(__dirname, "../Frontend");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});


// 3. URL ANALYSIS FUNCTION
function analyzeURL(inputURL) {

    let riskScore = 0;
    const reasons = [];

    let parsedURL;

    // Validate URL
    try {

        parsedURL = new URL(inputURL);

    } catch (error) {

        return {
            result: "Invalid URL",
            message: "Please enter a valid website URL.",
            riskScore: 0
        };

    }


    // Only HTTP and HTTPS are supported
    if (!["http:", "https:"].includes(parsedURL.protocol)) {

        return {
            result: "Invalid URL",
            message: "Only HTTP and HTTPS URLs are supported.",
            riskScore: 0
        };

    }


    const hostname = parsedURL.hostname.toLowerCase();
    const fullURL = inputURL.toLowerCase();


    // CHECK 1: IP ADDRESS
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

    if (ipPattern.test(hostname)) {

        riskScore += 25;

        reasons.push(
            "Website uses an IP address instead of a domain name."
        );

    }


    // CHECK 2: SUSPICIOUS KEYWORDS
    const suspiciousWords = [
        "login",
        "verify",
        "account",
        "password",
        "banking",
        "update",
        "secure",
        "free",
        "confirm"
    ];

    const foundWords = suspiciousWords.filter(word =>
        fullURL.includes(word)
    );

    if (foundWords.length > 0) {

        riskScore += Math.min(foundWords.length * 8, 24);

        reasons.push(
            "Suspicious keywords found: " + foundWords.join(", ")
        );

    }


    // CHECK 3: UNUSUAL @ SYMBOL OR CREDENTIALS
    if (
        parsedURL.username ||
        parsedURL.password ||
        inputURL.includes("@")
    ) {

        riskScore += 20;

        reasons.push(
            "URL contains an unusual @ symbol or embedded credentials."
        );

    }


    // CHECK 4: UNUSUALLY LONG URL
    if (inputURL.length > 100) {

        riskScore += 10;

        reasons.push(
            "URL is unusually long."
        );

    }


    // CHECK 5: TOO MANY SUBDOMAINS
    const subdomains = hostname.split(".");

    if (subdomains.length > 4) {

        riskScore += 15;

        reasons.push(
            "Website contains too many subdomains."
        );

    }


    // CHECK 6: HYPHEN IN DOMAIN
    if (hostname.includes("-")) {

        riskScore += 10;

        reasons.push(
            "Domain name contains a hyphen."
        );

    }


    // CHECK 7: HTTPS CHECK
    if (parsedURL.protocol !== "https:") {

        riskScore += 10;

        reasons.push(
            "Website does not use HTTPS."
        );

    }


    // FINAL RISK SCORE
    riskScore = Math.min(riskScore, 100);


    // CLASSIFY URL
    const isPhishing = riskScore >= 40;


    return {

        result: isPhishing
            ? "Potential Phishing"
            : "Legitimate",

        message: reasons.length > 0
            ? reasons.join(" ")
            : "No suspicious characteristics were detected by our basic checks.",

        riskScore: riskScore

    };

}


// 4. URL SCAN API
app.post("/api/scan", (req, res) => {

    const { url } = req.body;


    if (!url || typeof url !== "string") {

        return res.status(400).json({

            result: "Invalid URL",

            message: "Please provide a URL to scan.",

            riskScore: 0

        });

    }


    const analysis = analyzeURL(url.trim());

    res.json(analysis);

});


// 5. SERVER START
app.listen(PORT, () => {

    console.log("-----------------------------------");
    console.log("       PHISHGUARD SERVER");
    console.log("-----------------------------------");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Frontend connected successfully.");
    console.log("URL scanning API is ready.");
    console.log("-----------------------------------");

});
