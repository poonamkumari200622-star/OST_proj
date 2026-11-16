
// ==========================================
// PHISHGUARD - MAIN JAVASCRIPT
// ==========================================


// 1. GET HTML ELEMENTS
const menuLinks = document.querySelectorAll(".menu-link");
const pages = document.querySelectorAll(".page-section");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const scanForm = document.getElementById("scanForm");
const urlInput = document.getElementById("urlInput");
const scanButton = document.getElementById("scanButton");
const loading = document.getElementById("loading");

const safetyScore = document.getElementById("safetyScore");
const riskScore = document.getElementById("riskScore");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const scoreCircle = document.getElementById("scoreCircle");

const historyTable = document.getElementById("historyTable");
const clearHistoryButton = document.getElementById("clearHistory");


// 2. PAGE TITLES AND SUBTITLES
const pageDetails = {
    overview: {
        title: "Overview",
        subtitle: "Welcome to your security dashboard"
    },
    scanner: {
        title: "URL Scanner",
        subtitle: "Analyze website links for suspicious characteristics"
    },
    history: {
        title: "Scan History",
        subtitle: "View your previous URL scans"
    },
    "how-it-works": {
        title: "How It Works",
        subtitle: "Understand how PhishGuard analyzes URLs"
    },
    features: {
        title: "Features",
        subtitle: "Explore PhishGuard security tools"
    }
};


// 3. NAVIGATION BETWEEN PAGES
function showPage(pageId) {

    pages.forEach(page => {
        page.classList.remove("active");
    });

    menuLinks.forEach(link => {
        link.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    const selectedLink = document.querySelector(
        `.menu-link[data-page="${pageId}"]`
    );

    if (selectedLink) {
        selectedLink.classList.add("active");
    }

    if (pageDetails[pageId]) {
        pageTitle.textContent = pageDetails[pageId].title;
        pageSubtitle.textContent = pageDetails[pageId].subtitle;
    }
}


// Sidebar navigation
menuLinks.forEach(link => {

    link.addEventListener("click", function (event) {

        event.preventDefault();

        const pageId = this.dataset.page;

        showPage(pageId);

    });

});


// Dashboard button opens URL Scanner
document.getElementById("goToScanner").addEventListener("click", () => {
    showPage("scanner");
});


// 4. SCAN HISTORY STORAGE
let scanHistory = [];

try {
    const savedHistory = localStorage.getItem("phishGuardHistory");

    if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory)) {
            scanHistory = parsedHistory;
        }
    }
} catch (error) {
    console.error("Could not load scan history:", error);
}


function saveHistory() {

    try {
        localStorage.setItem(
            "phishGuardHistory",
            JSON.stringify(scanHistory)
        );
    } catch (error) {
        console.error("Could not save scan history:", error);
    }

}


// 5. UPDATE DASHBOARD STATISTICS
function updateStatistics() {

    const total = scanHistory.length;

    const phishing = scanHistory.filter(item =>
        item.riskScore >= 40
    ).length;

    const safe = total - phishing;

    const highRisk = scanHistory.filter(item =>
        item.riskScore >= 70
    ).length;

    document.getElementById("totalScans").textContent = total;

    document.getElementById("phishingCount").textContent = phishing;

    document.getElementById("safeCount").textContent = safe;

    document.getElementById("highRiskCount").textContent = highRisk;

    document.getElementById("recentCount").textContent =
        Math.min(total, 5);

    updateCharts();

}


// 6. DISPLAY SCAN HISTORY
function displayHistory() {

    historyTable.innerHTML = "";

    if (scanHistory.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-history";
        cell.textContent = "No scan history available.";

        row.appendChild(cell);
        historyTable.appendChild(row);

        return;
    }


    scanHistory.forEach(item => {

        const row = document.createElement("tr");

        const urlCell = document.createElement("td");
        urlCell.textContent = item.url;

        const dateCell = document.createElement("td");
        dateCell.textContent = item.date;

        const scoreCell = document.createElement("td");
        scoreCell.textContent = `${item.safetyScore}%`;

        const resultCell = document.createElement("td");

        const status = document.createElement("span");

        if (item.riskScore >= 40) {
            status.textContent = "Potential Phishing";
            status.className = "status-badge danger";
        } else {
            status.textContent = "Lower Risk";
            status.className = "status-badge safe";
        }

        resultCell.appendChild(status);

        row.appendChild(urlCell);
        row.appendChild(dateCell);
        row.appendChild(scoreCell);
        row.appendChild(resultCell);

        historyTable.appendChild(row);

    });

}


// 7. CLEAR SCAN HISTORY
clearHistoryButton.addEventListener("click", () => {

    if (scanHistory.length === 0) {
        alert("There is no scan history to clear.");
        return;
    }

    const confirmClear = confirm(
        "Are you sure you want to clear your scan history?"
    );

    if (confirmClear) {

        scanHistory = [];

        saveHistory();

        displayHistory();

        updateStatistics();

        alert("Scan history cleared successfully.");

    }

});


// 8. CHART VARIABLES
let activityChart = null;
let safetyChart = null;


// 9. UPDATE DASHBOARD CHARTS
function updateCharts() {

    if (typeof Chart === "undefined") {
        console.warn("Chart.js could not be loaded.");
        return;
    }

    const activityCanvas = document.getElementById("activityChart");
    const safetyCanvas = document.getElementById("safetyChart");

    if (!activityCanvas || !safetyCanvas) {
        return;
    }


    // Last seven days
    const labels = [];

    const dailyScans = [];
    const dailyPhishing = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();

        date.setDate(date.getDate() - i);

        const dateKey = date.toLocaleDateString();

        labels.push(
            date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            })
        );

        const dayScans = scanHistory.filter(item =>
            item.date === dateKey
        );

        dailyScans.push(dayScans.length);

        dailyPhishing.push(
            dayScans.filter(item => item.riskScore >= 40).length
        );

    }


    // Destroy old chart before updating
    if (activityChart) {
        activityChart.destroy();
    }

    if (safetyChart) {
        safetyChart.destroy();
    }


    // Activity Line Chart
    activityChart = new Chart(activityCanvas, {

        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "Total Scans",
                    data: dailyScans,
                    borderColor: "#9b72ff",
                    backgroundColor: "rgba(155, 114, 255, 0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: "Phishing Detected",
                    data: dailyPhishing,
                    borderColor: "#ff5c75",
                    backgroundColor: "rgba(255, 92, 117, 0.10)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: "#c7c7d5"
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#a5a5b5"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },

                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: "#a5a5b5"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                }
            }
        }

    });


    // Safety Doughnut Chart
    const phishingCount = scanHistory.filter(item =>
        item.riskScore >= 40
    ).length;

    const safeCount = scanHistory.length - phishingCount;

    safetyChart = new Chart(safetyCanvas, {

        type: "doughnut",

        data: {
            labels: ["Safe", "Potential Phishing"],

            datasets: [{
                data: [
                    safeCount,
                    phishingCount
                ],

                backgroundColor: [
                    "#20c997",
                    "#ff5c75"
                ],

                borderWidth: 0,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "70%",

            plugins: {
                legend: {
                    display: false
                }
            }
        }

    });

}


// 10. URL SCANNING
scanForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const url = urlInput.value.trim();

    if (!url) {
        alert("Please enter a website URL.");
        return;
    }


    // Show loading
    loading.classList.remove("hidden");

    scanButton.disabled = true;

    scanButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> SCANNING...';


    try {

        // Connect to Node.js backend
        const response = await fetch("/api/scan", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: url
            })

        });


        const data = await response.json();


        if (!response.ok) {
            throw new Error(data.message || "Unable to scan URL.");
        }


        // Backend risk score
        const detectedRisk = Number(data.riskScore);

        const safeRisk = Number.isFinite(detectedRisk)
            ? Math.min(100, Math.max(0, detectedRisk))
            : 0;

        // Safety score is the inverse of risk score
        const calculatedSafety = 100 - safeRisk;


        // Display result
        safetyScore.textContent = `${calculatedSafety}%`;

        riskScore.textContent = `${safeRisk}/100`;

        resultTitle.textContent = data.result;

        resultMessage.textContent = data.message;


        // Update result colors
        if (safeRisk >= 40) {

            resultTitle.className = "danger-text";

            scoreCircle.style.background =
                `conic-gradient(#ff5c75 ${calculatedSafety}%, #292938 ${calculatedSafety}%)`;

        } else {

            resultTitle.className = "safe-text";

            scoreCircle.style.background =
                `conic-gradient(#20c997 ${calculatedSafety}%, #292938 ${calculatedSafety}%)`;

        }


        // Save scan record
        const scanRecord = {

            url: url,

            date: new Date().toLocaleDateString(),

            safetyScore: calculatedSafety,

            riskScore: safeRisk,

            result: data.result,

            message: data.message

        };


        scanHistory.unshift(scanRecord);

        // Keep the latest 100 records
        scanHistory = scanHistory.slice(0, 100);


        saveHistory();

        displayHistory();

        updateStatistics();


    } catch (error) {

        console.error("Scan error:", error);

        resultTitle.textContent = "Scan Failed";

        resultTitle.className = "danger-text";

        resultMessage.textContent =
            error.message || "Could not connect to the backend server.";

        safetyScore.textContent = "--%";

        riskScore.textContent = "--/100";

        scoreCircle.style.background = "#292938";

        alert(
            "Unable to scan the URL. Make sure your Node.js backend is running."
        );

    } finally {

        // Hide loading
        loading.classList.add("hidden");

        scanButton.disabled = false;

        scanButton.innerHTML =
            '<i class="fa-solid fa-magnifying-glass"></i> SCAN URL';

    }

});


// 11. INITIALIZE DASHBOARD
displayHistory();

updateStatistics();

showPage("overview");

console.log("PhishGuard JavaScript loaded successfully.");
