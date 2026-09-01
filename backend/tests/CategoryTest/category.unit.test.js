import { expect } from "chai";
import sinon from "sinon";
function mockRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}
function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    user: { _id: "user123" },
    ...overrides,
  };
}
let CategoryFindSortStub;
let CategoryFindOneStub;
let CategoryFindOneAndDeleteStub;
let CategoryCreateStub;
const FakeCategory = {
  find: () => ({ sort: CategoryFindSortStub }),
  findOne: (...args) => CategoryFindOneStub(...args),
  findOneAndDelete: (...args) => CategoryFindOneAndDeleteStub(...args),
  create: (...args) => CategoryCreateStub(...args),
};
const makeControllers = () => {
  const getCategories = async (req, res) => {
    try {
      const categories = await FakeCategory.find({ user: req.user._id }).sort({ name: 1 });
      res.status(200).json({ categories });
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories", error: error.message });
    }
  };
  const createCategory = async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Category name is required" });
      }
      const trimmedName = name.trim();
      const existing = await FakeCategory.findOne({
        user: req.user._id,
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });
      if (existing) {
        return res.status(200).json({ message: "Category already exists", category: existing });
      }
      const category = await FakeCategory.create({ user: req.user._id, name: trimmedName });
      res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
      res.status(500).json({ message: "Failed to create category", error: error.message });
    }
  };
  const deleteCategory = async (req, res) => {
    try {
      const category = await FakeCategory.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category", error: error.message });
    }
  };
  return { getCategories, createCategory, deleteCategory };
};
describe("Category Controller â€“ Unit Tests", function () {
  let controllers;
  beforeEach(function () {
    CategoryFindSortStub = sinon.stub();
    CategoryFindOneStub = sinon.stub();
    CategoryFindOneAndDeleteStub = sinon.stub();
    CategoryCreateStub = sinon.stub();
    controllers = makeControllers();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe("getCategories", function () {
    it("should return 200 with a list of categories", async function () {
      const fakeCategories = [{ name: "Work" }, { name: "Personal" }];
      CategoryFindSortStub.resolves(fakeCategories);
      const req = mockReq();
      const res = mockRes();
      await controllers.getCategories(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.categories).to.deep.equal(fakeCategories);
    });
    it("should return 200 with empty array when user has no categories", async function () {
      CategoryFindSortStub.resolves([]);
      const req = mockReq();
      const res = mockRes();
      await controllers.getCategories(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.categories).to.deep.equal([]);
    });
    it("should return 500 when DB throws", async function () {
      CategoryFindSortStub.rejects(new Error("DB error"));
      const req = mockReq();
      const res = mockRes();
      await controllers.getCategories(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Failed to get categories");
    });
  });
  describe("createCategory", function () {
    it("should return 201 and created category when name is new", async function () {
      CategoryFindOneStub.resolves(null); // no existing
      const fakeCategory = { _id: "cat1", name: "Work" };
      CategoryCreateStub.resolves(fakeCategory);
      const req = mockReq({ body: { name: "Work" } });
      const res = mockRes();
      await controllers.createCategory(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Category created successfully");
      expect(body.category.name).to.equal("Work");
    });
    it("should return 200 with existing category when name already exists", async function () {
      const existing = { _id: "cat1", name: "Work" };
      CategoryFindOneStub.resolves(existing);
      const req = mockReq({ body: { name: "Work" } });
      const res = mockRes();
      await controllers.createCategory(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Category already exists");
      expect(body.category).to.deep.equal(existing);
    });
    it("should return 400 when name is missing", async function () {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.createCategory(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Category name is required");
    });
    it("should return 400 when name is only whitespace", async function () {
      const req = mockReq({ body: { name: "   " } });
      const res = mockRes();
      await controllers.createCategory(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Category name is required");
    });
    it("should trim the category name before saving", async function () {
      CategoryFindOneStub.resolves(null);
      CategoryCreateStub.resolves({ _id: "cat1", name: "Work" });
      const req = mockReq({ body: { name: "  Work  " } });
      const res = mockRes();
      await controllers.createCategory(req, res);
      const createArgs = CategoryCreateStub.firstCall.args[0];
      expect(createArgs.name).to.equal("Work");
    });
    it("should return 500 when DB throws on create", async function () {
      CategoryFindOneStub.resolves(null);
      CategoryCreateStub.rejects(new Error("DB error"));
      const req = mockReq({ body: { name: "Work" } });
      const res = mockRes();
      await controllers.createCategory(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("deleteCategory", function () {
    it("should return 200 when category is found and deleted", async function () {
      CategoryFindOneAndDeleteStub.resolves({ _id: "cat1", name: "Work" });
      const req = mockReq({ params: { id: "cat1" } });
      const res = mockRes();
      await controllers.deleteCategory(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Category deleted successfully");
    });
    it("should return 404 when category is not found", async function () {
      CategoryFindOneAndDeleteStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.deleteCategory(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Category not found");
    });
    it("should return 500 when DB throws", async function () {
      CategoryFindOneAndDeleteStub.rejects(new Error("DB error"));
      const req = mockReq({ params: { id: "cat1" } });
      const res = mockRes();
      await controllers.deleteCategory(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
    it("should delete using both the category id and user id for isolation", async function () {
      CategoryFindOneAndDeleteStub.resolves({ _id: "cat1", name: "Work" });
      const req = mockReq({ params: { id: "cat1" }, user: { _id: "user123" } });
      const res = mockRes();
      await controllers.deleteCategory(req, res);
      const query = CategoryFindOneAndDeleteStub.firstCall.args[0];
      expect(query._id).to.equal("cat1");
      expect(query.user).to.equal("user123");
    });
  });
});
