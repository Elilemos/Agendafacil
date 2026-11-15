import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: 1,
  duration: "10s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
    checks: ["rate==1"],
  },
};

export default function () {
  const health = http.get(BASE_URL + "/health");
  check(health, {
    "health retorna HTTP 200": (response) => response.status === 200,
    "health informa status ok": (response) =>
      JSON.parse(response.body).status === "ok",
  });

  const metrics = http.get(BASE_URL + "/metrics");
  check(metrics, {
    "metrics retorna HTTP 200": (response) => response.status === 200,
    "metrics usa formato Prometheus": (response) =>
      response.body.includes("http_request_duration_seconds"),
  });

  sleep(1);
}