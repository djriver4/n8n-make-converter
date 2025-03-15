"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });

// Mock the modules before importing the converter
const mockN8nToMake = jest.fn();
const mockMakeToN8n = jest.fn();

// Mock the converters using doMock to ensure they're mocked before import
jest.doMock("../../lib/converters/n8n-to-make", () => ({
  n8nToMake: mockN8nToMake
}));

jest.doMock("../../lib/converters/make-to-n8n", () => ({
  makeToN8n: mockMakeToN8n
}));

// Import fixtures for test data
const { basicN8nWorkflow } = require("../fixtures/n8n-workflows");
const { basicMakeWorkflow } = require("../fixtures/make-workflows");

// Import the module under test AFTER mocking its dependencies
const { convertWorkflow, EMPTY_MAKE_WORKFLOW } = require("../../lib/converter");

describe("convertWorkflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations for each test
    mockN8nToMake.mockResolvedValue({
      convertedWorkflow: basicMakeWorkflow,
      logs: [{ type: "info", message: "Conversion successful", timestamp: new Date().toISOString() }],
      parametersNeedingReview: [],
      paramsNeedingReview: [],
      unmappedNodes: [],
      isValidInput: true,
      debug: {}
    });
    
    mockMakeToN8n.mockResolvedValue({
      convertedWorkflow: basicN8nWorkflow,
      logs: [{ type: "info", message: "Conversion successful", timestamp: new Date().toISOString() }],
      parametersNeedingReview: [],
      paramsNeedingReview: [],
      unmappedNodes: [],
      isValidInput: true,
      debug: {}
    });
  });

  it("should convert n8n workflow to Make.com format", async () => {
    const result = await convertWorkflow(basicN8nWorkflow, "n8n", "make", { preserveIds: true });
    expect(mockN8nToMake).toHaveBeenCalledWith(basicN8nWorkflow, expect.anything(), { preserveIds: true });
    expect(result.convertedWorkflow).toEqual(basicMakeWorkflow);
    expect(result.logs).toContainEqual(expect.objectContaining({
      type: "info",
      message: "Conversion successful"
    }));
  });

  it("should convert Make.com workflow to n8n format", async () => {
    const result = await convertWorkflow(basicMakeWorkflow, "make", "n8n", { preserveIds: true });
    expect(mockMakeToN8n).toHaveBeenCalledWith(basicMakeWorkflow, expect.anything(), { preserveIds: true });
    expect(result.convertedWorkflow).toEqual(basicN8nWorkflow);
    expect(result.logs).toContainEqual(expect.objectContaining({
      type: "info",
      message: "Conversion successful"
    }));
  });

  it("should handle errors during conversion", async () => {
    mockN8nToMake.mockRejectedValueOnce(new Error("Conversion failed"));
    const result = await convertWorkflow(basicN8nWorkflow, "n8n", "make", { preserveIds: true });
    expect(result.convertedWorkflow).toEqual(EMPTY_MAKE_WORKFLOW);
    expect(result.logs).toContainEqual(expect.objectContaining({
      type: "error",
      message: expect.stringContaining("Conversion failed")
    }));
  });

  it("should return error for unsupported conversion direction", () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield convertWorkflow(basicN8nWorkflow, "n8n", "n8n", { preserveIds: true });
    expect(result.convertedWorkflow).toEqual(basicN8nWorkflow);
    expect(result.logs).toContainEqual(expect.objectContaining({
      type: "warning",
      message: expect.stringContaining("Source and target platforms are the same")
    }));
  }));
  
  it("should handle empty source workflow", () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield convertWorkflow(null, "n8n", "make", { preserveIds: true });
    expect(result.convertedWorkflow).toEqual(EMPTY_MAKE_WORKFLOW);
    expect(result.logs).toContainEqual(expect.objectContaining({
      type: "error",
      message: "Source workflow is empty"
    }));
  }));
  
  it("should pass options to the converter", async () => {
    const options = {
      preserveIds: false,
      strictMode: true,
      mappingAccuracy: 90,
    };
    await convertWorkflow(basicN8nWorkflow, "n8n", "make", options);
    expect(mockN8nToMake).toHaveBeenCalledWith(basicN8nWorkflow, expect.anything(), options);
  });
});
