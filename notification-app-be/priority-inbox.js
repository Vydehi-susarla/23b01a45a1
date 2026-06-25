const axios = require("axios");
const Log = require("../logging-middleware/logger");
const { getToken } = require("../logging-middleware/logger");

function getWeight(type) {
    switch (type) {
        case "Placement": return 3;
        case "Result": return 2;
        case "Event": return 1;
        default: return 0;
    }
}

function isLowerPriority(a, b) {
    const wA = getWeight(a.Type);
    const wB = getWeight(b.Type);
    if (wA !== wB) {
        return wA < wB;
    }
    const tA = new Date(a.Timestamp).getTime();
    const tB = new Date(b.Timestamp).getTime();
    return tA < tB;
}

class MinHeap {
    constructor() {
        this.heap = [];
    }

    size() {
        return this.heap.length;
    }

    peek() {
        return this.heap[0] || null;
    }

    push(item) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();
        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return min;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (isLowerPriority(this.heap[index], this.heap[parentIndex])) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    bubbleDown(index) {
        const length = this.heap.length;
        while (2 * index + 1 < length) {
            let smallest = index;
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;

            if (leftChild < length && isLowerPriority(this.heap[leftChild], this.heap[smallest])) {
                smallest = leftChild;
            }
            if (rightChild < length && isLowerPriority(this.heap[rightChild], this.heap[smallest])) {
                smallest = rightChild;
            }

            if (smallest !== index) {
                this.swap(index, smallest);
                index = smallest;
            } else {
                break;
            }
        }
    }

    swap(i, j) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    processItem(item, k = 10) {
        if (this.size() < k) {
            this.push(item);
        } else if (isLowerPriority(this.peek(), item)) {
            this.heap[0] = item;
            this.bubbleDown(0);
        }
    }

    getSortedResults() {
        const resultList = [...this.heap];
        resultList.sort((a, b) => {
            if (isLowerPriority(a, b)) return 1;
            if (isLowerPriority(b, a)) return -1;
            return 0;
        });
        return resultList;
    }
}

async function fetchNotifications() {
    const token = await getToken();
    const url = "http://4.224.186.213/evaluation-service/notifications";
    await Log("backend", "info", "handler", `GET: ${url}`.substring(0, 48), token);

    try {
        const response = await axios({
            method: "GET",
            url: url,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const notifications = response.data.notifications || [];
        await Log("backend", "info", "handler", `Fetched ${notifications.length} notifications`.substring(0, 48), token);
        return notifications;
    } catch (error) {
        const status = error.response ? error.response.status : "NET_ERR";
        const msg = `Fetch failed. Status: ${status}`.substring(0, 48);
        await Log("backend", "error", "handler", msg, token);
        throw error;
    }
}

async function run() {
    const token = await getToken();
    await Log("backend", "info", "handler", "Starting Priority Inbox Service...", token);

    try {
        const notifications = await fetchNotifications();
        const heap = new MinHeap();

        for (const notification of notifications) {
            heap.processItem(notification, 10);
        }

        const top10 = heap.getSortedResults();

        let output = "\n TOP 10 PRIORITY INBOX NOTIFICATIONS \n";
        output += "| Rank | Type       | Timestamp           | Message                                      |\n";

        top10.forEach((item, index) => {
            const rank = String(index + 1).padEnd(4);
            const type = item.Type.padEnd(10);
            const timestamp = item.Timestamp.padEnd(19);
            const msg = item.Message.substring(0, 44).padEnd(44);
            output += `| ${rank} | ${type} | ${timestamp} | ${msg} |\n`;
        });

        await Log("backend", "info", "handler", "Top 10 priority inbox notifications resolved.", token);
        process.stdout.write(output);

    } catch (err) {
        await Log("backend", "error", "handler", `Error: ${err.message}`.substring(0, 48), token);
    }
}

run();
