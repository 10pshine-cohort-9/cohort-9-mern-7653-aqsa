import { expect } from "chai";
import sinon from "sinon";
import bcrypt from "bcrypt";
import User from "../../src/models/user.model.js";
import ApiError from "../../src/utils/ApiError.js";
import {
  registerUser,
  loginUser,
  forgotPasswordService,
  resetPasswordService
} from "../../src/services/auth.service.js";

describe("Auth Service", function () {
  afterEach(function () {
    sinon.restore();
  });

  describe("registerUser()", function () {
    it("should register a new user successfully", async function () {
      const fakeUser = {
        _id: "123",
        username: "aqsa",
        email: "aqsa@gmail.com",
        password: "hashedPassword"
      };

      const findOneStub = sinon.stub(User, "findOne");
      findOneStub.onFirstCall().resolves(null);
      findOneStub.onSecondCall().resolves(null);

      sinon.stub(bcrypt, "hash").resolves("hashedPassword");
      sinon.stub(User, "create").resolves(fakeUser);

      const result = await registerUser({
        username: "aqsa",
        email: "aqsa@gmail.com",
        password: "123456"
      });

      expect(result).to.equal(fakeUser);
      expect(findOneStub.firstCall.args[0]).to.deep.equal({
        username: "aqsa"
      });
      expect(findOneStub.secondCall.args[0]).to.deep.equal({
        email: "aqsa@gmail.com"
      });
      expect(bcrypt.hash.calledOnce).to.be.true;
      expect(User.create.calledOnce).to.be.true;
    });

    it("should throw error if username already exists", async function () {
      sinon.stub(User, "findOne").resolves({
        username: "aqsa"
      });

      try {
        await registerUser({
          username: "aqsa",
          email: "aqsa@gmail.com",
          password: "123456"
        });
        expect.fail();
      } catch (error) {
        expect(error).to.be.instanceOf(ApiError);
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Username already exists");
      }
    });

    it("should throw error if email already exists", async function () {
      const findOneStub = sinon.stub(User, "findOne");
      findOneStub.onFirstCall().resolves(null);
      findOneStub.onSecondCall().resolves({
        email: "aqsa@gmail.com"
      });

      try {
        await registerUser({
          username: "aqsa",
          email: "aqsa@gmail.com",
          password: "123456"
        });
        expect.fail();
      } catch (error) {
        expect(error).to.be.instanceOf(ApiError);
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Email already exists");
      }
    });
  });

  describe("loginUser()", function () {
    it("should login user with correct credentials", async function () {
      const fakeUser = {
        _id: "123",
        username: "aqsa",
        email: "aqsa@gmail.com",
        password: "hashedPassword",
        provider: "local"
      };

      const selectStub = sinon.stub().resolves(fakeUser);
      sinon.stub(User, "findOne").returns({
        select: selectStub
      });
      sinon.stub(bcrypt, "compare").resolves(true);

      const result = await loginUser({
        email: "aqsa@gmail.com",
        password: "123456"
      });

      expect(result).to.equal(fakeUser);
      expect(selectStub.calledOnceWith("+password")).to.be.true;
      expect(bcrypt.compare.calledOnceWith(
        "123456",
        "hashedPassword"
      )).to.be.true;
    });

    it("should throw error if user does not exist", async function () {
      sinon.stub(User, "findOne").returns({
        select: sinon.stub().resolves(null)
      });

      try {
        await loginUser({
          email: "wrong@gmail.com",
          password: "123456"
        });
        expect.fail();
      } catch (error) {
        expect(error).to.be.instanceOf(ApiError);
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Invalid email or password");
      }
    });

    it("should reject Google users", async function () {
      const selectStub = sinon.stub().resolves({
        provider: "google"
      });

      sinon.stub(User, "findOne").returns({
        select: selectStub
      });

      try {
        await loginUser({
          email: "aqsa@gmail.com",
          password: "123456"
        });
        expect.fail();
      } catch (error) {
        expect(error).to.be.instanceOf(ApiError);
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Please login with Google");
      }
    });

    it("should reject incorrect password", async function () {
      const selectStub = sinon.stub().resolves({
        password: "hashedPassword",
        provider: "local"
      });

      sinon.stub(User, "findOne").returns({
        select: selectStub
      });
      sinon.stub(bcrypt, "compare").resolves(false);

      try {
        await loginUser({
          email: "aqsa@gmail.com",
          password: "wrongPassword"
        });
        expect.fail();
      } catch (error) {
        expect(error).to.be.instanceOf(ApiError);
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Invalid email or password");
      }
    });
  });

  describe("forgotPasswordService()", function () {
    it("should throw error if user does not exist", async function () {
      sinon.stub(User, "findOne").resolves(null);

      try {
        await forgotPasswordService("wrong@gmail.com");
        expect.fail();
      } catch (error) {
        expect(error).to.be.instanceOf(ApiError);
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.equal("User not found");
      }
    });

  });

  describe("resetPasswordService()", function () {
    it("should throw error for invalid OTP", async function () {
      const selectStub = sinon.stub().resolves({
        resetPasswordOtp: "hashedOtp"
      });

      sinon.stub(User, "findOne").returns({
        select: selectStub
      });

      try {
        await resetPasswordService(
          "aqsa@gmail.com",
          "123456",
          "newPassword"
        );
        expect.fail();
      } catch (error) {
        expect(error).to.be.instanceOf(ApiError);
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Invalid or expired OTP");
      }
    });

    it("should reset password successfully", async function () {
      const user = {
        resetPasswordOtp: "hashedOtp",
        resetPasswordExpire: Date.now() + 10000,
        save: sinon.stub().resolves()
      };

      const selectStub = sinon.stub().resolves(user);

      sinon.stub(User, "findOne").returns({
        select: selectStub
      });

      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(bcrypt, "hash").resolves("newHashedPassword");

      const result = await resetPasswordService(
        "aqsa@gmail.com",
        "123456",
        "newPassword"
      );

      expect(result).to.equal(true);
      expect(user.password).to.equal("newHashedPassword");
      expect(user.resetPasswordOtp).to.equal(undefined);
      expect(user.resetPasswordExpire).to.equal(undefined);
      expect(user.save.calledOnce).to.be.true;
    });
  });
});