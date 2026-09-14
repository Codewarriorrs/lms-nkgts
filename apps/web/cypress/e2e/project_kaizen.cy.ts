describe("Feature Test: Project Kaizen (Proposal & Laporan)", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("kaizenuntukindonesia1945");
    cy.get("button[type='submit']").click();
    cy.url().should("include", "/dashboard");
  });

  it("Harus dapat mengakses halaman utama Project Kaizen", () => {
    cy.visit("/dashboard/project");
    cy.contains(/project|kaizen/i).should("be.visible");
  });

  it("Harus menampilkan halaman Kumpulkan Proposal dengan tombol Kembali tanpa text overflow pada layar mobile", () => {
    cy.viewport("iphone-x");
    cy.visit("/dashboard/project/proposal");
    cy.contains("Kumpulkan Proposal").should("be.visible");
    cy.contains(/Kembali/i).should("be.visible");
  });

  it("Harus menampilkan halaman Kumpulkan Laporan dengan tombol Kembali tanpa text overflow pada layar mobile", () => {
    cy.viewport("iphone-x");
    cy.visit("/dashboard/project/laporan");
    cy.contains("Kumpulkan Laporan").should("be.visible");
    cy.contains(/Kembali/i).should("be.visible");
  });
});
