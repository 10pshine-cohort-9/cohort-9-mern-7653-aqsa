import { expect } from "chai";
import request from "supertest";
import app from "../../app.js";

describe("Media Integration Tests", function () {
  describe("POST /api/media", function () {
    it("should reject request without a file", async function () {
      const response = await request(app)
        .post("/api/media")
        .set("Origin", "http://localhost:5173");

      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal(
        "Access denied. Please log in."
      );
    });
  });
});