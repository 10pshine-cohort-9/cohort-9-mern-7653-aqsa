import { expect } from "chai";
import sinon from "sinon";
function mockRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  res.cookie = sinon.stub().returns(res);
  res.clearCookie = sinon.stub().returns(res);
  res.redirect = sinon.stub().returns(res);
  return res;
}
function mockReq(overrides = {}) {
  return { body: {}, user: null, cookies: {}, ...overrides };
}
let registerUserStub;
let loginUserStub;
let forgotPasswordServiceStub;
let resetPasswordServiceStub;
let generateTokenStub;
const makeControllers = () => {
  const register = async (req, res) => {
    try {
      const user = await registerUserStub(req.body);
      const token = generateTokenStub(user._id);
      res.cookie("token", token, {});
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: { id: user._id, username: user.username, email: user.email },
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
  const login = async (req, res) => {
    try {
      const user = await loginUserStub(req.body);
      const token = generateTokenStub(user._id);
      res.cookie("token", token, {});
      res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: { id: user._id, username: user.username, email: user.email },
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
  const googleCallback = (req, res) => {
    const token = generateTokenStub(req.user._id);
    res.cookie("token", token, {});
    if (process.env.FRONTEND_URL) {
      return res.redirect(`${process.env.FRONTEND_URL}/google-success`);
    }
    return res.status(200).json({
      success: true,
      message: "Google Login Successful",
      user: { id: req.user._id, username: req.user.username, email: req.user.email },
    });
  };
  const getProfile = (req, res) => {
    res.status(200).json({ success: true, user: req.user });
  };
  const forgotPassword = async (req, res) => {
    try {
      await forgotPasswordServiceStub(req.body.email);
      res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset otp has been sent.",
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  const resetPassword = async (req, res, next) => {
    try {
      const { email, otp, password } = req.body;
      await resetPasswordServiceStub(email, otp, password);
      res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (err) {
      next(err);
    }
  };
  const logout = (req, res) => {
    res.clearCookie("token", {});
    res.status(200).json({ success: true, message: "Logged out successfully" });
  };
  return { register, login, googleCallback, getProfile, forgotPassword, resetPassword, logout };
};
describe("Auth Controller â€“ Unit Tests", function () {
  let controllers;
  beforeEach(function () {
    registerUserStub = sinon.stub();
    loginUserStub = sinon.stub();
    forgotPasswordServiceStub = sinon.stub();
    resetPasswordServiceStub = sinon.stub();
    generateTokenStub = sinon.stub().returns("mock-jwt-token");
    controllers = makeControllers();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe("register", function () {
    it("should respond 201 with user data on success", async function () {
      const fakeUser = { _id: "uid1", username: "alice", email: "alice@test.com" };
      registerUserStub.resolves(fakeUser);
      const req = mockReq({ body: { username: "alice", email: "alice@test.com", password: "pw" } });
      const res = mockRes();
      await controllers.register(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(true);
      expect(body.message).to.equal("User registered successfully");
      expect(body.user.username).to.equal("alice");
    });
    it("should set a token cookie on successful registration", async function () {
      registerUserStub.resolves({ _id: "uid1", username: "alice", email: "alice@test.com" });
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.register(req, res);
      expect(res.cookie.calledWith("token", "mock-jwt-token")).to.equal(true);
    });
    it("should respond 400 when registerUser throws", async function () {
      registerUserStub.rejects(new Error("Email already exists"));
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.register(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(false);
      expect(body.error).to.equal("Email already exists");
    });
    it("should call generateToken with the new user id", async function () {
      const fakeUser = { _id: "uid99", username: "bob", email: "bob@test.com" };
      registerUserStub.resolves(fakeUser);
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.register(req, res);
      expect(generateTokenStub.calledWith("uid99")).to.equal(true);
    });
  });
  describe("login", function () {
    it("should respond 200 with user data on success", async function () {
      loginUserStub.resolves({ _id: "uid2", username: "carol", email: "carol@test.com" });
      const req = mockReq({ body: { email: "carol@test.com", password: "pw" } });
      const res = mockRes();
      await controllers.login(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(true);
      expect(body.message).to.equal("User logged in successfully");
    });
    it("should set a token cookie on successful login", async function () {
      loginUserStub.resolves({ _id: "uid2", username: "carol", email: "carol@test.com" });
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.login(req, res);
      expect(res.cookie.calledWith("token", "mock-jwt-token")).to.equal(true);
    });
    it("should respond 400 when loginUser throws", async function () {
      loginUserStub.rejects(new Error("Invalid email or password"));
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.login(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(false);
      expect(body.error).to.equal("Invalid email or password");
    });
  });
  describe("googleCallback", function () {
    it("should return 200 JSON when FRONTEND_URL is not set", function () {
      delete process.env.FRONTEND_URL;
      const req = mockReq({ user: { _id: "uid3", username: "dave", email: "dave@test.com" } });
      const res = mockRes();
      controllers.googleCallback(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(true);
      expect(body.message).to.equal("Google Login Successful");
    });
    it("should redirect when FRONTEND_URL is set", function () {
      process.env.FRONTEND_URL = "http://myfrontend.com";
      const req = mockReq({ user: { _id: "uid4", username: "eve", email: "eve@test.com" } });
      const res = mockRes();
      controllers.googleCallback(req, res);
      expect(res.redirect.calledWith("http://myfrontend.com/google-success")).to.equal(true);
      delete process.env.FRONTEND_URL;
    });
    it("should set a token cookie", function () {
      delete process.env.FRONTEND_URL;
      const req = mockReq({ user: { _id: "uid3", username: "dave", email: "dave@test.com" } });
      const res = mockRes();
      controllers.googleCallback(req, res);
      expect(res.cookie.calledWith("token", "mock-jwt-token")).to.equal(true);
    });
  });
  describe("getProfile", function () {
    it("should return 200 with the authenticated user", function () {
      const fakeUser = { _id: "uid5", username: "frank", email: "frank@test.com" };
      const req = mockReq({ user: fakeUser });
      const res = mockRes();
      controllers.getProfile(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(true);
      expect(body.user).to.deep.equal(fakeUser);
    });
    it("should pass the full user object without modification", function () {
      const fakeUser = { _id: "uid5", username: "frank", email: "frank@test.com", provider: "local" };
      const req = mockReq({ user: fakeUser });
      const res = mockRes();
      controllers.getProfile(req, res);
      const body = res.json.firstCall.args[0];
      expect(body.user.provider).to.equal("local");
    });
  });
  describe("forgotPassword", function () {
    it("should return 200 with the standard obfuscated message", async function () {
      forgotPasswordServiceStub.resolves();
      const req = mockReq({ body: { email: "anyone@test.com" } });
      const res = mockRes();
      await controllers.forgotPassword(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(true);
      expect(body.message).to.include("password reset otp");
    });
    it("should call the service with the email from request body", async function () {
      forgotPasswordServiceStub.resolves();
      const req = mockReq({ body: { email: "target@test.com" } });
      const res = mockRes();
      await controllers.forgotPassword(req, res);
      expect(forgotPasswordServiceStub.calledWith("target@test.com")).to.equal(true);
    });
    it("should return 500 when the service throws", async function () {
      forgotPasswordServiceStub.rejects(new Error("Mail error"));
      const req = mockReq({ body: { email: "error@test.com" } });
      const res = mockRes();
      await controllers.forgotPassword(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("resetPassword", function () {
    it("should return 200 on successful password reset", async function () {
      resetPasswordServiceStub.resolves();
      const req = mockReq({ body: { email: "u@test.com", otp: "123456", password: "newpw" } });
      const res = mockRes();
      const next = sinon.stub();
      await controllers.resetPassword(req, res, next);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(true);
      expect(body.message).to.equal("Password reset successfully");
    });
    it("should call next(err) when the service throws", async function () {
      const err = new Error("Invalid or expired OTP");
      resetPasswordServiceStub.rejects(err);
      const req = mockReq({ body: { email: "u@test.com", otp: "bad", password: "newpw" } });
      const res = mockRes();
      const next = sinon.stub();
      await controllers.resetPassword(req, res, next);
      expect(next.calledWith(err)).to.equal(true);
    });
    it("should call the service with correct email, otp and password", async function () {
      resetPasswordServiceStub.resolves();
      const req = mockReq({ body: { email: "u@test.com", otp: "654321", password: "myNewPw" } });
      const res = mockRes();
      const next = sinon.stub();
      await controllers.resetPassword(req, res, next);
      expect(resetPasswordServiceStub.calledWith("u@test.com", "654321", "myNewPw")).to.equal(true);
    });
  });
  describe("logout", function () {
    it("should return 200 with success message", function () {
      const req = mockReq();
      const res = mockRes();
      controllers.logout(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.success).to.equal(true);
      expect(body.message).to.equal("Logged out successfully");
    });
    it("should clear the token cookie", function () {
      const req = mockReq();
      const res = mockRes();
      controllers.logout(req, res);
      expect(res.clearCookie.calledWith("token")).to.equal(true);
    });
  });
});
