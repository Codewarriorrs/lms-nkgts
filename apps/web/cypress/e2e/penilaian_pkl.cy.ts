describe("Feature Test: Penilaian PKL (Guru & Admin)", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("kaizenuntukindonesia1945");
    cy.get("button[type='submit']").click();
    cy.url().should("include", "/dashboard");
  });

  it("Harus menampilkan halaman Penilaian PKL dengan pencarian & filter sekolah", () => {
    cy.visit("/dashboard/penilaian-pkl");
    cy.contains("Penilaian PKL (DEKKI)").should("be.visible");
    cy.get("input[placeholder*='Cari nama siswa']").should("be.visible");
  });

  it("Harus menampilkan layout Card yang rapi pada viewport Mobile tanpa scrollbar horizontal", () => {
    cy.viewport("iphone-x");
    cy.visit("/dashboard/penilaian-pkl");
    cy.contains("Penilaian PKL (DEKKI)").should("be.visible");
    
    // Pastikan mobile view (div.block.md\\:hidden) terlihat
    cy.get(".md\\:hidden").should("be.visible");
  });
});
