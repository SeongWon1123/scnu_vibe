import { existsSync, readFileSync, statSync } from "fs"
import { describe, expect, it } from "vitest"
import { BOARDS, detailUrl, listUrl } from "@/crawler/boards"

describe("board config", () => {
  it("has six boards with unique keys", () => {
    expect(BOARDS).toHaveLength(6)
    expect(new Set(BOARDS.map(board => board.key)).size).toBe(6)
  })

  it("builds list URLs with both required identifiers", () => {
    for (const board of BOARDS) {
      const url = listUrl(board)
      expect(url).toContain("?mi=" + board.mi)
      expect(url).toContain("&bbsId=" + board.bbsId)
    }
  })

  it("builds the verified academic list URL", () => {
    const academic = BOARDS.find(board => board.key === "academic")!
    expect(listUrl(academic)).toBe(
      "https://www.scnu.ac.kr/SCNU/na/ntt/selectNttList.do?mi=1132&bbsId=1041",
    )
  })

  it("uses the dorm site path and canonical detail URL", () => {
    const dorm = BOARDS.find(board => board.key === "dorm")!
    expect(listUrl(dorm)).toContain("/dorm/na/ntt/selectNttList.do")
    expect(detailUrl(dorm, 123)).toBe(
      "https://www.scnu.ac.kr/dorm/na/ntt/selectNttInfo.do?nttSn=123&mi=1337",
    )
  })

  it("builds canonical school detail URLs without list-only parameters", () => {
    const scholarship = BOARDS.find(board => board.key === "scholarship")!
    expect(detailUrl(scholarship, 456)).toBe(
      "https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=456&mi=8690",
    )
  })
})

describe("Task 2 fixtures", () => {
  const academicFixture = "tests/fixtures/list-academic.html"
  const invalidFixture = "tests/fixtures/list-invalid.html"

  it("stores a substantial academic list page with detail links", () => {
    expect(existsSync(academicFixture)).toBe(true)
    expect(statSync(academicFixture).size).toBeGreaterThan(50_000)
    expect(readFileSync(academicFixture, "utf-8")).toContain("selectNttInfo.do")
  })

  it("stores the missing-bbsId invalid-request response", () => {
    expect(existsSync(invalidFixture)).toBe(true)
    const invalidHtml = readFileSync(invalidFixture, "utf-8")
    expect(invalidHtml).toContain("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC694\uCCAD")
  })
})