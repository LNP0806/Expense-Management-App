const request = require("supertest");
const app = require("../src/app");

describe("API Health and Root Endpoints", () => {
  it("GET /health should return status OK and 200", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("message", "Backend server is running...");
  });

  it("GET / should return status OK and 200", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
  });

  it("GET /unknown-route should return 404 Not Found", async () => {
    const res = await request(app).get("/random-undefined-endpoint");
    expect(res.statusCode).toBe(404);
  });
});
