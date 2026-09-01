import { expect } from "chai";
import sinon from "sinon";
function mockRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}
function mockReq(overrides = {}) {
  return { body: {}, params: {}, user: { _id: "user123" }, file: null, ...overrides };
}
const makeControllers = () => {
  const uploadMedia = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      res.status(201).json({
        message: "File uploaded successfully",
        file: {
          url: req.file.path,
          publicId: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          resourceType: req.file.resource_type,
          duration: req.file.duration || null,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload media" });
    }
  };
  return { uploadMedia };
};
describe("Media Controller â€“ Unit Tests", function () {
  let controllers;
  beforeEach(function () {
    controllers = makeControllers();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe("uploadMedia", function () {
    it("should return 400 when no file is attached", async function () {
      const req = mockReq({ file: null });
      const res = mockRes();
      await controllers.uploadMedia(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("No file uploaded");
    });
    it("should return 201 with file metadata on successful upload", async function () {
      const fakeFile = {
        path: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
        filename: "sample_public_id",
        originalname: "photo.jpg",
        mimetype: "image/jpeg",
        size: 102400,
        resource_type: "image",
        duration: null,
      };
      const req = mockReq({ file: fakeFile });
      const res = mockRes();
      await controllers.uploadMedia(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("File uploaded successfully");
      expect(body.file.url).to.equal(fakeFile.path);
      expect(body.file.publicId).to.equal(fakeFile.filename);
      expect(body.file.originalName).to.equal(fakeFile.originalname);
      expect(body.file.mimetype).to.equal(fakeFile.mimetype);
      expect(body.file.size).to.equal(fakeFile.size);
      expect(body.file.resourceType).to.equal(fakeFile.resource_type);
    });
    it("should set duration to null when file has no duration", async function () {
      const fakeFile = {
        path: "https://example.com/file.jpg",
        filename: "pub_id",
        originalname: "file.jpg",
        mimetype: "image/jpeg",
        size: 1024,
        resource_type: "image",
        duration: undefined,
      };
      const req = mockReq({ file: fakeFile });
      const res = mockRes();
      await controllers.uploadMedia(req, res);
      const body = res.json.firstCall.args[0];
      expect(body.file.duration).to.equal(null);
    });
    it("should include duration when file has a duration", async function () {
      const fakeFile = {
        path: "https://example.com/video.mp4",
        filename: "video_pub_id",
        originalname: "clip.mp4",
        mimetype: "video/mp4",
        size: 5000000,
        resource_type: "video",
        duration: 30.5,
      };
      const req = mockReq({ file: fakeFile });
      const res = mockRes();
      await controllers.uploadMedia(req, res);
      const body = res.json.firstCall.args[0];
      expect(body.file.duration).to.equal(30.5);
    });
    it("should handle audio uploads correctly", async function () {
      const fakeFile = {
        path: "https://example.com/audio.mp3",
        filename: "audio_pub_id",
        originalname: "song.mp3",
        mimetype: "audio/mpeg",
        size: 3000000,
        resource_type: "audio",
        duration: 120,
      };
      const req = mockReq({ file: fakeFile });
      const res = mockRes();
      await controllers.uploadMedia(req, res);
      const body = res.json.firstCall.args[0];
      expect(res.status.calledWith(201)).to.equal(true);
      expect(body.file.resourceType).to.equal("audio");
      expect(body.file.duration).to.equal(120);
    });
  });
});
