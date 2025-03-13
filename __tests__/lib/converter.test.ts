import { convertWorkflow } from "../../lib/converter"
import { n8nToMake } from "../../lib/converters/n8n-to-make"
import { makeToN8n } from "../../lib/converters/make-to-n8n"
import { basicN8nWorkflow } from "../fixtures/n8n-workflows"
import { basicMakeWorkflow } from "../fixtures/make-workflows"

// Mock the converters
jest.mock("../../lib/converters/n8n-to-make")
jest.mock("../../lib/converters/make-to-n8n")

describe("convertWorkflow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set up default mock implementations
    ;(n8nToMake as jest.Mock).mockResolvedValue({
      convertedWorkflow: basicMakeWorkflow,
      logs: [{ type: "info", message: "Conversion successful" }],
    })
    ;(makeToN8n as jest.Mock).mockResolvedValue({
      convertedWorkflow: basicN8nWorkflow,
      logs: [{ type: "info", message: "Conversion successful" }],
    })
  })

  it("should convert n8n workflow to Make.com format", async () => {
    const result = await convertWorkflow(basicN8nWorkflow, "n8n", "make", { preserveIds: true })

    expect(n8nToMake).toHaveBeenCalledWith(basicN8nWorkflow, expect.anything(), { preserveIds: true })
    expect(result.convertedWorkflow).toEqual(basicMakeWorkflow)
    expect(result.logs).toContainEqual({ type: "info", message: "Conversion successful" })
  })

  it("should convert Make.com workflow to n8n format", async () => {
    const result = await convertWorkflow(basicMakeWorkflow, "make", "n8n", { preserveIds: true })

    expect(makeToN8n).toHaveBeenCalledWith(basicMakeWorkflow, expect.anything(), { preserveIds: true })
    expect(result.convertedWorkflow).toEqual(basicN8nWorkflow)
    expect(result.logs).toContainEqual({ type: "info", message: "Conversion successful" })
  })

  it("should handle errors during conversion", async () => {
    ;(n8nToMake as jest.Mock).mockRejectedValue(new Error("Conversion failed"))

    const result = await convertWorkflow(basicN8nWorkflow, "n8n", "make", { preserveIds: true })

    expect(result.convertedWorkflow).toEqual({})
    expect(result.logs).toContainEqual({
      type: "error",
      message: expect.stringContaining("Conversion failed")
    })
  })

  it("should return error for unsupported conversion direction", async () => {
    const result = await convertWorkflow(
      basicN8nWorkflow,
      "n8n",
      "n8n" as any, // Intentionally passing invalid target
      { preserveIds: true },
    )

    expect(result.convertedWorkflow).toEqual({})
    expect(result.logs).toContainEqual({
      type: "error",
      message: "Conversion from n8n to n8n is not supported",
    })
  })

  it("should handle empty source workflow", async () => {
    const result = await convertWorkflow(null, "n8n", "make", { preserveIds: true })

    expect(result.convertedWorkflow).toEqual({})
    expect(result.logs).toContainEqual({
      type: "error",
      message: "Source workflow is empty",
    })
  })

  it("should pass options to the converter", async () => {
    const options = {
      preserveIds: false,
      strictMode: true,
      mappingAccuracy: 90,
    }

    await convertWorkflow(basicN8nWorkflow, "n8n", "make", options)

    expect(n8nToMake).toHaveBeenCalledWith(basicN8nWorkflow, expect.anything(), options)
  })
})

