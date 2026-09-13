const request = require("supertest");
const app = require("../src/app");

describe("Auth Validation & Route Guard Tests", () => {
  it("POST /auth/register should return 400 when body is invalid", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "invalid-email", password: "123" }); // missing fullname, short password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });

  it("POST /auth/login should return 400 when email format is invalid", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /categories should return 401 when token is missing", async () => {
    const res = await request(app).get("/categories");
    expect(res.statusCode).toBe(401);
  });

  it("GET /transactions should return 401 with invalid token", async () => {
    const res = await request(app)
      .get("/transactions")
      .set("Authorization", "Bearer invalid.jwt.token");
    expect(res.statusCode).toBe(401);
  });
});
