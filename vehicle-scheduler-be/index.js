const axios = require("axios");
const Log = require("../logging-middleware/logger");
const { getToken } = require("../logging-middleware/logger");

async function fetchDepots() {
    const token = await getToken();
    const url = "http://4.224.186.213/evaluation-service/depots";
    await Log("backend", "info", "handler", `GET: ${url}`.substring(0, 48), token);

    try {
        const response = await axios({
            method: "GET",
            url: url,
            headers: { Authorization: `Bearer ${token}` }
        });
        const depots = response.data.depots || [];
        await Log("backend", "info", "handler", `Fetched ${depots.length} depots successfully`.substring(0, 48), token);
        return depots;
    } catch (error) {
        const status = error.response ? error.response.status : "NET_ERR";
        await Log("backend", "error", "handler", `Fetch depots failed. Status: ${status}`.substring(0, 48), token);
        throw error;
    }
}

async function fetchVehicles() {
    const token = await getToken();
    const url = "http://4.224.186.213/evaluation-service/vehicles";
    await Log("backend", "info", "handler", `GET: ${url}`.substring(0, 48), token);

    try {
        const response = await axios({
            method: "GET",
            url: url,
            headers: { Authorization: `Bearer ${token}` }
        });
        const vehicles = response.data.vehicles || [];
        await Log("backend", "info", "handler", `Fetched ${vehicles.length} vehicles successfully`.substring(0, 48), token);
        return vehicles;
    } catch (error) {
        const status = error.response ? error.response.status : "NET_ERR";
        await Log("backend", "error", "handler", `Fetch vehicles failed. Status: ${status}`.substring(0, 48), token);
        throw error;
    }
}

function solveKnapsack(vehicles, capacity) {
    const n = vehicles.length;
    if (n === 0 || capacity <= 0) {
        return { selectedVehicles: [], totalImpact: 0, totalDuration: 0 };
    }

    const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const item = vehicles[i - 1];
        const duration = item.Duration;
        const impact = item.Impact;

        for (let w = 0; w <= capacity; w++) {
            if (duration <= w) {
                dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - duration] + impact);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    const selectedVehicles = [];
    let w = capacity;
    for (let i = n; i > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const item = vehicles[i - 1];
            selectedVehicles.push(item);
            w -= item.Duration;
        }
    }

    selectedVehicles.reverse();

    const totalImpact = dp[n][capacity];
    const totalDuration = capacity - w;

    return {
        selectedVehicles,
        totalImpact,
        totalDuration
    };
}

async function run() {
    const token = await getToken();
    await Log("backend", "info", "handler", "Starting Vehicle Scheduler Microservice...", token);

    try {
        const depots = await fetchDepots();
        const vehicles = await fetchVehicles();

        let output = "\n VEHICLE MAINTENANCE SCHEDULE\n";

        for (const depot of depots) {
            await Log("backend", "info", "handler", `Scheduling Depot ${depot.ID} (Budget: ${depot.MechanicHours}h)`.substring(0, 48), token);

            const result = solveKnapsack(vehicles, depot.MechanicHours);

            const summaryLog = `Depot ${depot.ID}: Opt Impact=${result.totalImpact}, Hours=${result.totalDuration}h`.substring(0, 48);
            await Log("backend", "info", "handler", summaryLog, token);

            output += `\nDEPOT ID: ${depot.ID}\n`;
            output += `Available Mechanic Hours: ${depot.MechanicHours} hrs\n`;
            output += `Scheduled Vehicles: ${result.selectedVehicles.length} / ${vehicles.length}\n`;
            output += `Total Duration Used: ${result.totalDuration} hrs\n`;
            output += `Total Operational Impact Score: ${result.totalImpact}\n`;
            output += `Unused Budget: ${depot.MechanicHours - result.totalDuration} hrs\n`;

            output += "| TaskID                               | Duration (hrs) | Impact   |\n";

            result.selectedVehicles.forEach(v => {
                output += `| ${v.TaskID.padEnd(36)} | ${String(v.Duration).padEnd(14)} | ${String(v.Impact).padEnd(8)} |\n`;
            });
        }

        await Log("backend", "info", "handler", "All depot schedules successfully processed.", token);
        process.stdout.write(output);

    } catch (err) {
        await Log("backend", "error", "handler", `Error in scheduler: ${err.message}`.substring(0, 48), token);
    }
}

run();
